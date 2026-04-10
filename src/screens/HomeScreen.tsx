// @refresh reset
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useHomeMenu } from '../navigation/HomeMenuContext';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { apiRequest } from '../api/client';
import { API_BASE_URL } from '../config/env';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { logout } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { brand } from '../theme';
import { getCustomerPinnedLocation, setCustomerPinnedLocation } from '../utils/customerPinnedLocation';
import type { GeocodeResult } from '../utils/googleGeocode';
import { reverseGeocode } from '../utils/googleGeocode';
import { requestLocationCoords } from '../utils/requestLocationCoords';
import { buildMemberQrPayload } from '../utils/memberQr';
import { memberIdMasked } from '../utils/memberId';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

const MenuIcon = () => (
  <View style={styles.menuIconContainer}>
    <View style={styles.menuLineMain} />
    <View style={styles.menuLineSub} />
  </View>
);

const GeometricPin = () => (
  <View style={styles.geometricPin}>
    <View style={styles.geometricPinInner} />
  </View>
);

function assetUrl(pathOrUrl: string | null) {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (!pathOrUrl.startsWith('/')) return pathOrUrl;
  const origin = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');
  return `${origin}${pathOrUrl}`;
}

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeNav>();
  const { setMenuVisible } = useHomeMenu();
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.accessToken);
  const displayName = useAppSelector((s) => s.user.displayName);
  const memberUserId = useAppSelector((s) => s.user.id);

  // --- QR MODAL STATE ---
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const memberQrValue = useMemo(() => buildMemberQrPayload(memberUserId), [memberUserId]);

  const [dash, setDash] = useState<{
    points: { available: number; earned: number; redeemed: number };
    cashback: { savedAmount: number };
    coupons: { active: number; used: number; expired: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [nearby, setNearby] = useState<
    { id: string; name: string; city: string; state: string; imageUrl: string | null; distanceKm?: number | null }[]
  >([]);
  const [activeCoupons, setActiveCoupons] = useState<
    { assignmentId: string; coupon: { id: string; title: string; shortDescription: string | null; minOrderValue: number | null } | null }[]
  >([]);
  const [locationTag, setLocationTag] = useState('Browse stores');
  const [locationFormattedAddress, setLocationFormattedAddress] = useState('');
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationTick, setLocationTick] = useState(0);
  const [deviceLocationModalBusy, setDeviceLocationModalBusy] = useState(false);
  const [locationRequired, setLocationRequired] = useState(false);
  const [serviceUnavailableAtLocation, setServiceUnavailableAtLocation] = useState(false);
  const [locationActionBusy, setLocationActionBusy] = useState(false);
  const [failedShopImages, setFailedShopImages] = useState<Record<string, boolean>>({});
  const hasLoadedOnceRef = useRef(false);
  const lastSyncedLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const lastResolvedLocationRef = useRef<{
    latitude: number;
    longitude: number;
    label: string;
    formattedAddress?: string;
  } | null>(null);

  useEffect(() => {
    if (loading || locationRequired || serviceUnavailableAtLocation) {
      navigation.setOptions({
        tabBarStyle: { display: 'none' },
      });
      return;
    }
    navigation.setOptions({
      tabBarStyle: undefined,
    });
  }, [loading, locationRequired, serviceUnavailableAtLocation, navigation]);

  const postCustomerLocation = useCallback(
    async (coords: { latitude: number; longitude: number }, locationAddress?: string | null) => {
      if (!token) return;
      await apiRequest('/auth/customer/location', {
        method: 'POST',
        token,
        body: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          ...(locationAddress?.trim() ? { locationAddress: locationAddress.trim() } : {}),
        },
      }).catch(() => {});
    },
    [token],
  );

  const applyGeocodeResult = useCallback(
    async (geo: GeocodeResult, opts: { pin: boolean }) => {
      if (opts.pin) {
        await setCustomerPinnedLocation({
          latitude: geo.latitude,
          longitude: geo.longitude,
          formattedAddress: geo.formattedAddress,
          shortLabel: geo.shortLabel,
        });
      } else {
        await setCustomerPinnedLocation(null);
      }
      lastResolvedLocationRef.current = {
        latitude: geo.latitude,
        longitude: geo.longitude,
        label: geo.shortLabel,
        formattedAddress: geo.formattedAddress,
      };
      lastSyncedLocationRef.current = null;
      setLocationRequired(false);
      setLocationTag(geo.shortLabel);
      setLocationFormattedAddress(geo.formattedAddress);
      setServiceUnavailableAtLocation(false);
      await postCustomerLocation(geo, geo.formattedAddress);
      lastSyncedLocationRef.current = { latitude: geo.latitude, longitude: geo.longitude };
      setLocationTick((t) => t + 1);
    },
    [postCustomerLocation],
  );

  const handleUseDeviceLocationFromModal = useCallback(async () => {
    if (!token) return;
    setDeviceLocationModalBusy(true);
    try {
      await setCustomerPinnedLocation(null);
      const locationResult = await requestLocationCoords();
      if (locationResult.permissionDenied) {
        await Linking.openSettings().catch(() => {});
        return;
      }
      const coords = locationResult.coords;
      if (!coords) return;
      const geo = await reverseGeocode(coords.latitude, coords.longitude).catch(() => null);
      if (geo) {
        await applyGeocodeResult(geo, { pin: false });
      } else {
        lastResolvedLocationRef.current = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          label: 'Location',
          formattedAddress: '',
        };
        setLocationTag('Location');
        setLocationFormattedAddress('');
        await postCustomerLocation(coords, null);
        lastSyncedLocationRef.current = coords;
        setServiceUnavailableAtLocation(false);
        setLocationTick((t) => t + 1);
      }
    } finally {
      setDeviceLocationModalBusy(false);
    }
  }, [token, postCustomerLocation, applyGeocodeResult]);

  const handlePickSearchLocation = useCallback(
    async (geo: GeocodeResult) => {
      if (!token) return;
      await applyGeocodeResult(geo, { pin: true });
    },
    [token, applyGeocodeResult],
  );

  const handleAllowLocation = useCallback(async () => {
    if (!token) return;
    setLocationActionBusy(true);
    try {
      await setCustomerPinnedLocation(null);
      const locationResult = await requestLocationCoords();
      if (locationResult.permissionDenied) {
        await Linking.openSettings().catch(() => {});
        return;
      }
      const coords = locationResult.coords;
      if (!coords) return;

      setLocationRequired(false);
      setServiceUnavailableAtLocation(false);
      setLocationTag('Location');
      lastSyncedLocationRef.current = coords;
      const geo = await reverseGeocode(coords.latitude, coords.longitude).catch(() => null);
      if (geo) {
        setLocationTag(geo.shortLabel);
        setLocationFormattedAddress(geo.formattedAddress);
        lastResolvedLocationRef.current = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          label: geo.shortLabel,
          formattedAddress: geo.formattedAddress,
        };
        await postCustomerLocation(coords, geo.formattedAddress);
      } else {
        setLocationFormattedAddress('');
        lastResolvedLocationRef.current = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          label: 'Location',
        };
        await postCustomerLocation(coords, null);
      }
      setLocationTick((t) => t + 1);
    } finally {
      setLocationActionBusy(false);
    }
  }, [token, postCustomerLocation]);

  const handleLogout = useCallback(async () => {
    setLocationActionBusy(true);
    try {
      await dispatch(logout()).unwrap().catch(() => {});
    } finally {
      setLocationActionBusy(false);
    }
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        if (!token) return;
        const showBlockingLoader = !hasLoadedOnceRef.current;
        if (showBlockingLoader) setLoading(true);
        try {
          const pinned = await getCustomerPinnedLocation();
          const locationResult = await requestLocationCoords();
          if (!alive) return;

          if (locationResult.permissionDenied && !pinned) {
            setLocationRequired(true);
            return;
          }

          setLocationRequired(false);
          setServiceUnavailableAtLocation(false);

          const gps = locationResult.coords;
          let coords: { latitude: number; longitude: number } | null = pinned
            ? { latitude: pinned.latitude, longitude: pinned.longitude }
            : gps ?? null;

          if (!coords) {
            setLocationTag('Browse stores');
            setLocationFormattedAddress('');
          } else if (pinned) {
            setLocationTag(pinned.shortLabel);
            setLocationFormattedAddress(pinned.formattedAddress);
            lastResolvedLocationRef.current = {
              latitude: pinned.latitude,
              longitude: pinned.longitude,
              label: pinned.shortLabel,
              formattedAddress: pinned.formattedAddress,
            };
            const lastSyncedPin = lastSyncedLocationRef.current;
            const pinMovedEnough =
              !lastSyncedPin ||
              Math.abs(lastSyncedPin.latitude - coords.latitude) > 0.0005 ||
              Math.abs(lastSyncedPin.longitude - coords.longitude) > 0.0005;
            if (pinMovedEnough) {
              void postCustomerLocation(coords, pinned.formattedAddress)
                .then(() => {
                  lastSyncedLocationRef.current = coords;
                })
                .catch(() => {});
            }
          } else {
            setLocationTag('Location');
            const lastResolved = lastResolvedLocationRef.current;
            const shouldResolveLocation =
              !lastResolved ||
              Math.abs(lastResolved.latitude - coords.latitude) > 0.002 ||
              Math.abs(lastResolved.longitude - coords.longitude) > 0.002;
            if (shouldResolveLocation) {
              const geo = await reverseGeocode(coords.latitude, coords.longitude).catch(() => null);
              if (!alive) return;
              if (geo) {
                setLocationTag(geo.shortLabel);
                setLocationFormattedAddress(geo.formattedAddress);
                lastResolvedLocationRef.current = {
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  label: geo.shortLabel,
                  formattedAddress: geo.formattedAddress,
                };
              } else {
                setLocationFormattedAddress('');
              }
            } else if (lastResolved?.label) {
              setLocationTag(lastResolved.label);
              setLocationFormattedAddress(lastResolved.formattedAddress ?? lastResolved.label);
            }

            const lastSynced = lastSyncedLocationRef.current;
            const movedEnough =
              !lastSynced ||
              Math.abs(lastSynced.latitude - coords.latitude) > 0.0005 ||
              Math.abs(lastSynced.longitude - coords.longitude) > 0.0005;
            if (movedEnough) {
              const resolved = lastResolvedLocationRef.current;
              const addr =
                resolved?.formattedAddress ??
                (resolved?.label && resolved.label !== 'Location' ? resolved.label : undefined);
              void postCustomerLocation(coords, addr ?? null)
                .then(() => {
                  lastSyncedLocationRef.current = coords;
                })
                .catch(() => {});
            }
          }

          const shopsPath =
            coords != null
              ? `/shops/nearby?limit=10&radiusKm=10&lat=${encodeURIComponent(String(coords.latitude))}&lng=${encodeURIComponent(String(coords.longitude))}`
              : '/shops/nearby?limit=10';

          let shops: { items: any[] } = { items: [] };
          try {
            shops = await apiRequest<{ items: any[] }>(shopsPath, { method: 'GET' });
          } catch {
            shops = { items: [] };
          }
          if (!alive) return;
          if (coords && (shops.items ?? []).length === 0) {
            setNearby([]);
            setActiveCoupons([]);
            setDash(null);
            setServiceUnavailableAtLocation(true);
            return;
          }

          let dash: {
            points: { available: number; earned: number; redeemed: number };
            cashback: { savedAmount: number };
            coupons: { active: number; used: number; expired: number };
          } | null = { points: { available: 0, earned: 0, redeemed: 0 }, cashback: { savedAmount: 0 }, coupons: { active: 0, used: 0, expired: 0 } };
          try {
            dash = await apiRequest<any>('/users/me/dashboard', { method: 'GET', token });
          } catch (e) {
            void e;
            dash = null;
          }
          if (!alive) return;

          let coupons: { active: any[] } = { active: [] };
          try {
            coupons = await apiRequest<{ active: any[] }>('/users/me/coupons', {
              method: 'GET',
              token,
            });
          } catch {
            coupons = { active: [] };
          }
          if (!alive) return;

          setDash(dash);
          setNearby(shops.items ?? []);
          setActiveCoupons((coupons.active ?? []).slice(0, 4));
          hasLoadedOnceRef.current = true;
        } finally {
          if (alive && showBlockingLoader) setLoading(false);
        }
      })();
      return () => {
        alive = false;
      };
    }, [token, locationTick, postCustomerLocation]),
  );

  /**
   * Business meaning:
   * - Loyalty points == COINS (₹1 per coin) => use points.available (remaining)
   * - "Points" are Cashi points (separate system; not implemented yet) => show 0 for now
   */
  const pointsText = useMemo(() => '0', []);
  const coinsText = useMemo(() => String(dash?.points?.available ?? 0), [dash]);
  const cashbackText = useMemo(() => `₹${dash?.cashback?.savedAmount ?? 0}`, [dash]);
  const helloName = (displayName?.trim() ? displayName.trim() : 'there');
  const showNearby = nearby.length > 0;
  const showVouchers = activeCoupons.length > 0;
  
  const locationPillLine =
    (locationTag.trim() && locationTag !== 'Location' ? locationTag.trim() : '') ||
    locationFormattedAddress.trim() ||
    'Set your area';

  const locationPickerModal = (
    <LocationPickerModal
      visible={locationModalVisible}
      onClose={() => setLocationModalVisible(false)}
      headerTitle="Your location"
      currentFormattedAddress={locationFormattedAddress}
      onUseDeviceLocation={handleUseDeviceLocationFromModal}
      onSelectResult={(g) => void handlePickSearchLocation(g)}
      deviceBusy={deviceLocationModalBusy}
    />
  );

  // --- FULL SCREEN QR MODAL ---
  const fullScreenQRModal = (
    <Modal
      visible={qrModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setQrModalVisible(false)}>
      <Pressable style={styles.qrModalBackdrop} onPress={() => setQrModalVisible(false)}>
        <Pressable style={styles.qrModalCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.qrModalHeader}>
            <Text style={styles.qrModalTitle}>Cashi Card</Text>
            <TouchableOpacity onPress={() => setQrModalVisible(false)} style={styles.qrModalCloseBtn}>
              <Text style={styles.qrModalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.qrModalDesc}>
            Show this Cashi Card at the shop to earn coins and cashback.
          </Text>
          
          <View style={styles.qrBigBox}>
             <QRCode 
               value={memberQrValue} 
               size={SCREEN_WIDTH * 0.65} 
               color={brand.dark} 
               backgroundColor="#FFFFFF" 
             />
          </View>
          
          <Text style={styles.qrModalUserId} selectable>
            MEMBER ID: {memberIdMasked(memberUserId)}
          </Text>
          <Text style={styles.qrModalUserIdSub} selectable>
            USER ID: {memberUserId?.trim() ? memberUserId.trim() : '—'}
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );

  if (locationRequired) {
    return (
      <>
        <View style={styles.logoutOverlay}>
          <View style={styles.locationGateCard}>
            <View style={styles.gateIconWrap}>
                <GeometricPin />
            </View>
            <Text style={styles.logoutOverlayTitle}>Enable Location Access</Text>
            <Text style={styles.logoutOverlayDesc}>
              Allow location to discover nearby shops and continue.
            </Text>
            <TouchableOpacity
              style={styles.locationPrimaryBtn}
              onPress={handleAllowLocation}
              activeOpacity={0.85}
              disabled={locationActionBusy}>
              {locationActionBusy ? (
                <ActivityIndicator color={brand.dark} size="small" />
              ) : (
                <Text style={styles.locationPrimaryBtnText}>Allow Location</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.locationSecondaryBtn}
              onPress={() => setLocationModalVisible(true)}
              activeOpacity={0.8}
              disabled={locationActionBusy}>
              <Text style={styles.locationSecondaryBtnText}>Search address instead</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.locationSecondaryBtn}
              onPress={handleLogout}
              activeOpacity={0.8}
              disabled={locationActionBusy}>
              <Text style={styles.locationSecondaryBtnText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
        {locationPickerModal}
      </>
    );
  }
  
  if (serviceUnavailableAtLocation) {
    return (
      <>
        <View style={styles.logoutOverlay}>
          <View style={styles.locationGateCard}>
            <View style={styles.gateIconWrap}>
                <GeometricPin />
            </View>
            <Text style={styles.logoutOverlayTitle}>Service Unavailable</Text>
            <Text style={styles.logoutOverlayDesc}>
              We are not present in your location right now. Try another area or search for a
              place where we have partners.
            </Text>
            <TouchableOpacity
              style={styles.locationPrimaryBtn}
              onPress={() => setLocationModalVisible(true)}
              activeOpacity={0.85}
              disabled={locationActionBusy}>
              <Text style={styles.locationPrimaryBtnText}>Change location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.locationSecondaryBtn}
              onPress={handleLogout}
              activeOpacity={0.8}
              disabled={locationActionBusy}>
              <Text style={styles.locationSecondaryBtnText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
        {locationPickerModal}
      </>
    );
  }
  
  if (loading && !hasLoadedOnceRef.current) {
    return (
      <View style={styles.homeLoadingOverlay}>
        <StatusBar barStyle="light-content" />
        <Image source={require('../assets/cashi-logo.png')} style={styles.homeLoadingLogo} resizeMode="contain" />
        <ActivityIndicator color={brand.surface} size="small" style={styles.homeLoadingSpinner} />
        <Text style={styles.homeLoadingText}>Fetching nearby shops...</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* --- PREMIUM MESH HERO --- */}
      <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <TouchableOpacity
              onPress={() => setMenuVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Open menu"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.menuHit}
              activeOpacity={0.7}>
              <MenuIcon />
            </TouchableOpacity>
          </View>
          
          <View style={styles.topBarCenter}>
            <TouchableOpacity 
              style={styles.topLocationSelector} 
              onPress={() => setLocationModalVisible(true)}
              activeOpacity={0.8}>
                <GeometricPin />
                <Text style={styles.topLocationText} numberOfLines={1}>{locationPillLine}</Text>
                <View style={styles.chevronDown} />
            </TouchableOpacity>
          </View>

          <View style={styles.topBarRight}>
             <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Invite')}
                accessibilityRole="button">
                <Text style={styles.inviteLink}>Invite</Text>
              </TouchableOpacity>
          </View>
        </View>

        <View style={styles.balanceHeader}>
          <View style={styles.greetingRow}>
            <Text style={styles.greetingText} numberOfLines={1}>
              Hello, {helloName}
            </Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{pointsText}</Text>
              <Text style={styles.statTag}>CASHI POINTS</Text>
            </View>
            <View style={styles.dividerInner} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{coinsText}</Text>
              <Text style={styles.statTag}>COINS</Text>
            </View>
            <View style={styles.dividerInner} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{cashbackText}</Text>
              <Text style={styles.statTag}>CASHBACK</Text>
            </View>
          </View>
        </View>
      </View>

      {/* --- CONTENT SHEET --- */}
      <View style={styles.mainSheet}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={styles.sheetHandle} />

          {/* 1. THE CASHI CARD */}
          <TouchableOpacity activeOpacity={0.96} style={styles.walletCard} onPress={() => setQrModalVisible(true)}>
            {/* Abstract Premium Background Elements */}
            <View style={styles.cardGlow} />
            <View style={styles.cardCircle1} />
            <View style={styles.cardCircle2} />

            <View style={styles.cardHeader}>
              <View style={styles.tierPill}>
                <Text style={styles.tierText}>CASHI CARD</Text>
              </View>
              <Text style={styles.cardProvider}>CASHI</Text>
            </View>
            
            <View style={styles.cardMiddle}>
              <View style={styles.cardTextWrap}>
                <Text style={styles.cardName}>Cashi Card</Text>
                <Text style={styles.cardDetail}>Scan at the shop to earn instantly</Text>
                
                {/* Visual Member ID inside the pass for realism */}
                <View style={styles.memberIdWrap}>
                   <Text style={styles.memberIdLabel}>MEMBER ID: </Text>
                   <Text style={styles.memberIdVal}>{memberIdMasked(memberUserId)}</Text>
                </View>
              </View>
              
              <View style={styles.glassQRBox}>
                 <QRCode 
                   value={memberQrValue} 
                   size={56} /* Taller card allows a slightly bigger QR */
                   color={brand.dark} 
                   backgroundColor="#FFFFFF" 
                 />
              </View>
            </View>
          </TouchableOpacity>

          {/* 2. DISCOVER MERCHANTS (Nearby Partners) */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionHeading}>Nearby Partners</Text>
            {showNearby && nearby.length > 1 ? (
              <TouchableOpacity onPress={() => navigation.navigate('ShopsDirectory')}>
                <Text style={styles.actionText}>See all</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          
          {showNearby ? (
            nearby.length === 1 ? (
              // FULL WIDTH SINGLE ITEM LAYOUT (1 Shop found)
              <View style={styles.singleMerchantWrap}>
                 <TouchableOpacity
                  style={styles.singleMerchantCard}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('ShopDetail', { shop: nearby[0] })}>
                  <View style={styles.singleMerchantLogoWrap}>
                    {nearby[0].imageUrl && !failedShopImages[nearby[0].id] ? (
                      <Image
                        source={{ uri: assetUrl(nearby[0].imageUrl) ?? undefined }}
                        style={styles.singleMerchantLogoImage} 
                        resizeMode="cover"
                        onError={() =>
                          setFailedShopImages((prev) => ({ ...prev, [nearby[0].id]: true }))
                        }
                      />
                    ) : (
                      <Text style={styles.merchantInit}>
                        {(nearby[0].name?.[0] ?? 'S').toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.singleMerchantDetails}>
                    <View style={styles.merchantNameBlock}>
                      <Text style={styles.singleMerchantTitle} numberOfLines={1}>{nearby[0].name}</Text>
                      <View style={styles.rewardTag}>
                        <Text style={styles.rewardTagText}>
                          {nearby[0].distanceKm != null ? `${nearby[0].distanceKm} km away` : 'OFFICIAL PARTNER'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.singleMerchantChevron}>
                      <View style={[styles.chevronDown, { transform: [{ rotate: '-90deg' }], borderTopColor: brand.blue }]} />
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              // HORIZONTAL SCROLL FOR MULTIPLE ITEMS (> 1 Shop found)
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.nearbyScroll}>
                {nearby.map((s: any, i: number) => (
                  <TouchableOpacity
                    key={s.id ?? i}
                    style={styles.merchantCard}
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('ShopDetail', { shop: s })}>
                    <View style={styles.merchantLogoWrap}>
                      {s.imageUrl && !failedShopImages[s.id] ? (
                        <Image
                          source={{ uri: assetUrl(s.imageUrl) ?? undefined }}
                          style={styles.merchantLogoImage}
                          resizeMode="cover"
                          onError={() =>
                            setFailedShopImages((prev) => ({ ...prev, [s.id]: true }))
                          }
                        />
                      ) : (
                        <Text style={styles.merchantInit}>
                          {(s.name?.[0] ?? 'S').toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={styles.merchantNameBlock}>
                      <Text style={styles.merchantTitle} numberOfLines={1}>
                        {s.name}
                      </Text>
                      <View style={styles.rewardTag}>
                        <Text style={styles.rewardTagText}>
                          {s.distanceKm != null ? `${s.distanceKm} km` : 'PARTNER'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )
          ) : (
            <View style={styles.noNearbyWrap}>
              <Text style={styles.noNearbyText}>
                We are not present at your location now.
              </Text>
            </View>
          )}

          {/* 3. YOUR BEST DEALS (Voucher Style) */}
          {showVouchers ? (
            <>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionHeading}>Active Vouchers</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Coupons')}>
                  <Text style={styles.actionText}>Browse All</Text>
                </TouchableOpacity>
              </View>

              {activeCoupons.map((it, i) => {
                const c = it.coupon;
                return (
                  <TouchableOpacity
                    key={it.assignmentId}
                    style={styles.voucherRow}
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('CouponPass', { item: it })}>
                    <View
                      style={[
                        styles.voucherAccent,
                        { backgroundColor: i % 2 === 0 ? brand.blue : '#FF5252' },
                      ]}
                    />
                    <View style={styles.voucherContent}>
                      <Text style={styles.vouchLabel}>{c?.title ?? 'Coupon'}</Text>
                      <Text style={styles.vouchMain}>
                        {c?.shortDescription ?? 'Tap to view'}
                      </Text>
                      <Text style={styles.vouchSub}>
                        {c?.minOrderValue
                          ? `Valid on orders above ₹${c.minOrderValue}`
                          : 'Valid at partner store'}
                      </Text>
                    </View>
                    <View style={styles.voucherAction}>
                      <View style={styles.usePill}>
                        <Text style={styles.usePillText}>USE</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          ) : null}

          {/* 4. SMART QUICK-ACTION WIDGET */}
          <TouchableOpacity
            style={styles.quickActionCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Scanner')}
          >
             <View style={styles.quickActionLeft}>
                <View style={styles.liveIndicator}>
                   <View style={styles.livePulse} />
                   <Text style={styles.liveText}>SCAN & PAY ACTIVE</Text>
                </View>
                <Text style={styles.quickTitle}>Instant Coin Accrual</Text>
                <Text style={styles.quickDesc}>Show your QR at checkout to earn</Text>
                <View style={styles.quickBtn}>
                   <Text style={styles.quickBtnText}>Launch Scanner</Text>
                </View>
             </View>
             <View style={styles.quickIconContainer}>
                <QRCode 
                   value="mock" 
                   size={100} 
                   color="rgba(255,255,255,0.15)" 
                   backgroundColor="transparent" 
                 />
             </View>
          </TouchableOpacity>

        </ScrollView>
      </View>
      </View>
      {locationPickerModal}
      {fullScreenQRModal}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: brand.dark, overflow: 'visible' },
  logoutOverlay: {
    flex: 1,
    backgroundColor: '#0D111B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  locationGateCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#151B2A',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  gateIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(59,158,232,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  geometricPin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: brand.blue,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  geometricPinInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: brand.blue,
  },
  logoutOverlayTitle: {
    color: brand.surface,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  logoutOverlayDesc: {
    marginTop: 8,
    color: brand.heroBody,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 28,
  },
  locationPrimaryBtn: {
    width: '100%',
    backgroundColor: brand.surface,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationPrimaryBtnText: {
    color: brand.dark,
    fontSize: 14,
    fontWeight: '800',
  },
  locationSecondaryBtn: {
    marginTop: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationSecondaryBtnText: {
    color: brand.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  homeLoadingOverlay: {
    flex: 1,
    backgroundColor: brand.dark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  homeLoadingLogo: { width: 160, height: 54 },
  homeLoadingSpinner: { marginTop: 16 },
  homeLoadingText: { marginTop: 12, color: brand.heroBody, fontSize: 13, fontWeight: '600' },
  
  // Hero & Header
  hero: { paddingHorizontal: 24, paddingBottom: 45 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
    minHeight: 44,
    zIndex: 20,
    elevation: 20,
  },
  topBarLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  menuHit: {
    minWidth: 44,
    minHeight: 44,
    paddingVertical: 8,
    paddingRight: 4,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  topBarCenter: {
    flex: 2,
    alignItems: 'center',
  },
  topLocationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    maxWidth: '100%',
  },
  topLocationText: {
    color: brand.surface,
    fontSize: 12,
    fontWeight: '700',
    marginHorizontal: 6,
    maxWidth: 100,
  },
  topBarRight: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  inviteLink: { color: brand.surface, fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },
  
  greetingRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingText: {
    color: brand.surface,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  chevronDown: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(255,255,255,0.55)',
    marginTop: 2,
  },

  balanceHeader: { width: '100%' },
  statsContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 18, borderRadius: 22 },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { color: brand.surface, fontSize: 19, fontWeight: '800' },
  statTag: { color: brand.heroBody, fontSize: 9, fontWeight: '900', marginTop: 4, letterSpacing: 1.2 },
  dividerInner: { width: 1, height: 22, backgroundColor: 'rgba(255,255,255,0.1)' },

  // Content Sheet
  mainSheet: { flex: 1, backgroundColor: brand.background, borderTopLeftRadius: 36, borderTopRightRadius: 36, marginTop: -20 },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#E0E2EE', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 24 },

  // --- BIGGER, REVISED CASHI CARD ---
  walletCard: { 
    marginHorizontal: 24, 
    height: 216, // Increased height
    backgroundColor: '#1A1F2C', 
    borderRadius: 24, 
    padding: 24, 
    justifyContent: 'space-between', 
    overflow: 'hidden', 
    elevation: 15, 
    shadowColor: '#000', 
    shadowOpacity: 0.4, 
    shadowRadius: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)' 
  },
  cardGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: brand.blue },
  cardCircle1: { position: 'absolute', right: -20, top: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(59,158,232,0.1)' },
  cardCircle2: { position: 'absolute', left: -40, bottom: -40, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.03)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 },
  tierPill: { backgroundColor: brand.blue, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  tierText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  cardProvider: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  cardMiddle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 2 },
  cardTextWrap: { flex: 1, paddingRight: 16 },
  cardName: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', marginBottom: 6 },
  cardDetail: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '500', marginBottom: 12 },
  
  // New visual member ID line
  memberIdWrap: { flexDirection: 'row', alignItems: 'center' },
  memberIdLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  memberIdVal: { color: brand.blueLight, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  
  glassQRBox: { backgroundColor: '#FFFFFF', padding: 8, borderRadius: 14, elevation: 5, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10 },

  // Merchant Cards Common
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginTop: 32, marginBottom: 18, alignItems: 'center' },
  sectionHeading: { fontSize: 18, fontWeight: '800', color: brand.cardHeading },
  actionText: { color: brand.blue, fontWeight: '700', fontSize: 13 },
  
  nearbyScroll: { paddingLeft: 24, paddingRight: 12, marginBottom: 12 },
  noNearbyWrap: { marginHorizontal: 24, marginBottom: 8, backgroundColor: '#F4F6FB', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  noNearbyText: { color: brand.helperColor, fontSize: 13, fontWeight: '700' },
  
  // MULTIPLE ITEMS STYLE (Horizontal Scroll)
  merchantCard: { width: 104, marginRight: 16, alignItems: 'center' },
  merchantLogoWrap: { width: 76, height: 76, borderRadius: 18, backgroundColor: brand.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#F0F1F7' },
  merchantLogoImage: { width: '100%', height: '100%', borderRadius: 18 },
  merchantInit: { fontSize: 24, fontWeight: '800', color: brand.cardHeading },
  merchantTitle: { fontSize: 13, color: brand.cardHeading, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  
  // SINGLE ITEM STYLE (Full Width Feature Card)
  singleMerchantWrap: { paddingHorizontal: 24, marginBottom: 12 },
  singleMerchantCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#F0F1F7', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  singleMerchantLogoWrap: { width: 60, height: 60, borderRadius: 14, backgroundColor: '#F8F9FB', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EBECEF' },
  singleMerchantLogoImage: { width: '100%', height: '100%', borderRadius: 14 },
  singleMerchantDetails: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  singleMerchantTitle: { fontSize: 16, color: brand.cardHeading, fontWeight: '800', marginBottom: 4 },
  singleMerchantChevron: { paddingLeft: 12 },

  merchantNameBlock: { alignSelf: 'center', alignItems: 'center' },
  rewardTag: { backgroundColor: brand.blueLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  rewardTagText: { color: brand.blue, fontSize: 10, fontWeight: '900', textAlign: 'center' },

  // Voucher Row
  voucherRow: { flexDirection: 'row', marginHorizontal: 24, marginBottom: 12, backgroundColor: brand.surface, borderRadius: 20, height: 90, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F1F7' },
  voucherAccent: { width: 6 },
  voucherContent: { flex: 1, paddingLeft: 16, justifyContent: 'center' },
  vouchLabel: { fontSize: 11, fontWeight: '800', color: brand.helperColor, letterSpacing: 0.5 },
  vouchMain: { fontSize: 15, fontWeight: '900', color: brand.cardHeading, marginTop: 2 },
  vouchSub: { fontSize: 11, color: brand.blue, fontWeight: '700', marginTop: 4 },
  voucherAction: { paddingRight: 16, justifyContent: 'center' },
  usePill: { backgroundColor: brand.inputBg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  usePillText: { color: brand.cardHeading, fontWeight: '900', fontSize: 12 },

  // Quick Action Dashboard Element
  quickActionCard: { marginHorizontal: 24, marginTop: 24, backgroundColor: brand.dark, borderRadius: 32, padding: 28, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  quickActionLeft: { flex: 1, zIndex: 2 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  livePulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50', marginRight: 8 },
  liveText: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  quickTitle: { color: brand.surface, fontSize: 20, fontWeight: '800' },
  quickDesc: { color: brand.heroBody, fontSize: 13, marginTop: 6, fontWeight: '500' },
  quickBtn: { backgroundColor: brand.surface, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, alignSelf: 'flex-start', marginTop: 20 },
  quickBtnText: { color: brand.dark, fontSize: 12, fontWeight: '800' },
  quickIconContainer: { position: 'absolute', right: -25, bottom: -10, transform: [{ rotate: '-10deg' }] },

  // --- BIG QR MODAL STYLES ---
  qrModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 23, 0.85)', // Dark glass blur effect
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  qrModalCard: {
    width: '100%',
    backgroundColor: brand.surface,
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 32,
  },
  qrModalHeader: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  qrModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: brand.cardHeading,
  },
  qrModalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F6FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrModalCloseText: {
    fontSize: 16,
    fontWeight: '700',
    color: brand.helperColor,
  },
  qrModalDesc: {
    fontSize: 14,
    color: brand.helperColor,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  qrBigBox: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 5 },
    marginBottom: 24,
  },
  qrModalUserId: {
    fontSize: 14,
    fontWeight: '800',
    color: brand.blue,
    letterSpacing: 1,
  },
  qrModalUserIdSub: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
    color: brand.helperColor,
    letterSpacing: 0.3,
  },

  // Icon Styles
  menuIconContainer: { gap: 6 },
  menuLineMain: { width: 22, height: 2.5, backgroundColor: brand.surface, borderRadius: 2 },
  menuLineSub: { width: 14, height: 2.5, backgroundColor: brand.surface, borderRadius: 2 },
});