import React, { useState } from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand } from '../theme';

// --- Professional Mock Data ---
const EARNINGS_DATA = [
  { id: '1', store: 'Deep @ Toys & More', amount: 236.00, coins: 45, refId: '#31245560941', date: '20 Mar 2026', type: 'Earned' },
  { id: '2', store: 'Ma The Pyar Restaurant', amount: 3.00, coins: 5, refId: '#31248560942', date: '19 Mar 2026', type: 'Earned' },
  { id: '3', store: 'Barista Coffee House', amount: 450.50, coins: 92, refId: '#31248560945', date: '18 Mar 2026', type: 'Earned' },
  { id: '4', store: 'Cookie Cottage Bakery', amount: 120.00, coins: 25, refId: '#31248560949', date: '15 Mar 2026', type: 'Earned' },
];

export function EarningsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const showBack = route.name === 'EarningsFromMenu';
  const [activeTab, setActiveTab] = useState('Earnings');

  const renderTransaction = ({ item }: { item: typeof EARNINGS_DATA[0] }) => (
    <View style={styles.transactionRow}>
      <TouchableOpacity activeOpacity={0.8} style={styles.transactionCard}>
        <View style={styles.cardHeader}>
          <View style={styles.storeCircle}>
            <Text style={styles.storeInitial}>{item.store[0]}</Text>
          </View>
          <View style={styles.mainInfo}>
            <Text style={styles.storeName} numberOfLines={1}>{item.store}</Text>
            <Text style={styles.dateText}>{item.date} • {item.refId}</Text>
          </View>
          <View style={styles.amountCol}>
             <Text style={styles.transactionAmount}>₹{item.amount.toFixed(2)}</Text>
             <View style={styles.coinBadge}>
                <View style={styles.coinDot} />
                <Text style={styles.coinText}>+{item.coins}</Text>
             </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

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
            <Text style={styles.balLabel}>POINTS</Text>
            <Text style={styles.balVal}>1,240</Text>
          </View>
          <View style={styles.balDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balLabel}>COINS</Text>
            <Text style={[styles.balVal, { color: brand.blue }]}>450</Text>
          </View>
          <View style={styles.balDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balLabel}>CASHBACK</Text>
            <Text style={styles.balVal}>₹120</Text>
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
          data={EARNINGS_DATA}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <View style={styles.listHeader}>
               <Text style={styles.timelineLabel}>Recent Activity</Text>
               <TouchableOpacity><Text style={styles.filterText}>Filter</Text></TouchableOpacity>
            </View>
          )}
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
});