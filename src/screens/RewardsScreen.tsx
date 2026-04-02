import React, { useState } from 'react';
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
const COLUMN_WIDTH = (width - 60) / 2; // Precise 2-column math

// --- Professional SVG Vector Icons ---
const StopwatchIcon = ({ color }: { color: string }) => (
  <Svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 6v6l4 2" />
  </Svg>
);

const CoinIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 8v8M8 12h8" />
  </Svg>
);

// --- Mock Data ---
const REWARDS = [
  { id: '1', name: 'Cookie Cottage', offer: 'TEST OFFER', date: '09-Jul-26', coins: 10, initial: 'C' },
  { id: '2', name: 'Barista', offer: 'Exclusive Deal', date: '24-Jul-26', coins: 10, initial: 'B' },
  { id: '3', name: 'New Offer', offer: 'Limited Drop', date: '21-Sep-26', coins: 15, initial: 'C' },
  { id: '4', name: 'Zomato Pro', offer: 'Dinner Special', date: '05-Aug-26', coins: 20, initial: 'Z' },
];

export function RewardsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('NEW');

  const renderRewardCard = ({ item }: { item: typeof REWARDS[0] }) => (
    <View style={styles.rewardCard}>
      {/* Brand Image Container */}
      <View style={styles.imageBox}>
        <View style={styles.brandCircle}>
           <Text style={styles.brandInitial}>{item.initial}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.rewardTitle} numberOfLines={1}>{item.name}</Text>
        
        <View style={styles.metaRow}>
          <StopwatchIcon color={brand.helperColor} />
          <Text style={styles.metaText}>{item.date}</Text>
        </View>

        <View style={styles.actionRow}>
          <View style={styles.coinBadge}>
            <CoinIcon />
            <Text style={styles.coinVal}>{item.coins}</Text>
          </View>
          <TouchableOpacity style={styles.grabBtn} activeOpacity={0.8}>
            <Text style={styles.grabText}>GRAB</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
          <Text style={styles.headerTitle}>Rewards</Text>
          <View style={styles.placeholder} />
        </View>

        {/* --- PREMIUM UNDERLINE TABS --- */}
        <View style={styles.tabContainer}>
          {['NEW', 'TRENDING', 'CRAFTED FOR YOU'].map((tab) => (
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

      {/* --- CONTENT SHEET --- */}
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        
        <FlatList
          data={REWARDS}
          renderItem={renderRewardCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 120 }}
          ListHeaderComponent={() => (
            <View style={styles.listHeader}>
               <Text style={styles.listTitle}>Available for you</Text>
               <Text style={styles.listSub}>Use your Cashi Coins to unlock these perks</Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: brand.dark },
  
  // Header & Tabs
  header: { paddingBottom: 10 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 25 },
  backCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  backArrow: { width: 10, height: 10, borderLeftWidth: 2, borderTopWidth: 2, borderColor: brand.surface, transform: [{ rotate: '-45deg' }], marginLeft: 4 },
  headerTitle: { color: brand.surface, fontSize: 18, fontWeight: '800' },
  placeholder: { width: 40 },

  tabContainer: { flexDirection: 'row', paddingHorizontal: 24, gap: 24 },
  tab: { paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: brand.blue },
  tabText: { color: brand.heroBody, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  activeTabText: { color: brand.blue },

  // Sheet
  sheet: { flex: 1, backgroundColor: brand.background, borderTopLeftRadius: 36, borderTopRightRadius: 36, marginTop: 10 },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#E0E2EE', borderRadius: 2, alignSelf: 'center', marginVertical: 15 },
  
  listHeader: { marginBottom: 20 },
  listTitle: { fontSize: 18, fontWeight: '800', color: brand.cardHeading },
  listSub: { fontSize: 13, color: brand.cardBody, marginTop: 4, fontWeight: '500' },

  // Reward Card Grid
  gridRow: { justifyContent: 'space-between' },
  rewardCard: { 
    width: COLUMN_WIDTH, 
    backgroundColor: brand.surface, 
    borderRadius: 24, 
    marginBottom: 16, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F1F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  imageBox: { 
    height: 140, 
    backgroundColor: brand.inputBg, 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: 20
  },
  brandCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#FFF', 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: brand.inputBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  brandInitial: { fontSize: 28, fontWeight: '900', color: brand.dark },

  cardContent: { padding: 14 },
  rewardTitle: { fontSize: 14, fontWeight: '800', color: brand.blue, marginBottom: 8 },
  
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  metaText: { fontSize: 11, color: brand.helperColor, fontWeight: '700' },

  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  coinBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  coinVal: { fontSize: 14, fontWeight: '900', color: '#FFB800' },
  
  grabBtn: { backgroundColor: brand.blue, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  grabText: { color: brand.surface, fontSize: 11, fontWeight: '900' },
});