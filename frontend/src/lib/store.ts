import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './supabase';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  clinic: { id: string; name: string; logo?: string };
}

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      setAuth: (user, token) => {
        localStorage.setItem('vetpanel_token', token);
        set({ user, token });
      },

      logout: async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('vetpanel_token');
        set({ user: null, token: null });
        window.location.href = '/login';
      },

      refreshToken: async () => {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const newToken = data.session.access_token;
          localStorage.setItem('vetpanel_token', newToken);
          set({ token: newToken });
          return newToken;
        }
        return null;
      },
    }),
    {
      name: 'vetpanel-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
