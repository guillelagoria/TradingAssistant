import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import { AnalysisService } from '../services/analysis.service';
import { logger } from '../utils/logger';

export class AnalysisController {
  /**
   * Get What-If analysis for user's trades
   */
  static async getWhatIfAnalysis(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
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
  static async generateWhatIfAnalysis(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const { tradeIds, scenarios, customScenarios, accountSize } = req.body;
      
      const analysis = await AnalysisService.generateWhatIfAnalysis(userId, {
        tradeIds,
        scenarios,
        customScenarios,
        accountSize
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
  static async getAvailableScenarios(req: AuthenticatedRequest, res: Response) {
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
  static async getImprovementSuggestions(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
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
  static async getPortfolioAnalysis(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
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
}