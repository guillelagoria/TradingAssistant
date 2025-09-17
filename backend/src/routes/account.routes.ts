import { Router } from 'express';
import {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  setActiveAccount,
  getAccountStats,
  getDefaultAccount,
  canCreateAccount,
  recalculateBalance
} from '../controllers/account.controller';
import {
  validateCreateAccount,
  validateUpdateAccount,
  validateAccountId
} from '../middleware/validation';

const router = Router();

/**
 * Account management routes
 */

// Get all accounts for authenticated user
router.get('/', getAccounts);

// Get user's default/active account
router.get('/default', getDefaultAccount);

// Check if user can create more accounts
router.get('/can-create', canCreateAccount);

// Get specific account by ID
router.get('/:accountId', validateAccountId, getAccountById);

// Get account statistics
router.get('/:accountId/stats', validateAccountId, getAccountStats);

// Create new account
router.post('/', validateCreateAccount, createAccount);

// Update account
router.put('/:accountId', validateUpdateAccount, updateAccount);

// Set account as active
router.patch('/:accountId/set-active', validateAccountId, setActiveAccount);

// Recalculate account balance
router.patch('/:accountId/recalculate-balance', validateAccountId, recalculateBalance);

// Delete account (and all related trades)
router.delete('/:accountId', validateAccountId, deleteAccount);

export default router;