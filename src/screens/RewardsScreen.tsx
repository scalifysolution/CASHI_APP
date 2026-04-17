// @refresh reset
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { apiRequest } from '../api/client';
import { API_BASE_URL } from '../config/env';
import { RemoteAssetImage } from '../components/RemoteAssetImage';
import { useAppSelector } from '../store/hooks';
import { brand } from '../theme';
import { SegmentedTabs } from '../components/SegmentedTabs';

// --- Professional High-Fidelity Icons ---
const RewardIcon = ({ type, color, size = 16 }: { type: 'cash' | 'coin' | 'pts' | 'empty'; color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {type === 'cash' && <Path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />}
    {type === 'coin' && <Circle cx="12" cy="12" r="10" />}
    {type === 'pts' && <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />}
    {type === 'empty' && (
      <>
        <Rect x="2" y="5" width="20" height="14" rx="2" />
        <Path d="M2 10h20" />
      </>
    )}
  </Svg>
);

type CouponAssignmentItem = {
  assignmentId: string;
  status: 'ASSIGNED' | 'REDEEMED' | 'EXPIRED';
  coupon: {
    id: string;
    title: string;
    shortDescription: string | null;
    imageUrl: string | null;
    shopId: string;
  } | null;
};

type AvailableCoupon = {
  id: string;
  title: string;
  shortDescription: string | null;
  imageUrl: string | null;
  cashiPointsCost?: number;
  cashiCoinsCost?: number;
  shop: { id: string; name: string; imageUrl: string | null };
};

type RewardsData = {
  cashiCoins: number;
  myCoupons: CouponAssignmentItem[];
  nearby: AvailableCoupon[];
};

function assetUrl(pathOrUrl: string | null) {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (!pathOrUrl.startsWith('/')) return pathOrUrl;
  const origin = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');
  return `${origin}${pathOrUrl}`;
}

export function RewardsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const token = useAppSelector((s) => s.auth.accessToken);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'Discover' | 'My Vouchers'>('Discover');
  const [data, setData] = useState<RewardsData>({ cashiCoins: 0, myCoupons: [], nearby: [] });
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const pagerRef = useRef<ScrollView | null>(null);
  const [pageWidth, setPageWidth] = useState(0);
  const tabs = useMemo(() => ['Discover', 'My Vouchers'] as const, []);
  type Tab = (typeof tabs)[number];
  const getCouponCost = useCallback(
    (coupon: Pick<AvailableCoupon, 'cashiCoinsCost' | 'cashiPointsCost'>) =>
      Math.max(0, Number(coupon.cashiCoinsCost ?? coupon.cashiPointsCost ?? 0)),
    [],
  );

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    if (!token) return;
    if (mode === 'initial') setLoading(true);
    else setRefreshing(true);

    try {
      const [dash, mine, avail] = await Promise.all([
        apiRequest<any>('/users/me/dashboard', { method: 'GET', token }),
        apiRequest<{ active: CouponAssignmentItem[] }>('/users/me/coupons', { method: 'GET', token }),
        apiRequest<{ items: AvailableCoupon[] }>('/users/me/rewards/available-coupons?radiusKm=15', { method: 'GET', token }),
      ]);

      setData({
        cashiCoins: Number(dash?.cashiCoins?.available ?? dash?.cashiPoints?.available ?? 0),
        myCoupons: mine.active ?? [],
        nearby: avail?.items ?? [],
      });
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { load('initial'); }, [load]);

  const claim = async (coupon: AvailableCoupon) => {
    const couponCost = getCouponCost(coupon);
    if (claimingId || data.cashiCoins < couponCost) return;
    setClaimingId(coupon.id);
    try {
      const res = await apiRequest<any>('/users/me/rewards/claim-coupon', {
        method: 'POST',
        token,
        body: { couponId: coupon.id },
      });
      setData(prev => ({
        ...prev,
        cashiCoins: Number(
          res.cashiCoins?.available ??
          res.cashiPoints?.available ??
          Math.max(0, prev.cashiCoins - couponCost),
        ),
        nearby: prev.nearby.filter(c => c.id !== coupon.id),
        myCoupons: [res.assignment, ...prev.myCoupons],
      }));
      navigation.navigate('CouponPass', { item: res.assignment });
    } catch (e: any) {
      Alert.alert('Claim Failed', e?.message ?? 'Please try again.');
    } finally {
      setClaimingId(null);
    }
  };

  const dataForTab = useMemo(() => {
    return {
      Discover: data.nearby,
      'My Vouchers': data.myCoupons,
    } as const;
  }, [data.myCoupons, data.nearby]);

  const renderItemForTab =
    (tab: Tab) =>
    ({ item }: { item: any }) => {
    const isDiscover = tab === 'Discover';
    const title = isDiscover ? item.title : item.coupon?.title;
    const img = assetUrl(isDiscover ? (item.imageUrl ?? item.shop?.imageUrl) : item.coupon?.imageUrl);
    const shopName = isDiscover ? item.shop?.name : 'Claimed Reward';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.txRow}
        onPress={() => !isDiscover && navigation.navigate('CouponPass', { item })}
      >
        <View style={styles.storeCircle}>
          {img ? (
            <RemoteAssetImage uri={img} style={styles.storeImg} resizeMode="cover" />
          ) : (
            <Text style={styles.storeInitial}>{title?.[0]?.toUpperCase() ?? 'R'}</Text>
          )}
        </View>

        <View style={styles.mainInfo}>
          <Text style={styles.txStoreName} numberOfLines={1}>{title}</Text>
          <Text style={styles.dateText} numberOfLines={1}>{shopName}</Text>
        </View>

        <View style={styles.amountCol}>
          {isDiscover ? (
            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.grabBtn, data.cashiCoins < getCouponCost(item) && styles.grabBtnDisabled]}
              onPress={() => claim(item)}
              disabled={claimingId === item.id || data.cashiCoins < getCouponCost(item)}
            >
              {claimingId === item.id ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.grabBtnText}>{getCouponCost(item)} Cashi Coins</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.coinBadge}>
              <View style={styles.coinDot} />
              <Text style={styles.coinText}>ACTIVE</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const goToTab = (tab: Tab) => {
    setActiveTab(tab);
    const idx = tabs.indexOf(tab);
    if (idx >= 0 && pageWidth) pagerRef.current?.scrollTo({ x: idx * pageWidth, animated: true });
  };

  useEffect(() => {
    const idx = tabs.indexOf(activeTab);
    if (idx >= 0 && pageWidth) pagerRef.current?.scrollTo({ x: idx * pageWidth, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageWidth]);

  const onPagerMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = pageWidth ? Math.round(x / pageWidth) : 0;
    const next = tabs[Math.max(0, Math.min(tabs.length - 1, idx))];
    if (next && next !== activeTab) setActiveTab(next);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* --- ELITE DARK HERO (Exact Pattern) --- */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
            <View style={styles.backArrow} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rewards Center</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.heroContent}>
            <Text style={styles.heroGreeting}>Rewards Center</Text>
            <Text style={styles.heroSub}>
              Redeem Cashi Coins for exclusive vouchers and track your claimed rewards.
            </Text>

            <View style={styles.balanceWidget}>
              <View style={styles.balanceItem}>
                <View style={styles.balIconRow}>
                  <RewardIcon type="pts" color={brand.blue} size={14} />
                  <Text style={[styles.balLabel, { color: brand.blue }]}>CASHI COINS</Text>
                </View>
                <Text style={[styles.balVal, { color: brand.blue }]}>{data.cashiCoins}</Text>
              </View>

              <View style={styles.balDivider} />
              
              <View style={styles.balanceItem}>
                <View style={styles.balIconRow}>
                  <RewardIcon type="cash" color={brand.heroBody} size={14} />
                  <Text style={styles.balLabel}>MY VOUCHERS</Text>
                </View>
                <Text style={styles.balVal}>{data.myCoupons.length}</Text>
              </View>

              <View style={styles.balDivider} />
              
              <View style={styles.balanceItem}>
                <View style={styles.balIconRow}>
                  <RewardIcon type="coin" color={brand.heroBody} size={14} />
                  <Text style={styles.balLabel}>NEARBY</Text>
                </View>
                <Text style={styles.balVal}>{data.nearby.length}</Text>
              </View>
            </View>
        </View>
      </View>

      {/* --- CONTENT SHEET --- */}
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />

        <View style={styles.listHeaderContainer}>
          <SegmentedTabs
            options={tabs}
            value={activeTab}
            onChange={goToTab}
            containerStyle={styles.segmentContainer}
            tabStyle={styles.segmentTab}
            indicatorStyle={styles.activeSegment}
            textStyle={styles.segmentLabel}
            activeTextStyle={styles.activeSegmentLabel}
            inset={4}
          />

          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>
              {activeTab === 'Discover' ? 'Recommended for You' : 'Recent Claims'}
            </Text>
            {loading && <ActivityIndicator size="small" color={brand.blue} />}
          </View>
        </View>

        <View style={styles.pagerWrap} onLayout={(e) => setPageWidth(e.nativeEvent.layout.width)}>
          <ScrollView
            ref={(r) => {
              pagerRef.current = r;
            }}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onPagerMomentumEnd}
            scrollEventThrottle={16}
          >
            {tabs.map((tab) => {
              const list = dataForTab[tab];
              return (
                <View key={tab} style={{ width: pageWidth || 1, flex: 1 }}>
                  <FlatList
                    data={list}
                    renderItem={renderItemForTab(tab)}
                    keyExtractor={(it, idx) => (it.assignmentId || it.id || idx.toString())}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
                    refreshControl={
                      <RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} tintColor={brand.blue} />
                    }
                    ListEmptyComponent={() => {
                      if (loading) return null;
                      return (
                        <View style={styles.emptyState}>
                          <RewardIcon type="empty" color={brand.helperColor} size={32} />
                          <Text style={styles.emptyTitle}>No rewards found</Text>
                          <Text style={styles.emptySub}>
                            {tab === 'Discover'
                              ? 'Check back later for new nearby offers.'
                              : "You haven't claimed any vouchers yet."}
                          </Text>
                        </View>
                      );
                    }}
                  />
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: brand.dark },
  
  // Header (Exact MyLoyalty Pattern)
  header: { paddingBottom: 50 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 24 },
  backCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  backArrow: { width: 10, height: 10, borderLeftWidth: 2, borderTopWidth: 2, borderColor: brand.surface, transform: [{ rotate: '-45deg' }], marginLeft: 4 },
  headerTitle: { color: brand.surface, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  arrow: { width: 10, height: 10, borderLeftWidth: 2, borderTopWidth: 2, borderColor: brand.surface, transform: [{ rotate: '-45deg' }], marginLeft: 4 },
  
  heroContent: { paddingHorizontal: 24 },
  heroGreeting: { color: brand.surface, fontSize: 32, fontWeight: '900', letterSpacing: -0.8, marginBottom: 6 },
  heroSub: { color: brand.heroBody, fontSize: 14, fontWeight: '500', lineHeight: 22, opacity: 0.8 },
  
  balanceWidget: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(255,255,255,0.04)', 
    borderRadius: 24, 
    paddingVertical: 20, 
    paddingHorizontal: 12, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)', 
    marginTop: 24,
  },
  balanceItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  balIconRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  balLabel: { color: brand.heroBody, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  balVal: { color: brand.surface, fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  balDivider: { width: 1, height: '80%', backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'center' },

  // Sheet Area (Exact MyLoyalty Pattern)
  sheet: { flex: 1, backgroundColor: '#F8F9FB', borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -24 },
  sheetHandle: { width: 40, height: 5, backgroundColor: '#E2E5F1', borderRadius: 3, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  pagerWrap: { flex: 1 },
  
  listHeaderContainer: { paddingHorizontal: 24 },
  segmentContainer: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 14, padding: 4, marginBottom: 24 },
  segmentTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeSegment: { backgroundColor: brand.surface, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  segmentLabel: { fontSize: 13, fontWeight: '700', color: brand.helperColor },
  activeSegmentLabel: { color: brand.dark, fontWeight: '800' },

  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: brand.cardHeading },
  
  // Rows
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEEF4',
  },
  storeCircle: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8F9FB', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ECEEF4', overflow: 'hidden' },
  storeImg: { width: '100%', height: '100%' },
  storeInitial: { fontSize: 18, fontWeight: '800', color: brand.cardHeading },
  mainInfo: { flex: 1, marginLeft: 14 },
  txStoreName: { fontSize: 15, fontWeight: '800', color: brand.cardHeading, marginBottom: 4 },
  dateText: { fontSize: 11, color: brand.helperColor, fontWeight: '600' },
  
  amountCol: { alignItems: 'flex-end' },
  grabBtn: { backgroundColor: brand.dark, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  grabBtnDisabled: { backgroundColor: '#C9CEDA' },
  grabBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  
  coinBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: brand.blueLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  coinDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: brand.blue, marginRight: 5 },
  coinText: { color: brand.blue, fontSize: 10, fontWeight: '900' },

  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: brand.cardHeading, marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 13, fontWeight: '500', color: brand.helperColor, textAlign: 'center', lineHeight: 20 },
});