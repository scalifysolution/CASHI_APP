import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback } from 'react';
import {
  Alert,
  Linking,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { brand } from '../theme';
import { useStore } from 'react-redux';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchMe } from '../store/authSlice';
import { setUser, type UserState } from '../store/userSlice';
import { saveUserProfile } from '../store/userStorage';
import { flattenMeResponse } from '../utils/mePayload';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Invite'>;
};

const DOWNLOAD_URL = 'https://console.shopview.net/web/download_cashi';

export function InviteScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const store = useStore();
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const referralCode = useAppSelector((s) => s.user.referenceCode);

  useFocusEffect(
    useCallback(() => {
      if (!accessToken) return;
      void dispatch(fetchMe(accessToken))
        .unwrap()
        .then((raw) => {
          const p = flattenMeResponse(raw);
          const r = p.referralCode ?? p.referral_code;
          if (typeof r === 'string' && r.trim().length > 0) {
            const code = r.trim();
            dispatch(setUser({ referenceCode: code }));
            const u = (store.getState() as { user: UserState }).user;
            void saveUserProfile({
              displayName: u.displayName,
              email: u.email,
              phone: u.phone,
              referenceCode: code,
              profileComplete: u.profileComplete,
            });
          }
        })
        .catch(() => {});
    }, [accessToken, dispatch]),
  );

  const shareInvite = async () => {
    if (!referralCode?.trim()) {
      Alert.alert(
        'Referral code',
        'We could not load your code yet. Pull to refresh on Home or sign in again.',
      );
      return;
    }
    const code = referralCode.trim();
    const message = `Please download the Cashi app using this link:\n${DOWNLOAD_URL}\n\nUse my referral code: ${code}\n\nYou will get 500 Cashi Points and I will also receive 500 Cashi Points when you sign up using this referral code.`;
    try {
      // Prefer WhatsApp with prefilled message.
      const encoded = encodeURIComponent(message);
      try {
        await Linking.openURL(`whatsapp://send?text=${encoded}`);
        return;
      } catch {
        // Fallback: opens WhatsApp if installed, else browser.
        await Linking.openURL(`https://wa.me/?text=${encoded}`);
        return;
      }
    } catch {
      // Fallback to native share sheet
      try {
        await Share.share({ message, title: 'Invite to Cashi' });
      } catch {
        // ignore
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backCircle}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <View style={styles.backArrow} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invite</Text>
          <View style={styles.placeholder} />
        </View>

        <Text style={styles.heroLine}>Invite friends.{'\n'}Get rewarded.</Text>
      </View>

      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={[styles.body, { paddingBottom: insets.bottom + 32 }]}>
          <Text style={styles.label}>Your referral code</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText} selectable>
              {referralCode?.trim() ? referralCode.trim() : '—'}
            </Text>
          </View>
          <Text style={styles.hint}>
            Share your code on WhatsApp. When your friend signs up with it, you both get 500 Cashi Points.
          </Text>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.shareBtn, !referralCode?.trim() && styles.shareBtnDisabled]}
            onPress={shareInvite}
            disabled={!referralCode?.trim()}>
            <Text style={styles.shareBtnText}>Share invite</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: brand.dark },
  header: { paddingHorizontal: 24, paddingBottom: 28 },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderColor: brand.surface,
    transform: [{ rotate: '-45deg' }],
    marginLeft: 4,
  },
  headerTitle: { color: brand.surface, fontSize: 16, fontWeight: '700' },
  placeholder: { width: 40 },
  heroLine: {
    color: brand.surface,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    letterSpacing: -0.5,
  },

  sheet: {
    flex: 1,
    backgroundColor: brand.background,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -14,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#E0E2EE',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 14,
  },
  body: { paddingHorizontal: 24, paddingTop: 8 },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: brand.cardBody,
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  codeBox: {
    backgroundColor: brand.surface,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#F0F1F7',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  codeText: {
    fontSize: 22,
    fontWeight: '900',
    color: brand.cardHeading,
    letterSpacing: 2,
  },
  hint: {
    marginTop: 18,
    fontSize: 14,
    color: brand.cardBody,
    fontWeight: '500',
    lineHeight: 21,
  },
  shareBtn: {
    marginTop: 28,
    backgroundColor: brand.blue,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  shareBtnDisabled: {
    opacity: 0.45,
  },
  shareBtnText: { color: brand.surface, fontSize: 16, fontWeight: '800' },
});
