import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'cashi.auth.accessToken';

export async function loadAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function saveAccessToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearAccessToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

