import { Response } from 'express';
// import { AuthenticatedRequest } from '../types/auth';
import { AnalysisService } from '../services/analysis.service';
import { BEAnalysisService } from '../services/beAnalysis.service';
import { BECalculationsService } from '../services/bECalculations.service';
import { BEMetricsService } from '../services/bEMetrics.service';
import { logger } from '../utils/logger';

export class AnalysisController {
  /**
   * Get What-If analysis for user's trades
   */
  static async getWhatIfAnalysis(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { tradeIds, scenarios, includeCache = true } = req.query;

      const analysis = await AnalysisService.getWhatIfAnalysis(userId, {
        tradeIds: tradeIds as string[] | undefined,
        scenarios: scenarios as string[] | undefined,
        includeCache: includeCache as boolean
      });

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      logger.error('Error in getWhatIfAnalysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get What-If analysis',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Generate What-If analysis with custom parameters
   */
  static async generateWhatIfAnalysis(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { tradeIds, scenarios, customScenarios, accountSize } = req.body;
      
      const analysis = await AnalysisService.generateWhatIfAnalysis(userId, {
        tradeIds,
        scenarios,
        _customScenarios: customScenarios,
        _accountSize: accountSize
      });

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      logger.error('Error in generateWhatIfAnalysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate What-If analysis',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Get available What-If scenarios
   */
  static async getAvailableScenarios(_req: any, res: Response): Promise<void> {
    try {
      const scenarios = AnalysisService.getAvailableScenarios();

      res.json({
        success: true,
        data: scenarios
      });
    } catch (error) {
      logger.error('Error in getAvailableScenarios:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get available scenarios',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Get improvement suggestions based on trading performance
   */
  static async getImprovementSuggestions(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { tradeIds, priority, category } = req.query;
      
      const suggestions = await AnalysisService.getImprovementSuggestions(userId, {
        tradeIds: tradeIds as string[] | undefined,
        priority: priority as string | undefined,
        category: category as string | undefined
      });

      res.json({
        success: true,
        data: suggestions
      });
    } catch (error) {
      logger.error('Error in getImprovementSuggestions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get improvement suggestions',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Get portfolio-level analysis including correlations and heat maps
   */
  static async getPortfolioAnalysis(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { period = 'all', includeOpenTrades = false } = req.query;
      
      const analysis = await AnalysisService.getPortfolioAnalysis(userId, {
        period: period as string,
        includeOpenTrades: includeOpenTrades as boolean
      });

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      logger.error('Error in getPortfolioAnalysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get portfolio analysis',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Get Break-Even analysis and recommendations
   */
  static async getBEAnalysis(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'test-user-id'; // TODO: Remove fallback when auth is implemented

      const analysis = await BEAnalysisService.getBERecommendations(userId);

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      logger.error('Error in getBEAnalysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get BE analysis',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Generate Break-Even optimization scenarios
   */
  static async getBEScenarios(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'test-user-id'; // TODO: Remove fallback when auth is implemented

      const scenarios = await BEAnalysisService.generateBEOptimizationScenarios(userId);

      res.json({
        success: true,
        data: scenarios
      });
    } catch (error) {
      logger.error('Error in getBEScenarios:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get BE scenarios',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Get portfolio-level BE metrics
   */
  static async getBEMetrics(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'test-user-id'; // TODO: Remove fallback when auth is implemented

      const metrics = await BEAnalysisService.calculatePortfolioBEMetrics(userId);

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('Error in getBEMetrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get BE metrics',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Get Stop Loss optimization analysis
   */
  static async getStopLossOptimization(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'test-user-id';
      const { tradeId } = req.query;

      const optimizations = await BECalculationsService.calculateStopLossOptimization(
        userId,
        tradeId as string | undefined
      );

      res.json({
        success: true,
        data: optimizations
      });
    } catch (error) {
      logger.error('Error in getStopLossOptimization:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Stop Loss optimization',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Get Take Profit optimization analysis
   */
  static async getTakeProfitOptimization(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'test-user-id';
      const { tradeId } = req.query;

      const optimizations = await BECalculationsService.calculateTakeProfitOptimization(
        userId,
        tradeId as string | undefined
      );

      res.json({
        success: true,
        data: optimizations
      });
    } catch (error) {
      logger.error('Error in getTakeProfitOptimization:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Take Profit optimization',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Get Break-Even efficiency analysis
   */
  static async getBEEfficiency(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'test-user-id';

      const efficiency = await BECalculationsService.calculateBEEfficiency(userId);

      res.json({
        success: true,
        data: efficiency
      });
    } catch (error) {
      logger.error('Error in getBEEfficiency:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get BE efficiency analysis',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Get personalized risk management recommendations
   */
  static async getRiskManagementRecommendations(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'test-user-id';

      const recommendations = await BECalculationsService.generatePersonalizedRecommendations(userId);

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      logger.error('Error in getRiskManagementRecommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get risk management recommendations',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Validate BE fields for a trade
   */
  static async validateBEFields(req: any, res: Response): Promise<void> {
    try {
      const tradeData = req.body;

      const validation = BECalculationsService.validateBEFields(tradeData);

      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      logger.error('Error in validateBEFields:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate BE fields',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Calculate what-if scenario for BE modifications
   */
  static async calculateBEWhatIf(req: any, res: Response): Promise<void> {
    try {
      const { originalTrade, modifications } = req.body;

      const whatIfResult = BECalculationsService.calculateBEWhatIf(originalTrade, modifications);

      res.json({
        success: true,
        data: whatIfResult
      });
    } catch (error) {
      logger.error('Error in calculateBEWhatIf:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate BE what-if scenario',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Get comprehensive BE effectiveness metrics
   */
  static async getBEEffectivenessMetrics(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'test-user-id';
      const { period = 'all', startDate, endDate } = req.query;

      const timeframe = {
        period: period as 'all' | '1m' | '3m' | '6m' | '1y',
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      };

      const metrics = await BEMetricsService.getBEEffectivenessMetrics(userId, timeframe);

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('Error in getBEEffectivenessMetrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get BE effectiveness metrics',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Get risk-adjusted metrics comparing BE vs non-BE performance
   */
  static async getRiskAdjustedMetrics(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'test-user-id';
      const { period = 'all', startDate, endDate } = req.query;

      const timeframe = {
        period: period as 'all' | '1m' | '3m' | '6m' | '1y',
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      };

      const riskMetrics = await BEMetricsService.calculateRiskAdjustedMetrics(userId, timeframe);

      res.json({
        success: true,
        data: riskMetrics
      });
    } catch (error) {
      logger.error('Error in getRiskAdjustedMetrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get risk-adjusted metrics',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Get BE portfolio impact analysis
   */
  static async getBEPortfolioImpact(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'test-user-id';
      const { period = 'all', startDate, endDate, accountSize = 100000 } = req.query;

      const timeframe = {
        period: period as 'all' | '1m' | '3m' | '6m' | '1y',
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      };

      const impact = await BEMetricsService.calculateBEPortfolioImpact(
        userId,
        Number(accountSize),
        timeframe
      );

      res.json({
        success: true,
        data: impact
      });
    } catch (error) {
      logger.error('Error in getBEPortfolioImpact:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get BE portfolio impact',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Get BE optimization recommendations
   */
  static async getBEOptimizationRecommendations(req: any, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'test-user-id';
      const { period = 'all', startDate, endDate } = req.query;

      const timeframe = {
        period: period as 'all' | '1m' | '3m' | '6m' | '1y',
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      };

      const recommendations = await BEMetricsService.generateBEOptimizationRecommendations(userId, timeframe);

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      logger.error('Error in getBEOptimizationRecommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get BE optimization recommendations',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
}