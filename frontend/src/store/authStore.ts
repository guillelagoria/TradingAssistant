/**
 * Authentication Store
 * Global state management for authentication using Zustand
 */

import { create } from 'zustand';
import { toast } from 'sonner';
import type { AuthStore, User } from '@/types/auth';
import * as authService from '@/services/auth.service';

// Token storage keys
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

/**
 * Get tokens from localStorage
 */
const getStoredTokens = () => ({
  accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
  refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
});

/**
 * Get user from localStorage
 */
const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

/**
 * Store tokens in localStorage
 */
const storeTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

/**
 * Store user in localStorage
 */
const storeUser = (user: User) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Clear all auth data from localStorage
 */
const clearStorage = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  // State
  user: getStoredUser(),
  accessToken: getStoredTokens().accessToken,
  refreshToken: getStoredTokens().refreshToken,
  isAuthenticated: !!getStoredTokens().accessToken,
  isLoading: false,
  error: null,

  // Actions
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(email, password);

      // Store tokens and user
      storeTokens(response.accessToken, response.refreshToken);
      storeUser(response.user);

      set({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      toast.success('Login successful!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  register: async (email: string, password: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register(email, password, name);

      // Store tokens and user
      storeTokens(response.accessToken, response.refreshToken);
      storeUser(response.user);

      set({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      toast.success('Registration successful!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  logout: () => {
    // Call logout endpoint (optional, for server-side token invalidation)
    authService.logout().catch(() => {
      // Ignore errors, we're logging out anyway
    });

    // Clear all auth state
    clearStorage();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    });

    toast.info('Logged out successfully');
  },

  verifyEmail: async (token: string) => {
    set({ isLoading: true, error: null });
    try {
      await authService.verifyEmail(token);

      // Update user's emailVerified status
      const { user } = get();
      if (user) {
        const updatedUser = { ...user, emailVerified: true };
        storeUser(updatedUser);
        set({ user: updatedUser });
      }

      set({ isLoading: false });
      toast.success('Email verified successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Email verification failed';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  requestPasswordReset: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      await authService.requestPasswordReset(email);
      set({ isLoading: false });
      toast.success('Password reset email sent!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset email';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  resetPassword: async (token: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      await authService.resetPassword(token, password);
      set({ isLoading: false });
      toast.success('Password reset successful!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Password reset failed';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    set({ isLoading: true, error: null });
    try {
      await authService.changePassword(currentPassword, newPassword);
      set({ isLoading: false });
      toast.success('Password changed successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Password change failed';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  refreshAccessToken: async () => {
    const { refreshToken } = get();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await authService.refreshToken(refreshToken);

      // Update tokens
      storeTokens(response.accessToken, response.refreshToken);

      set({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });
    } catch (error: any) {
      // If refresh fails, logout user
      get().logout();
      throw error;
    }
  },

  loadUserFromToken: async () => {
    const { accessToken } = get();
    if (!accessToken) {
      set({ isLoading: false });
      return null;
    }

    set({ isLoading: true });
    try {
      const user = await authService.getCurrentUser();
      storeUser(user);
      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch (error: any) {
      // Token might be invalid or expired, try to refresh
      try {
        await get().refreshAccessToken();
        const user = await authService.getCurrentUser();
        storeUser(user);
        set({ user, isAuthenticated: true, isLoading: false });
        return user;
      } catch {
        // Both attempts failed, logout
        get().logout();
        set({ isLoading: false });
        return null;
      }
    }
  },

  checkAuth: () => {
    const { accessToken, user } = get();
    return !!accessToken && !!user;
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },
}));
