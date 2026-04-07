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
} from 'react-native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHomeMenu } from '../navigation/HomeMenuContext';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { apiRequest } from '../api/client';
import { API_BASE_URL, GOOGLE_MAPS_API_KEY } from '../config/env';
import { logout } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { brand } from '../theme';
import { requestLocationCoords } from '../utils/requestLocationCoords';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

async function resolveLocationLabel(latitude: number, longitude: number): Promise<string | null> {
  if (!GOOGLE_MAPS_API_KEY) return null;
  const q = `latlng=${encodeURIComponent(`${latitude},${longitude}`)}&language=en&region=IN&key=${encodeURIComponent(
    GOOGLE_MAPS_API_KEY,
  )}`;
  const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${q}`);
  if (!res.ok) return null;
  const data = await res.json();
  if (data?.status && data.status !== 'OK') {
    if (__DEV__) {
      console.log(
        '[HomeScreen] geocode failed:',
        String(data.status),
        data?.error_message ? String(data.error_message) : '',
      );
    }
    return null;
  }
  const first = Array.isArray(data?.results) ? data.results[0] : null;
  const components: any[] = Array.isArray(first?.address_components)
    ? first.address_components
    : [];
  const pick = (types: string[]) =>
    components.find((c) => types.every((t) => Array.isArray(c?.types) && c.types.includes(t)))
      ?.long_name ?? null;
  return (
    pick(['sublocality']) ||
    pick(['sublocality_level_1']) ||
    pick(['locality']) ||
    pick(['administrative_area_level_3']) ||
    pick(['administrative_area_level_2']) ||
    pick(['administrative_area_level_1']) ||
    first?.formatted_address ||
    null
  );
}

function assetUrl(pathOrUrl: string | null) {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (!pathOrUrl.startsWith('/')) return pathOrUrl;
  const origin = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');
  return `${origin}${pathOrUrl}`;
}

function QRBlock({
  light = false,
  size = 6.5,
}: {
  light?: boolean;
  size?: number;
}) {
  const fg = light ? brand.surface : brand.dark;
  const dotOpacity = light ? 0.9 : 1;
  return (
    <View style={{ gap: 2.2 }}>
      {[...Array(6)].map((_, row) => (
        <View key={row} style={{ flexDirection: 'row', gap: 2.2 }}>
          {[...Array(6)].map((_, col) => {
            const filled = (row + col) % 2 === 0 || row === 0 || col === 5;
            return (
              <View
                key={col}
                style={{
                  width: size,
                  height: size,
                  borderRadius: 1.2,
                  backgroundColor: filled ? fg : 'transparent',
                  opacity: filled ? dotOpacity : 0.08,
                  borderWidth: filled ? 0 : 0.5,
                  borderColor: fg,
                }}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeNav>();
  const { setMenuVisible } = useHomeMenu();
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.accessToken);
  const displayName = useAppSelector((s) => s.user.displayName);

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
  const [locationRequired, setLocationRequired] = useState(false);
  const [serviceUnavailableAtLocation, setServiceUnavailableAtLocation] = useState(false);
  const [locationActionBusy, setLocationActionBusy] = useState(false);
  const [failedShopImages, setFailedShopImages] = useState<Record<string, boolean>>({});
  const hasLoadedOnceRef = useRef(false);
  const lastSyncedLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const lastResolvedLocationRef = useRef<{ latitude: number; longitude: number; label: string } | null>(
    null,
  );

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

  const handleAllowLocation = useCallback(async () => {
    if (!token) return;
    setLocationActionBusy(true);
    try {
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
      const resolvedLabel = await resolveLocationLabel(coords.latitude, coords.longitude).catch(
        () => null,
      );
      if (resolvedLabel?.trim()) {
        setLocationTag(resolvedLabel.trim());
        lastResolvedLocationRef.current = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          label: resolvedLabel.trim(),
        };
      }
      await apiRequest('/auth/customer/location', {
        method: 'POST',
        token,
        body: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      }).catch(() => {});
    } finally {
      setLocationActionBusy(false);
    }
  }, [token]);

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
          const locationResult = await requestLocationCoords();
          if (!alive) return;
          if (locationResult.permissionDenied) {
            setLocationRequired(true);
            return;
          }
          setLocationRequired(false);
          setServiceUnavailableAtLocation(false);
          const coords = locationResult.coords;
          setLocationTag(coords ? 'Location' : 'Browse stores');
          if (coords) {
            const lastResolved = lastResolvedLocationRef.current;
            const shouldResolveLocation =
              !lastResolved ||
              Math.abs(lastResolved.latitude - coords.latitude) > 0.002 ||
              Math.abs(lastResolved.longitude - coords.longitude) > 0.002;
            if (shouldResolveLocation) {
              const resolvedLabel = await resolveLocationLabel(
                coords.latitude,
                coords.longitude,
              ).catch(() => null);
              if (resolvedLabel?.trim()) {
                setLocationTag(resolvedLabel.trim());
                lastResolvedLocationRef.current = {
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  label: resolvedLabel.trim(),
                };
              }
            } else if (lastResolved?.label) {
              setLocationTag(lastResolved.label);
            }
            const lastSynced = lastSyncedLocationRef.current;
            const movedEnough =
              !lastSynced ||
              Math.abs(lastSynced.latitude - coords.latitude) > 0.0005 ||
              Math.abs(lastSynced.longitude - coords.longitude) > 0.0005;
            if (movedEnough) {
              void apiRequest('/auth/customer/location', {
                method: 'POST',
                token,
                body: {
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                },
              })
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
          console.log(
            '[HomeScreen] fetching nearby shops with coords:',
            coords
              ? { latitude: coords.latitude, longitude: coords.longitude }
              : { latitude: null, longitude: null },
          );

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
    }, [token]),
  );

  const pointsText = useMemo(() => String(dash?.points?.available ?? 0), [dash]);
  const coinsText = useMemo(() => String(dash?.points?.earned ?? 0), [dash]);
  const cashbackText = useMemo(() => {
    const availablePoints = Number(dash?.points?.available ?? 0);
    return `₹${availablePoints}`;
  }, [dash]);
  const helloName = (displayName?.trim() ? displayName.trim() : 'there');
  const showNearby = nearby.length > 0;
  const showVouchers = activeCoupons.length > 0;
  if (locationRequired) {
    return (
      <View style={styles.logoutOverlay}>
        <View style={styles.locationGateCard}>
          <Text style={styles.locationGateEmoji}>📍</Text>
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
            onPress={handleLogout}
            activeOpacity={0.8}
            disabled={locationActionBusy}>
            <Text style={styles.locationSecondaryBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  if (serviceUnavailableAtLocation) {
    return (
      <View style={styles.logoutOverlay}>
        <View style={styles.locationGateCard}>
          <Text style={styles.locationGateEmoji}>📍</Text>
          <Text style={styles.logoutOverlayTitle}>Service Unavailable</Text>
          <Text style={styles.logoutOverlayDesc}>
            We are not present in your location right now.
          </Text>
          <TouchableOpacity
            style={styles.locationSecondaryBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
            disabled={locationActionBusy}>
            <Text style={styles.locationSecondaryBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
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
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Invite')}
              accessibilityRole="button"
              accessibilityLabel="Invite">
              <Text style={styles.inviteLink}>Invite</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.topBarLogo}>
            <Image source={require('../assets/cashi-logo.png')} style={styles.logoMain} resizeMode="contain" />
          </View>
          <View style={styles.topBarRight}>
          </View>
        </View>

        <View style={styles.balanceHeader}>
          <View style={styles.greetingRow}>
            <Text style={styles.greetingText} numberOfLines={2}>
              Hello, {helloName}
            </Text>
            <View style={styles.locationContainer}>
              <View style={styles.gpsDot} />
              <Text style={styles.locationLabel} numberOfLines={1}>
                {locationTag}
              </Text>
              <View style={styles.chevronSmall} />
            </View>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{pointsText}</Text>
              <Text style={styles.statTag}>POINTS</Text>
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

          {/* 1. THE PLATINUM WALLET CARD */}
          <TouchableOpacity activeOpacity={0.96} style={styles.walletCard}>
            <View style={styles.cardGlow} />
            <View style={styles.cardHeader}>
              <View style={styles.tierPill}>
                <Text style={styles.tierText}>PLATINUM MEMBER</Text>
              </View>
              <Text style={styles.cardProvider}>SHOPVIEW • SHOPOS</Text>
            </View>
            
            <View style={styles.cardMiddle}>
              <View>
                <Text style={styles.cardName}>Loyalty Card</Text>
                <Text style={styles.cardDetail}>Unlimited 5% Cashback Rewards</Text>
              </View>
              <View style={styles.glassQRBox}>
                 <QRBlock light size={9} />
              </View>
            </View>
          </TouchableOpacity>

          {/* 2. DISCOVER MERCHANTS (Nearby Partners) */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionHeading}>Nearby Partners</Text>
            {showNearby ? (
              <TouchableOpacity onPress={() => navigation.navigate('ShopsDirectory')}>
                <Text style={styles.actionText}>See all</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {showNearby ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.nearbyScroll}>
              {nearby.map((s: any, i: number) => (
                <TouchableOpacity
                  key={s.id ?? i}
                  style={styles.merchantCard}
                  activeOpacity={0.9}
                  onPress={() => {
                    // later: navigate to shop detail by username
                  }}>
                  <View style={styles.merchantLogoWrap}>
                    {s.imageUrl && !failedShopImages[s.id] ? (
                      <Image
                        source={{ uri: assetUrl(s.imageUrl) ?? undefined }}
                        style={styles.merchantLogoImage}
                        resizeMode="cover"
                        onError={() =>
                          setFailedShopImages((prev) => ({
                            ...prev,
                            [s.id]: true,
                          }))
                        }
                      />
                    ) : (
                      <Text style={styles.merchantInit}>
                        {(s.name?.[0] ?? 'S').toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.merchantTitle} numberOfLines={1}>
                    {s.name}
                  </Text>
                  <View style={styles.rewardTag}>
                    <Text style={styles.rewardTagText}>
                      {s.distanceKm != null ? `${s.distanceKm} km` : 'PARTNER'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
                    onPress={() => navigation.navigate('Coupons')}>
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
          <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.9}>
             <View style={styles.quickActionLeft}>
                <View style={styles.liveIndicator}>
                   <View style={styles.livePulse} />
                   <Text style={styles.liveText}>SCAN & PAY ACTIVE</Text>
                </View>
                <Text style={styles.quickTitle}>Instant Coin Accrual</Text>
                <Text style={styles.quickDesc}>Pay any merchant to earn coins</Text>
                <View style={styles.quickBtn}>
                   <Text style={styles.quickBtnText}>Launch Scanner</Text>
                </View>
             </View>
             <View style={styles.quickIconContainer}>
                <QRBlock light size={7.5} />
             </View>
          </TouchableOpacity>

        </ScrollView>
      </View>
    </View>
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
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  locationGateEmoji: {
    fontSize: 30,
    textAlign: 'center',
    marginBottom: 8,
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
    marginBottom: 24,
  },
  locationPrimaryBtn: {
    minWidth: 190,
    backgroundColor: brand.surface,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationPrimaryBtnText: {
    color: brand.dark,
    fontSize: 14,
    fontWeight: '800',
  },
  locationSecondaryBtn: {
    marginTop: 10,
    minWidth: 190,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
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
  homeLoadingLogo: {
    width: 160,
    height: 54,
  },
  homeLoadingSpinner: {
    marginTop: 16,
  },
  homeLoadingText: {
    marginTop: 12,
    color: brand.heroBody,
    fontSize: 13,
    fontWeight: '600',
  },
  
  // Hero & Header
  hero: { paddingHorizontal: 24, paddingBottom: 45 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    minHeight: 44,
    zIndex: 20,
    elevation: 20,
  },
  topBarLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    justifyContent: 'flex-start',
  },
  menuHit: {
    minWidth: 44,
    minHeight: 44,
    paddingVertical: 8,
    paddingRight: 4,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  inviteLink: { color: brand.surface, fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },
  topBarLogo: {
    width: 104,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 14,
  },
  logoMain: { width: 96, height: 34 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  greetingRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
    flexShrink: 0,
    maxWidth: '56%',
  },
  gpsDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: brand.blue, marginRight: 6 },
  locationLabel: { color: brand.heroBody, fontSize: 10, fontWeight: '700', flexShrink: 1 },
  chevronSmall: { width: 4, height: 4, borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: brand.heroBody, transform: [{ rotate: '45deg' }], marginLeft: 4 },

  balanceHeader: { width: '100%' },
  greetingText: {
    flex: 1,
    color: brand.surface,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginRight: 4,
  },
  statsContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 18, borderRadius: 22 },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { color: brand.surface, fontSize: 19, fontWeight: '800' },
  statTag: { color: brand.heroBody, fontSize: 9, fontWeight: '900', marginTop: 4, letterSpacing: 1.2 },
  dividerInner: { width: 1, height: 22, backgroundColor: 'rgba(255,255,255,0.1)' },

  // Content Sheet
  mainSheet: { flex: 1, backgroundColor: brand.background, borderTopLeftRadius: 36, borderTopRightRadius: 36, marginTop: -20 },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#E0E2EE', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 24 },

  // The Card (Elite Wallet Design)
  walletCard: { marginHorizontal: 24, height: 190, backgroundColor: brand.blue, borderRadius: 28, padding: 24, justifyContent: 'space-between', overflow: 'hidden', elevation: 15, shadowColor: brand.blue, shadowOpacity: 0.3, shadowRadius: 20 },
  cardGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.4)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tierPill: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  tierText: { color: brand.surface, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  cardProvider: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  cardMiddle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardName: { color: brand.surface, fontSize: 24, fontWeight: '800' },
  cardDetail: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', marginTop: 4 },
  glassQRBox: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 14, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },

  // Merchant Cards
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginTop: 32, marginBottom: 18, alignItems: 'center' },
  sectionHeading: { fontSize: 18, fontWeight: '800', color: brand.cardHeading },
  actionText: { color: brand.blue, fontWeight: '700', fontSize: 13 },
  nearbyScroll: { paddingLeft: 24, paddingRight: 12, marginBottom: 12 },
  noNearbyWrap: {
    marginHorizontal: 24,
    marginBottom: 8,
    backgroundColor: '#F4F6FB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noNearbyText: { color: brand.helperColor, fontSize: 13, fontWeight: '700' },
  merchantCard: { width: 90, marginRight: 16, alignItems: 'center' },
  merchantLogoWrap: { width: 72, height: 72, borderRadius: 24, backgroundColor: brand.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#F0F1F7' },
  merchantLogoImage: { width: '100%', height: '100%', borderRadius: 24 },
  merchantInit: { fontSize: 24, fontWeight: '800', color: brand.cardHeading },
  merchantTitle: { fontSize: 12, color: brand.cardHeading, fontWeight: '700', marginBottom: 6 },
  rewardTag: { backgroundColor: brand.blueLight, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  rewardTagText: { color: brand.blue, fontSize: 9, fontWeight: '900' },

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
  quickIconContainer: { opacity: 0.15, position: 'absolute', right: -15, transform: [{ scale: 1.8 }, { rotate: '-10deg' }] },

  // Icon Styles
  menuIconContainer: { gap: 6 },
  menuLineMain: { width: 22, height: 2.5, backgroundColor: brand.surface, borderRadius: 2 },
  menuLineSub: { width: 14, height: 2.5, backgroundColor: brand.surface, borderRadius: 2 },
});