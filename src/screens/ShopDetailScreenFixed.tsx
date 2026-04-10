import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackScreenProps } from '../navigation/types';
import { apiRequest } from '../api/client';
import { API_BASE_URL } from '../config/env';
import { brand } from '../theme';
import { useAppSelector } from '../store/hooks';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function assetUrl(pathOrUrl: string | null) {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (!pathOrUrl.startsWith('/')) return pathOrUrl;
  const origin = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');
  return `${origin}${pathOrUrl}`;
}

type ShopActivityItem = {
  id: string;
  createdAt: string;
  amount: number;
  originalAmount: number | null;
  discountAmount: number;
  pointsEarned: number;
  pointsRedeemed: number;
};

type ShopActivityResponse = {
  shopId: string;
  stats: { visits: number; coinsEarned: number; cashback: number };
  page: number;
  limit: number;
  total: number;
  items: ShopActivityItem[];
};

type ShopCouponItem = {
  assignmentId: string;
  status: 'ASSIGNED' | 'REDEEMED' | 'EXPIRED';
  assignedAt: string;
  redeemedAt: string | null;
  coupon: {
    id: string;
    shopId: string;
    title: string;
    shortDescription: string | null;
    longDescription: string | null;
    valueType: 'FIXED' | 'PERCENTAGE';
    valueFixed: number | null;
    valuePercent: number | null;
    minOrderValue: number | null;
    status: 'DRAFT' | 'ACTIVE' | 'EXPIRED';
    activeAt: string | null;
    expiresAt: string | null;
    imageUrl: string | null;
  } | null;
};

type MyCouponsResponse = {
  active: ShopCouponItem[];
  used: ShopCouponItem[];
  expired: ShopCouponItem[];
};

type AvailableCoupon = {
  id: string;
  shopId: string;
  title: string;
  shortDescription: string | null;
  longDescription: string | null;
  valueType: 'FIXED' | 'PERCENTAGE';
  valueFixed: number | null;
  valuePercent: number | null;
  minOrderValue: number | null;
  status: 'ACTIVE';
  activeAt: string | null;
  expiresAt: string | null;
  imageUrl: string | null;
  cashiPointsCost: number;
  shop: { id: string; name: string; username: string | null; imageUrl: string | null; city: string; state: string };
};

type AvailableCouponsResponse = {
  items: AvailableCoupon[];
  radiusKm: number;
  usedCoords: boolean;
};

function formatTxnDate(iso: string) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = d.toLocaleString('en-US', { month: 'short' });
  const yyyy = d.getFullYear();
  return `${dd} ${mm} ${yyyy}`;
}

export function ShopDetailScreen({ navigation, route }: RootStackScreenProps<'ShopDetail'>) {
  const insets = useSafeAreaInsets();
  const token = useAppSelector((s) => s.auth.accessToken);
  const shopFromRoute = (route?.params?.shop ?? {}) as any;
  const [shop, setShop] = useState<any>(shopFromRoute);
  const [loadingRemote, setLoadingRemote] = useState(false);

  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [activeViewerImage, setActiveViewerImage] = useState<string | null>(null);

  const shopId = useMemo(() => String(shop?.id ?? shopFromRoute?.id ?? '').trim(), [shop?.id, shopFromRoute?.id]);

  const [activity, setActivity] = useState<ShopActivityResponse | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);

  const [txModalVisible, setTxModalVisible] = useState(false);
  const [txPage, setTxPage] = useState(1);
  const [txHasMore, setTxHasMore] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [txItems, setTxItems] = useState<ShopActivityItem[]>([]);

  const [shopCouponsLoading, setShopCouponsLoading] = useState(false);
  const [shopCoupons, setShopCoupons] = useState<ShopCouponItem[]>([]);
  const [couponModalVisible, setCouponModalVisible] = useState(false);

  const [availableShopCouponsLoading, setAvailableShopCouponsLoading] = useState(false);
  const [availableShopCoupons, setAvailableShopCoupons] = useState<AvailableCoupon[]>([]);
  const [claimingCouponId, setClaimingCouponId] = useState<string | null>(null);

  useEffect(() => {
    setShop(shopFromRoute);
  }, [shopFromRoute]);

  useEffect(() => {
    setTxPage(1);
    setTxHasMore(true);
    setTxItems([]);
  }, [shopId]);

  useEffect(() => {
    let alive = true;
    if (!token || !shopId) return () => {};

    setActivityLoading(true);
    void apiRequest<ShopActivityResponse>(
      `/users/me/shop-activity?shopId=${encodeURIComponent(shopId)}&page=1&limit=2`,
      { method: 'GET', token },
    )
      .then((res) => {
        if (!alive) return;
        setActivity(res);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setActivityLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [token, shopId]);

  useEffect(() => {
    let alive = true;
    if (!token || !shopId) {
      setShopCoupons([]);
      setShopCouponsLoading(false);
      return () => {};
    }

    setShopCouponsLoading(true);
    void apiRequest<MyCouponsResponse>('/users/me/coupons', { method: 'GET', token })
      .then((res) => {
        if (!alive) return;
        const filtered = (res?.active ?? []).filter((it) => String(it?.coupon?.shopId ?? '').trim() === shopId);
        setShopCoupons(filtered);
      })
      .catch(() => {
        if (!alive) return;
        setShopCoupons([]);
      })
      .finally(() => {
        if (!alive) return;
        setShopCouponsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [token, shopId]);

  useEffect(() => {
    let alive = true;
    if (!token || !shopId) {
      setAvailableShopCoupons([]);
      setAvailableShopCouponsLoading(false);
      return () => {};
    }

    setAvailableShopCouponsLoading(true);
    void apiRequest<AvailableCouponsResponse>(
      `/users/me/rewards/available-coupons?shopId=${encodeURIComponent(shopId)}&limit=30`,
      { method: 'GET', token },
    )
      .then((res) => {
        if (!alive) return;
        setAvailableShopCoupons(res?.items ?? []);
      })
      .catch(() => {
        if (!alive) return;
        setAvailableShopCoupons([]);
      })
      .finally(() => {
        if (!alive) return;
        setAvailableShopCouponsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [token, shopId]);

  const loadTransactionsPage = useCallback(
    async (targetPage: number) => {
      if (!token || !shopId) return;
      if (txLoading) return;

      setTxLoading(true);
      try {
        const res = await apiRequest<ShopActivityResponse>(
          `/users/me/shop-activity?shopId=${encodeURIComponent(shopId)}&page=${targetPage}&limit=20`,
          { method: 'GET', token },
        );
        setTxPage(res.page);
        setTxHasMore(res.page * res.limit < res.total);
        setTxItems((prev) => (targetPage === 1 ? res.items : [...prev, ...res.items]));
        setActivity((prev) => (prev ? { ...prev, stats: res.stats, total: res.total } : res));
      } catch {
        // ignore
      } finally {
        setTxLoading(false);
      }
    },
    [token, shopId, txLoading],
  );

  const openAllTransactions = useCallback(() => {
    setTxModalVisible(true);
    if (txItems.length === 0 && !txLoading) {
      void loadTransactionsPage(1);
    }
  }, [loadTransactionsPage, txItems.length, txLoading]);

  const openAllCoupons = useCallback(() => {
    setCouponModalVisible(true);
  }, []);

  const openCoupon = useCallback(
    (item: ShopCouponItem) => {
      navigation.navigate('CouponPass', { item });
    },
    [navigation],
  );

  const claimCoupon = useCallback(
    async (coupon: AvailableCoupon) => {
      if (!token) return;
      if (claimingCouponId) return;

      setClaimingCouponId(coupon.id);
      try {
        const res = await apiRequest<any>('/users/me/rewards/claim-coupon', {
          method: 'POST',
          token,
          body: { couponId: coupon.id },
        });
        const assignment: ShopCouponItem | null = res?.assignment ?? null;
        if (assignment) {
          setShopCoupons((prev) => [assignment, ...(prev ?? [])]);
          setAvailableShopCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
          navigation.navigate('CouponPass', { item: assignment });
        }
      } catch (e: any) {
        // keep it simple; UI already has lots of alerts elsewhere
      } finally {
        setClaimingCouponId(null);
      }
    },
    [claimingCouponId, navigation, token],
  );

  useEffect(() => {
    let alive = true;
    const rawUsername = String(shopFromRoute?.username ?? '').trim();
    if (!rawUsername) return () => {};

    const normalized = rawUsername.startsWith('@') ? rawUsername.slice(1) : rawUsername;
    setLoadingRemote(true);
    void apiRequest<any>(`/shops/by-username/${encodeURIComponent(normalized)}`, { method: 'GET' })
      .then((res) => {
        if (!alive) return;
        // Merge so we don't lose extra fields from list results (distanceKm/latitude/longitude etc.)
        setShop((prev: any) => ({ ...(prev ?? {}), ...(res ?? {}) }));
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoadingRemote(false);
      });

    return () => {
      alive = false;
    };
  }, [shopFromRoute?.username]);

  const img = useMemo(() => assetUrl(shop?.imageUrl ?? null), [shop?.imageUrl]);
  const title = String(shop?.name ?? 'Partner Store');
  const username = shop?.username ? `@${String(shop.username)}` : '@shop';
  const location = [shop?.city, shop?.state].filter(Boolean).join(', ') || 'Location unavailable';
  const distance = shop?.distanceKm != null ? `${shop.distanceKm} km away` : 'Partner Store';

  const handleOpenImage = (imageUrl: string | null) => {
    if (imageUrl) {
      setActiveViewerImage(imageUrl);
      setImageViewerVisible(true);
    }
  };

  const handleVisitMap = () => {
    const lat = shop?.latitude ?? shop?.lat;
    const lng = shop?.longitude ?? shop?.lng;
    
    // Attempt coordinate-based routing, fallback to name/city search
    let url = '';
    if (lat && lng) {
      url = Platform.select({
        ios: `maps:0,0?q=${title}@${lat},${lng}`,
        android: `geo:0,0?q=${lat},${lng}(${encodeURIComponent(title)})`,
        default: `https://maps.google.com/?q=${lat},${lng}`
      });
    } else {
      const query = encodeURIComponent(`${title} ${shop?.city || ''}`);
      url = Platform.select({
        ios: `maps:0,0?q=${query}`,
        android: `geo:0,0?q=${query}`,
        default: `https://maps.google.com/?q=${query}`
      });
    }
    
    Linking.canOpenURL(url).then((supported) => {
      if (supported) Linking.openURL(url);
      else Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(title)}`);
    }).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* --- FULL SCREEN IMAGE VIEWER MODAL --- */}
      <Modal
        visible={imageViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageViewerVisible(false)}>
        <View style={styles.viewerBackdrop}>
          <TouchableOpacity
            style={[styles.viewerCloseBtn, { top: insets.top + 20 }]}
            onPress={() => setImageViewerVisible(false)}>
            <View style={styles.closeCrossMain} />
            <View style={styles.closeCrossSub} />
          </TouchableOpacity>
          {activeViewerImage ? (
            <Image
              source={{ uri: activeViewerImage }}
              style={styles.viewerImage}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>

      {/* --- ALL TRANSACTIONS MODAL --- */}
      <Modal
        visible={txModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTxModalVisible(false)}
      >
        <View style={styles.txModalBackdrop}>
          <View style={[styles.txModalCard, { paddingTop: insets.top + 14, paddingBottom: Math.max(insets.bottom, 14) }]}>
            <View style={styles.txModalHeader}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setTxModalVisible(false)} style={styles.txModalCloseBtn}>
                <Text style={styles.txModalCloseText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.txModalTitle}>All Transactions</Text>
              <View style={{ width: 44 }} />
            </View>

            <View style={styles.txModalSummaryRow}>
              <View style={styles.txSummaryPill}>
                <Text style={styles.txSummaryLabel}>VISITS</Text>
                <Text style={styles.txSummaryValue}>{activity?.stats?.visits ?? 0}</Text>
              </View>
              <View style={styles.txSummaryPill}>
                <Text style={styles.txSummaryLabel}>COINS</Text>
                <Text style={styles.txSummaryValue}>{activity?.stats?.coinsEarned ?? 0}</Text>
              </View>
              <View style={styles.txSummaryPill}>
                <Text style={styles.txSummaryLabel}>CASHBACK</Text>
                <Text style={styles.txSummaryValue}>₹{activity?.stats?.cashback ?? 0}</Text>
              </View>
            </View>

            <FlatList
              data={txItems}
              keyExtractor={(it) => it.id}
              contentContainerStyle={{ paddingTop: 10, paddingBottom: 18 }}
              onEndReachedThreshold={0.3}
              onEndReached={() => {
                if (!txLoading && txHasMore) void loadTransactionsPage(txPage + 1);
              }}
              ListEmptyComponent={
                txLoading ? (
                  <View style={{ paddingVertical: 22, alignItems: 'center' }}>
                    <ActivityIndicator />
                    <Text style={[styles.updatingText, { marginTop: 10 }]}>Loading…</Text>
                  </View>
                ) : (
                  <View style={{ paddingVertical: 26, alignItems: 'center' }}>
                    <Text style={styles.emptyHistoryText}>No transactions at this store yet.</Text>
                  </View>
                )
              }
              renderItem={({ item, index }) => (
                <View style={[styles.txRow, index === 0 && styles.txRowFirst]}>
                  <View style={styles.txIconWrap}>
                    <View style={styles.txIconInner} />
                  </View>
                  <View style={styles.txDetails}>
                    <Text style={styles.txTitle}>Store Payment</Text>
                    <Text style={styles.txDate}>{formatTxnDate(item.createdAt)}</Text>
                  </View>
                  <View style={styles.txValues}>
                    <Text style={styles.txAmount}>₹{item.amount}</Text>
                    <Text style={styles.txRewards}>
                      +{item.pointsEarned} Coins {item.discountAmount > 0 ? ` • ₹${item.discountAmount} CB` : ''}
                    </Text>
                  </View>
                </View>
              )}
              ListFooterComponent={
                txLoading && txItems.length > 0 ? (
                  <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                    <ActivityIndicator />
                  </View>
                ) : null
              }
            />
          </View>
        </View>
      </Modal>

      {/* --- ALL COUPONS MODAL --- */}
      <Modal
        visible={couponModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCouponModalVisible(false)}
      >
        <View style={styles.couponModalBackdrop}>
          <View style={[styles.couponModalCard, { paddingTop: insets.top + 14, paddingBottom: Math.max(insets.bottom, 14) }]}>
            <View style={styles.couponModalHeader}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setCouponModalVisible(false)} style={styles.couponModalCloseBtn}>
                <Text style={styles.couponModalCloseText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.couponModalTitle}>Shop Coupons</Text>
              <View style={{ width: 44 }} />
            </View>

            <FlatList
              data={shopCoupons}
              keyExtractor={(it) => it.assignmentId}
              contentContainerStyle={{ paddingTop: 10, paddingBottom: 18 }}
              ListEmptyComponent={
                shopCouponsLoading ? (
                  <View style={{ paddingVertical: 22, alignItems: 'center' }}>
                    <ActivityIndicator />
                    <Text style={[styles.updatingText, { marginTop: 10 }]}>Loading…</Text>
                  </View>
                ) : (
                  <View style={{ paddingVertical: 26, alignItems: 'center' }}>
                    <Text style={styles.emptyHistoryText}>No active coupons for this shop.</Text>
                  </View>
                )
              }
              renderItem={({ item, index }) => {
                const c = item.coupon;
                const imgUrl = assetUrl(c?.imageUrl ?? null);
                return (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => openCoupon(item)}
                    style={[styles.couponRow, index === 0 && styles.couponRowFirst]}
                  >
                    <View style={styles.couponImgWrap}>
                      {imgUrl ? (
                        <Image source={{ uri: imgUrl }} style={styles.couponImg} resizeMode="cover" />
                      ) : (
                        <View style={styles.couponImgFallback}>
                          <Text style={styles.couponImgFallbackText}>%</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.couponContent}>
                      <Text style={styles.couponTitle} numberOfLines={1}>
                        {c?.title ?? 'Coupon'}
                      </Text>
                      <Text style={styles.couponSub} numberOfLines={2}>
                        {c?.shortDescription ?? 'Tap to view coupon'}
                      </Text>
                      {c?.minOrderValue ? (
                        <Text style={styles.couponMeta}>Min order: ₹{c.minOrderValue}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* --- BACK BUTTON (Fixed absolutely) --- */}
      <View style={[styles.absoluteHeader, { top: insets.top + 10 }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <View style={styles.arrow} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}>
        
        {/* --- HERO BACKGROUND (Unblurred Cover Photo) --- */}
        <View style={styles.heroBackground}>
          {img ? (
            <Image 
              source={{ uri: img }} 
              style={styles.heroImg} 
              resizeMode="cover" 
              // Removed blurRadius to show the cover photo clearly
            />
          ) : (
            <View style={styles.heroFallback} />
          )}
          {/* Lighter overlay so the cover photo shines through */}
          <View style={styles.heroOverlay} />
        </View>

        {/* --- MAIN PROFILE CARD --- */}
        <View style={styles.contentWrapper}>
          <View style={styles.mainCard}>
            
            <View style={styles.mainCardTop}>
              {/* FACEBOOK STYLE PROFILE PIC OVERLAP */}
              <TouchableOpacity 
                activeOpacity={0.9} 
                style={styles.logoWrap}
                onPress={() => handleOpenImage(img)}
              >
                {img ? (
                  <Image source={{ uri: img }} style={styles.logoImg} resizeMode="cover" />
                ) : (
                  <Text style={styles.logoInitial}>{(title?.[0] ?? 'S').toUpperCase()}</Text>
                )}
              </TouchableOpacity>

              <View style={styles.titleWrap}>
                <Text style={styles.name} numberOfLines={2}>{title}</Text>
                <Text style={styles.username}>{username}</Text>
                {loadingRemote ? (
                  <Text style={styles.updatingText}>Updating…</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.locationRow}>
              <View style={styles.locationDetails}>
                <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
                <Text style={styles.distanceText}>{distance}</Text>
              </View>
              <TouchableOpacity style={styles.visitBtn} activeOpacity={0.8} onPress={handleVisitMap}>
                <Text style={styles.visitBtnText}>Get Directions</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* --- MY REWARDS / STATS SECTION --- */}
          <View style={styles.statsCard}>
            <Text style={styles.sectionHeading}>My Activity Here</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{activity?.stats?.visits ?? 0}</Text>
                <Text style={styles.statLabel}>VISITS</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{activity?.stats?.coinsEarned ?? 0}</Text>
                <Text style={styles.statLabel}>COINS</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>₹{activity?.stats?.cashback ?? 0}</Text>
                <Text style={styles.statLabel}>CASHBACK</Text>
              </View>
            </View>
            {activityLoading ? (
              <View style={{ paddingTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator />
                <Text style={[styles.updatingText, { marginLeft: 10 }]}>Loading your activity…</Text>
              </View>
            ) : null}
          </View>

          {/* --- SHOP COUPONS (Like Home Active Vouchers) --- */}
          {shopCouponsLoading ? (
            <View style={[styles.couponLoadingRow, { paddingTop: 10 }]}>
              <ActivityIndicator />
              <Text style={[styles.updatingText, { marginLeft: 10 }]}>Loading coupons…</Text>
            </View>
          ) : null}

          {shopCoupons.length > 0 ? (
            <View style={styles.couponsSection}>
              <View style={styles.historyHeader}>
                <Text style={styles.sectionHeading}>Active Vouchers</Text>
                {shopCoupons.length > 4 ? (
                  <TouchableOpacity activeOpacity={0.7} onPress={openAllCoupons}>
                    <Text style={styles.seeAllText}>See all</Text>
                  </TouchableOpacity>
                ) : (
                  <View />
                )}
              </View>

              <View style={styles.couponsList}>
                {shopCoupons.slice(0, 4).map((it, idx) => {
                  const c = it.coupon;
                  const imgUrl = assetUrl(c?.imageUrl ?? null);
                  return (
                    <TouchableOpacity
                      key={it.assignmentId}
                      activeOpacity={0.88}
                      onPress={() => openCoupon(it)}
                      style={[styles.couponRow, idx === 0 && styles.couponRowFirst]}
                    >
                      <View style={styles.couponImgWrap}>
                        {imgUrl ? (
                          <Image source={{ uri: imgUrl }} style={styles.couponImg} resizeMode="cover" />
                        ) : (
                          <View style={styles.couponImgFallback}>
                            <Text style={styles.couponImgFallbackText}>%</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.couponContent}>
                        <Text style={styles.couponTitle} numberOfLines={1}>
                          {c?.title ?? 'Coupon'}
                        </Text>
                        <Text style={styles.couponSub} numberOfLines={2}>
                          {c?.shortDescription ?? 'Tap to view coupon'}
                        </Text>
                        {c?.minOrderValue ? (
                          <Text style={styles.couponMeta}>Min order: ₹{c.minOrderValue}</Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : availableShopCouponsLoading ? (
            <View style={[styles.couponLoadingRow, { paddingTop: 10, marginBottom: 14 }]}>
              <ActivityIndicator />
              <Text style={[styles.updatingText, { marginLeft: 10 }]}>Loading shop coupons…</Text>
            </View>
          ) : availableShopCoupons.length > 0 ? (
            <View style={styles.couponsSection}>
              <View style={styles.historyHeader}>
                <Text style={styles.sectionHeading}>Grab Coupons</Text>
                <View />
              </View>

              <View style={styles.couponsList}>
                {availableShopCoupons.slice(0, 4).map((c, idx) => {
                  const imgUrl = assetUrl(c?.imageUrl ?? null) ?? assetUrl(c?.shop?.imageUrl ?? null);
                  const isClaiming = claimingCouponId === c.id;
                  return (
                    <View key={c.id} style={[styles.couponRow, idx === 0 && styles.couponRowFirst]}>
                      <View style={styles.couponImgWrap}>
                        {imgUrl ? (
                          <Image source={{ uri: imgUrl }} style={styles.couponImg} resizeMode="cover" />
                        ) : (
                          <View style={styles.couponImgFallback}>
                            <Text style={styles.couponImgFallbackText}>%</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.couponContent}>
                        <Text style={styles.couponTitle} numberOfLines={1}>
                          {c.title}
                        </Text>
                        <Text style={styles.couponSub} numberOfLines={2}>
                          {c.shortDescription ?? 'Grab this coupon using Cashi Points'}
                        </Text>
                        <Text style={styles.couponMeta}>Cost: {Number(c.cashiPointsCost ?? 0)} points</Text>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => void claimCoupon(c)}
                        disabled={isClaiming}
                        style={[styles.shopGrabBtn, isClaiming && styles.shopGrabBtnDisabled]}
                      >
                        {isClaiming ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <Text style={styles.shopGrabBtnText}>GRAB</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* --- SALES / TRANSACTION HISTORY --- */}
          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <Text style={styles.sectionHeading}>Recent Transactions</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={openAllTransactions}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>

            {(activity?.items?.length ?? 0) > 0 ? (
              <View style={styles.historyList}>
                {(activity?.items ?? []).slice(0, 2).map((tx, index) => (
                  <View key={tx.id} style={[styles.txRow, index === 0 && styles.txRowFirst]}>
                    <View style={styles.txIconWrap}>
                      <View style={styles.txIconInner} />
                    </View>
                    <View style={styles.txDetails}>
                      <Text style={styles.txTitle}>Store Payment</Text>
                      <Text style={styles.txDate}>{formatTxnDate(tx.createdAt)}</Text>
                    </View>
                    <View style={styles.txValues}>
                      <Text style={styles.txAmount}>₹{tx.amount}</Text>
                      <Text style={styles.txRewards}>
                        +{tx.pointsEarned} Coins {tx.discountAmount > 0 ? ` • ₹${tx.discountAmount} CB` : ''}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyHistory}>
                <Text style={styles.emptyHistoryText}>No transactions at this store yet.</Text>
              </View>
            )}
          </View>

          {/* --- STORE INFO DETAILS --- */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionHeading}>Store Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.kvRow}>
                <Text style={styles.k}>Shop ID</Text>
                <Text style={styles.v}>{shop?.id ? String(shop.id) : '—'}</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={styles.k}>Status</Text>
                <Text style={[styles.v, { color: '#4CAF50' }]}>Active Partner</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={styles.k}>City</Text>
                <Text style={styles.v}>{shop?.city ? String(shop.city) : '—'}</Text>
              </View>
              <View style={[styles.kvRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.k}>State</Text>
                <Text style={styles.v}>{shop?.state ? String(shop.state) : '—'}</Text>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F4F6FB' 
  },
  
  // --- FULL SCREEN VIEWER ---
  viewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,14,23,0.98)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerCloseBtn: {
    position: 'absolute',
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeCrossMain: { width: 16, height: 2, backgroundColor: '#FFF', transform: [{ rotate: '45deg' }], position: 'absolute' },
  closeCrossSub: { width: 16, height: 2, backgroundColor: '#FFF', transform: [{ rotate: '-45deg' }], position: 'absolute' },
  viewerImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },

  // --- HEADER ---
  absoluteHeader: {
    position: 'absolute',
    left: 20,
    zIndex: 99, 
    elevation: 10, 
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.35)', 
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  arrow: {
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '-45deg' }],
    marginLeft: 4,
  },

  // --- HERO BACKGROUND ---
  heroBackground: {
    width: '100%',
    height: 220, // Adjusted height for proportion
    backgroundColor: brand.dark,
    position: 'absolute',
    top: 0,
    zIndex: 1, 
  },
  heroImg: {
    width: '100%',
    height: '100%',
  },
  heroFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: brand.blue,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,14,23,0.25)', // Lighter overlay for better cover photo visibility
  },

  // --- CONTENT LAYOUT ---
  contentWrapper: {
    marginTop: 180, // High enough so the white card overlaps the bottom of the cover photo
    paddingHorizontal: 20,
    zIndex: 2, // Sits above the background
    elevation: 2, // Needed for Android
  },

  // --- MAIN CARD ---
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    marginBottom: 20,
  },
  mainCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-end', // Aligns the text next to the bottom of the overlapping profile picture
    paddingBottom: 8,
  },
  // THE FACEBOOK STYLE OVERLAP
  logoWrap: {
    width: 86,
    height: 86,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#ECEEF4',
    marginRight: 16,
    marginTop: -50, // This negative margin pulls the profile picture UP into the cover photo!
  },
  logoImg: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  logoInitial: {
    fontSize: 28,
    fontWeight: '900',
    color: brand.cardHeading,
  },
  titleWrap: {
    flex: 1,
    paddingBottom: 4, // Aligns baseline with the avatar nicely
  },
  name: { 
    color: brand.cardHeading, 
    fontSize: 22, 
    fontWeight: '900',
    letterSpacing: -0.5, 
    marginBottom: 4,
  },
  username: { 
    color: brand.blue, 
    fontSize: 13, 
    fontWeight: '800', 
  },
  updatingText: {
    marginTop: 6,
    color: brand.helperColor,
    fontSize: 11,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F1F7',
    marginVertical: 18,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationDetails: {
    flex: 1,
    paddingRight: 16,
  },
  locationText: {
    color: brand.cardHeading,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  distanceText: {
    color: brand.helperColor,
    fontSize: 12,
    fontWeight: '600',
  },
  visitBtn: {
    backgroundColor: brand.dark,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  visitBtnText: {
    color: brand.surface,
    fontSize: 13,
    fontWeight: '800',
  },

  // --- STATS CARD ---
  statsCard: {
    marginBottom: 24,
  },
  sectionHeading: {
    color: brand.cardHeading,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 12,
    paddingLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ECEEF4',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: brand.blue,
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    color: brand.helperColor,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 6,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#F0F1F7',
    alignSelf: 'center',
  },

  // --- HISTORY / SALES SECTION ---
  historySection: {
    marginBottom: 24,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 4,
  },
  seeAllText: {
    color: brand.blue,
    fontSize: 13,
    fontWeight: '800',
  },
  historyList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ECEEF4',
    overflow: 'hidden',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F4F6FB',
  },
  txRowFirst: {
    borderTopWidth: 0,
  },
  txIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8F9FB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEEF4',
    marginRight: 14,
  },
  txIconInner: {
    width: 12,
    height: 12,
    borderRadius: 4,
    backgroundColor: brand.dark,
  },
  txDetails: {
    flex: 1,
  },
  txTitle: {
    color: brand.cardHeading,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  txDate: {
    color: brand.helperColor,
    fontSize: 11,
    fontWeight: '600',
  },
  couponBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
    borderWidth: 0.5,
    borderColor: '#A5D6A7',
  },
  couponText: {
    color: '#2E7D32',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  txValues: {
    alignItems: 'flex-end',
  },
  txAmount: {
    color: brand.cardHeading,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 2,
  },
  txRewards: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyHistory: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#ECEEF4',
    alignItems: 'center',
  },
  emptyHistoryText: {
    color: brand.helperColor,
    fontSize: 13,
    fontWeight: '600',
  },

  // --- ALL TXNS MODAL ---
  txModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,14,23,0.55)',
    justifyContent: 'flex-end',
  },
  txModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    maxHeight: SCREEN_HEIGHT * 0.88,
  },
  txModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  txModalCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F4F6FB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEEF4',
  },
  txModalCloseText: {
    color: brand.cardHeading,
    fontSize: 16,
    fontWeight: '900',
  },
  txModalTitle: {
    color: brand.cardHeading,
    fontSize: 16,
    fontWeight: '900',
  },
  txModalSummaryRow: {
    flexDirection: 'row',
    paddingBottom: 10,
  },
  txSummaryPill: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#F8F9FB',
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEEF4',
  },
  txSummaryLabel: {
    color: brand.helperColor,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  txSummaryValue: {
    marginTop: 6,
    color: brand.blue,
    fontSize: 16,
    fontWeight: '900',
  },

  // --- SHOP COUPONS ---
  couponLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  couponsSection: {
    marginBottom: 24,
  },
  couponsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ECEEF4',
    overflow: 'hidden',
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F4F6FB',
    backgroundColor: '#FFFFFF',
  },
  couponRowFirst: {
    borderTopWidth: 0,
  },
  couponImgWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F8F9FB',
    borderWidth: 1,
    borderColor: '#ECEEF4',
    marginRight: 14,
  },
  couponImg: {
    width: '100%',
    height: '100%',
  },
  couponImgFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FB',
  },
  couponImgFallbackText: {
    color: brand.blue,
    fontSize: 18,
    fontWeight: '900',
  },
  couponContent: {
    flex: 1,
  },
  couponTitle: {
    color: brand.cardHeading,
    fontSize: 14,
    fontWeight: '900',
  },
  couponSub: {
    marginTop: 3,
    color: brand.helperColor,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  couponMeta: {
    marginTop: 6,
    color: brand.dark,
    fontSize: 11,
    fontWeight: '800',
  },

  // --- ALL COUPONS MODAL ---
  couponModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,14,23,0.55)',
    justifyContent: 'flex-end',
  },
  couponModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    maxHeight: SCREEN_HEIGHT * 0.88,
  },
  couponModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  couponModalCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F4F6FB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEEF4',
  },
  couponModalCloseText: {
    color: brand.cardHeading,
    fontSize: 16,
    fontWeight: '900',
  },
  couponModalTitle: {
    color: brand.cardHeading,
    fontSize: 16,
    fontWeight: '900',
  },

  shopGrabBtn: {
    marginLeft: 10,
    backgroundColor: brand.blue,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 66,
  },
  shopGrabBtnDisabled: {
    backgroundColor: '#C9CEDA',
  },
  shopGrabBtnText: {
    color: brand.surface,
    fontSize: 11,
    fontWeight: '900',
  },

  // --- STORE INFO SECTION ---
  infoSection: {
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#ECEEF4',
  },
  kvRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F4F6FB' 
  },
  k: { 
    color: brand.helperColor, 
    fontSize: 13, 
    fontWeight: '700' 
  },
  v: { 
    color: brand.cardHeading, 
    fontSize: 13, 
    fontWeight: '800' 
  },
});