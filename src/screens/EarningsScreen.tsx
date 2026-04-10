// @refresh reset
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '../api/client';
import { useAppSelector } from '../store/hooks';
import { brand } from '../theme';

type Dashboard = {
  points: { available: number; earned: number; redeemed: number };
  cashback: { savedAmount: number };
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

export function EarningsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const showBack = route.name === 'EarningsFromMenu';
  const [activeTab, setActiveTab] = useState('Earnings');
  const token = useAppSelector((s) => s.auth.accessToken);

  const [dash, setDash] = useState<Dashboard | null>(null);
  const [items, setItems] = useState<EarningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingMoreRef = useRef(false);
  const reachedEndDuringMomentumRef = useRef(false);
  const lastRequestedPageRef = useRef(0);

  const PAGE_SIZE = 20;

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
          {
            method: 'GET',
            token,
          },
        ),
      ]);
      setDash(d);
      setPage(targetPage);
      setHasMore(targetPage * (e.limit ?? PAGE_SIZE) < (e.total ?? 0));
      const nextItems = e.items ?? [];
      setItems((prev) => (mode === 'more' ? [...prev, ...nextItems] : nextItems));
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load earnings');
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

  const filtered = useMemo(() => {
    if (activeTab === 'Redeemed') return items.filter((i) => (i.pointsRedeemed ?? 0) > 0);
    return items.filter((i) => (i.pointsEarned ?? 0) > 0);
  }, [activeTab, items]);

  const pointsAvailable = '0';
  const coinsAvailable = String(dash?.points?.available ?? 0);
  const cashback = `₹${dash?.cashback?.savedAmount ?? 0}`;

  const renderTransaction = ({ item }: { item: EarningItem }) => {
    const store = item.shop?.name ?? 'Store';
    const isRedeem = activeTab === 'Redeemed';
    const coins = isRedeem ? item.pointsRedeemed : item.pointsEarned;
    return (
      <View style={styles.transactionRow}>
        <TouchableOpacity activeOpacity={0.8} style={styles.transactionCard}>
          <View style={styles.cardHeader}>
            <View style={styles.storeCircle}>
              <Text style={styles.storeInitial}>{store[0]?.toUpperCase() ?? 'S'}</Text>
            </View>
            <View style={styles.mainInfo}>
              <Text style={styles.storeName} numberOfLines={1}>
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
      <StatusBar barStyle="light-content" backgroundColor={brand.dark} />
      
      {/* --- Same header pattern as My Coupons: back | title | spacer --- */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          {showBack ? (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <View style={styles.arrow} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtnPlaceholder} />
          )}
          <Text style={styles.headerTitle}>Earnings History</Text>
          <View style={styles.placeholder} />
        </View>

        {/* --- PREMIUM BALANCE WIDGET --- */}
        <View style={styles.balanceWidget}>
          <View style={styles.balanceItem}>
            <Text style={styles.balLabel}>CASHI POINTS</Text>
            <Text style={styles.balVal}>{pointsAvailable}</Text>
          </View>
          <View style={styles.balDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balLabel}>COINS</Text>
            <Text style={[styles.balVal, { color: brand.blue }]}>{coinsAvailable}</Text>
          </View>
          <View style={styles.balDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balLabel}>CASHBACK</Text>
            <Text style={styles.balVal}>{cashback}</Text>
          </View>
        </View>
      </View>

      {/* --- TRANSACTION CONTENT SHEET --- */}
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        
        {/* Segmented Controller */}
        <View style={styles.segmentContainer}>
          {['Earnings', 'Redeemed'].map((tab) => (
            <TouchableOpacity 
              key={tab} 
              onPress={() => setActiveTab(tab)}
              style={[styles.segmentTab, activeTab === tab && styles.activeSegment]}
            >
              <Text style={[styles.segmentLabel, activeTab === tab && styles.activeSegmentLabel]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filtered}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load('refresh')}
              tintColor={brand.blue}
            />
          }
          ListHeaderComponent={() => (
            <View style={styles.listHeader}>
               <Text style={styles.timelineLabel}>Recent Activity</Text>
               <TouchableOpacity onPress={() => load('refresh')}>
                 <Text style={styles.filterText}>{loading ? 'Loading…' : 'Refresh'}</Text>
               </TouchableOpacity>
            </View>
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
            if (!loading && !refreshing && !loadingMore && hasMore) {
              void load('more');
            }
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
                  <Text style={styles.emptyTitle}>Couldn’t load earnings</Text>
                  <Text style={styles.emptySub}>Please try again.</Text>
                  <TouchableOpacity
                    style={styles.emptyBtn}
                    onPress={() => load('refresh')}
                    activeOpacity={0.9}>
                    <Text style={styles.emptyBtnText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              );
            }
            return (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>
                  {activeTab === 'Redeemed'
                    ? 'No redemptions yet'
                    : 'No earnings yet'}
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
  
  header: {
    backgroundColor: brand.dark,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderColor: brand.surface,
    transform: [{ rotate: '-45deg' }],
    marginLeft: 4,
  },
  headerTitle: {
    color: brand.surface,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  placeholder: { width: 40 },
  backBtnPlaceholder: { width: 40, height: 40 },

  // Premium Balance Widget
  balanceWidget: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 24, paddingVertical: 22, paddingHorizontal: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, marginBottom: 20 },
  balanceItem: { flex: 1, alignItems: 'center' },
  balLabel: { color: brand.heroBody, fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginBottom: 6 },
  balVal: { color: brand.surface, fontSize: 18, fontWeight: '800' },
  balDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.1)' },

  // Sheet Architecture
  sheet: { flex: 1, backgroundColor: brand.background, borderTopLeftRadius: 40, borderTopRightRadius: 40, marginTop: -20, paddingHorizontal: 24 },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#E0E2EE', borderRadius: 2, alignSelf: 'center', marginVertical: 14 },
  
  segmentContainer: { flexDirection: 'row', backgroundColor: '#EBECEF', borderRadius: 16, padding: 4, marginBottom: 28 },
  segmentTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 13 },
  activeSegment: { backgroundColor: brand.surface, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  segmentLabel: { fontSize: 14, fontWeight: '700', color: brand.cardBody },
  activeSegmentLabel: { color: brand.dark },

  // List Styling
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  timelineLabel: { fontSize: 14, fontWeight: '800', color: brand.cardHeading, letterSpacing: 0.3 },
  filterText: { fontSize: 13, color: brand.blue, fontWeight: '700' },

  list: { overflow: 'visible' },
  listContent: { paddingBottom: 120 },

  // Row inset so FlatList does not clip left/right shadow (scroll views clip overflow)
  transactionRow: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginBottom: 12,
  },
  // Transaction Card (Refined)
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
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  storeCircle: { width: 48, height: 48, borderRadius: 16, backgroundColor: brand.inputBg, alignItems: 'center', justifyContent: 'center' },
  storeInitial: { fontSize: 20, fontWeight: '800', color: brand.dark },
  mainInfo: { flex: 1, marginLeft: 16 },
  storeName: { fontSize: 15, fontWeight: '800', color: brand.cardHeading, marginBottom: 4 },
  dateText: { fontSize: 11, color: brand.helperColor, fontWeight: '600' },
  
  amountCol: { alignItems: 'flex-end' },
  transactionAmount: { fontSize: 16, fontWeight: '800', color: brand.dark, marginBottom: 6 },
  coinBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: brand.blueLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  coinDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: brand.blue, marginRight: 6 },
  coinText: { color: brand.blue, fontSize: 11, fontWeight: '900' },

  emptyWrap: {
    marginTop: 8,
    paddingVertical: 26,
    paddingHorizontal: 18,
    backgroundColor: brand.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: brand.inputBg,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: brand.cardHeading,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  emptySub: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: brand.cardBody,
    lineHeight: 18,
    textAlign: 'center',
  },
  emptyBtn: {
    marginTop: 14,
    height: 42,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: brand.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBtnText: {
    color: brand.surface,
    fontSize: 13,
    fontWeight: '800',
  },
  footerLoading: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexDirection: 'row',
  },
  footerLoadingText: {
    fontSize: 12,
    color: brand.helperColor,
    fontWeight: '700',
  },
});