import { Router } from 'express';
import { body, query } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
// import { authenticate } from '../middleware/auth';
import { handleValidationErrors, validateTradeData, validatePriceTicks, validateMarketExists } from '../middleware/validation';
import {
  createTrade,
  getTrades,
  getTrade,
  updateTrade,
  deleteTrade,
  bulkDelete,
  createQuickTrade,
  uploadTradeImage
} from '../controllers/trade.controller';

const router = Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/trade-images';
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `trade-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

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

// Quick trade creation (minimal validation for speed)
router.post(
  '/quick',
  upload.single('image'), // Handle optional image upload
  [
    // Skip validation for FormData - will be handled in controller
    handleValidationErrors
  ],
  createQuickTrade
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

// Upload image for specific trade
router.post(
  '/:tradeId/image',
  upload.single('image'),
  uploadTradeImage
);

export default router;