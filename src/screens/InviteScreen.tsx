import React from 'react';
import {
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

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Invite'>;
};

const REFERRAL_CODE = 'CASHI-ABH12';

export function InviteScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

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

        <Text style={styles.heroLine}>Invite friends.{'\n'}You both earn rewards.</Text>
      </View>

      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={[styles.body, { paddingBottom: insets.bottom + 32 }]}>
          <Text style={styles.label}>Your referral code</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{REFERRAL_CODE}</Text>
          </View>
          <Text style={styles.hint}>
            When a friend joins with your code, you earn bonus coins and they get a welcome perk.
          </Text>
          <TouchableOpacity activeOpacity={0.9} style={styles.shareBtn}>
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
  shareBtnText: { color: brand.surface, fontSize: 16, fontWeight: '800' },
});
