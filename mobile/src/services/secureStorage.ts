import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { User } from '../types';

const TOKEN_KEY = 'sobda.token';
const USER_KEY = 'sobda.user';

// SecureStore has no web implementation. On web (dev/testing only) fall back to localStorage,
// which is NOT secure storage; the shipped Android/iOS builds always use the keychain/Keystore.
const kv = {
  set: async (k: string, v: string) =>
    Platform.OS === 'web' ? void localStorage.setItem(k, v) : SecureStore.setItemAsync(k, v),
  get: async (k: string) =>
    Platform.OS === 'web' ? localStorage.getItem(k) : SecureStore.getItemAsync(k),
  del: async (k: string) =>
    Platform.OS === 'web' ? void localStorage.removeItem(k) : SecureStore.deleteItemAsync(k),
};

// The session lives in the OS keychain (iOS) / Keystore-backed storage (Android),
// never in AsyncStorage. Values are small, well under SecureStore's per-item limit.
export async function saveSession(token: string, user: User): Promise<void> {
  await kv.set(TOKEN_KEY, token);
  await kv.set(USER_KEY, JSON.stringify(user));
}

export async function loadSession(): Promise<{ token: string; user: User } | null> {
  try {
    const [token, rawUser] = await Promise.all([
      kv.get(TOKEN_KEY),
      kv.get(USER_KEY),
    ]);
    if (!token || !rawUser) return null;
    return { token, user: JSON.parse(rawUser) as User };
  } catch {
    return null;
  }
}

export async function getToken(): Promise<string | null> {
  try {
    return await kv.get(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    kv.del(TOKEN_KEY),
    kv.del(USER_KEY),
  ]);
}
