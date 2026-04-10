// @refresh reset
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { apiRequest } from '../api/client';
import { API_BASE_URL } from '../config/env';
import { useAppSelector } from '../store/hooks';
import { brand } from '../theme';

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

type Dashboard = {
  points: { available: number; earned: number; redeemed: number };
  cashback: { savedAmount: number };
};

type ShopItem = {
  id: string;
  name: string;
  city?: string | null;
  state?: string | null;
  imageUrl?: string | null;
  distanceKm?: number | null;
};

type EarningItem = {
  id: string;
  createdAt: string;
  amount: number;
  originalAmount: number | null;
  discountAmount: number;
  pointsEarned: number;
  pointsRedeemed: number;
  shop: { id: string; name: string; username?: string | null; imageUrl: string | null };
};

function assetUrl(pathOrUrl: string | null) {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (!pathOrUrl.startsWith('/')) return pathOrUrl;
  const origin = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');
  return `${origin}${pathOrUrl}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function MyLoyaltyScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const token = useAppSelector((s) => s.auth.accessToken);

  const [dash, setDash] = useState<Dashboard | null>(null);
  const [items, setItems] = useState<EarningItem[]>([]);
  const [activeTab, setActiveTab] = useState<'Earnings' | 'Redeemed'>('Earnings');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const PAGE_SIZE = 20;
  const loadingMoreRef = useRef(false);
  const reachedEndDuringMomentumRef = useRef(false);
  const lastRequestedPageRef = useRef(0);

  const load = async (mode: 'initial' | 'refresh' | 'more') => {
    if (!token) return;
    if (mode === 'more' && (loadingMoreRef.current || !hasMore)) return;
    if (mode === 'initial') setLoading(true);
    else if (mode === 'refresh') setRefreshing(true);
    else {
      loadingMoreRef.current = true;
      setLoadingMore(true);
    }
    setError(null);
    try {
      const targetPage = mode === 'more' ? page + 1 : 1;
      if (mode === 'more' && targetPage === lastRequestedPageRef.current) return;
      lastRequestedPageRef.current = targetPage;

      const [d, e] = await Promise.all([
        apiRequest<Dashboard>('/users/me/dashboard', { method: 'GET', token }),
        apiRequest<{ page: number; limit: number; total: number; items: EarningItem[] }>(
          `/users/me/earnings?page=${targetPage}&limit=${PAGE_SIZE}`,
          { method: 'GET', token },
        ),
      ]);
      setDash(d);
      setPage(targetPage);
      setHasMore(targetPage * (e.limit ?? PAGE_SIZE) < (e.total ?? 0));
      setItems((prev) => (mode === 'more' ? [...prev, ...(e.items ?? [])] : e.items ?? []));
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load loyalty');
    } finally {
      if (mode === 'initial') setLoading(false);
      else if (mode === 'refresh') setRefreshing(false);
      else {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    load('initial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /**
   * Business meaning:
   * - Loyalty points == COINS (₹1 per coin) => use points.available (remaining)
   * - "Points" are Cashi points (separate system; not implemented yet) => show 0 for now
   */
  const pointsText = useMemo(() => '0', []);
  const coinsText = useMemo(() => String(dash?.points?.available ?? 0), [dash]);
  const cashbackText = useMemo(() => `₹${dash?.cashback?.savedAmount ?? 0}`, [dash]);

  const filtered = useMemo(() => {
    if (activeTab === 'Redeemed') return items.filter((i) => (i.pointsRedeemed ?? 0) > 0);
    return items.filter((i) => (i.pointsEarned ?? 0) > 0);
  }, [activeTab, items]);

  const renderTransaction = ({ item, index }: { item: EarningItem; index: number }) => {
    const store = item.shop?.name ?? 'Store';
    const storeImg = assetUrl(item.shop?.imageUrl ?? null);
    const isRedeem = activeTab === 'Redeemed';
    const coins = isRedeem ? item.pointsRedeemed : item.pointsEarned;
    const isLast = index === filtered.length - 1;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.txRow, isLast && styles.txRowLast]}
        onPress={() => navigation.navigate('ShopDetail', { shop: item.shop })}
      >
        <View style={styles.storeCircle}>
          {storeImg ? (
            <Image source={{ uri: storeImg }} style={styles.storeImg} />
          ) : (
            <Text style={styles.storeInitial}>{store[0]?.toUpperCase() ?? 'S'}</Text>
          )}
        </View>
        
        <View style={styles.mainInfo}>
          <Text style={styles.txStoreName} numberOfLines={1}>{store}</Text>
          <Text style={styles.dateText}>
            {formatDate(item.createdAt)} • #{item.id.slice(-6)}
          </Text>
        </View>
        
        <View style={styles.amountCol}>
          <Text style={styles.transactionAmount}>₹{item.amount}</Text>
          <View style={[styles.coinBadge, isRedeem && styles.coinBadgeRedeem]}>
            <View style={[styles.coinDot, isRedeem && styles.coinDotRedeem]} />
            <Text style={[styles.coinText, isRedeem && styles.coinTextRedeem]}>
              {isRedeem ? `-${coins}` : `+${coins}`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* --- ELITE DARK HERO --- */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.navRow}>
          {navigation?.canGoBack?.() ? (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
              <View style={styles.backArrow} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40, height: 40 }} />
          )}
          <Text style={styles.headerTitle}>My Rewards</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.heroContent}>
            <Text style={styles.heroGreeting}>Loyalty Wallet</Text>
            <Text style={styles.heroSub}>
              Track your points, coins, and cashback. Shop at partners to grow your balance.
            </Text>

            <View style={styles.balanceWidget}>
              <View style={styles.balanceItem}>
                <View style={styles.balIconRow}>
                  <RewardIcon type="pts" color={brand.heroBody} size={14} />
                  <Text style={styles.balLabel}>CASHI POINTS</Text>
                </View>
                <Text style={styles.balVal}>{pointsText}</Text>
              </View>

              <View style={styles.balDivider} />
              
              <View style={styles.balanceItem}>
                <View style={styles.balIconRow}>
                  <RewardIcon type="coin" color={brand.blue} size={14} />
                  <Text style={[styles.balLabel, { color: brand.blue }]}>COINS</Text>
                </View>
                <Text style={[styles.balVal, { color: brand.blue }]}>{coinsText}</Text>
              </View>

              <View style={styles.balDivider} />
              
              <View style={styles.balanceItem}>
                <View style={styles.balIconRow}>
                  <RewardIcon type="cash" color={brand.heroBody} size={14} />
                  <Text style={styles.balLabel}>CASHBACK</Text>
                </View>
                <Text style={styles.balVal}>{cashbackText}</Text>
              </View>
            </View>
        </View>
      </View>

      {/* --- CONTENT SHEET --- */}
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />

        <FlatList
          data={filtered}
          renderItem={renderTransaction}
          keyExtractor={(it) => it.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} tintColor={brand.blue} />
          }
          ListHeaderComponent={() => (
            <View style={styles.listHeaderContainer}>
              <View style={styles.segmentContainer}>
                {(['Earnings', 'Redeemed'] as const).map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    activeOpacity={0.8}
                    onPress={() => setActiveTab(tab)}
                    style={[styles.segmentTab, activeTab === tab && styles.activeSegment]}>
                    <Text style={[styles.segmentLabel, activeTab === tab && styles.activeSegmentLabel]}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.listHeader}>
                <Text style={styles.sectionHeading}>Recent Activity</Text>
                {loading ? (
                  <Text style={styles.sectionSubText}>Syncing wallet...</Text>
                ) : error ? (
                  <Text style={styles.sectionSubTextError}>Couldn't load. Pull to retry.</Text>
                ) : null}
              </View>
            </View>
          )}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (reachedEndDuringMomentumRef.current || loading || refreshing || loadingMore || !hasMore || items.length < PAGE_SIZE) return;
            reachedEndDuringMomentumRef.current = true;
            void load('more');
          }}
          onMomentumScrollBegin={() => {
            reachedEndDuringMomentumRef.current = false;
          }}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator color={brand.blue} size="small" />
                <Text style={styles.footerLoadingText}>Loading older transactions...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={() => {
            if (loading) return null;
            if (error) {
              return (
                <View style={styles.emptyWrap}>
                  <RewardIcon type="empty" color={brand.helperColor} size={32} />
                  <Text style={styles.emptyTitle}>Couldn’t load history</Text>
                  <Text style={styles.emptySub}>Check your connection and try again.</Text>
                  <TouchableOpacity style={styles.emptyBtn} onPress={() => load('refresh')} activeOpacity={0.9}>
                    <Text style={styles.emptyBtnText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              );
            }
            return (
              <View style={styles.emptyWrap}>
                <RewardIcon type="empty" color={brand.helperColor} size={36} />
                <Text style={styles.emptyTitle}>
                  {activeTab === 'Redeemed' ? 'No Redemptions Yet' : 'No Earnings Yet'}
                </Text>
                <Text style={styles.emptySub}>
                  {activeTab === 'Redeemed'
                    ? 'Coins you spend at our partner stores will appear here.'
                    : 'Shop at partner stores to start stacking up coins and rewards.'}
                </Text>
              </View>
            );
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: brand.dark },
  
  // Header
  header: { paddingBottom: 50 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 24 },
  backCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  backArrow: { width: 10, height: 10, borderLeftWidth: 2, borderTopWidth: 2, borderColor: brand.surface, transform: [{ rotate: '-45deg' }], marginLeft: 4 },
  headerTitle: { color: brand.surface, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  
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

  // Sheet
  sheet: { flex: 1, backgroundColor: '#F8F9FB', borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -24 },
  sheetHandle: { width: 40, height: 5, backgroundColor: '#E2E5F1', borderRadius: 3, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  
  listHeaderContainer: { paddingHorizontal: 24 },
  
  segmentContainer: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(0,0,0,0.05)', 
    borderRadius: 14, 
    padding: 4, 
    marginBottom: 24 
  },
  segmentTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeSegment: { backgroundColor: brand.surface, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  segmentLabel: { fontSize: 13, fontWeight: '700', color: brand.helperColor },
  activeSegmentLabel: { color: brand.dark, fontWeight: '800' },

  listHeader: { marginBottom: 16 },
  sectionHeading: { fontSize: 18, fontWeight: '900', color: brand.cardHeading, letterSpacing: -0.3 },
  sectionSubText: { fontSize: 13, color: brand.helperColor, marginTop: 4, fontWeight: '600' },
  sectionSubTextError: { fontSize: 13, color: '#FF5252', marginTop: 4, fontWeight: '600' },

  // Premium List Rows
  txRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 16, 
    paddingHorizontal: 24,
    backgroundColor: brand.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1F7',
  },
  txRowLast: { borderBottomWidth: 0 },
  storeCircle: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F3F5F9', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EAEEF5' },
  storeImg: { width: 44, height: 44, borderRadius: 14, resizeMode: 'cover' },
  storeInitial: { fontSize: 18, fontWeight: '900', color: brand.cardHeading },
  mainInfo: { flex: 1, marginLeft: 14 },
  txStoreName: { fontSize: 15, fontWeight: '800', color: brand.cardHeading, marginBottom: 4, letterSpacing: -0.2 },
  dateText: { fontSize: 12, color: brand.helperColor, fontWeight: '600' },
  
  amountCol: { alignItems: 'flex-end', justifyContent: 'center' },
  transactionAmount: { fontSize: 15, fontWeight: '900', color: brand.cardHeading, marginBottom: 6 },
  
  coinBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: brand.blueLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  coinDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: brand.blue, marginRight: 5 },
  coinText: { color: brand.blue, fontSize: 11, fontWeight: '900' },
  coinBadgeRedeem: { backgroundColor: '#FFF0F0' },
  coinDotRedeem: { backgroundColor: '#FF5252' },
  coinTextRedeem: { color: '#FF5252' },

  footerLoading: { paddingVertical: 20, alignItems: 'center', justifyContent: 'center', gap: 10, flexDirection: 'row' },
  footerLoadingText: { fontSize: 13, color: brand.helperColor, fontWeight: '700' },

  emptyWrap: {
    marginTop: 20,
    marginHorizontal: 24,
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: brand.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F0F1F7',
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 17, fontWeight: '900', color: brand.cardHeading, textAlign: 'center', marginTop: 16, letterSpacing: -0.3 },
  emptySub: { marginTop: 8, fontSize: 13, fontWeight: '600', color: brand.helperColor, lineHeight: 20, textAlign: 'center' },
  emptyBtn: { marginTop: 20, height: 44, paddingHorizontal: 24, borderRadius: 14, backgroundColor: brand.dark, alignItems: 'center', justifyContent: 'center' },
  emptyBtnText: { color: brand.surface, fontSize: 14, fontWeight: '800' },
});