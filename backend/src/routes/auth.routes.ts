import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, me, updateProfile } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();

// Register new user
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').optional().trim().notEmpty(),
    handleValidationErrors
  ],
  register
);

// Login user
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    handleValidationErrors
  ],
  login
);

// Get current user
router.get('/me', authenticate, me);

// Update profile
router.patch(
  '/profile',
  authenticate,
  [
    body('name').optional().trim().notEmpty(),
    body('commission').optional().isFloat({ min: 0 }),
    body('timezone').optional().isString(),
    handleValidationErrors
  ],
  updateProfile
);

export default router;