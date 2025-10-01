import { Router } from 'express';
import { TradeOptimizationController } from '../controllers/tradeOptimization.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/optimization/insights
 * Get optimization insights for all user trades or specific account
 * Query params: accountId (optional)
 */
router.get('/insights', TradeOptimizationController.getOptimizationInsights);

/**
 * POST /api/optimization/insights/custom
 * Get optimization insights for specific trades
 * Body: { tradeIds?: string[], accountId?: string }
 */
router.post('/insights/custom', TradeOptimizationController.getCustomOptimizationInsights);

export default router;
