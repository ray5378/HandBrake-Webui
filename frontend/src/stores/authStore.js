import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: async (username, password) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/login', { username, password });
          const { token, refreshToken, user } = response.data.data;
          
          localStorage.setItem('refreshToken', refreshToken);
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          });
          
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            error: error.response?.data?.error || 'Login failed'
          };
        }
      },
      
      register: async (username, password) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/register', { username, password });
          const { token, refreshToken, user } = response.data.data;
          
          localStorage.setItem('refreshToken', refreshToken);
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          });
          
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            error: error.response?.data?.error || 'Registration failed'
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
        } catch (error) {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              const response = await api.post('/auth/refresh', { refreshToken });
              const { token } = response.data.data;
              
              set({ token });
              
              const userResponse = await api.get('/auth/me');
              set({
                user: userResponse.data.data,
                isAuthenticated: true
              });
            } catch (refreshError) {
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
      
      setToken: (token) => set({ token })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
