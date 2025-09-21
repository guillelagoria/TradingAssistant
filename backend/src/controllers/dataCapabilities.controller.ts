import { Request, Response } from 'express';
import { dataCapabilitiesService } from '../services/dataCapabilities.service';

/**
 * Get data capabilities analysis for an account
 */
export const getAccountCapabilities = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required', statusCode: 401 }
      });
    }

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Account ID is required', statusCode: 400 }
      });
    }

    const capabilities = await dataCapabilitiesService.analyzeAccountCapabilities(accountId, userId);

    res.json({
      success: true,
      data: capabilities
    });
  } catch (error) {
    console.error('Error analyzing account capabilities:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Internal server error',
        statusCode: 500
      }
    });
  }
};

/**
 * Check if account has capability for specific analysis
 */
export const checkAnalysisCapability = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { analysisType } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required', statusCode: 401 }
      });
    }

    if (!accountId || !analysisType) {
      return res.status(400).json({
        success: false,
        error: { message: 'Account ID and analysis type are required', statusCode: 400 }
      });
    }

    const validTypes = ['basic', 'efficiency', 'timing', 'strategy'];
    if (!validTypes.includes(analysisType as string)) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Invalid analysis type. Must be one of: ${validTypes.join(', ')}`,
          statusCode: 400
        }
      });
    }

    const hasCapability = await dataCapabilitiesService.hasCapabilityForAnalysis(
      accountId,
      userId,
      analysisType as 'basic' | 'efficiency' | 'timing' | 'strategy'
    );

    res.json({
      success: true,
      data: {
        accountId,
        analysisType,
        hasCapability
      }
    });
  } catch (error) {
    console.error('Error checking analysis capability:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Internal server error',
        statusCode: 500
      }
    });
  }
};

/**
 * Get capability-aware account stats (enhanced version of regular stats)
 */
export const getAdaptiveAccountStats = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required', statusCode: 401 }
      });
    }

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Account ID is required', statusCode: 400 }
      });
    }

    // Get capabilities analysis
    const capabilities = await dataCapabilitiesService.analyzeAccountCapabilities(accountId, userId);

    // Get regular account stats (this will include advanced metrics if available)
    const { accountService } = await import('../services/account.service');
    const stats = await accountService.getAccountStats(accountId, userId);

    // Combine stats with capabilities
    res.json({
      success: true,
      data: {
        stats,
        capabilities,
        adaptiveFeatures: {
          showAdvancedMetrics: capabilities.capabilityScore > 50,
          showEfficiencyAnalysis: capabilities.availableMetrics.advanced.some(metric =>
            metric.includes('Efficiency') || metric.includes('MAE') || metric.includes('MFE')
          ),
          showTimingAnalysis: capabilities.availableMetrics.advanced.some(metric =>
            metric.includes('Duration')
          ),
          showStrategyBreakdown: capabilities.availableMetrics.advanced.some(metric =>
            metric.includes('Strategy')
          )
        }
      }
    });
  } catch (error) {
    console.error('Error getting adaptive account stats:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Internal server error',
        statusCode: 500
      }
    });
  }
};