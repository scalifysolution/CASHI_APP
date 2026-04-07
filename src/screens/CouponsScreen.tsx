import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand } from '../theme';
import { useAppSelector } from '../store/hooks';
import { apiRequest } from '../api/client';
import { API_BASE_URL } from '../config/env';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2; // Precise grid calculation

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
  // API_BASE_URL includes /api, but uploads are served from the root.
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
  const showBack = route.name === 'CouponsFromMenu';
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

  const headerText = useMemo(() => {
    // Keep the "no coupons" message only in ListEmptyComponent (below),
    // so we don't show it twice (top + content).
    if (loading) return '';
    if (error) return '';
    if (list.length === 0) return '';
    return `${list.length} ${activeTab.toLowerCase()} coupon${list.length === 1 ? '' : 's'}`;
  }, [activeTab, error, list.length, loading]);

  const renderCoupon = ({ item }: { item: CouponItem }) => {
    const c = item.coupon;
    const title = c?.title ?? 'Coupon';
    const img = assetUrl(c?.imageUrl ?? null);
    const dleft = daysLeft(c?.expiresAt ?? null);
    const badge =
      activeTab === 'Used'
        ? 'Used'
        : activeTab === 'Expired'
          ? 'Expired'
          : dleft == null
            ? 'No expiry'
            : dleft <= 0
              ? 'Expires today'
              : `${dleft} days left`;

    const initial = title.trim()?.[0]?.toUpperCase() ?? 'C';

    return (
    <TouchableOpacity activeOpacity={0.9} style={styles.couponCard}>
      {/* Expiry Badge */}
      <View style={styles.expiryBadge}>
        <Text style={styles.expiryText}>{badge}</Text>
      </View>

      {/* Logo Container */}
      <View style={styles.logoContainer}>
        {img ? (
          <Image
            source={{ uri: img }}
            style={styles.brandImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.initialText}>{initial}</Text>
        )}
      </View>

      {/* Brand Info */}
      <View style={styles.cardFooter}>
        <Text style={styles.brandName} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.offerText} numberOfLines={1}>
          {c?.shortDescription ?? 'Tap to view'}
        </Text>
      </View>
    </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={brand.dark} />
      
      {/* --- PREMIUM HEADER --- */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          {showBack ? (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <View style={styles.arrow} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtnPlaceholder} />
          )}
          <Text style={styles.headerTitle}>My Coupons</Text>
          <View style={styles.placeholder} />
        </View>

        {/* --- CATEGORY TABS --- */}
        <View style={styles.tabContainer}>
          {['Active', 'Used', 'Expired'].map((tab) => (
            <TouchableOpacity 
              key={tab} 
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* --- COUPONS GRID --- */}
      <FlatList
        data={list}
        renderItem={renderCoupon}
        keyExtractor={(item) => item.assignmentId}
        numColumns={2}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load('refresh')}
            tintColor={brand.blue}
          />
        }
        ListHeaderComponent={() =>
          headerText ? <Text style={styles.countText}>{headerText}</Text> : null
        }
        ListEmptyComponent={() => {
          if (loading) return null;
          if (error) {
            return (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>Couldn’t load coupons</Text>
                <Text style={styles.emptySub}>
                  Check your connection and try again.
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
              <Text style={styles.emptyTitle}>
                {activeTab === 'Used'
                  ? 'No used coupons yet'
                  : activeTab === 'Expired'
                    ? 'No expired coupons'
                    : 'No active coupons yet'}
              </Text>
              <Text style={styles.emptySub}>
                {activeTab === 'Active'
                  ? 'Earn coupons when you shop at partner stores. They’ll appear here automatically.'
                  : activeTab === 'Used'
                    ? 'Once you redeem a coupon, it will show up here.'
                    : 'When a coupon expires, it will move here.'}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brand.dark, // Matching your professional theme
  },
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

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: brand.blue,
  },
  tabText: {
    color: brand.heroBody,
    fontSize: 13,
    fontWeight: '700',
  },
  activeTabText: {
    color: brand.surface,
  },

  // Grid
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    backgroundColor: brand.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  countText: {
    fontSize: 13,
    color: brand.cardBody,
    fontWeight: '600',
    marginBottom: 20,
  },
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

  // Card Design
  couponCard: {
    width: COLUMN_WIDTH,
    backgroundColor: brand.surface,
    borderRadius: 24,
    padding: 12,
    alignItems: 'center',
    // Premium Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.035,
    shadowRadius: 8,
    elevation: 2,
  },
  expiryBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 2,
  },
  expiryText: {
    color: brand.surface,
    fontSize: 9,
    fontWeight: '800',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: brand.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 15,
    overflow: 'hidden',
  },
  brandImage: {
    width: 80,
    height: 80,
  },
  initialText: {
    fontSize: 28,
    fontWeight: '800',
    color: brand.cardHeading,
  },
  cardFooter: {
    width: '100%',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: brand.inputBg,
    paddingTop: 12,
    paddingBottom: 4,
  },
  brandName: {
    fontSize: 15,
    fontWeight: '800',
    color: brand.cardHeading,
  },
  offerText: {
    fontSize: 11,
    color: brand.blue,
    fontWeight: '700',
    marginTop: 2,
  },
});