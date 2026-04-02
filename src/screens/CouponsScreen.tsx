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
import { useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand } from '../theme';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2; // Precise grid calculation

// --- Mock Data ---
const COUPONS_DATA = [
  { id: '1', name: 'Cookie Cottage', daysLeft: 158, logo: 'C' },
  { id: '2', name: 'Barista', daysLeft: 614, logo: 'B' },
  { id: '3', name: 'FreshMart', daysLeft: 12, logo: 'F' },
  { id: '4', name: 'Nike Store', daysLeft: 45, logo: 'N' },
  { id: '5', name: 'Starbucks', daysLeft: 5, logo: 'S' },
  { id: '6', name: 'Zomato', daysLeft: 120, logo: 'Z' },
];

export function CouponsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const showBack = route.name === 'CouponsFromMenu';
  const [activeTab, setActiveTab] = useState('Active');

  const renderCoupon = ({ item }: { item: typeof COUPONS_DATA[0] }) => (
    <TouchableOpacity activeOpacity={0.9} style={styles.couponCard}>
      {/* Expiry Badge */}
      <View style={styles.expiryBadge}>
        <Text style={styles.expiryText}>{item.daysLeft} days left</Text>
      </View>

      {/* Logo Container */}
      <View style={styles.logoContainer}>
        <Text style={styles.initialText}>{item.logo}</Text>
        {/* If you have images, replace Text with: 
            <Image source={item.image} style={styles.brandImage} /> 
        */}
      </View>

      {/* Brand Info */}
      <View style={styles.cardFooter}>
        <Text style={styles.brandName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.offerText}>Tap to View</Text>
      </View>
    </TouchableOpacity>
  );

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
        data={COUPONS_DATA}
        renderItem={renderCoupon}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={() => (
          <Text style={styles.countText}>You have {COUPONS_DATA.length} active coupons</Text>
        )}
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