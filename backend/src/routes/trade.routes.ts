import { Router } from 'express';
import { body, query } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
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
    query('symbol').optional().isString(),
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
    body('symbol').notEmpty().trim(),
    body('direction').isIn(['LONG', 'SHORT']),
    body('orderType').isIn(['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT']),
    body('entryDate').isISO8601(),
    body('entryPrice').isFloat({ min: 0 }),
    body('quantity').isFloat({ min: 0 }),
    body('exitDate').optional().isISO8601(),
    body('exitPrice').optional().isFloat({ min: 0 }),
    body('stopLoss').optional().isFloat({ min: 0 }),
    body('takeProfit').optional().isFloat({ min: 0 }),
    body('maxFavorablePrice').optional().isFloat({ min: 0 }),
    body('maxAdversePrice').optional().isFloat({ min: 0 }),
    body('strategy').optional().isString(),
    body('timeframe').optional().isString(),
    body('notes').optional().isString(),
    body('imageUrl').optional().isURL(),
    handleValidationErrors
  ],
  createTrade
);

// Get single trade
router.get('/:id', getTrade);

// Update trade
router.put(
  '/:id',
  [
    body('symbol').optional().notEmpty().trim(),
    body('direction').optional().isIn(['LONG', 'SHORT']),
    body('orderType').optional().isIn(['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT']),
    body('entryDate').optional().isISO8601(),
    body('entryPrice').optional().isFloat({ min: 0 }),
    body('quantity').optional().isFloat({ min: 0 }),
    body('exitDate').optional().isISO8601(),
    body('exitPrice').optional().isFloat({ min: 0 }),
    body('stopLoss').optional().isFloat({ min: 0 }),
    body('takeProfit').optional().isFloat({ min: 0 }),
    body('maxFavorablePrice').optional().isFloat({ min: 0 }),
    body('maxAdversePrice').optional().isFloat({ min: 0 }),
    body('strategy').optional().isString(),
    body('timeframe').optional().isString(),
    body('notes').optional().isString(),
    body('imageUrl').optional().isURL(),
    handleValidationErrors
  ],
  updateTrade
);

// Delete trade
router.delete('/:id', deleteTrade);

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