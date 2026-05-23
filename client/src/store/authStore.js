import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../api/auth.js';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Login action
      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const { data } = await authAPI.login(credentials);
          localStorage.setItem('token', data.token);
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          if (error.response?.data?.needsVerification) {
            return {
              success: false,
              needsVerification: true,
              email: error.response.data.email,
              message: error.message
            };
          }
          return { success: false, message: error.message };
        }
      },

      // Register action
      register: async (userData) => {
        set({ isLoading: true });
        try {
          const { data } = await authAPI.register(userData);
          if (data.needsVerification) {
            set({ isLoading: false });
            return { success: true, needsVerification: true, email: data.email };
          }
          localStorage.setItem('token', data.token);
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, message: error.message };
        }
      },

      // Verify Email action
      verifyEmail: async (email, otp) => {
        set({ isLoading: true });
        try {
          const { data } = await authAPI.verifyEmail({ email, otp });
          localStorage.setItem('token', data.token);
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, message: error.message };
        }
      },

      // Resend Verification action
      resendVerification: async (email) => {
        set({ isLoading: true });
        try {
          const { data } = await authAPI.resendVerification({ email });
          set({ isLoading: false });
          return { success: true, message: data.message };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, message: error.message };
        }
      },

      // Logout action
      logout: async () => {
        try {
          await authAPI.logout();
        } catch (error) {
          console.error('Server logout failed:', error);
        }
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      // Update Profile
      updateProfile: async (profileData) => {
        set({ isLoading: true });
        try {
          const { data } = await authAPI.updateProfile(profileData);
          set({ user: data.user, isLoading: false });
          return { success: true, message: data.message };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, message: error.message };
        }
      },

      // Change Password
      changePassword: async (passwordData) => {
        set({ isLoading: true });
        try {
          const { data } = await authAPI.changePassword(passwordData);
          set({ isLoading: false });
          return { success: true, message: data.message };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, message: error.message };
        }
      },

      // Refresh user data
      refreshUser: async () => {
        try {
          const { data } = await authAPI.getMe();
          set({ user: data.user });
        } catch {
          get().logout();
        }
      },

      // Update user in state after profile update
      updateUser: (updates) => {
        set((state) => ({ user: { ...state.user, ...updates } }));
      },

      // Role helpers
      isAdmin: () => get().user?.role === 'admin',
      isManager: () => ['admin', 'manager'].includes(get().user?.role),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
