import { Router } from 'express';
import {
  getAccountCapabilities,
  checkAnalysisCapability,
  getAdaptiveAccountStats
} from '../controllers/dataCapabilities.controller';

const router = Router();

/**
 * GET /api/data-capabilities/:accountId
 * Get comprehensive data capabilities analysis for an account
 */
router.get('/:accountId', getAccountCapabilities);

/**
 * GET /api/data-capabilities/:accountId/check
 * Check if account has capability for specific analysis type
 * Query params: analysisType (basic|efficiency|timing|strategy)
 */
router.get('/:accountId/check', checkAnalysisCapability);

/**
 * GET /api/data-capabilities/:accountId/adaptive-stats
 * Get capability-aware account stats with adaptive features flags
 */
router.get('/:accountId/adaptive-stats', getAdaptiveAccountStats);

export default router;