import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { MERCHANT_PORTAL_URL } from '../config/env';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { brand } from '../theme';
import { logout } from '../store/authSlice';

// --- High-Fidelity Vector Icon Set ---

const Icon = ({ name, color = brand.surface, size = 20 }: { name: string; color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    {name === 'store' && <><Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><Path d="M9 22V12h6v10" /></>}
    {name === 'sale' && <><Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></>}
    {name === 'coupon' && <Path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 001 1.73 2 2 0 00-1 1.73V17a2 2 0 002 2h14a2 2 0 002-2v-3.27a2 2 0 00-1-1.73 2 2 0 001-1.73V7a2 2 0 00-2-2H5z" />}
    {name === 'loyalty' && <Path d="M20.42 4.58a5 5 0 00-7.07 0l-1.35 1.35-1.35-1.35a5 5 0 00-7.07 7.07l1.35 1.35L12 20l7.07-7.07 1.35-1.35a5 5 0 000-7.07z" />}
    {name === 'earnings' && <><Path d="M18 20V10" /><Path d="M12 20V4" /><Path d="M6 20v-4" /></>}
    {name === 'rewards' && <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />}
    {name === 'info' && <><Circle cx="12" cy="12" r="10" /><Path d="M12 16v-4m0-4h.01" /></>}
    {name === 'support' && <><Path d="M3 18v-6a9 9 0 0118 0v6" /><Path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" /></>}
    {name === 'logout' && <><Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><Path d="M16 17l5-5-5-5M21 12H9" /></>}
    {name === 'pencil' && <><Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></>}
  </Svg>
);

function withQueryParams(
  url: string,
  params: Record<string, string | undefined | null>,
) {
  const base = String(url || '').trim();
  if (!base) return base;
  const hashIdx = base.indexOf('#');
  const beforeHash = hashIdx >= 0 ? base.slice(0, hashIdx) : base;
  const hash = hashIdx >= 0 ? base.slice(hashIdx) : '';
  const qs = Object.entries(params)
    .filter(([, v]) => v != null && String(v).length > 0)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  if (!qs) return base;
  const joiner = beforeHash.includes('?') ? '&' : '?';
  return `${beforeHash}${joiner}${qs}${hash}`;
}

export function HomeSideMenu({ visible, onClose, navigation }: any) {
  const dispatch = useAppDispatch();
  const role = useAppSelector((s) => s.user.role);
  const displayName = useAppSelector((s) => s.user.displayName);
  const token = useAppSelector((s) => s.auth.accessToken);
  const { width: windowWidth } = useWindowDimensions();
  
  const drawerWidth = useMemo(
    () => Math.min(320, Math.max(280, windowWidth * 0.82)),
    [windowWidth]
  );
  
  const translateX = useRef(new Animated.Value(-320)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(translateX, {
        toValue: -drawerWidth,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, drawerWidth, translateX]);

  const closeDrawer = () => {
    Animated.timing(translateX, { toValue: -drawerWidth, duration: 220, useNativeDriver: true }).start(() => onClose());
  };

  const MENU_ITEMS = useMemo(() => [
    { label: 'My Coupons', icon: 'coupon', screen: 'CouponsFromMenu' },
    { label: 'My Loyalty', icon: 'loyalty', screen: 'MyLoyalty' },
    { label: 'Rewards Marketplace', icon: 'rewards', screen: 'Rewards' },
    { label: 'Help & Support', icon: 'support', screen: null },
    { label: 'About Cashi', icon: 'info', screen: null },
    { label: 'Sign Out', icon: 'logout', screen: null, isDestructive: true },
  ], []);

  const avatarLetter = displayName?.trim()?.[0]?.toUpperCase() ?? 'M';

  if (!visible) return null;

  return (
    <View style={styles.overlayRoot} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={closeDrawer} />
      <Animated.View style={[styles.drawer, { width: drawerWidth, transform: [{ translateX }] }]}>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          
          {/* Top Navigation */}
          <View style={styles.topActions}>
            <TouchableOpacity onPress={closeDrawer} style={styles.closeBtn}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation?.navigate?.('Invite')}>
              <View style={styles.inviteBadge}>
                <Text style={styles.inviteText}>Invite</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Profile Section */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarBase}>
                <Text style={styles.avatarText}>{avatarLetter}</Text>
              </View>
              <TouchableOpacity 
                style={styles.editPencil} 
                activeOpacity={0.8}
                onPress={() => { closeDrawer(); navigation?.navigate?.('EditProfile'); }}
              >
                <Icon name="pencil" size={14} />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{displayName || 'Mohan Singh'}</Text>
            <Text style={styles.userTier}>Platinum Member</Text>
          </View>

          <View style={styles.divider} />

          <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
            {/* --- PREMIUM MERCHANT PORTAL CTA --- */}
            <TouchableOpacity 
              style={styles.merchantCard} 
              activeOpacity={0.9}
              onPress={() => {
                closeDrawer();
                const base = (MERCHANT_PORTAL_URL || '').replace(/\/+$/, '');
                const isUser = String(role || '').toUpperCase() === 'USER' || !role;
                const rawUrl = isUser ? `${base}/register` : `${base}`;
                const url = withQueryParams(rawUrl, {
                  token,
                  action: isUser ? 'REGISTER_ON_CASHI' : 'REGISTER_SALE',
                });
                navigation?.navigate?.('WebPage', {
                  title: isUser ? 'Start Cashi' : 'Register Sale',
                  url,
                });
              }}
            >
              <View style={styles.merchantIconBox}>
                <Icon name={(String(role || '').toUpperCase() === 'USER' || !role) ? 'store' : 'sale'} color={brand.surface} />
              </View>
              <View style={styles.merchantTexts}>
                <Text style={styles.merchantTitle}>
                  {(String(role || '').toUpperCase() === 'USER' || !role) ? 'Start Cashi on your Store' : 'Register Sale'}
                </Text>
                <Text style={styles.merchantSub}>
                  {(String(role || '').toUpperCase() === 'USER' || !role) ? 'Register your store and become a partner' : 'Record loyalty transactions'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Menu List */}
            {MENU_ITEMS.map((item, i) => (
              <TouchableOpacity 
                key={i} 
                style={styles.menuItem} 
                activeOpacity={0.7}
                onPress={() => {
                  closeDrawer();
                  if (item.label === 'Sign Out') {
                    dispatch(logout());
                    return;
                  }
                  if (item.screen) navigation?.navigate?.(item.screen);
                }}
              >
                <View style={styles.menuIconWrap}>
                   <Icon name={item.icon} color={item.isDestructive ? '#FF6B6B' : brand.surface} />
                </View>
                <Text style={[styles.menuLabel, item.isDestructive && styles.destructiveLabel]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Footer Section */}
          <View style={styles.footer}>
            <TouchableOpacity><Text style={styles.footerLink}>Privacy Policy</Text></TouchableOpacity>
            <Text style={styles.version}>CASHI v1.1.6 BETA</Text>
          </View>

        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayRoot: { ...StyleSheet.absoluteFillObject, zIndex: 10000, elevation: 10000 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  drawer: { 
    position: 'absolute', 
    left: 0, 
    top: 0, 
    bottom: 0, 
    backgroundColor: brand.dark, 
    shadowColor: '#000', 
    shadowOpacity: 0.4, 
    shadowRadius: 15, 
    elevation: 24 
  },
  container: { flex: 1 },
  
  topActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 50 },
  closeBtn: { padding: 4 },
  closeIcon: { color: brand.surface, fontSize: 18, fontWeight: '300' },
  inviteBadge: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  inviteText: { color: brand.surface, fontSize: 13, fontWeight: '700' },

  profileHeader: { alignItems: 'center', marginTop: 15, marginBottom: 30 },
  avatarContainer: { width: 88, height: 88 },
  avatarBase: { flex: 1, borderRadius: 44, backgroundColor: '#2A2A32', borderWidth: 2.5, borderColor: brand.surface, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: brand.surface, fontSize: 32, fontWeight: '800' },
  editPencil: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: brand.blue, borderWidth: 2, borderColor: brand.dark, alignItems: 'center', justifyContent: 'center' },
  userName: { color: brand.surface, fontSize: 19, fontWeight: '800', marginTop: 14, letterSpacing: -0.4 },
  userTier: { color: brand.heroBody, fontSize: 12, fontWeight: '600', marginTop: 4 },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 24 },

  menuScroll: { paddingHorizontal: 24, marginTop: 20 },
  
  // Premium Merchant Card
  merchantCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(59, 158, 232, 0.12)', 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 158, 232, 0.25)'
  },
  merchantIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: brand.blue, alignItems: 'center', justifyContent: 'center' },
  merchantTexts: { marginLeft: 14, flex: 1 },
  merchantTitle: { color: brand.surface, fontSize: 15, fontWeight: '800' },
  merchantSub: { color: 'rgba(59, 158, 232, 0.8)', fontSize: 11, fontWeight: '700', marginTop: 2 },
  cardChevron: { width: 6, height: 6, borderRightWidth: 2, borderBottomWidth: 2, borderColor: brand.blue, transform: [{ rotate: '-45deg' }], opacity: 0.6 },

  // List Items
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  menuIconWrap: { width: 32, alignItems: 'center', marginRight: 14 },
  menuLabel: { color: brand.surface, fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  destructiveLabel: { color: '#FF6B6B' },

  footer: { padding: 30, alignItems: 'center' },
  footerLink: { color: brand.heroBody, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  version: { color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
});