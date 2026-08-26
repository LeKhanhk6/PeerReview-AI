import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, User } from '../types';
import { api } from '@/lib/axios';

interface AuthActions {
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true, // Initially true because we need to hydrate
      error: null,

      setUser: (user) => set({ user, isAuthenticated: !!user, error: null }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      checkAuth: async () => {
        try {
          set({ isLoading: true, error: null });
          const user = await api.get('/auth/me') as unknown as User;
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          // 401 is expected if not logged in, don't set global error
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Logout failed:', error);
        } finally {
          set({ user: null, isAuthenticated: false, isLoading: false, error: null });
        }
      }
    }),
    {
      name: 'auth-storage', // Store in localStorage to prevent flashing
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }), // Only persist these
    }
  )
);
