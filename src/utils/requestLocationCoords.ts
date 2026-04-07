import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform } from 'react-native';

export type Coords = { latitude: number; longitude: number };
export type LocationCoordsResult = {
  coords: Coords | null;
  permissionDenied: boolean;
};

/**
 * Requests permission and returns one location fix with permission status.
 */
export async function requestLocationCoords(): Promise<LocationCoordsResult> {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      return { coords: null, permissionDenied: true };
    }
  }

  return new Promise((resolve) => {
    Geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          coords: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          },
          permissionDenied: false,
        });
      },
      (error) => {
        // 1 = permission denied on iOS / runtime layer.
        if (error?.code === 1) {
          resolve({ coords: null, permissionDenied: true });
          return;
        }
        resolve({ coords: null, permissionDenied: false });
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 60000,
      },
    );
  });
}
