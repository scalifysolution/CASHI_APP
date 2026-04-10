import React, { useMemo } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MERCHANT_PORTAL_URL } from '../config/env';
import type { RootStackParamList } from '../navigation/types';
import { brand } from '../theme';
import { useAppSelector } from '../store/hooks';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MerchantPortal'>;
};

export function MerchantPortalScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const baseUrl = (MERCHANT_PORTAL_URL || '').trim().replace(/\/+$/, '');
  const token = useAppSelector((s) => s.auth.accessToken);
  const user = useAppSelector((s) => s.user);

  const url = useMemo(() => {
    if (!baseUrl) return '';
    return `${baseUrl}/login?fromApp=1`;
  }, [baseUrl]);

  const injected = useMemo(() => {
    const safeToken = token ? JSON.stringify(token) : '""';
    const profile = {
      id: user?.id ?? null,
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      name: user?.displayName ?? '',
      role: user?.role ?? '',
    };
    const safeProfile = JSON.stringify(profile);

    return `
      (function () {
        try {
          if (${safeToken} && ${safeToken}.length > 0) {
            localStorage.setItem('cashi_access_token', ${safeToken});
          }
          localStorage.setItem('cashi_app_profile', ${JSON.stringify(safeProfile)});
        } catch (e) {}
      })();
      true;
    `;
  }, [token, user?.id, user?.email, user?.phone, user?.displayName, user?.role]);

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
          javaScriptEnabled
          domStorageEnabled
          injectedJavaScriptBeforeContentLoaded={injected}
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
