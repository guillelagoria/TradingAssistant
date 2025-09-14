import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { marketService } from '../services/market.service';
import { ApiResponse, UpdateMarketPreferencesRequest, MarketInfo } from '../types';
import { getAllMarketsInfo, getMarketInfo } from '../types/market';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Get all available markets
 */
export const getMarkets = async (req: Request, res: Response): Promise<void> => {
  try {
    const markets = marketService.getAllMarkets();

    const response: ApiResponse = {
      success: true,
      data: markets,
      message: 'Markets retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    logger.error('Error fetching markets:', error);

    const response: ApiResponse = {
      success: false,
      error: {
        message: 'Failed to fetch markets',
        statusCode: 500
      }
    };

    res.status(500).json(response);
  }
};

/**
 * Get specific market details by symbol
 */
export const getMarketBySymbol = async (req: Request, res: Response): Promise<void> => {
  try {
    const { symbol } = req.params;

    const market = marketService.getMarket(symbol);

    if (!market) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: `Market not found: ${symbol}`,
          statusCode: 404
        }
      };

      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: market,
      message: 'Market retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    logger.error('Error fetching market:', error);

    const response: ApiResponse = {
      success: false,
      error: {
        message: 'Failed to fetch market details',
        statusCode: 500
      }
    };

    res.status(500).json(response);
  }
};

/**
 * Get market defaults for trade form
 */
export const getMarketDefaults = async (req: Request, res: Response): Promise<void> => {
  try {
    const { symbol } = req.params;
    const { entryPrice, accountBalance } = req.query;

    const userId = (req as any).user?.id;

    // Get user's account size from preferences if available
    let userAccountSize = accountBalance ? parseFloat(accountBalance as string) : undefined;

    if (userId && !userAccountSize) {
      try {
        const userPrefs = await prisma.userMarketPreferences.findUnique({
          where: { userId }
        });

        if (userPrefs) {
          userAccountSize = userPrefs.accountSize;
        }
      } catch (error) {
        logger.warn('Could not fetch user preferences:', error);
      }
    }

    const defaults = marketService.calculateTradeDefaults(
      symbol,
      userAccountSize || 100000,
      entryPrice ? parseFloat(entryPrice as string) : undefined
    );

    const response: ApiResponse = {
      success: true,
      data: defaults,
      message: 'Market defaults calculated successfully'
    };

    res.json(response);
  } catch (error) {
    logger.error('Error calculating market defaults:', error);

    const response: ApiResponse = {
      success: false,
      error: {
        message: 'Failed to calculate market defaults',
        statusCode: 500,
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    };

    res.status(500).json(response);
  }
};

/**
 * Get user's market preferences
 */
export const getUserMarketPreferences = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'User not authenticated',
          statusCode: 401
        }
      };

      res.status(401).json(response);
      return;
    }

    let preferences = await prisma.userMarketPreferences.findUnique({
      where: { userId }
    });

    // If no preferences exist, create default ones
    if (!preferences) {
      preferences = await prisma.userMarketPreferences.create({
        data: {
          userId,
          preferredMarkets: ['ES', 'NQ'],
          defaultMarket: 'ES',
          quickAccessMarkets: ['ES', 'NQ'],
          accountSize: 100000,
          riskPerTrade: 1.0
        }
      });
    }

    const response: ApiResponse = {
      success: true,
      data: {
        preferredMarkets: preferences.preferredMarkets,
        defaultMarket: preferences.defaultMarket,
        quickAccessMarkets: preferences.quickAccessMarkets,
        marketSettings: preferences.marketSettings,
        accountSize: preferences.accountSize,
        riskPerTrade: preferences.riskPerTrade,
        commissionOverrides: preferences.commissionOverrides
      },
      message: 'Market preferences retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    logger.error('Error fetching user market preferences:', error);

    const response: ApiResponse = {
      success: false,
      error: {
        message: 'Failed to fetch market preferences',
        statusCode: 500
      }
    };

    res.status(500).json(response);
  }
};

/**
 * Update user's market preferences
 */
export const updateUserMarketPreferences = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'User not authenticated',
          statusCode: 401
        }
      };

      res.status(401).json(response);
      return;
    }

    const updateData: UpdateMarketPreferencesRequest = req.body;

    // Validate preferred markets exist
    if (updateData.preferredMarkets) {
      for (const market of updateData.preferredMarkets) {
        if (!marketService.getMarket(market)) {
          const response: ApiResponse = {
            success: false,
            error: {
              message: `Invalid market: ${market}`,
              statusCode: 400
            }
          };

          res.status(400).json(response);
          return;
        }
      }
    }

    // Validate default market exists
    if (updateData.defaultMarket && !marketService.getMarket(updateData.defaultMarket)) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: `Invalid default market: ${updateData.defaultMarket}`,
          statusCode: 400
        }
      };

      res.status(400).json(response);
      return;
    }

    // Update or create preferences
    const preferences = await prisma.userMarketPreferences.upsert({
      where: { userId },
      update: {
        ...(updateData.preferredMarkets && { preferredMarkets: updateData.preferredMarkets }),
        ...(updateData.defaultMarket && { defaultMarket: updateData.defaultMarket }),
        ...(updateData.quickAccessMarkets && { quickAccessMarkets: updateData.quickAccessMarkets }),
        ...(updateData.marketSettings && { marketSettings: updateData.marketSettings }),
        ...(updateData.accountSize && { accountSize: updateData.accountSize }),
        ...(updateData.riskPerTrade && { riskPerTrade: updateData.riskPerTrade }),
        ...(updateData.commissionOverrides && { commissionOverrides: updateData.commissionOverrides }),
        updatedAt: new Date()
      },
      create: {
        userId,
        preferredMarkets: updateData.preferredMarkets || ['ES', 'NQ'],
        defaultMarket: updateData.defaultMarket || 'ES',
        quickAccessMarkets: updateData.quickAccessMarkets || ['ES', 'NQ'],
        marketSettings: updateData.marketSettings || {},
        accountSize: updateData.accountSize || 100000,
        riskPerTrade: updateData.riskPerTrade || 1.0,
        commissionOverrides: updateData.commissionOverrides || {}
      }
    });

    const response: ApiResponse = {
      success: true,
      data: {
        preferredMarkets: preferences.preferredMarkets,
        defaultMarket: preferences.defaultMarket,
        quickAccessMarkets: preferences.quickAccessMarkets,
        marketSettings: preferences.marketSettings,
        accountSize: preferences.accountSize,
        riskPerTrade: preferences.riskPerTrade,
        commissionOverrides: preferences.commissionOverrides
      },
      message: 'Market preferences updated successfully'
    };

    res.json(response);
  } catch (error) {
    logger.error('Error updating user market preferences:', error);

    const response: ApiResponse = {
      success: false,
      error: {
        message: 'Failed to update market preferences',
        statusCode: 500,
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    };

    res.status(500).json(response);
  }
};

/**
 * Validate trade parameters for a specific market
 */
export const validateTradeForMarket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { symbol } = req.params;
    const { entryPrice, quantity, stopLoss, takeProfit } = req.body;

    if (!entryPrice || !quantity) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Entry price and quantity are required',
          statusCode: 400
        }
      };

      res.status(400).json(response);
      return;
    }

    const validation = marketService.validateTrade(
      parseFloat(entryPrice),
      parseInt(quantity),
      symbol,
      stopLoss ? parseFloat(stopLoss) : undefined,
      takeProfit ? parseFloat(takeProfit) : undefined
    );

    const response: ApiResponse = {
      success: true,
      data: validation,
      message: 'Trade validation completed'
    };

    res.json(response);
  } catch (error) {
    logger.error('Error validating trade:', error);

    const response: ApiResponse = {
      success: false,
      error: {
        message: 'Failed to validate trade parameters',
        statusCode: 500,
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    };

    res.status(500).json(response);
  }
};

/**
 * Calculate position size for market
 */
export const calculatePositionSize = async (req: Request, res: Response): Promise<void> => {
  try {
    const { symbol } = req.params;
    const { riskAmount, entryPrice, stopLoss } = req.body;

    if (!riskAmount || !entryPrice || !stopLoss) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Risk amount, entry price, and stop loss are required',
          statusCode: 400
        }
      };

      res.status(400).json(response);
      return;
    }

    const market = marketService.getMarket(symbol);
    if (!market) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: `Market not found: ${symbol}`,
          statusCode: 404
        }
      };

      res.status(404).json(response);
      return;
    }

    const positionSize = marketService.calculatePositionSize(
      parseFloat(riskAmount),
      parseFloat(entryPrice),
      parseFloat(stopLoss),
      market
    );

    const response: ApiResponse = {
      success: true,
      data: { positionSize },
      message: 'Position size calculated successfully'
    };

    res.json(response);
  } catch (error) {
    logger.error('Error calculating position size:', error);

    const response: ApiResponse = {
      success: false,
      error: {
        message: 'Failed to calculate position size',
        statusCode: 500,
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    };

    res.status(500).json(response);
  }
};

/**
 * Get all available markets in simplified format
 * NEW ENDPOINT: Returns MarketInfo[] instead of full ContractSpecification[]
 */
export const getMarketsSimplified = async (req: Request, res: Response): Promise<void> => {
  try {
    const markets = getAllMarketsInfo();

    const response: ApiResponse<MarketInfo[]> = {
      success: true,
      data: markets,
      message: 'Markets retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    logger.error('Error fetching simplified markets:', error);

    const response: ApiResponse = {
      success: false,
      error: {
        message: 'Failed to fetch markets',
        statusCode: 500
      }
    };

    res.status(500).json(response);
  }
};

/**
 * Get specific market details by symbol in simplified format
 * NEW ENDPOINT: Returns MarketInfo instead of full ContractSpecification
 */
export const getMarketBySymbolSimplified = async (req: Request, res: Response): Promise<void> => {
  try {
    const { symbol } = req.params;

    const market = getMarketInfo(symbol);

    if (!market) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: `Market not found: ${symbol}`,
          statusCode: 404
        }
      };

      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<MarketInfo> = {
      success: true,
      data: market,
      message: 'Market retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    logger.error('Error fetching simplified market:', error);

    const response: ApiResponse = {
      success: false,
      error: {
        message: 'Failed to fetch market details',
        statusCode: 500
      }
    };

    res.status(500).json(response);
  }
};