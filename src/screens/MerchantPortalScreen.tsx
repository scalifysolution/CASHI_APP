import React from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MERCHANT_PORTAL_URL } from '../config/env';
import type { RootStackParamList } from '../navigation/types';
import { brand } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MerchantPortal'>;
};

export function MerchantPortalScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const url = (MERCHANT_PORTAL_URL || '').trim();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backCircle}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <View style={styles.backArrow} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Merchant portal
        </Text>
        <View style={styles.placeholder} />
      </View>

      {!url ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Set MERCHANT_PORTAL_URL in your .env file (see .env.example).</Text>
        </View>
      ) : (
        <WebView
          source={{ uri: url }}
          style={styles.webview}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={brand.blue} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: brand.dark },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
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
  headerTitle: { flex: 1, textAlign: 'center', color: brand.surface, fontSize: 16, fontWeight: '800' },
  placeholder: { width: 40 },
  webview: { flex: 1, backgroundColor: brand.background },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.background,
  },
  errorBox: { flex: 1, padding: 24, justifyContent: 'center' },
  errorText: { color: brand.heroBody, fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
