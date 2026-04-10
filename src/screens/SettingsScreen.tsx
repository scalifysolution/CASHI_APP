import React from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { MERCHANT_PORTAL_URL } from '../config/env';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { brand } from '../theme';
import { logout } from '../store/authSlice';

// --- Professional Vector Icons ---
const SettingIcon = ({ type, color = brand.cardHeading }: { type: string; color?: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {type === 'user' && <><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><Circle cx="12" cy="7" r="4" /></>}
    {type === 'security' && <><Rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><Path d="M7 11V7a5 5 0 0 1 10 0v4" /></>}
    {type === 'bell' && <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />}
    {type === 'help' && <><Circle cx="12" cy="12" r="10" /><Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" /></>}
    {type === 'privacy' && <><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>}
  </Svg>
);

export function SettingsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const cashiBusiness = useAppSelector((s) => s.user.cashiBusiness);
  const role = useAppSelector((s) => s.user.role);
  const displayName = useAppSelector((s) => s.user.displayName) || '—';
  const email = useAppSelector((s) => s.user.email) || '—';

  const PRIVACY_URL = 'https://cashi.in/privacy.html';
  const FAQ_URL = 'https://cashi.in/#faq';

  const confirmLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          void dispatch(logout());
        },
      },
    ]);
  };

  const goRegisterSale = () => {
    const base = (MERCHANT_PORTAL_URL || '').trim().replace(/\/+$/, '');
    if (!base) {
      Alert.alert('Missing URL', 'Set MERCHANT_PORTAL_URL in your .env file.');
      return;
    }
    // Always open the dedicated MerchantPortal WebView so we can inject the app token.
    navigation.navigate('MerchantPortal');
  };

  // Delete account is handled under Personal Information (not shown here).

  const SettingTile = ({ label, sub, icon, onPress }: any) => (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.tileIcon}>
        <SettingIcon type={icon} />
      </View>
      <View style={styles.tileContent}>
        <Text style={styles.tileLabel}>{label}</Text>
        <Text style={styles.tileSub}>{sub}</Text>
      </View>
      <View style={styles.chevron} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* --- ELITE HEADER --- */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Account Settings</Text>
        
        {/* Profile Quick Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(displayName?.trim()?.[0] ?? 'C').toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{email}</Text>
          </View>
          <TouchableOpacity 
            style={styles.editBtn} 
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- CONTENT SHEET --- */}
      <View style={styles.sheet}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={styles.sheetHandle} />

          <TouchableOpacity style={styles.storeCtaCard} onPress={goRegisterSale} activeOpacity={0.92}>
            <View style={styles.storeCtaIconWrap}>
              <Svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={brand.surface} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <Rect x="9" y="22" width="6" height="10" />
              </Svg>
            </View>
            <View style={styles.storeCtaTextBlock}>
              <Text style={styles.storeCtaTitle}>
                {(String(role || '').toUpperCase() === 'USER' || !role) ? 'Start Cashi on your Store' : 'Register sale'}
              </Text>
              <Text style={styles.storeCtaSub}>
                {(String(role || '').toUpperCase() === 'USER' || !role)
                  ? 'Opens registration inside the app'
                  : 'Open the merchant portal to record a sale'}
              </Text>
            </View>
            <View style={styles.storeCtaChevron} />
          </TouchableOpacity>

          {/* Section: Personal */}
          <Text style={styles.sectionLabel}>PERSONAL</Text>
          <View style={styles.group}>
            <SettingTile 
              label="Personal Information" 
              sub="Name, Email, Mobile number" 
              icon="user" 
              onPress={() => navigation.navigate('EditProfile')}
            />
          </View>

          {/* Section: App Preferences */}
          <Text style={styles.sectionLabel}>PREFERENCES</Text>
          <View style={styles.group}>
            <SettingTile 
              label="Privacy Policy" 
              sub="How we handle your data" 
              icon="privacy" 
              onPress={() => navigation.navigate('WebPage', { title: 'Privacy Policy', url: PRIVACY_URL })}
            />
          </View>

          {/* Section: Support */}
          <Text style={styles.sectionLabel}>SUPPORT</Text>
          <View style={styles.group}>
            <SettingTile 
              label="Help & FAQ" 
              sub="Get help with your account" 
              icon="help" 
              onPress={() => navigation.navigate('WebPage', { title: 'Help & FAQ', url: FAQ_URL })}
            />
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout} activeOpacity={0.85}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>


          <Text style={styles.versionText}>CASHI v1.1.6 BETA</Text>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: brand.dark },
  
  // Header
  header: { paddingHorizontal: 24, paddingBottom: 40 },
  headerTitle: { color: brand.surface, fontSize: 24, fontWeight: '800', marginBottom: 25 },
  
  profileCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.06)', 
    padding: 16, 
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: brand.blue, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: brand.surface, fontSize: 22, fontWeight: '800' },
  profileInfo: { flex: 1, marginLeft: 16 },
  profileName: { color: brand.surface, fontSize: 17, fontWeight: '800' },
  profileEmail: { color: brand.heroBody, fontSize: 12, fontWeight: '500', marginTop: 2 },
  editBtn: { backgroundColor: brand.blueLight, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  editBtnText: { color: brand.blue, fontSize: 12, fontWeight: '800' },

  // Sheet
  sheet: { flex: 1, backgroundColor: brand.background, borderTopLeftRadius: 36, borderTopRightRadius: 36, marginTop: -20 },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#E0E2EE', borderRadius: 2, alignSelf: 'center', marginVertical: 15 },
  
  sectionLabel: { fontSize: 11, fontWeight: '900', color: brand.helperColor, paddingHorizontal: 28, marginTop: 25, marginBottom: 12, letterSpacing: 1 },
  group: { marginHorizontal: 20, backgroundColor: brand.surface, borderRadius: 24, padding: 8, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  
  tile: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  tileIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: brand.inputBg, alignItems: 'center', justifyContent: 'center' },
  tileContent: { flex: 1, marginLeft: 16 },
  tileLabel: { fontSize: 15, fontWeight: '800', color: brand.cardHeading },
  tileSub: { fontSize: 12, color: brand.cardBody, marginTop: 2, fontWeight: '500' },
  chevron: { width: 7, height: 7, borderRightWidth: 2, borderBottomWidth: 2, borderColor: '#D0D3E2', transform: [{ rotate: '-45deg' }], marginRight: 8 },
  
  divider: { height: 1, backgroundColor: '#F4F5F9', marginHorizontal: 14 },

  storeCtaCard: {
    marginHorizontal: 20,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brand.surface,
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E8ECF4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  storeCtaIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: brand.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  storeCtaTextBlock: { flex: 1 },
  storeCtaTitle: { fontSize: 16, fontWeight: '800', color: brand.cardHeading, letterSpacing: -0.2 },
  storeCtaSub: { fontSize: 12, color: brand.cardBody, marginTop: 5, fontWeight: '600', lineHeight: 17 },
  storeCtaChevron: {
    width: 8,
    height: 8,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: brand.helperColor,
    transform: [{ rotate: '-45deg' }],
    marginLeft: 4,
  },
  logoutBtn: {
    marginHorizontal: 28,
    marginTop: 18,
    marginBottom: 8,
    paddingVertical: 18,
    borderRadius: 18,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
  },
  logoutText: { color: '#FF4B4B', fontSize: 15, fontWeight: '800' },
  versionText: { textAlign: 'center', color: brand.helperColor, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
});