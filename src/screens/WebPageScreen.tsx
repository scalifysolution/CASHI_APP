import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import type { RootStackParamList } from '../navigation/types';
import { brand } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'WebPage'>;

export function WebPageScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const webRef = useRef<WebView>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const title = useMemo(() => (route.params?.title || 'Web').trim(), [route.params?.title]);
  const url = useMemo(() => (route.params?.url || '').trim(), [route.params?.url]);

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
          {title}
        </Text>
        <TouchableOpacity
          onPress={() => {
            webRef.current?.reload();
            setReloadKey((k) => k + 1);
          }}
          style={styles.rightBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.rightBtnText}>Reload</Text>
        </TouchableOpacity>
      </View>

      {!url ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Missing URL.</Text>
        </View>
      ) : (
        <WebView
          key={reloadKey}
          ref={webRef}
          source={{ uri: url }}
          style={styles.webview}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={brand.blue} />
            </View>
          )}
          renderError={() => (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Couldn’t load this page.</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => {
                  webRef.current?.reload();
                  setReloadKey((k) => k + 1);
                }}
                activeOpacity={0.9}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
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
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: brand.surface,
    fontSize: 16,
    fontWeight: '800',
    paddingHorizontal: 10,
  },
  rightBtn: { width: 56, alignItems: 'flex-end' },
  rightBtnText: { color: brand.blue, fontSize: 13, fontWeight: '800' },
  webview: { flex: 1, backgroundColor: brand.background },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.background,
  },
  errorBox: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: brand.heroBody, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  retryBtn: {
    marginTop: 14,
    height: 42,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: brand.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: { color: brand.surface, fontSize: 13, fontWeight: '800' },
});

