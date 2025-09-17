import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { accountService } from '../services/account.service';
import { CreateAccountRequest, UpdateAccountRequest } from '../types';

/**
 * Get all accounts for the authenticated user
 */
export const getAccounts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Temporarily use a default test user ID for development
    // TODO: Remove when authentication is properly implemented
    const userId = req.userId || 'test-user-id';

    const accounts = await accountService.getUserAccounts(userId);

    res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single account by ID
 */
export const getAccountById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { accountId } = req.params;
    // Temporarily use a default test user ID for development
    const userId = req.userId || 'test-user-id';

    const account = await accountService.getAccountById(accountId, userId);

    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new account
 */
export const createAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Temporarily use a default test user ID for development
    const userId = req.userId || 'test-user-id';

    const accountData: CreateAccountRequest = req.body;

    // Convert string date to Date object
    const createData = {
      ...accountData,
      creationDate: new Date(accountData.creationDate)
    };

    const account = await accountService.createAccount(userId, createData);

    res.status(201).json({
      success: true,
      data: account,
      message: 'Account created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an account
 */
export const updateAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { accountId } = req.params;
    // Temporarily use a default test user ID for development
    const userId = req.userId || 'test-user-id';

    const updateData: UpdateAccountRequest = req.body;

    // Convert string date to Date object if provided
    const cleanUpdateData = {
      ...updateData,
      creationDate: updateData.creationDate ? new Date(updateData.creationDate) : undefined
    };

    const account = await accountService.updateAccount(accountId, userId, cleanUpdateData);

    res.json({
      success: true,
      data: account,
      message: 'Account updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an account
 */
export const deleteAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { accountId } = req.params;
    // Temporarily use a default test user ID for development
    const userId = req.userId || 'test-user-id';

    await accountService.deleteAccount(accountId, userId);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set active account for user
 */
export const setActiveAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { accountId } = req.params;
    // Temporarily use a default test user ID for development
    const userId = req.userId || 'test-user-id';

    const account = await accountService.setActiveAccount(userId, accountId);

    res.json({
      success: true,
      data: account,
      message: 'Active account set successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get account statistics
 */
export const getAccountStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { accountId } = req.params;
    // Temporarily use a default test user ID for development
    const userId = req.userId || 'test-user-id';

    const stats = await accountService.getAccountStats(accountId, userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's default account
 */
export const getDefaultAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Temporarily use a default test user ID for development
    const userId = req.userId || 'test-user-id';

    const account = await accountService.getDefaultAccount(userId);

    if (!account) {
      res.status(404).json({
        success: false,
        error: {
          message: 'No account found for user',
          statusCode: 404
        }
      });
      return;
    }

    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user can create more accounts
 */
export const canCreateAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Temporarily use a default test user ID for development
    const userId = req.userId || 'test-user-id';

    const canCreate = await accountService.canCreateAccount(userId);
    const remainingSlots = await accountService.getRemainingAccountSlots(userId);

    res.json({
      success: true,
      data: {
        canCreate,
        remainingSlots
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Recalculate account balance based on trades
 */
export const recalculateBalance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { accountId } = req.params;
    // Temporarily use a default test user ID for development
    const userId = req.userId || 'test-user-id';

    const account = await accountService.recalculateAccountBalance(accountId, userId);

    res.json({
      success: true,
      data: account,
      message: 'Account balance recalculated successfully'
    });
  } catch (error) {
    next(error);
  }
};