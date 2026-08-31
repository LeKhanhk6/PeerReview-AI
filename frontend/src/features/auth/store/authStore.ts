import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, User } from '../types';
import { api } from '@/lib/axios';
import { queryClient } from '@/lib/queryClient';

interface AuthActions {
  setAuth: (user: User | null, token: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  updateUser: (updatedUser: Partial<User>) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true, // Initially true because we need to hydrate
      error: null,

      setAuth: (user, token) => set({ user, token, isAuthenticated: !!user, error: null }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        })),

      checkAuth: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.get('/auth/me') as any;
          const user = response.user;
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          // 401 is expected if not logged in, don't set global error
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
          // Clear query cache to prevent stale data leaking from expired session
          queryClient.clear();
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Logout failed:', error);
        } finally {
          set({ user: null, token: null, isAuthenticated: false, isLoading: false, error: null });
          // Clear query cache to prevent data leaking between users
          queryClient.clear();
        }
      }
    }),
    {
      name: 'auth-storage', // Store in localStorage to prevent flashing
      partialize: (state) => ({ user: state.user, token: state.token as any, isAuthenticated: state.isAuthenticated }), // Only persist these
    }
  )
);
