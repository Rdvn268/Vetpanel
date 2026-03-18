import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem('vetpanel_token', token);
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem('vetpanel_token');
        set({ user: null, token: null });
      },
    }),
    { name: 'vetpanel-auth', partialize: (state) => ({ user: state.user, token: state.token }) }
  )
);
