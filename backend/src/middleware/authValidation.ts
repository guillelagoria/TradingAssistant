import { body, ValidationChain } from 'express-validator';

/**
 * Password validation rules
 */
const passwordValidation = (): ValidationChain =>
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number');

/**
 * Email validation rules
 */
const emailValidation = (): ValidationChain =>
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail();

/**
 * Validation rules for user registration
 */
export const registerValidation = [
  emailValidation(),
  passwordValidation(),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters')
];

/**
 * Validation rules for login
 */
export const loginValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Validation rules for password reset request
 */
export const requestPasswordResetValidation = [
  emailValidation()
];

/**
 * Validation rules for resetting password
 */
export const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 32, max: 100 })
    .withMessage('Invalid token format'),
  passwordValidation()
];

/**
 * Validation rules for changing password
 */
export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('New password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('New password must contain at least one number')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    })
];

/**
 * Validation rules for email verification
 */
export const verifyEmailValidation = [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required')
    .isLength({ min: 32, max: 100 })
    .withMessage('Invalid token format')
];

/**
 * Validation rules for refresh token
 */
export const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
];

/**
 * Validation rules for resending verification email
 */
export const resendVerificationValidation = [
  emailValidation()
];

/**
 * Validation rules for updating profile
 */
export const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('commission')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Commission must be a positive number'),
  body('timezone')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Timezone cannot be empty')
];
