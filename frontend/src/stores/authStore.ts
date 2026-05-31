import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean | null;

  checkInitialization: () => Promise<boolean | null>;
  setupAdmin: (
    username: string,
    password: string,
    confirmPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: null,

      checkInitialization: async () => {
        try {
          const response = await api.get('/auth/check-initialization');
          const initialized = response.data.data.initialized;
          set({ isInitialized: initialized });
          return initialized;
        } catch (error) {
          console.error('Check initialization error:', error);
          return null;
        }
      },

      setupAdmin: async (username, password, confirmPassword) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/setup-admin', {
            username,
            password,
            confirmPassword
          });
          const { token, refreshToken, user } = response.data.data;

          localStorage.setItem('refreshToken', refreshToken);

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true
          });

          return { success: true };
        } catch (error: unknown) {
          set({ isLoading: false });
          const axiosError = error as { response?: { data?: { error?: string } } };
          return {
            success: false,
            error: axiosError.response?.data?.error || 'Setup failed'
          };
        }
      },

      login: async (username, password) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/login', {
            username,
            password
          });
          const { token, refreshToken, user } = response.data.data;

          localStorage.setItem('refreshToken', refreshToken);

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          });

          return { success: true };
        } catch (error: unknown) {
          set({ isLoading: false });
          const axiosError = error as { response?: { data?: { error?: string } } };
          return {
            success: false,
            error: axiosError.response?.data?.error || 'Login failed'
          };
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Logout error:', error);
        }

        localStorage.removeItem('refreshToken');
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
      },

      checkAuth: async () => {
        const token = get().token;
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }

        try {
          const response = await api.get('/auth/me');
          set({
            user: response.data.data,
            isAuthenticated: true
          });
        } catch (_error) {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              const response = await api.post('/auth/refresh', {
                refreshToken
              });
              const { token } = response.data.data;

              set({ token });

              const userResponse = await api.get('/auth/me');
              set({
                user: userResponse.data.data,
                isAuthenticated: true
              });
            } catch (_refreshError) {
              localStorage.removeItem('refreshToken');
              set({
                user: null,
                token: null,
                isAuthenticated: false
              });
            }
          } else {
            set({
              user: null,
              token: null,
              isAuthenticated: false
            });
          }
        }
      },

      setToken: token => set({ token })
    }),
    {
      name: 'auth-storage',
      partialize: state => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
