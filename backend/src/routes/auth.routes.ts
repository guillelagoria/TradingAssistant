import { Router } from 'express';
import {
  register,
  login,
  logout,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  changePassword,
  refreshToken,
  me,
  resendVerification
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import {
  registerValidation,
  loginValidation,
  verifyEmailValidation,
  requestPasswordResetValidation,
  resetPasswordValidation,
  changePasswordValidation,
  refreshTokenValidation,
  resendVerificationValidation
} from '../middleware/authValidation';

const router = Router();

/**
 * Public routes - No authentication required
 */

// Register new user
router.post('/register', registerValidation, register);

// Login user
router.post('/login', loginValidation, login);

// Verify email with token
router.post('/verify-email', verifyEmailValidation, verifyEmail);

// Request password reset
router.post('/request-password-reset', requestPasswordResetValidation, requestPasswordReset);

// Reset password with token
router.post('/reset-password', resetPasswordValidation, resetPassword);

// Refresh access token
router.post('/refresh-token', refreshTokenValidation, refreshToken);

// Resend verification email
router.post('/resend-verification', resendVerificationValidation, resendVerification);

/**
 * Protected routes - Authentication required
 */

// Get current user info
router.get('/me', authenticate, me);

// Logout user
router.post('/logout', authenticate, logout);

// Change password for logged-in user
router.post('/change-password', authenticate, changePasswordValidation, changePassword);

export default router;