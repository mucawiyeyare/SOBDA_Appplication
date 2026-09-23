import { create } from 'zustand';
import { authApi } from '../api/auth';
import { setUnauthorizedHandler } from '../api/client';
import { unregisterPush } from '../services/push';
import { clearSession, loadSession, saveSession } from '../services/secureStorage';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  /** true until the persisted session has been read from secure storage */
  hydrating: boolean;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  setSession: (token: string, user: User) => Promise<void>;
  updateUser: (patch: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  hydrating: true,

  hydrate: async () => {
    const session = await loadSession();
    set({ user: session?.user ?? null, token: session?.token ?? null, hydrating: false });
  },

  login: async (email, password) => {
    const res = await authApi.login(email, password);
    if (!res.token) throw new Error('Login failed. Please try again.');
    await get().setSession(res.token, res.user);
  },

  setSession: async (token, user) => {
    await saveSession(token, user);
    set({ token, user });
  },

  updateUser: async (patch) => {
    const { user, token } = get();
    if (!user || !token) return;
    const next = { ...user, ...patch };
    await saveSession(token, next);
    set({ user: next });
  },

  logout: async () => {
    // Each cleanup step is best-effort: a storage or network hiccup here must never leave the
    // user stuck signed in with no way out, so state is always cleared no matter what fails above.
    try {
      await unregisterPush(); // must run first, while the token still exists for the API call
    } catch (e) {
      if (__DEV__) console.warn('Push unregister failed during logout:', e);
    }
    try {
      await clearSession();
    } catch (e) {
      if (__DEV__) console.warn('Clearing stored session failed during logout:', e);
    }
    set({ user: null, token: null });
  },
}));

// Any authenticated request that comes back 401 (expired/invalid token) ends the session.
setUnauthorizedHandler(() => {
  if (useAuthStore.getState().token) void useAuthStore.getState().logout();
});
