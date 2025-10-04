/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { api } from './api';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  VerifyEmailRequest,
  RequestPasswordResetRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  RefreshTokenRequest,
  User,
} from '@/types/auth';

/**
 * Login with email and password
 */
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const payload: LoginRequest = { email, password };
  const response = await api.post<{ success: boolean; data: AuthResponse }>('/api/auth/login', payload);
  return response.data.data;
};

/**
 * Register a new user
 */
export const register = async (
  email: string,
  password: string,
  name: string
): Promise<AuthResponse> => {
  const payload: RegisterRequest = { email, password, name };
  const response = await api.post<{ success: boolean; data: AuthResponse }>('/api/auth/register', payload);
  return response.data.data;
};

/**
 * Verify email with token
 */
export const verifyEmail = async (token: string): Promise<{ message: string }> => {
  const payload: VerifyEmailRequest = { token };
  const response = await api.post<{ message: string }>('/api/auth/verify-email', payload);
  return response.data;
};

/**
 * Request password reset email
 */
export const requestPasswordReset = async (email: string): Promise<{ message: string }> => {
  const payload: RequestPasswordResetRequest = { email };
  const response = await api.post<{ message: string }>(
    '/api/auth/request-password-reset',
    payload
  );
  return response.data;
};

/**
 * Reset password with token
 */
export const resetPassword = async (
  token: string,
  password: string
): Promise<{ message: string }> => {
  const payload: ResetPasswordRequest = { token, password };
  const response = await api.post<{ message: string }>('/api/auth/reset-password', payload);
  return response.data;
};

/**
 * Change password for authenticated user
 */
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> => {
  const payload: ChangePasswordRequest = { currentPassword, newPassword };
  const response = await api.post<{ message: string }>('/api/auth/change-password', payload);
  return response.data;
};

/**
 * Refresh access token using refresh token
 */
export const refreshToken = async (refreshToken: string): Promise<AuthResponse> => {
  const payload: RefreshTokenRequest = { refreshToken };
  const response = await api.post<{ success: boolean; data: AuthResponse }>('/api/auth/refresh-token', payload);
  return response.data.data;
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<{ success: boolean; data: User }>('/api/auth/me');
  return response.data.data;
};

/**
 * Logout (optional - mainly for server-side token invalidation)
 */
export const logout = async (): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/api/auth/logout');
  return response.data;
};

/**
 * Resend verification email
 */
export const resendVerificationEmail = async (): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/api/auth/resend-verification');
  return response.data;
};
