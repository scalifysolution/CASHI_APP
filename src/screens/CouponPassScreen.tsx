import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import type { RootStackParamList } from '../navigation/types';
import { useAppSelector } from '../store/hooks';
import { brand } from '../theme';
import { API_BASE_URL } from '../config/env';
import { RemoteAssetImage } from '../components/RemoteAssetImage';
import { buildMemberQrPayload } from '../utils/memberQr';
import { memberIdMasked } from '../utils/memberId';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = NativeStackScreenProps<RootStackParamList, 'CouponPass'>;

function assetUrl(pathOrUrl: string | null) {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (!pathOrUrl.startsWith('/')) return pathOrUrl;
  const origin = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');
  return `${origin}${pathOrUrl}`;
}

export function CouponPassScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const userId = useAppSelector((s) => s.user.id);
  
  const [isQrRevealed, setIsQrRevealed] = useState(false);

  const item = (route.params as any)?.item as any;
  const c = item?.coupon ?? null;

  const title = String(c?.title ?? 'Special Offer').trim();
  const shortDesc = (c?.shortDescription ?? '') as string;
  const longDesc = (c?.longDescription ?? '') as string;
  const img = assetUrl((c?.imageUrl ?? null) as string | null);
  const minOrder = c?.minOrderValue != null ? Number(c.minOrderValue) : null;
  const expiresAt = (c?.expiresAt ?? null) as string | null;
  
  const valueType = c?.valueType; 
  const valueFixed = c?.valueFixed;
  const valuePercent = c?.valuePercent;

  const discountHighlight = useMemo(() => {
    if (valueType === 'PERCENT' && valuePercent) return `${valuePercent}% OFF`;
    if (valueType === 'FIXED' && valueFixed) return `₹${valueFixed} OFF`;
    return 'REWARD';
  }, [valueType, valueFixed, valuePercent]);

  const formattedExpiry = useMemo(() => {
    if (!expiresAt) return null;
    const date = new Date(expiresAt);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }, [expiresAt]);

  const qrValue = useMemo(() => {
    return buildMemberQrPayload(userId);
  }, [userId]);

  const handleRevealQr = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsQrRevealed(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={brand.dark} />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <View style={styles.arrow} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Offer Details</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      {/* MAIN CONTENT SHEET */}
      <View style={styles.sheet}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        >
          {/* THE MAIN CARD */}
          <View style={styles.card}>
            
            {/* FULL WIDTH HERO IMAGE */}
            <View style={styles.heroContainer}>
              {img ? (
                <RemoteAssetImage uri={img} style={styles.heroImg} resizeMode="cover" />
              ) : (
                <View style={styles.heroFallback}>
                  <Text style={styles.fallbackText}>{title?.[0]?.toUpperCase() ?? 'O'}</Text>
                </View>
              )}
              {/* Floating Discount Badge */}
              <View style={styles.floatingBadge}>
                <Text style={styles.floatingBadgeText}>{discountHighlight}</Text>
              </View>
            </View>

            {/* CARD BODY */}
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{title}</Text>
              
              {shortDesc?.trim() ? (
                <Text style={styles.cardSub}>{shortDesc.trim()}</Text>
              ) : null}

              {/* INFO GRID */}
              <View style={styles.infoGrid}>
                {minOrder != null && (
                  <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>MIN. ORDER</Text>
                    <Text style={styles.infoValue}>₹{minOrder}</Text>
                  </View>
                )}
                {formattedExpiry && (
                  <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>VALID UNTIL</Text>
                    <Text style={[styles.infoValue, { color: '#E53935' }]}>{formattedExpiry}</Text>
                  </View>
                )}
              </View>

              {/* T&C Section */}
              {longDesc?.trim() ? (
                <View style={styles.tcSection}>
                  <Text style={styles.tcLabel}>Terms & Conditions</Text>
                  <Text style={styles.tcText}>{longDesc.trim()}</Text>
                </View>
              ) : null}

              {/* ACTION AREA (Button OR QR Code) */}
              <View style={styles.actionArea}>
                {!isQrRevealed ? (
                  <TouchableOpacity 
                    style={styles.revealBtn} 
                    activeOpacity={0.85}
                    onPress={handleRevealQr}
                  >
                    <Text style={styles.revealBtnText}>Use Coupon Now</Text>
                    <Text style={styles.revealBtnSub}>Show QR to the merchant</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.qrContainer}>
                    <View style={styles.qrInstructionBanner}>
                      <Text style={styles.qrInstructionText}>Scan this at the counter</Text>
                    </View>
                    <View style={styles.qrBox}>
                      <QRCode value={qrValue} size={200} color={brand.dark} backgroundColor="#FFFFFF" />
                    </View>
                    <Text style={styles.qrId} selectable>
                      MEMBER ID: {memberIdMasked(userId)}
                    </Text>
                  </View>
                )}
              </View>

            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: brand.dark },

  // Header
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: brand.surface, fontSize: 18, fontWeight: '800' },
  placeholder: { width: 40 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12, // Sharper radius
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

  // Background Sheet
  sheet: {
    flex: 1,
    backgroundColor: '#F4F6FB',
    borderTopLeftRadius: 24, // Reduced from 36
    borderTopRightRadius: 24,
  },
  content: { paddingHorizontal: 20, paddingTop: 24 },

  // Main Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16, // Sharper radius (was 24)
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    overflow: 'hidden',
  },

  // Hero Image Area (Full Width)
  heroContainer: {
    width: '100%',
    height: 190,
    backgroundColor: '#F0F1F7',
    position: 'relative',
  },
  heroImg: {
    width: '100%',
    height: '100%',
  },
  heroFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: brand.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontSize: 56,
    fontWeight: '900',
    color: '#D0D4E4',
  },
  
  floatingBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: brand.blue,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 7,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  floatingBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  // Card Body Content
  cardBody: {
    padding: 20,
  },
  cardTitle: { 
    fontSize: 22, 
    fontWeight: '900', 
    color: brand.cardHeading, 
    lineHeight: 28,
    marginBottom: 6,
  },
  cardSub: { 
    fontSize: 14, 
    color: brand.helperColor, 
    fontWeight: '500', 
    lineHeight: 20,
    marginBottom: 20,
  },

  // Info Grid
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#F8F9FB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEEF4',
  },
  infoBlock: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: brand.helperColor,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '800',
    color: brand.cardHeading,
  },

  // T&C Section
  tcSection: {
    marginBottom: 24,
  },
  tcLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: brand.cardHeading,
    marginBottom: 8,
  },
  tcText: {
    fontSize: 13,
    color: brand.helperColor,
    fontWeight: '500',
    lineHeight: 20,
  },

  // Action Area (Button vs QR)
  actionArea: {
    marginTop: 4,
  },
  revealBtn: {
    backgroundColor: brand.dark,
    borderRadius: 12, // Sharper radius
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revealBtnText: {
    color: brand.surface,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  revealBtnSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },

  // QR Display Mode
  qrContainer: {
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ECEEF4',
  },
  qrInstructionBanner: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 20,
  },
  qrInstructionText: {
    color: '#388E3C',
    fontSize: 13,
    fontWeight: '800',
  },
  qrBox: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECEEF4',
  },
  qrId: {
    marginTop: 20,
    fontSize: 12,
    fontWeight: '800',
    color: brand.helperColor,
    letterSpacing: 1,
  },
});