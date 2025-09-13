import { Router } from 'express';
import { query } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import {
  getDashboardStats,
  getProfitLossChart,
  getEfficiencyAnalysis,
  getWhatIfAnalysis,
  getStrategyPerformance
} from '../controllers/stats.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get dashboard statistics
router.get(
  '/dashboard',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    handleValidationErrors
  ],
  getDashboardStats
);

// Get profit/loss chart data
router.get(
  '/profit-loss',
  [
    query('period').optional().isIn(['day', 'week', 'month', 'year']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    handleValidationErrors
  ],
  getProfitLossChart
);

// Get efficiency analysis
router.get(
  '/efficiency',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    handleValidationErrors
  ],
  getEfficiencyAnalysis
);

// Get what-if analysis
router.get(
  '/what-if',
  [
    query('scenario').isIn(['perfectEntry', 'perfectExit', 'noStopLoss', 'tightStopLoss']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    handleValidationErrors
  ],
  getWhatIfAnalysis
);

// Get strategy performance comparison
router.get(
  '/strategies',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    handleValidationErrors
  ],
  getStrategyPerformance
);

export default router;