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
import { CameraKitModule } from '../native/CameraKitModule';
import { useAppSelector } from '../store/hooks';
import { brand } from '../theme';

export function ScannerScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const userId = useAppSelector((s) => s.user.id);
  const displayName = useAppSelector((s) => s.user.displayName);
  const phone = useAppSelector((s) => s.user.phone);
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);
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
    let cancelled = false;

    const run = async () => {
      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
          if (!cancelled) setHasPermission(Boolean(granted));
          return;
        }

        if (!CameraKitModule) {
          if (!cancelled) {
            setHasPermission(false);
            setPermissionChecked(true);
          }
          return;
        }

        // iOS: check current status; request once when entering scanner.
        const granted = await CameraKitModule.checkDeviceCameraAuthorizationStatus();
        if (!cancelled) setHasPermission(Boolean(granted));
        if (!granted) {
          const requested = await CameraKitModule.requestDeviceCameraAuthorization();
          if (!cancelled) setHasPermission(Boolean(requested));
        }
      } catch {
        if (!cancelled) setHasPermission(false);
      } finally {
        if (!cancelled) setPermissionChecked(true);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const openAppSettings = useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch {
      // Fallback for older RN / platforms
      await Linking.openURL('app-settings:');
    }
  }, []);

  const handleInvalid = useCallback(() => {
    Alert.alert('Invalid QR', 'Please scan a valid Cashi QR.', [
      {
        text: 'Close',
        onPress: close,
      },
    ]);
  }, [close]);

  const buildReviewLinkWithUser = useCallback(
    (rawLink: string) => {
      try {
        const url = new URL(rawLink);
        const pathname = (url.pathname || '').toLowerCase();
        if (pathname !== '/review') return null;
        if (!url.searchParams.get('shopId') || !url.searchParams.get('category')) {
          return null;
        }
        if (userId) url.searchParams.set('userId', userId);
        if (displayName?.trim()) url.searchParams.set('name', displayName.trim());
        if (phone?.trim()) url.searchParams.set('phone', phone.trim());
        return url.toString();
      } catch {
        return null;
      }
    },
    [displayName, phone, userId],
  );

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
      const directReviewLink = buildReviewLinkWithUser(text);
      const payloadReviewLink = link ? buildReviewLinkWithUser(link) : null;

      if (directReviewLink) {
        navigation.navigate('WebPage', {
          title: 'Review',
          url: directReviewLink,
        });
        setTimeout(close, 150);
        return;
      }

      if (app !== 'cashi' || !link) {
        handleInvalid();
        setTimeout(close, 350);
        return;
      }

      if (payloadReviewLink) {
        navigation.navigate('WebPage', {
          title: 'Review',
          url: payloadReviewLink,
        });
        setTimeout(close, 150);
        return;
      }

      Linking.openURL(link)
        .catch(() => {})
        .finally(() => {
          close();
        });
    },
    [buildReviewLinkWithUser, close, handleInvalid, hasScanned, navigation],
  );

  const permissionTitle = useMemo(() => {
    if (Platform.OS === 'android') return 'Camera permission required';
    return 'Camera permission required';
  }, []);

  const requestAndroidPermission = useCallback(async () => {
    const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
    if (res === PermissionsAndroid.RESULTS.GRANTED) {
      setHasPermission(true);
      return;
    }

    setHasPermission(false);

    if (res === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      Alert.alert('Camera permission blocked', 'Enable camera access in Settings to scan QR codes.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: openAppSettings },
      ]);
    }
  }, [openAppSettings]);

  const requestIosPermission = useCallback(async () => {
    try {
      if (!CameraKitModule) {
        setHasPermission(false);
        setPermissionChecked(true);
        return;
      }

      const requested = await CameraKitModule.requestDeviceCameraAuthorization();
      setHasPermission(Boolean(requested));
      setPermissionChecked(true);

      if (!requested) {
        Alert.alert('Camera permission denied', 'Enable camera access in Settings to scan QR codes.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: openAppSettings },
        ]);
      }
    } catch {
      setHasPermission(false);
      setPermissionChecked(true);
    }
  }, [openAppSettings]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {hasPermission ? (
        <Camera
          style={StyleSheet.absoluteFill}
          cameraType="back"
          scanBarcode
          onReadCode={onReadCode}
          onError={(e) => {
            const msg = e?.nativeEvent?.errorMessage || 'Camera failed to initialize.';
            Alert.alert('Camera error', msg, [
              { text: 'Close', onPress: close },
              { text: 'Open Settings', onPress: openAppSettings },
            ]);
          }}
          showFrame={false}
          laserColor="transparent"
          frameColor="transparent"
        />
      ) : (
        <View style={styles.permissionWrap}>
          <Text style={styles.permissionTitle}>{permissionTitle}</Text>
          <Text style={styles.permissionBody}>
            {permissionChecked ? 'Enable camera access to scan QR codes.' : 'Checking camera permission…'}
          </Text>
          {Platform.OS === 'android' ? (
            <TouchableOpacity
              style={styles.permissionBtn}
              activeOpacity={0.85}
              onPress={requestAndroidPermission}>
              <Text style={styles.permissionBtnText}>Allow camera</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.permissionBtn}
              activeOpacity={0.85}
              onPress={requestIosPermission}>
              <Text style={styles.permissionBtnText}>Allow camera</Text>
            </TouchableOpacity>
          )}
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

