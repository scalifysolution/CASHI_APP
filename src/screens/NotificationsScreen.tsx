import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { brand } from '../theme';

// --- Professional SVG Icons ---
const NotificationIcon = ({ type, color }: { type: string; color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {type === 'reward' && (
      <>
        <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </>
    )}
    {type === 'system' && (
      <>
        <Circle cx="12" cy="12" r="10" />
        <Path d="M12 16v-4m0-4h.01" />
      </>
    )}
    {type === 'security' && (
      <>
        <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <Path d="M7 11V7a5 5 0 0110 0v4" />
      </>
    )}
  </Svg>
);

// --- Mock Data ---
const NOTIFICATIONS = [
  {
    id: '1',
    type: 'reward',
    title: 'Cashi Coins Credited!',
    message: 'You earned 45 Cashi Coins from your order at Deep@toys.',
    time: '2 mins ago',
    unread: true,
  },
  {
    id: '2',
    type: 'system',
    title: 'New Store Nearby',
    message: 'Reliance Digital is now a Cashi partner. Join their loyalty program today!',
    time: '1 hour ago',
    unread: true,
  },
  {
    id: '3',
    type: 'security',
    title: 'Login Alert',
    message: 'A new login was detected on your account from a Chrome browser.',
    time: 'Yesterday',
    unread: false,
  },
  {
    id: '4',
    type: 'reward',
    title: 'Coupon Expiring',
    message: 'Your 15% discount for Cookie Cottage expires in 24 hours. Use it now!',
    time: '2 days ago',
    unread: false,
  },
];

export function NotificationsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const tabs = ['All', 'Rewards', 'Alerts'] as const;
  type Tab = (typeof tabs)[number];
  const [filter, setFilter] = useState<Tab>('All');
  const pagerRef = useRef<ScrollView | null>(null);
  const [pageWidth, setPageWidth] = useState(0);

  const dataForTab = useMemo(() => {
    return {
      All: NOTIFICATIONS,
      Rewards: NOTIFICATIONS.filter((n) => n.type === 'reward'),
      Alerts: NOTIFICATIONS.filter((n) => n.type !== 'reward'),
    } as const;
  }, []);

  const goToTab = (tab: Tab) => {
    setFilter(tab);
    const idx = tabs.indexOf(tab);
    if (idx >= 0 && pageWidth) pagerRef.current?.scrollTo({ x: idx * pageWidth, animated: true });
  };

  useEffect(() => {
    const idx = tabs.indexOf(filter);
    if (idx >= 0 && pageWidth) pagerRef.current?.scrollTo({ x: idx * pageWidth, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageWidth]);

  const onPagerMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = pageWidth ? Math.round(x / pageWidth) : 0;
    const next = tabs[Math.max(0, Math.min(tabs.length - 1, idx))];
    if (next && next !== filter) setFilter(next);
  };

  const renderItem = ({ item }: { item: typeof NOTIFICATIONS[0] }) => (
    <TouchableOpacity 
      activeOpacity={0.8} 
      style={[styles.notifCard, item.unread && styles.unreadCard]}
    >
      <View style={[styles.iconBox, { backgroundColor: item.type === 'reward' ? brand.blueLight : brand.inputBg }]}>
        <NotificationIcon 
          type={item.type} 
          color={item.type === 'reward' ? brand.blue : brand.cardBody} 
        />
      </View>
      <View style={styles.notifContent}>
        <View style={styles.notifHeader}>
          <Text style={styles.notifTitle}>{item.title}</Text>
          <Text style={styles.notifTime}>{item.time}</Text>
        </View>
        <Text style={styles.notifMessage} numberOfLines={2}>
          {item.message}
        </Text>
      </View>
      {item.unread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* --- ELITE DARK HEADER --- */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
            <View style={styles.backArrow} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity>
            <Text style={styles.markRead}>Mark all</Text>
          </TouchableOpacity>
        </View>

        {/* --- CATEGORY TABS --- */}
        <View style={styles.tabScroll}>
          {tabs.map((tab) => (
            <TouchableOpacity 
              key={tab} 
              onPress={() => goToTab(tab)}
              style={[styles.pill, filter === tab && styles.activePill]}
            >
              <Text style={[styles.pillText, filter === tab && styles.activePillText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* --- CONTENT SHEET --- */}
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        
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
            {tabs.map((tab) => (
              <View key={tab} style={{ width: pageWidth || 1, flex: 1 }}>
                <FlatList
                  data={dataForTab[tab]}
                  renderItem={renderItem}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
                  ListHeaderComponent={() => <Text style={styles.listLabel}>Recently Received</Text>}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: brand.dark },
  
  // Header
  header: { paddingBottom: 30 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 25 },
  backCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  backArrow: { width: 10, height: 10, borderLeftWidth: 2, borderTopWidth: 2, borderColor: brand.surface, transform: [{ rotate: '-45deg' }], marginLeft: 4 },
  headerTitle: { color: brand.surface, fontSize: 18, fontWeight: '800' },
  markRead: { color: brand.blue, fontSize: 13, fontWeight: '700' },

  tabScroll: { flexDirection: 'row', paddingHorizontal: 24 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  activePill: { backgroundColor: brand.surface, borderColor: brand.surface },
  pillText: { color: brand.heroBody, fontSize: 13, fontWeight: '700' },
  activePillText: { color: brand.dark },

  // Sheet
  sheet: { flex: 1, backgroundColor: brand.background, borderTopLeftRadius: 36, borderTopRightRadius: 36, marginTop: -10 },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#E0E2EE', borderRadius: 2, alignSelf: 'center', marginVertical: 15 },
  pagerWrap: { flex: 1 },
  
  listLabel: { fontSize: 13, fontWeight: '800', color: brand.helperColor, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 },

  // Notification Card
  notifCard: { flexDirection: 'row', backgroundColor: brand.surface, padding: 16, borderRadius: 20, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  unreadCard: { borderColor: brand.blueLight, backgroundColor: '#FFFFFF' },
  iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  notifContent: { flex: 1, marginLeft: 16, marginRight: 8 },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notifTitle: { fontSize: 15, fontWeight: '800', color: brand.cardHeading },
  notifTime: { fontSize: 11, color: brand.helperColor, fontWeight: '600' },
  notifMessage: { fontSize: 13, color: brand.cardBody, lineHeight: 18, fontWeight: '500' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: brand.blue },
});