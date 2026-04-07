// @refresh reset
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { apiRequest } from '../api/client';
import { useAppSelector } from '../store/hooks';
import { brand } from '../theme';

// --- Professional High-Fidelity Icons ---
const RewardIcon = ({ type, color }: { type: 'cash' | 'coin' | 'pts'; color: string }) => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {type === 'cash' && <Path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />}
    {type === 'coin' && <Circle cx="12" cy="12" r="10" />}
    {type === 'pts' && <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />}
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
  shop: { id: string; name: string; imageUrl: string | null };
};

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

      const [d, e, s] = await Promise.all([
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

  const pointsText = useMemo(() => String(dash?.points?.available ?? 0), [dash]);
  const coinsText = useMemo(() => String(dash?.points?.earned ?? 0), [dash]);
  const cashbackText = useMemo(() => `₹${dash?.points?.available ?? 0}`, [dash]);

  const filtered = useMemo(() => {
    if (activeTab === 'Redeemed') return items.filter((i) => (i.pointsRedeemed ?? 0) > 0);
    return items.filter((i) => (i.pointsEarned ?? 0) > 0);
  }, [activeTab, items]);

  const renderTransaction = ({ item }: { item: EarningItem }) => {
    const store = item.shop?.name ?? 'Store';
    const isRedeem = activeTab === 'Redeemed';
    const coins = isRedeem ? item.pointsRedeemed : item.pointsEarned;
    return (
      <View style={styles.transactionRow}>
        <TouchableOpacity activeOpacity={0.8} style={styles.transactionCard}>
          <View style={styles.txHeader}>
            <View style={styles.storeCircle}>
              <Text style={styles.storeInitial}>{store[0]?.toUpperCase() ?? 'S'}</Text>
            </View>
            <View style={styles.mainInfo}>
              <Text style={styles.txStoreName} numberOfLines={1}>
                {store}
              </Text>
              <Text style={styles.dateText}>
                {formatDate(item.createdAt)} • #{item.id.slice(-8)}
              </Text>
            </View>
            <View style={styles.amountCol}>
              <Text style={styles.transactionAmount}>₹{item.amount}</Text>
              <View
                style={[
                  styles.coinBadge,
                  isRedeem && { backgroundColor: 'rgba(255,82,82,0.14)' },
                ]}>
                <View
                  style={[
                    styles.coinDot,
                    isRedeem && { backgroundColor: '#FF5252' },
                  ]}
                />
                <Text style={[styles.coinText, isRedeem && { color: '#FF5252' }]}>
                  {isRedeem ? `-${coins}` : `+${coins}`}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* --- ELITE DARK HERO --- */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.navRow}>
          {navigation?.canGoBack?.() ? (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
              <View style={styles.backArrow} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40, height: 40 }} />
          )}
          <Text style={styles.headerTitle}>My Loyalty</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.heroContent}>
            <Text style={styles.heroGreeting}>Your Loyalty{'\n'}Wallet</Text>
            <Text style={styles.heroSub}>
              Track your points, coins and cashback — and join partner stores to start earning more.
            </Text>

            <View style={styles.balanceWidget}>
              <View style={styles.balanceItem}>
                <Text style={styles.balLabel}>POINTS</Text>
                <Text style={styles.balVal}>{pointsText}</Text>
              </View>
              <View style={styles.balDivider} />
              <View style={styles.balanceItem}>
                <Text style={styles.balLabel}>COINS</Text>
                <Text style={[styles.balVal, { color: brand.blue }]}>{coinsText}</Text>
              </View>
              <View style={styles.balDivider} />
              <View style={styles.balanceItem}>
                <Text style={styles.balLabel}>CASHBACK</Text>
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
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} tintColor={brand.blue} />
          }
          ListHeaderComponent={() => (
            <>
              <View style={styles.segmentContainer}>
                {(['Earnings', 'Redeemed'] as const).map((tab) => (
                  <TouchableOpacity
                    key={tab}
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
                <Text style={styles.sectionSubText}>
                  {loading ? 'Loading…' : error ? 'Couldn’t load. Pull to retry.' : ''}
                </Text>
              </View>
            </>
          )}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (
              reachedEndDuringMomentumRef.current ||
              loading ||
              refreshing ||
              loadingMore ||
              !hasMore ||
              items.length < PAGE_SIZE
            ) {
              return;
            }
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
                <Text style={styles.footerLoadingText}>Loading more...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={() => {
            if (loading) return null;
            if (error) {
              return (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyTitle}>Couldn’t load loyalty</Text>
                  <Text style={styles.emptySub}>Pull to refresh or try again.</Text>
                  <TouchableOpacity style={styles.emptyBtn} onPress={() => load('refresh')} activeOpacity={0.9}>
                    <Text style={styles.emptyBtnText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              );
            }
            return (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>
                  {activeTab === 'Redeemed' ? 'No redemptions yet' : 'No earnings yet'}
                </Text>
                <Text style={styles.emptySub}>
                  {activeTab === 'Redeemed'
                    ? 'When you redeem coins, they will show up here.'
                    : 'Shop at partner stores to start earning coins.'}
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
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 30 },
  backCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  backArrow: { width: 10, height: 10, borderLeftWidth: 2, borderTopWidth: 2, borderColor: brand.surface, transform: [{ rotate: '-45deg' }], marginLeft: 4 },
  headerTitle: { color: brand.surface, fontSize: 16, fontWeight: '700' },
  headerActionBtn: { width: 60, alignItems: 'flex-end' },
  headerActionText: { color: brand.blue, fontSize: 13, fontWeight: '800' },
  
  heroContent: { paddingHorizontal: 24 },
  heroGreeting: { color: brand.surface, fontSize: 34, fontWeight: '800', lineHeight: 40, letterSpacing: -0.6 },
  heroSub: { color: brand.heroBody, fontSize: 14, fontWeight: '500', marginTop: 12, lineHeight: 22 },
  balanceWidget: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 22, paddingVertical: 18, paddingHorizontal: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginTop: 18 },
  balanceItem: { flex: 1, alignItems: 'center' },
  balLabel: { color: brand.heroBody, fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginBottom: 6 },
  balVal: { color: brand.surface, fontSize: 18, fontWeight: '800' },
  balDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.1)' },

  // Sheet
  sheet: { flex: 1, backgroundColor: brand.background, borderTopLeftRadius: 36, borderTopRightRadius: 36, marginTop: -20 },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#E0E2EE', borderRadius: 2, alignSelf: 'center', marginVertical: 15 },
  
  listHeader: { marginBottom: 24 },
  sectionHeading: { fontSize: 20, fontWeight: '800', color: brand.cardHeading },
  sectionSubText: { fontSize: 13, color: brand.cardBody, marginTop: 4, fontWeight: '500' },
  sectionHeadingSmall: { fontSize: 14, fontWeight: '900', color: brand.cardHeading },

  segmentContainer: { flexDirection: 'row', backgroundColor: '#EBECEF', borderRadius: 16, padding: 4, marginBottom: 16 },
  segmentTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 13 },
  activeSegment: { backgroundColor: brand.surface, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  segmentLabel: { fontSize: 14, fontWeight: '700', color: brand.cardBody },
  activeSegmentLabel: { color: brand.dark },

  transactionRow: { paddingVertical: 2, marginBottom: 12 },
  transactionCard: {
    backgroundColor: brand.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F0F1F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.035,
    shadowRadius: 8,
    elevation: 2,
  },
  txHeader: { flexDirection: 'row', alignItems: 'center' },
  storeCircle: { width: 48, height: 48, borderRadius: 16, backgroundColor: brand.inputBg, alignItems: 'center', justifyContent: 'center' },
  storeInitial: { fontSize: 20, fontWeight: '800', color: brand.dark },
  mainInfo: { flex: 1, marginLeft: 16 },
  txStoreName: { fontSize: 15, fontWeight: '800', color: brand.cardHeading, marginBottom: 4 },
  dateText: { fontSize: 11, color: brand.helperColor, fontWeight: '600' },
  amountCol: { alignItems: 'flex-end' },
  transactionAmount: { fontSize: 16, fontWeight: '800', color: brand.dark, marginBottom: 6 },
  coinBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: brand.blueLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  coinDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: brand.blue, marginRight: 6 },
  coinText: { color: brand.blue, fontSize: 11, fontWeight: '900' },

  footerLoading: { paddingVertical: 12, alignItems: 'center', justifyContent: 'center', gap: 8, flexDirection: 'row' },
  footerLoadingText: { fontSize: 12, color: brand.helperColor, fontWeight: '700' },

  emptyWrap: {
    marginTop: 4,
    paddingVertical: 22,
    paddingHorizontal: 18,
    backgroundColor: brand.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: brand.inputBg,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: brand.cardHeading, textAlign: 'center' },
  emptySub: { marginTop: 8, fontSize: 12, fontWeight: '600', color: brand.cardBody, lineHeight: 18, textAlign: 'center' },
  emptyBtn: { marginTop: 14, height: 42, paddingHorizontal: 18, borderRadius: 14, backgroundColor: brand.blue, alignItems: 'center', justifyContent: 'center' },
  emptyBtnText: { color: brand.surface, fontSize: 13, fontWeight: '800' },
});