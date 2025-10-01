import { Request, Response } from 'express';
import { TradeOptimizationService } from '../services/tradeOptimization.service';
import { TradeService } from '../services/trade.service';
import { logger } from '../utils/logger';
import { accountService } from '../services/account.service';

export class TradeOptimizationController {
  /**
   * Get optimization insights for user's trades
   * GET /api/optimization/insights
   */
  static async getOptimizationInsights(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized', statusCode: 401 }
        });
      }

      const accountId = req.query.accountId as string | undefined;

      // Validate account ownership if accountId is provided
      if (accountId) {
        const accountExists = await accountService.validateAccountOwnership(accountId, userId);
        if (!accountExists) {
          return res.status(404).json({
            success: false,
            error: { message: 'Account not found or access denied', statusCode: 404 }
          });
        }
      }

      // Get user's trades for the specified account (or default account)
      const trades = await TradeService.getUserTrades(userId, {
        includeCalculations: true,
        accountId
      });

      // Calculate optimization insights
      const insights = await TradeOptimizationService.getOptimizationInsights(trades);

      logger.info(`Retrieved optimization insights for user ${userId} (${trades.length} trades)`);

      return res.status(200).json({
        success: true,
        data: insights
      });
    } catch (error) {
      logger.error('Error in getOptimizationInsights:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to get optimization insights',
          statusCode: 500
        }
      });
    }
  }

  /**
   * Get optimization insights for specific trades
   * POST /api/optimization/insights/custom
   */
  static async getCustomOptimizationInsights(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized', statusCode: 401 }
        });
      }

      const { tradeIds, accountId } = req.body;

      // Validate account ownership if accountId is provided
      if (accountId) {
        const accountExists = await accountService.validateAccountOwnership(accountId, userId);
        if (!accountExists) {
          return res.status(404).json({
            success: false,
            error: { message: 'Account not found or access denied', statusCode: 404 }
          });
        }
      }

      // Get specific trades or all trades for account
      const trades = await TradeService.getUserTrades(userId, {
        tradeIds,
        includeCalculations: true,
        accountId
      });

      if (trades.length === 0) {
        return res.status(404).json({
          success: false,
          error: { message: 'No trades found for analysis', statusCode: 404 }
        });
      }

      // Calculate optimization insights
      const insights = await TradeOptimizationService.getOptimizationInsights(trades);

      logger.info(`Retrieved custom optimization insights for user ${userId} (${trades.length} trades)`);

      return res.status(200).json({
        success: true,
        data: insights
      });
    } catch (error) {
      logger.error('Error in getCustomOptimizationInsights:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to get custom optimization insights',
          statusCode: 500
        }
      });
    }
  }
}
