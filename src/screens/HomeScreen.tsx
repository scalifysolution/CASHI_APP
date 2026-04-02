import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationBellIcon } from '../components/icons/NotificationBellIcon';
import { useHomeMenu } from '../navigation/HomeMenuContext';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { brand } from '../theme';

type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

const MenuIcon = () => (
  <View style={styles.menuIconContainer}>
    <View style={styles.menuLineMain} />
    <View style={styles.menuLineSub} />
  </View>
);

function QRBlock({
  light = false,
  size = 6.5,
}: {
  light?: boolean;
  size?: number;
}) {
  const fg = light ? brand.surface : brand.dark;
  const dotOpacity = light ? 0.9 : 1;
  return (
    <View style={{ gap: 2.2 }}>
      {[...Array(6)].map((_, row) => (
        <View key={row} style={{ flexDirection: 'row', gap: 2.2 }}>
          {[...Array(6)].map((_, col) => {
            const filled = (row + col) % 2 === 0 || row === 0 || col === 5;
            return (
              <View
                key={col}
                style={{
                  width: size,
                  height: size,
                  borderRadius: 1.2,
                  backgroundColor: filled ? fg : 'transparent',
                  opacity: filled ? dotOpacity : 0.08,
                  borderWidth: filled ? 0 : 0.5,
                  borderColor: fg,
                }}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeNav>();
  const { setMenuVisible } = useHomeMenu();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* --- PREMIUM MESH HERO --- */}
      <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <TouchableOpacity
              onPress={() => setMenuVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Open menu"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.menuHit}
              activeOpacity={0.7}>
              <MenuIcon />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Invite')}
              accessibilityRole="button"
              accessibilityLabel="Invite">
              <Text style={styles.inviteLink}>Invite</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.topBarLogo}>
            <Image source={require('../assets/cashi-logo.png')} style={styles.logoMain} resizeMode="contain" />
          </View>
          <View style={styles.topBarRight}>
            <TouchableOpacity
              style={styles.iconCircle}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              onPress={() => navigation.navigate('Notifications')}>
              <NotificationBellIcon />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.balanceHeader}>
          <View style={styles.greetingRow}>
            <Text style={styles.greetingText} numberOfLines={2}>
              Hello, Abhishek
            </Text>
            <View style={styles.locationContainer}>
              <View style={styles.gpsDot} />
              <Text style={styles.locationLabel} numberOfLines={1}>
                Sector 85, Faridabad, HR
              </Text>
              <View style={styles.chevronSmall} />
            </View>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>1,240</Text>
              <Text style={styles.statTag}>POINTS</Text>
            </View>
            <View style={styles.dividerInner} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>450</Text>
              <Text style={styles.statTag}>COINS</Text>
            </View>
            <View style={styles.dividerInner} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>₹120</Text>
              <Text style={styles.statTag}>CASHBACK</Text>
            </View>
          </View>
        </View>
      </View>

      {/* --- CONTENT SHEET --- */}
      <View style={styles.mainSheet}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={styles.sheetHandle} />

          {/* 1. THE PLATINUM WALLET CARD */}
          <TouchableOpacity activeOpacity={0.96} style={styles.walletCard}>
            <View style={styles.cardGlow} />
            <View style={styles.cardHeader}>
              <View style={styles.tierPill}>
                <Text style={styles.tierText}>PLATINUM MEMBER</Text>
              </View>
              <Text style={styles.cardProvider}>SHOPVIEW • SHOPOS</Text>
            </View>
            
            <View style={styles.cardMiddle}>
              <View>
                <Text style={styles.cardName}>Loyalty Card</Text>
                <Text style={styles.cardDetail}>Unlimited 5% Cashback Rewards</Text>
              </View>
              <View style={styles.glassQRBox}>
                 <QRBlock light size={9} />
              </View>
            </View>
          </TouchableOpacity>

          {/* 2. DISCOVER MERCHANTS (The "Nearby" Section) */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionHeading}>Nearby Partners</Text>
            <TouchableOpacity><Text style={styles.actionText}>See Map</Text></TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearbyScroll}>
             {['Cookie Cottage', 'Barista', 'FreshMart', 'Nike', 'Zara'].map((name, i) => (
                <TouchableOpacity key={i} style={styles.merchantCard}>
                   <View style={styles.merchantLogoWrap}>
                      <Text style={styles.merchantInit}>{name[0]}</Text>
                   </View>
                   <Text style={styles.merchantTitle} numberOfLines={1}>{name}</Text>
                   <View style={styles.rewardTag}>
                      <Text style={styles.rewardTagText}>10% OFF</Text>
                   </View>
                </TouchableOpacity>
             ))}
          </ScrollView>

          {/* 3. YOUR BEST DEALS (Voucher Style) */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionHeading}>Active Vouchers</Text>
            <TouchableOpacity><Text style={styles.actionText}>Browse All</Text></TouchableOpacity>
          </View>

          {['Starbucks India', 'KFC Rewards'].map((name, i) => (
            <TouchableOpacity key={i} style={styles.voucherRow} activeOpacity={0.9}>
              <View style={[styles.voucherAccent, { backgroundColor: i === 0 ? brand.blue : '#FF5252' }]} />
              <View style={styles.voucherContent}>
                <Text style={styles.vouchLabel}>{name}</Text>
                <Text style={styles.vouchMain}>20% INSTANT CASHBACK</Text>
                <Text style={styles.vouchSub}>Valid on orders above ₹499</Text>
              </View>
              <View style={styles.voucherAction}>
                <View style={styles.usePill}><Text style={styles.usePillText}>USE</Text></View>
              </View>
            </TouchableOpacity>
          ))}

          {/* 4. SMART QUICK-ACTION WIDGET */}
          <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.9}>
             <View style={styles.quickActionLeft}>
                <View style={styles.liveIndicator}>
                   <View style={styles.livePulse} />
                   <Text style={styles.liveText}>SCAN & PAY ACTIVE</Text>
                </View>
                <Text style={styles.quickTitle}>Instant Coin Accrual</Text>
                <Text style={styles.quickDesc}>Pay any merchant to earn coins</Text>
                <View style={styles.quickBtn}>
                   <Text style={styles.quickBtnText}>Launch Scanner</Text>
                </View>
             </View>
             <View style={styles.quickIconContainer}>
                <QRBlock light size={7.5} />
             </View>
          </TouchableOpacity>

        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: brand.dark, overflow: 'visible' },
  
  // Hero & Header
  hero: { paddingHorizontal: 24, paddingBottom: 45 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    minHeight: 44,
    zIndex: 20,
    elevation: 20,
  },
  topBarLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    justifyContent: 'flex-start',
  },
  menuHit: {
    minWidth: 44,
    minHeight: 44,
    paddingVertical: 8,
    paddingRight: 4,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  inviteLink: { color: brand.surface, fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },
  topBarLogo: {
    width: 104,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 14,
  },
  logoMain: { width: 96, height: 34 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  greetingRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
    flexShrink: 0,
    maxWidth: '56%',
  },
  gpsDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: brand.blue, marginRight: 6 },
  locationLabel: { color: brand.heroBody, fontSize: 10, fontWeight: '700', flexShrink: 1 },
  chevronSmall: { width: 4, height: 4, borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: brand.heroBody, transform: [{ rotate: '45deg' }], marginLeft: 4 },

  balanceHeader: { width: '100%' },
  greetingText: {
    flex: 1,
    color: brand.surface,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginRight: 4,
  },
  statsContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 18, borderRadius: 22 },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { color: brand.surface, fontSize: 19, fontWeight: '800' },
  statTag: { color: brand.heroBody, fontSize: 9, fontWeight: '900', marginTop: 4, letterSpacing: 1.2 },
  dividerInner: { width: 1, height: 22, backgroundColor: 'rgba(255,255,255,0.1)' },

  // Content Sheet
  mainSheet: { flex: 1, backgroundColor: brand.background, borderTopLeftRadius: 36, borderTopRightRadius: 36, marginTop: -20 },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#E0E2EE', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 24 },

  // The Card (Elite Wallet Design)
  walletCard: { marginHorizontal: 24, height: 190, backgroundColor: brand.blue, borderRadius: 28, padding: 24, justifyContent: 'space-between', overflow: 'hidden', elevation: 15, shadowColor: brand.blue, shadowOpacity: 0.3, shadowRadius: 20 },
  cardGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.4)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tierPill: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  tierText: { color: brand.surface, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  cardProvider: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  cardMiddle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardName: { color: brand.surface, fontSize: 24, fontWeight: '800' },
  cardDetail: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', marginTop: 4 },
  glassQRBox: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 14, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },

  // Merchant Cards
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginTop: 32, marginBottom: 18, alignItems: 'center' },
  sectionHeading: { fontSize: 18, fontWeight: '800', color: brand.cardHeading },
  actionText: { color: brand.blue, fontWeight: '700', fontSize: 13 },
  nearbyScroll: { paddingLeft: 24, paddingRight: 12, marginBottom: 12 },
  merchantCard: { width: 90, marginRight: 16, alignItems: 'center' },
  merchantLogoWrap: { width: 72, height: 72, borderRadius: 24, backgroundColor: brand.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#F0F1F7' },
  merchantInit: { fontSize: 24, fontWeight: '800', color: brand.cardHeading },
  merchantTitle: { fontSize: 12, color: brand.cardHeading, fontWeight: '700', marginBottom: 6 },
  rewardTag: { backgroundColor: brand.blueLight, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  rewardTagText: { color: brand.blue, fontSize: 9, fontWeight: '900' },

  // Voucher Row
  voucherRow: { flexDirection: 'row', marginHorizontal: 24, marginBottom: 12, backgroundColor: brand.surface, borderRadius: 20, height: 90, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F1F7' },
  voucherAccent: { width: 6 },
  voucherContent: { flex: 1, paddingLeft: 16, justifyContent: 'center' },
  vouchLabel: { fontSize: 11, fontWeight: '800', color: brand.helperColor, letterSpacing: 0.5 },
  vouchMain: { fontSize: 15, fontWeight: '900', color: brand.cardHeading, marginTop: 2 },
  vouchSub: { fontSize: 11, color: brand.blue, fontWeight: '700', marginTop: 4 },
  voucherAction: { paddingRight: 16, justifyContent: 'center' },
  usePill: { backgroundColor: brand.inputBg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  usePillText: { color: brand.cardHeading, fontWeight: '900', fontSize: 12 },

  // Quick Action Dashboard Element
  quickActionCard: { marginHorizontal: 24, marginTop: 24, backgroundColor: brand.dark, borderRadius: 32, padding: 28, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  quickActionLeft: { flex: 1, zIndex: 2 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  livePulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50', marginRight: 8 },
  liveText: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  quickTitle: { color: brand.surface, fontSize: 20, fontWeight: '800' },
  quickDesc: { color: brand.heroBody, fontSize: 13, marginTop: 6, fontWeight: '500' },
  quickBtn: { backgroundColor: brand.surface, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, alignSelf: 'flex-start', marginTop: 20 },
  quickBtnText: { color: brand.dark, fontSize: 12, fontWeight: '800' },
  quickIconContainer: { opacity: 0.15, position: 'absolute', right: -15, transform: [{ scale: 1.8 }, { rotate: '-10deg' }] },

  // Icon Styles
  menuIconContainer: { gap: 6 },
  menuLineMain: { width: 22, height: 2.5, backgroundColor: brand.surface, borderRadius: 2 },
  menuLineSub: { width: 14, height: 2.5, backgroundColor: brand.surface, borderRadius: 2 },
});