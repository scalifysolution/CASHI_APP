import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand } from '../theme';
import { useAppSelector } from '../store/hooks';
import { apiRequest } from '../api/client';
import { API_BASE_URL } from '../config/env';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = 20;
const COLUMN_GAP = 12;
const COLUMN_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - COLUMN_GAP) / 2;

type CouponItem = {
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
  active: CouponItem[];
  used: CouponItem[];
  expired: CouponItem[];
};

function assetUrl(pathOrUrl: string | null) {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (!pathOrUrl.startsWith('/')) return pathOrUrl;
  const origin = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');
  return `${origin}${pathOrUrl}`;
}

function daysLeft(expiresAt: string | null) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function CouponsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const showBack = route.name === 'CouponsFromMenu' || navigation.canGoBack();
  const [activeTab, setActiveTab] = useState('Active');
  const token = useAppSelector((s) => s.auth.accessToken);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MyCouponsResponse>({
    active: [],
    used: [],
    expired: [],
  });

  const load = async (mode: 'initial' | 'refresh') => {
    if (!token) return;
    if (mode === 'initial') setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await apiRequest<MyCouponsResponse>('/users/me/coupons', {
        method: 'GET',
        token,
      });
      setData(res);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load coupons');
    } finally {
      if (mode === 'initial') setLoading(false);
      else setRefreshing(false);
    }
  };

  useEffect(() => {
    load('initial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const list = useMemo(() => {
    if (activeTab === 'Used') return data.used;
    if (activeTab === 'Expired') return data.expired;
    return data.active;
  }, [activeTab, data.active, data.expired, data.used]);

  const renderCoupon = ({ item }: { item: CouponItem }) => {
    const c = item.coupon;
    const title = c?.title ?? 'Partner Store';
    const img = assetUrl(c?.imageUrl ?? null);
    const dleft = daysLeft(c?.expiresAt ?? null);
    
    // --- Discount Value ---
    const isPercent = c?.valueType === 'PERCENTAGE' && c?.valuePercent;
    const isFixed = c?.valueType === 'FIXED' && c?.valueFixed;
    
    let highlightText = 'Reward';
    if (isPercent) highlightText = `${c.valuePercent}% OFF`;
    else if (isFixed) highlightText = `₹${c.valueFixed} OFF`;

    // --- Status & Expiry ---
    let statusText = '';
    let statusColor = '#111827'; // Dark gray by default
    
    if (activeTab === 'Used') {
      statusText = 'Redeemed';
      statusColor = '#10B981'; // Green
    } else if (activeTab === 'Expired') {
      statusText = 'Expired';
      statusColor = '#9CA3AF'; // Light Gray
    } else {
      if (dleft == null) {
        statusText = 'No expiry';
      } else if (dleft < 0) {
        statusText = 'Expired';
        statusColor = '#EF4444';
      } else if (dleft === 0) {
        statusText = 'Expires today';
        statusColor = '#EF4444'; 
      } else if (dleft <= 3) {
        statusText = `${dleft} days left`;
        statusColor = '#F59E0B'; 
      } else {
        statusText = `${dleft} days left`;
      }
    }

    const initial = title.trim()?.[0]?.toUpperCase() ?? 'S';
    const rootNav = navigation?.getParent?.() ?? navigation;
    const isInactive = activeTab !== 'Active';

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.gridCard, isInactive && styles.gridCardInactive]}
        onPress={() => {
          if (activeTab === 'Active') {
            rootNav?.navigate?.('CouponPass', { item });
          }
        }}
      >
        {/* TOP: PERFECT IMAGE AREA */}
        <View style={styles.imageWrap}>
          {img ? (
            <Image
              source={{ uri: img }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.imageFallback}>{initial}</Text>
          )}
          <View style={styles.imageOverlay} />
        </View>

        {/* BOTTOM: HIGHLY ORGANIZED DETAILS */}
        <View style={styles.detailsWrap}>
          
          <Text style={styles.brandName} numberOfLines={1}>{title}</Text>
          <Text style={styles.hugeDiscount} numberOfLines={1} adjustsFontSizeToFit>
            {highlightText}
          </Text>

          {/* DEDICATED TERMS BOX */}
          <View style={styles.termsBox}>
            <View style={styles.termRow}>
              <Text style={styles.termLabel}>Min Order</Text>
              <Text style={styles.termValue}>
                {c?.minOrderValue ? `₹${c.minOrderValue}` : 'None'}
              </Text>
            </View>
            <View style={styles.termRowLast}>
              <Text style={styles.termLabel}>Status</Text>
              <Text style={[styles.termValue, { color: statusColor }]}>
                {statusText}
              </Text>
            </View>
          </View>

        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={brand.dark} />
      
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          {showBack ? (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <View style={styles.arrow} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtnPlaceholder} />
          )}
          <Text style={styles.headerTitle}>My Vouchers</Text>
          <View style={styles.placeholder} />
        </View>

        {/* SEGMENTED TABS */}
        <View style={styles.tabContainer}>
          {['Active', 'Used', 'Expired'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity 
                key={tab} 
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
                style={[styles.tab, isActive && styles.activeTab]}
              >
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 2-COLUMN GRID LIST */}
      <View style={styles.sheetContainer}>
        <FlatList
          data={list}
          renderItem={renderCoupon}
          keyExtractor={(item) => item.assignmentId}
          numColumns={2} 
          columnWrapperStyle={styles.row} 
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load('refresh')}
              tintColor={brand.blue}
            />
          }
          ListHeaderComponent={() => (
             !loading && !error && list.length > 0 ? (
               <Text style={styles.countText}>
                 {list.length} {activeTab.toLowerCase()} voucher{list.length === 1 ? '' : 's'}
               </Text>
             ) : null
          )}
          ListEmptyComponent={() => {
            if (loading) return null;
            if (error) {
              return (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyTitle}>Couldn’t load vouchers</Text>
                  <Text style={styles.emptySub}>
                    Please check your internet connection and try again.
                  </Text>
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
                <View style={styles.emptyIconPlaceholder}>
                   <View style={styles.emptyShape} />
                </View>
                <Text style={styles.emptyTitle}>
                  {activeTab === 'Used'
                    ? 'No used vouchers'
                    : activeTab === 'Expired'
                      ? 'No expired vouchers'
                      : 'No active vouchers'}
                </Text>
                <Text style={styles.emptySub}>
                  {activeTab === 'Active'
                    ? 'Shop at our partner stores to earn exclusive rewards and cashback vouchers.'
                    : activeTab === 'Used'
                      ? 'Vouchers you have successfully redeemed will appear in this history.'
                      : 'Vouchers that have crossed their validity period will move here.'}
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
  header: { backgroundColor: brand.dark, paddingHorizontal: HORIZONTAL_PADDING, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backBtn: { width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  arrow: { width: 10, height: 10, borderLeftWidth: 2, borderTopWidth: 2, borderColor: brand.surface, transform: [{ rotate: '-45deg' }], marginLeft: 4 },
  headerTitle: { color: brand.surface, fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  placeholder: { width: 40 },
  backBtnPlaceholder: { width: 40, height: 40 },

  // Tabs
  tabContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 3 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  activeTab: { backgroundColor: brand.surface, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  tabText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600' },
  activeTabText: { color: brand.dark, fontWeight: '700' },

  // Sheet Area
  sheetContainer: {
    flex: 1,
    backgroundColor: '#F8F9FB', 
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  listContent: { paddingHorizontal: HORIZONTAL_PADDING, paddingTop: 24, flexGrow: 1 },
  countText: { fontSize: 12, color: '#8A94A6', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 },

  // Empty State
  emptyWrap: { marginTop: 40, alignItems: 'center', paddingHorizontal: 24, width: '100%' },
  emptyIconPlaceholder: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 1, borderWidth: 1, borderColor: '#E8EAED' },
  emptyShape: { width: 24, height: 16, borderRadius: 4, borderWidth: 1.5, borderColor: '#C4C9D4', borderStyle: 'solid' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1A1D26', textAlign: 'center' },
  emptySub: { marginTop: 8, fontSize: 13, fontWeight: '500', color: '#6B7280', lineHeight: 20, textAlign: 'center' },
  emptyBtn: { marginTop: 24, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, backgroundColor: brand.dark, alignItems: 'center', justifyContent: 'center' },
  emptyBtnText: { color: brand.surface, fontSize: 13, fontWeight: '700' },

  // --- GRID CARDS ---
  row: {
    justifyContent: 'space-between',
    marginBottom: COLUMN_GAP,
  },
  gridCard: {
    width: COLUMN_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EAED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  gridCardInactive: {
    opacity: 0.6,
  },

  // TOP: PERFECT IMAGE
  imageWrap: {
    width: '100%',
    height: 120, 
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    fontSize: 32,
    fontWeight: '700',
    color: '#D1D5DB',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },

  // BOTTOM: ORGANIZED DETAILS
  detailsWrap: {
    padding: 12,
  },
  brandName: {
    fontSize: 10,
    fontWeight: '700',
    color: brand.blue, // Gives the brand name a nice pop
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  hugeDiscount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
    marginBottom: 10,
  },

  // ORGANIZED TERMS BOX (Min Order & Expiry)
  termsBox: {
    backgroundColor: '#F8F9FB', // Light gray background to separate rules
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F0F1F5',
  },
  termRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4, // Spacing between the two rules
  },
  termRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  termLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  termValue: {
    fontSize: 10,
    fontWeight: '800',
    color: '#111827',
  },
});