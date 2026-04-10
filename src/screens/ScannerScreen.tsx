import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  PermissionsAndroid,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera } from 'react-native-camera-kit';
import { brand } from '../theme';

export function ScannerScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [hasPermission, setHasPermission] = useState(Platform.OS === 'ios');
  const [hasScanned, setHasScanned] = useState(false);

  const close = useCallback(() => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }
    // If scanner is opened as a Tab screen, go back to Home.
    navigation?.navigate?.('Home');
  }, [navigation]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA).then((granted) => {
      setHasPermission(Boolean(granted));
    });
  }, []);

  const handleInvalid = useCallback(() => {
    Alert.alert('Invalid QR', 'Please scan a valid Cashi QR.', [
      {
        text: 'Close',
        onPress: close,
      },
    ]);
  }, [close]);

  const onReadCode = useCallback(
    (event: any) => {
      if (hasScanned) return;
      const raw =
        event?.nativeEvent?.codeStringValue ??
        event?.nativeEvent?.codeStringValue ??
        event?.codeStringValue ??
        '';
      const text = String(raw || '').trim();
      if (!text) return;

      setHasScanned(true);

      let payload: any = null;
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }

      const app = String(payload?.app ?? '').toLowerCase();
      const link = typeof payload?.link === 'string' ? payload.link.trim() : '';

      if (app !== 'cashi' || !link) {
        handleInvalid();
        setTimeout(close, 350);
        return;
      }

      void Linking.openURL(link)
        .catch(() => {})
        .finally(() => {
          close();
        });
    },
    [close, handleInvalid, hasScanned],
  );

  const permissionTitle = useMemo(() => {
    if (Platform.OS === 'android') return 'Camera permission required';
    return 'Camera permission required';
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {hasPermission ? (
        <Camera
          style={StyleSheet.absoluteFill}
          cameraType="back"
          scanBarcode
          onReadCode={onReadCode}
          showFrame={false}
          laserColor="transparent"
          frameColor="transparent"
        />
      ) : (
        <View style={styles.permissionWrap}>
          <Text style={styles.permissionTitle}>{permissionTitle}</Text>
          <Text style={styles.permissionBody}>
            Enable camera access to scan QR codes.
          </Text>
          {Platform.OS === 'android' ? (
            <TouchableOpacity
              style={styles.permissionBtn}
              activeOpacity={0.85}
              onPress={async () => {
                const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
                setHasPermission(res === PermissionsAndroid.RESULTS.GRANTED);
              }}>
              <Text style={styles.permissionBtnText}>Allow camera</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={close} style={styles.closeBtn} activeOpacity={0.85}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Overlay frame (only when camera is visible) */}
      {hasPermission ? (
        <View pointerEvents="none" style={styles.overlay}>
          <View style={styles.maskRow} />
          <View style={styles.middleRow}>
            <View style={styles.maskSide} />
            <View style={styles.scanBox}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
            </View>
            <View style={styles.maskSide} />
          </View>
          <View style={styles.maskRow} />
        </View>
      ) : null}
    </View>
  );
}

const CORNER = 22;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },

  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  closeText: { color: brand.surface, fontSize: 18, fontWeight: '700' },

  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  maskRow: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  maskSide: {
    width: 999,
    height: 260,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  scanBox: {
    width: 260,
    height: 260,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  // Permission fallback
  permissionWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#0B1020',
  },
  permissionTitle: { color: brand.surface, fontSize: 18, fontWeight: '900', textAlign: 'center' },
  permissionBody: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  permissionBtn: {
    marginTop: 16,
    backgroundColor: brand.blue,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  permissionBtnText: { color: brand.surface, fontSize: 13, fontWeight: '900' },

  cornerTL: {
    position: 'absolute',
    left: 18,
    top: 18,
    width: CORNER,
    height: CORNER,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    borderColor: brand.blue,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    position: 'absolute',
    right: 18,
    top: 18,
    width: CORNER,
    height: CORNER,
    borderRightWidth: 3,
    borderTopWidth: 3,
    borderColor: brand.blue,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    position: 'absolute',
    left: 18,
    bottom: 18,
    width: CORNER,
    height: CORNER,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderColor: brand.blue,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: CORNER,
    height: CORNER,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: brand.blue,
    borderBottomRightRadius: 8,
  },
});

