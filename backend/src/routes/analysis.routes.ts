import { Router } from 'express';
import { body, query } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';
// import { AuthenticatedRequest } from '../types/auth';
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

/**
 * GET /api/analysis/be
 * Get Break-Even analysis and recommendations
 */
router.get('/be', AnalysisController.getBEAnalysis);

/**
 * GET /api/analysis/be/scenarios
 * Generate Break-Even optimization scenarios
 */
router.get('/be/scenarios', AnalysisController.getBEScenarios);

/**
 * GET /api/analysis/be/metrics
 * Get portfolio-level BE metrics
 */
router.get('/be/metrics', AnalysisController.getBEMetrics);

/**
 * GET /api/analysis/be/stop-loss-optimization
 * Get Stop Loss optimization analysis
 */
router.get(
  '/be/stop-loss-optimization',
  [
    query('tradeId')
      .optional()
      .isString()
      .withMessage('tradeId must be a string'),
    handleValidationErrors
  ],
  AnalysisController.getStopLossOptimization
);

/**
 * GET /api/analysis/be/take-profit-optimization
 * Get Take Profit optimization analysis
 */
router.get(
  '/be/take-profit-optimization',
  [
    query('tradeId')
      .optional()
      .isString()
      .withMessage('tradeId must be a string'),
    handleValidationErrors
  ],
  AnalysisController.getTakeProfitOptimization
);

/**
 * GET /api/analysis/be/efficiency
 * Get Break-Even efficiency analysis
 */
router.get('/be/efficiency', AnalysisController.getBEEfficiency);

/**
 * GET /api/analysis/be/recommendations
 * Get personalized risk management recommendations
 */
router.get('/be/recommendations', AnalysisController.getRiskManagementRecommendations);

/**
 * POST /api/analysis/be/validate
 * Validate BE fields for a trade
 */
router.post(
  '/be/validate',
  [
    body('direction')
      .isIn(['LONG', 'SHORT'])
      .withMessage('direction must be LONG or SHORT'),
    body('entryPrice')
      .isNumeric()
      .withMessage('entryPrice must be a number'),
    body('quantity')
      .isNumeric()
      .withMessage('quantity must be a number'),
    body('maxPotentialProfit')
      .optional()
      .isNumeric()
      .withMessage('maxPotentialProfit must be a number'),
    body('maxDrawdown')
      .optional()
      .isNumeric()
      .withMessage('maxDrawdown must be a number'),
    body('takeProfit')
      .optional()
      .isNumeric()
      .withMessage('takeProfit must be a number'),
    body('stopLoss')
      .optional()
      .isNumeric()
      .withMessage('stopLoss must be a number'),
    body('breakEvenWorked')
      .optional()
      .isBoolean()
      .withMessage('breakEvenWorked must be a boolean'),
    handleValidationErrors
  ],
  AnalysisController.validateBEFields
);

/**
 * POST /api/analysis/be/what-if
 * Calculate what-if scenario for BE modifications
 */
router.post(
  '/be/what-if',
  [
    body('originalTrade')
      .isObject()
      .withMessage('originalTrade must be an object'),
    body('modifications')
      .isObject()
      .withMessage('modifications must be an object'),
    handleValidationErrors
  ],
  AnalysisController.calculateBEWhatIf
);

/**
 * GET /api/analysis/be/effectiveness
 * Get comprehensive BE effectiveness metrics
 */
router.get(
  '/be/effectiveness',
  [
    query('period')
      .optional()
      .isIn(['1m', '3m', '6m', '1y', 'all'])
      .withMessage('period must be 1m, 3m, 6m, 1y, or all'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('startDate must be a valid ISO8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('endDate must be a valid ISO8601 date'),
    handleValidationErrors
  ],
  AnalysisController.getBEEffectivenessMetrics
);

/**
 * GET /api/analysis/be/risk-adjusted
 * Get risk-adjusted metrics comparing BE vs non-BE performance
 */
router.get(
  '/be/risk-adjusted',
  [
    query('period')
      .optional()
      .isIn(['1m', '3m', '6m', '1y', 'all'])
      .withMessage('period must be 1m, 3m, 6m, 1y, or all'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('startDate must be a valid ISO8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('endDate must be a valid ISO8601 date'),
    handleValidationErrors
  ],
  AnalysisController.getRiskAdjustedMetrics
);

/**
 * GET /api/analysis/be/portfolio-impact
 * Get BE portfolio impact analysis
 */
router.get(
  '/be/portfolio-impact',
  [
    query('period')
      .optional()
      .isIn(['1m', '3m', '6m', '1y', 'all'])
      .withMessage('period must be 1m, 3m, 6m, 1y, or all'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('startDate must be a valid ISO8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('endDate must be a valid ISO8601 date'),
    query('accountSize')
      .optional()
      .isNumeric()
      .withMessage('accountSize must be a number'),
    handleValidationErrors
  ],
  AnalysisController.getBEPortfolioImpact
);

/**
 * GET /api/analysis/be/optimization-recommendations
 * Get BE optimization recommendations
 */
router.get(
  '/be/optimization-recommendations',
  [
    query('period')
      .optional()
      .isIn(['1m', '3m', '6m', '1y', 'all'])
      .withMessage('period must be 1m, 3m, 6m, 1y, or all'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('startDate must be a valid ISO8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('endDate must be a valid ISO8601 date'),
    handleValidationErrors
  ],
  AnalysisController.getBEOptimizationRecommendations
);

export default router;