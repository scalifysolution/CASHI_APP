import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@cashi/customer_pinned_location';

export type CustomerPinnedLocation = {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  shortLabel: string;
};

export async function getCustomerPinnedLocation(): Promise<CustomerPinnedLocation | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Record<string, unknown>;
    if (typeof p.latitude !== 'number' || typeof p.longitude !== 'number') return null;
    const formattedAddress = String(p.formattedAddress ?? '');
    const shortLabel = String(p.shortLabel ?? '');
    return {
      latitude: p.latitude,
      longitude: p.longitude,
      formattedAddress: formattedAddress || shortLabel,
      shortLabel: shortLabel || formattedAddress || 'Saved location',
    };
  } catch {
    return null;
  }
}

export async function setCustomerPinnedLocation(
  value: CustomerPinnedLocation | null,
): Promise<void> {
  if (!value) {
    await AsyncStorage.removeItem(KEY);
    return;
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(value));
}
