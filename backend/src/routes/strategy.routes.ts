import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import {
  createStrategy,
  getStrategies,
  getStrategy,
  updateStrategy,
  deleteStrategy
} from '../controllers/strategy.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all strategies for user
router.get('/', getStrategies);

// Create new strategy
router.post(
  '/',
  [
    body('name').notEmpty().trim(),
    body('description').optional().trim(),
    handleValidationErrors
  ],
  createStrategy
);

// Get single strategy
router.get('/:id', getStrategy);

// Update strategy
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().trim(),
    body('description').optional().trim(),
    handleValidationErrors
  ],
  updateStrategy
);

// Delete strategy
router.delete('/:id', deleteStrategy);

export default router;