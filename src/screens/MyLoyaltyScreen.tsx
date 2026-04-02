import React from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { brand } from '../theme';

const { width } = Dimensions.get('window');

// --- Professional High-Fidelity Icons ---
const RewardIcon = ({ type, color }: { type: 'cash' | 'coin' | 'pts'; color: string }) => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {type === 'cash' && <Path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />}
    {type === 'coin' && <Circle cx="12" cy="12" r="10" />}
    {type === 'pts' && <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />}
  </Svg>
);

// --- All Partner Stores (No Memberships Yet) ---
const DISCOVER_STORES = [
  { 
    id: 's1', name: 'FreshMart Grocery', category: 'Grocery', 
    cashback: '5%', coins: 10, pts: 20 
  },
  { 
    id: 's2', name: 'The Coffee Bean', category: 'Cafe & Drinks', 
    cashback: '3%', coins: 5, pts: 15 
  },
  { 
    id: 's3', name: 'Reliance Digital', category: 'Electronics', 
    cashback: '2%', coins: 50, pts: 100 
  },
  { 
    id: 's4', name: 'Cookie Cottage', category: 'Bakery', 
    cashback: '7%', coins: 15, pts: 30 
  },
];

export function MyLoyaltyScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  const renderStoreItem = ({ item }: { item: typeof DISCOVER_STORES[0] }) => (
    <TouchableOpacity activeOpacity={0.9} style={styles.storeCard}>
      <View style={styles.cardHeader}>
        <View style={styles.storeLogo}>
          <Text style={styles.logoInitial}>{item.name[0]}</Text>
        </View>
        <View style={styles.storeMainInfo}>
          <Text style={styles.storeName}>{item.name}</Text>
          <Text style={styles.categoryLabel}>{item.category}</Text>
        </View>
        <TouchableOpacity style={styles.joinBtn}>
           <Text style={styles.joinBtnText}>JOIN</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.rewardsGrid}>
        <View style={styles.rewardPill}>
          <RewardIcon type="cash" color="#4CAF50" />
          <Text style={[styles.rewardVal, { color: '#4CAF50' }]}>{item.cashback} Back</Text>
        </View>
        <View style={styles.rewardPill}>
          <RewardIcon type="coin" color="#FFB800" />
          <Text style={[styles.rewardVal, { color: '#FFB800' }]}>+{item.coins} Coins</Text>
        </View>
        <View style={styles.rewardPill}>
          <RewardIcon type="pts" color={brand.blue} />
          <Text style={[styles.rewardVal, { color: brand.blue }]}>{item.pts} Pts</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* --- ELITE DARK HERO --- */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
            <View style={styles.backArrow} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Loyalty</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.heroContent}>
            <Text style={styles.heroGreeting}>Start Earning{'\n'}Rewards</Text>
            <Text style={styles.heroSub}>Join your favorite stores to unlock exclusive cashback, coins, and premium perks.</Text>
        </View>
      </View>

      {/* --- CONTENT SHEET --- */}
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        
        <FlatList
          data={DISCOVER_STORES}
          renderItem={renderStoreItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
          ListHeaderComponent={() => (
            <View style={styles.listHeader}>
              <Text style={styles.sectionHeading}>Join Partner Stores</Text>
              <Text style={styles.sectionSubText}>Tap 'Join' to start your loyalty journey</Text>
            </View>
          )}
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
  placeholder: { width: 40 },
  
  heroContent: { paddingHorizontal: 24 },
  heroGreeting: { color: brand.surface, fontSize: 34, fontWeight: '800', lineHeight: 40, letterSpacing: -0.6 },
  heroSub: { color: brand.heroBody, fontSize: 14, fontWeight: '500', marginTop: 12, lineHeight: 22 },

  // Sheet
  sheet: { flex: 1, backgroundColor: brand.background, borderTopLeftRadius: 36, borderTopRightRadius: 36, marginTop: -20 },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#E0E2EE', borderRadius: 2, alignSelf: 'center', marginVertical: 15 },
  
  listHeader: { marginBottom: 24 },
  sectionHeading: { fontSize: 20, fontWeight: '800', color: brand.cardHeading },
  sectionSubText: { fontSize: 13, color: brand.cardBody, marginTop: 4, fontWeight: '500' },

  // Store Card
  storeCard: { 
    backgroundColor: brand.surface, 
    borderRadius: 24, 
    padding: 16, 
    marginBottom: 16, 
    borderWidth: 1,
    borderColor: '#F0F1F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  storeLogo: { 
    width: 52, 
    height: 52, 
    borderRadius: 16, 
    backgroundColor: brand.inputBg, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: brand.inputBorder
  },
  logoInitial: { fontSize: 22, fontWeight: '800', color: brand.dark },
  storeMainInfo: { flex: 1, marginLeft: 16 },
  storeName: { fontSize: 16, fontWeight: '800', color: brand.cardHeading },
  categoryLabel: { fontSize: 12, color: brand.cardBody, fontWeight: '700', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  joinBtn: { backgroundColor: brand.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  joinBtnText: { color: brand.surface, fontSize: 11, fontWeight: '900' },

  divider: { height: 1, backgroundColor: '#F0F1F7', marginVertical: 16 },

  rewardsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  rewardPill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: brand.inputBg, 
    paddingHorizontal: 8, 
    paddingVertical: 8, 
    borderRadius: 12, 
    gap: 5,
    flex: 1,
    marginHorizontal: 3,
    justifyContent: 'center'
  },
  rewardVal: { fontSize: 10, fontWeight: '900' },
});