import AsyncStorage from '@react-native-async-storage/async-storage';

export type StoredUserProfile = {
  displayName?: string;
  email?: string;
  phone?: string;
  referenceCode?: string;
  profileComplete?: boolean;
};

const PROFILE_KEY = 'cashi.user.profile';

export async function loadUserProfile(): Promise<StoredUserProfile | null> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUserProfile;
  } catch {
    return null;
  }
}

export async function saveUserProfile(profile: StoredUserProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function clearUserProfile(): Promise<void> {
  await AsyncStorage.removeItem(PROFILE_KEY);
}

