import { Router } from 'express';
import { body, query } from 'express-validator';
// import { authenticate } from '../middleware/auth';
import { handleValidationErrors, validateTradeData, validatePriceTicks, validateMarketExists } from '../middleware/validation';
import {
  createTrade,
  getTrades,
  getTrade,
  updateTrade,
  deleteTrade,
  bulkDelete
} from '../controllers/trade.controller';

const router = Router();

// Temporarily disable authentication for development
// TODO: Re-enable authentication when frontend auth is implemented
// router.use(authenticate);

// Get all trades with filters
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('accountId').optional().isString(),
    query('symbol').optional().isString(),
    query('market').optional().isString(),
    query('strategy').optional().isString(),
    query('direction').optional().isIn(['LONG', 'SHORT']),
    query('result').optional().isIn(['WIN', 'LOSS', 'BREAKEVEN']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('sortBy').optional().isString(),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    handleValidationErrors
  ],
  getTrades
);

// Create new trade
router.post(
  '/',
  [
    body('accountId').optional().isString(),
    body('symbol').notEmpty().trim(),
    body('market').optional().isString().isLength({ min: 1, max: 10 }),
    body('direction').isIn(['LONG', 'SHORT']),
    body('orderType').isIn(['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT']),
    body('entryDate').isISO8601(),
    body('entryPrice').isFloat({ min: 0 }),
    body('quantity').isInt({ min: 1 }),
    body('exitDate').optional().isISO8601(),
    body('exitPrice').optional().isFloat({ min: 0 }),
    body('stopLoss').optional().isFloat({ min: 0 }),
    body('takeProfit').optional().isFloat({ min: 0 }),
    body('maxFavorablePrice').optional().isFloat({ min: 0 }),
    body('maxAdversePrice').optional().isFloat({ min: 0 }),
    // BE Analysis fields
    body('maxPotentialProfit').optional().isFloat({ min: 0 }),
    body('maxDrawdown').optional().isFloat({ min: 0 }),
    body('breakEvenWorked').optional().isBoolean(),
    body('strategy').optional().isString(),
    body('timeframe').optional().isString(),
    body('notes').optional().isString(),
    body('imageUrl').optional().isString(),
    // Frontend additional fields
    body('mood').optional().isInt({ min: 1, max: 5 }),
    body('stopLossPoints').optional().isFloat(),
    body('takeProfitPoints').optional().isFloat(),
    body('exitPricePoints').optional().isFloat(),
    body('status').optional().isIn(['OPEN', 'CLOSED']),
    handleValidationErrors,
    validateMarketExists,
    validateTradeData,
    validatePriceTicks
  ],
  createTrade
);

// Get single trade
router.get(
  '/:id',
  [
    query('accountId').optional().isString(),
    handleValidationErrors
  ],
  getTrade
);

// Update trade
router.put(
  '/:id',
  [
    body('accountId').optional().isString(),
    body('symbol').optional().notEmpty().trim(),
    body('market').optional().isString().isLength({ min: 1, max: 10 }),
    body('direction').optional().isIn(['LONG', 'SHORT']),
    body('orderType').optional().isIn(['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT']),
    body('entryDate').optional().isISO8601(),
    body('entryPrice').optional().isFloat({ min: 0 }),
    body('quantity').optional().isInt({ min: 1 }),
    body('exitDate').optional().isISO8601(),
    body('exitPrice').optional().isFloat({ min: 0 }),
    body('stopLoss').optional().isFloat({ min: 0 }),
    body('takeProfit').optional().isFloat({ min: 0 }),
    body('maxFavorablePrice').optional().isFloat({ min: 0 }),
    body('maxAdversePrice').optional().isFloat({ min: 0 }),
    // BE Analysis fields
    body('maxPotentialProfit').optional().isFloat({ min: 0 }),
    body('maxDrawdown').optional().isFloat({ min: 0 }),
    body('breakEvenWorked').optional().isBoolean(),
    body('strategy').optional().isString(),
    body('timeframe').optional().isString(),
    body('notes').optional().isString(),
    body('imageUrl').optional().isString(),
    // Frontend additional fields
    body('mood').optional().isInt({ min: 1, max: 5 }),
    body('stopLossPoints').optional().isFloat(),
    body('takeProfitPoints').optional().isFloat(),
    body('exitPricePoints').optional().isFloat(),
    body('status').optional().isIn(['OPEN', 'CLOSED']),
    handleValidationErrors,
    validateMarketExists,
    validatePriceTicks
  ],
  updateTrade
);

// Delete trade
router.delete(
  '/:id',
  [
    query('accountId').optional().isString(),
    handleValidationErrors
  ],
  deleteTrade
);

// Bulk delete trades
router.post(
  '/bulk-delete',
  [
    body('ids').isArray().notEmpty(),
    body('ids.*').isString(),
    handleValidationErrors
  ],
  bulkDelete
);

export default router;