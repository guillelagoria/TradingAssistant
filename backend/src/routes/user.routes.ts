import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import {
  getProfile,
  updateSettings,
  changePassword,
  deleteAccount
} from '../controllers/user.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user profile
router.get('/profile', getProfile);

// Update user settings
router.patch(
  '/settings',
  [
    body('commission').optional().isFloat({ min: 0 }),
    body('timezone').optional().isString(),
    handleValidationErrors
  ],
  updateSettings
);

// Change password
router.post(
  '/change-password',
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
    handleValidationErrors
  ],
  changePassword
);

// Delete account
router.delete('/account', deleteAccount);

export default router;