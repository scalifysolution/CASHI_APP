import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

interface CameraKitModuleSpec extends TurboModule {
  requestDeviceCameraAuthorization: () => Promise<boolean>;
  checkDeviceCameraAuthorizationStatus: () => Promise<boolean>;
}

// iOS: implemented by `react-native-camera-kit`
// Android: currently not implemented by the library (use PermissionsAndroid instead)
export const CameraKitModule = TurboModuleRegistry.get<CameraKitModuleSpec>('RNCameraKitModule') ?? null;

