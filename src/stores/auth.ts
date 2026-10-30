import { create } from 'zustand';

import { api, ApiUser, setToken } from '@/src/lib/api';

export type AuthStatus = 'booting' | 'guest' | 'authenticated' | 'signedOut';

interface AuthState {
  status: AuthStatus;
  user: ApiUser | null;
  bootstrap: (locale?: string) => Promise<void>;
  login: (login: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    username: string;
    email: string;
    password: string;
    password_confirmation: string;
    locale?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  setUser: (user: ApiUser) => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  status: 'booting',
  user: null,

  bootstrap: async (locale) => {
    try {
      const { token, user } = await api.auth.device(locale);
      await setToken(token);
      set({ user, status: user.is_guest ? 'guest' : 'authenticated' });
    } catch {
      // offline or API down — allow browsing with no session
      set({ status: 'signedOut', user: null });
    }
  },

  login: async (login, password) => {
    const { token, user } = await api.auth.login(login, password);
    await setToken(token);
    set({ user, status: 'authenticated' });
  },

  register: async (input) => {
    const { token, user } = await api.auth.register(input);
    await setToken(token);
    set({ user, status: 'authenticated' });
  },

  logout: async () => {
    try {
      await api.auth.logout();
    } finally {
      await setToken(null);
      set({ status: 'signedOut', user: null });
    }
  },

  refreshMe: async () => {
    const user = await api.me.get();
    set({ user });
  },

  setUser: (user) => set({ user }),
}));
