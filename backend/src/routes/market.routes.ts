import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getMarkets,
  getMarketBySymbol,
  getMarketDefaults,
  getUserMarketPreferences,
  updateUserMarketPreferences,
  validateTradeForMarket,
  calculatePositionSize
} from '../controllers/market.controller';
import { validateRequest } from '../middleware/validation';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/markets
 * @desc Get all available markets
 * @access Public
 */
router.get('/', getMarkets);

/**
 * @route GET /api/markets/:symbol
 * @desc Get specific market details
 * @access Public
 */
router.get(
  '/:symbol',
  param('symbol')
    .isString()
    .isLength({ min: 1, max: 10 })
    .withMessage('Symbol must be a string between 1-10 characters'),
  validateRequest,
  getMarketBySymbol
);

/**
 * @route GET /api/markets/:symbol/defaults
 * @desc Get market defaults for trade form
 * @access Public (but enhanced with user data if authenticated)
 */
router.get(
  '/:symbol/defaults',
  param('symbol')
    .isString()
    .isLength({ min: 1, max: 10 })
    .withMessage('Symbol must be a string between 1-10 characters'),
  validateRequest,
  getMarketDefaults
);

/**
 * @route POST /api/markets/:symbol/validate
 * @desc Validate trade parameters for a specific market
 * @access Public
 */
router.post(
  '/:symbol/validate',
  [
    param('symbol')
      .isString()
      .isLength({ min: 1, max: 10 })
      .withMessage('Symbol must be a string between 1-10 characters'),
    body('entryPrice')
      .isFloat({ gt: 0 })
      .withMessage('Entry price must be a positive number'),
    body('quantity')
      .isInt({ gt: 0 })
      .withMessage('Quantity must be a positive integer'),
    body('stopLoss')
      .optional()
      .isFloat({ gt: 0 })
      .withMessage('Stop loss must be a positive number'),
    body('takeProfit')
      .optional()
      .isFloat({ gt: 0 })
      .withMessage('Take profit must be a positive number')
  ],
  validateRequest,
  validateTradeForMarket
);

/**
 * @route POST /api/markets/:symbol/position-size
 * @desc Calculate position size for a trade
 * @access Public
 */
router.post(
  '/:symbol/position-size',
  [
    param('symbol')
      .isString()
      .isLength({ min: 1, max: 10 })
      .withMessage('Symbol must be a string between 1-10 characters'),
    body('riskAmount')
      .isFloat({ gt: 0 })
      .withMessage('Risk amount must be a positive number'),
    body('entryPrice')
      .isFloat({ gt: 0 })
      .withMessage('Entry price must be a positive number'),
    body('stopLoss')
      .isFloat({ gt: 0 })
      .withMessage('Stop loss must be a positive number')
  ],
  validateRequest,
  calculatePositionSize
);

// Protected routes - require authentication
/**
 * @route GET /api/markets/user/preferences
 * @desc Get user's market preferences
 * @access Private
 */
router.get('/user/preferences', authenticate, getUserMarketPreferences);

/**
 * @route PUT /api/markets/user/preferences
 * @desc Update user's market preferences
 * @access Private
 */
router.put(
  '/user/preferences',
  authenticate,
  [
    body('preferredMarkets')
      .optional()
      .isArray()
      .withMessage('Preferred markets must be an array'),
    body('preferredMarkets.*')
      .optional()
      .isString()
      .isLength({ min: 1, max: 10 })
      .withMessage('Each market symbol must be a string between 1-10 characters'),
    body('defaultMarket')
      .optional()
      .isString()
      .isLength({ min: 1, max: 10 })
      .withMessage('Default market must be a string between 1-10 characters'),
    body('quickAccessMarkets')
      .optional()
      .isArray()
      .withMessage('Quick access markets must be an array'),
    body('quickAccessMarkets.*')
      .optional()
      .isString()
      .isLength({ min: 1, max: 10 })
      .withMessage('Each market symbol must be a string between 1-10 characters'),
    body('accountSize')
      .optional()
      .isFloat({ gt: 0 })
      .withMessage('Account size must be a positive number'),
    body('riskPerTrade')
      .optional()
      .isFloat({ min: 0.1, max: 100 })
      .withMessage('Risk per trade must be between 0.1 and 100'),
    body('marketSettings')
      .optional()
      .isObject()
      .withMessage('Market settings must be an object'),
    body('commissionOverrides')
      .optional()
      .isObject()
      .withMessage('Commission overrides must be an object')
  ],
  validateRequest,
  updateUserMarketPreferences
);

export default router;