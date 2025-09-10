import { Router } from 'express';
import { body, query } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';
import { AuthenticatedRequest } from '../types/auth';
import { AnalysisController } from '../controllers/analysis.controller';

const router = Router();

/**
 * GET /api/analysis/whatif
 * Get What-If analysis for user's trades
 */
router.get(
  '/whatif',
  [
    query('tradeIds')
      .optional()
      .isArray()
      .withMessage('tradeIds must be an array of trade IDs'),
    query('scenarios')
      .optional()
      .isArray()
      .withMessage('scenarios must be an array of scenario IDs'),
    query('includeCache')
      .optional()
      .isBoolean()
      .withMessage('includeCache must be a boolean'),
    handleValidationErrors
  ],
  AnalysisController.getWhatIfAnalysis
);

/**
 * POST /api/analysis/whatif
 * Generate What-If analysis with custom parameters
 */
router.post(
  '/whatif',
  [
    body('tradeIds')
      .optional()
      .isArray()
      .withMessage('tradeIds must be an array of trade IDs'),
    body('scenarios')
      .optional()
      .isArray()
      .withMessage('scenarios must be an array of scenario configurations'),
    body('customScenarios')
      .optional()
      .isArray()
      .withMessage('customScenarios must be an array'),
    body('accountSize')
      .optional()
      .isNumeric()
      .withMessage('accountSize must be a number'),
    handleValidationErrors
  ],
  AnalysisController.generateWhatIfAnalysis
);

/**
 * GET /api/analysis/scenarios
 * Get available What-If scenarios
 */
router.get('/scenarios', AnalysisController.getAvailableScenarios);

/**
 * GET /api/analysis/suggestions
 * Get improvement suggestions based on trading performance
 */
router.get(
  '/suggestions',
  [
    query('tradeIds')
      .optional()
      .isArray()
      .withMessage('tradeIds must be an array of trade IDs'),
    query('priority')
      .optional()
      .isIn(['high', 'medium', 'low'])
      .withMessage('priority must be high, medium, or low'),
    query('category')
      .optional()
      .isIn(['risk', 'entry', 'exit', 'psychology', 'strategy'])
      .withMessage('category must be a valid category'),
    handleValidationErrors
  ],
  AnalysisController.getImprovementSuggestions
);

/**
 * GET /api/analysis/portfolio
 * Get portfolio-level analysis including correlations and heat maps
 */
router.get(
  '/portfolio',
  [
    query('period')
      .optional()
      .isIn(['1m', '3m', '6m', '1y', 'all'])
      .withMessage('period must be 1m, 3m, 6m, 1y, or all'),
    query('includeOpenTrades')
      .optional()
      .isBoolean()
      .withMessage('includeOpenTrades must be a boolean'),
    handleValidationErrors
  ],
  AnalysisController.getPortfolioAnalysis
);

export default router;