import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../server';
import { calculateTradeMetrics } from '../services/trade.service';
import { BECalculationsService } from '../services/bECalculations.service';
import { accountService } from '../services/account.service';
import { convertPointsToDollars } from '../utils/symbolUtils';

export const getTrades = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      accountId,
      symbol,
      market,
      strategy,
      direction,
      result,
      startDate,
      endDate,
      sortBy = 'entryDate',
      sortOrder = 'desc'
    } = req.query;

    console.log('📊 [getTrades] === GET TRADES REQUEST ===');
    console.log('📊 [getTrades] Query params:', req.query);

    const skip = (Number(page) - 1) * Number(limit);

    // Temporarily use a default test user ID for development
    // TODO: Remove when authentication is properly implemented
    const userId = req.userId || 'test-user-id';
    console.log('📊 [getTrades] Using userId:', userId);
    
    const where: any = {
      userId
    };

    if (accountId) where.accountId = String(accountId);
    if (symbol) where.symbol = { contains: String(symbol), mode: 'insensitive' };
    if (market) where.market = String(market);
    if (strategy) where.strategy = String(strategy);
    if (direction) where.direction = String(direction);
    if (result) where.result = String(result);
    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) where.entryDate.gte = new Date(String(startDate));
      if (endDate) where.entryDate.lte = new Date(String(endDate));
    }

    console.log('📊 [getTrades] Where clause:', JSON.stringify(where, null, 2));

    const [trades, total] = await Promise.all([
      prisma.trade.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [String(sortBy)]: String(sortOrder) }
      }),
      prisma.trade.count({ where })
    ]);

    console.log('📊 [getTrades] Found', trades.length, 'trades, total:', total);

    res.json({
      success: true,
      data: {
        trades,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getTrade = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Temporarily use a default test user ID for development
    const userId = req.userId || 'test-user-id';
    
    const trade = await prisma.trade.findFirst({
      where: {
        id: req.params.id,
        userId
      },
    });

    if (!trade) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Trade not found',
          statusCode: 404
        }
      });
      return;
    }

    res.json({
      success: true,
      data: trade
    });
  } catch (error) {
    next(error);
  }
};

export const createTrade = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('=== CREATE TRADE CALLED ===');
    console.log('Request method:', req.method);
    console.log('Request path:', req.path);

    // Temporarily use a default test user ID for development
    const userId = req.userId || 'test-user-id';

    // Ensure test user exists
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: 'test@example.com',
        password: 'test-password',
        name: 'Test User'
      }
    });

    console.log('Creating trade with body size:', JSON.stringify(req.body).length, 'bytes');
    console.log('ImageUrl size:', req.body.imageUrl ? req.body.imageUrl.length : 0, 'characters');
    console.log('Trade data keys:', Object.keys(req.body));

    // Get accountId from request or use default account
    let accountId = req.body.accountId;

    if (!accountId) {
      // If no accountId provided, get user's default account
      const defaultAccount = await accountService.getDefaultAccount(userId);
      if (!defaultAccount) {
        // Create a default account if user has none
        const newAccount = await accountService.createAccount(userId, {
          name: 'Default Account',
          creationDate: new Date(),
          initialBalance: 10000,
          currency: 'USD'
        });
        accountId = newAccount.id;
      } else {
        accountId = defaultAccount.id;
      }
    } else {
      // Verify the account belongs to the user
      const accountBelongsToUser = await accountService.validateAccountOwnership(accountId, userId);
      if (!accountBelongsToUser) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Access denied: Account does not belong to user',
            statusCode: 403
          }
        });
        return;
      }
    }

    // Auto-derive market from symbol if not provided
    const market = req.body.market || req.body.symbol;

    const tradeData = {
      ...req.body,
      userId,
      accountId,
      market, // Use derived market
      entryDate: new Date(req.body.entryDate),
      exitDate: req.body.exitDate ? new Date(req.body.exitDate) : null
    };

    console.log('Trade data before metrics calculation:', tradeData);

    // Validate BE fields if they are provided
    if (req.body.maxPotentialProfit !== undefined || req.body.maxDrawdown !== undefined || req.body.breakEvenWorked !== undefined) {
      const beValidation = BECalculationsService.validateBEFields(tradeData);

      if (!beValidation.isValid) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid Break-Even Analysis fields',
            errors: beValidation.errors,
            warnings: beValidation.warnings,
            statusCode: 400
          }
        });
        return;
      }

      // Log warnings if any
      if (beValidation.warnings.length > 0) {
        console.warn('BE field warnings for trade:', beValidation.warnings);
      }
    }

    // Calculate trade metrics
    const metrics = calculateTradeMetrics(tradeData);

    console.log('Calculated metrics:', metrics);

    // Clean data to match Prisma schema exactly
    const cleanTradeData = {
      userId,
      accountId,
      symbol: tradeData.symbol,
      market: tradeData.market, // Use derived market from above
      direction: tradeData.direction,
      orderType: tradeData.orderType,
      strategyId: null, // TODO: Handle strategy name to ID mapping
      entryDate: tradeData.entryDate,
      entryPrice: tradeData.entryPrice,
      quantity: tradeData.quantity,
      exitDate: tradeData.exitDate,
      exitPrice: tradeData.exitPrice || null,
      stopLoss: tradeData.stopLoss || null,
      takeProfit: tradeData.takeProfit || null,
      maxFavorablePrice: tradeData.maxFavorablePrice || null,
      maxAdversePrice: tradeData.maxAdversePrice || null,
      // NEW: BE Analysis fields
      maxPotentialProfit: tradeData.maxPotentialProfit || null,
      maxDrawdown: tradeData.maxDrawdown || null,
      breakEvenWorked: tradeData.breakEvenWorked || false,
      timeframe: tradeData.timeframe || null,
      result: tradeData.result || null,
      notes: tradeData.notes || null,
      imageUrl: tradeData.imageUrl || null,
      pnl: metrics.pnl,
      pnlPercentage: metrics.pnlPercentage,
      commission: (metrics && 'commission' in metrics) ? metrics.commission : 0,
      netPnl: metrics.netPnl,
      efficiency: metrics.efficiency,
      rMultiple: metrics.rMultiple,
    };

    console.log('Clean trade data for Prisma:', cleanTradeData);

    const trade = await prisma.trade.create({
      data: cleanTradeData,
    });

    // Update account balance after creating trade
    try {
      await accountService.recalculateAccountBalance(accountId, userId);
    } catch (balanceError) {
      console.warn('Failed to update account balance after creating trade:', balanceError);
      // Don't fail the trade creation if balance update fails
    }

    res.status(201).json({
      success: true,
      data: trade
    });
  } catch (error) {
    console.error('Error creating trade:', error);

    // Check for Prisma validation errors
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Prisma error code:', error.code);
      console.error('Prisma error meta:', (error as any).meta);
    }

    // Send more detailed error response for debugging
    res.status(400).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to create trade',
        statusCode: 400,
        details: error instanceof Error ? error.stack : error
      }
    });
  }
};

export const updateTrade = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Temporarily use a default test user ID for development
    const userId = req.userId || 'test-user-id';
    
    // Check if trade exists and belongs to user
    const existingTrade = await prisma.trade.findFirst({
      where: {
        id: req.params.id,
        userId
      }
    });

    if (!existingTrade) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Trade not found',
          statusCode: 404
        }
      });
      return;
    }

    const updateData = {
      ...req.body,
      entryDate: req.body.entryDate ? new Date(req.body.entryDate) : undefined,
      exitDate: req.body.exitDate ? new Date(req.body.exitDate) : undefined
    };

    // Validate BE fields if they are being updated
    if (req.body.maxPotentialProfit !== undefined || req.body.maxDrawdown !== undefined || req.body.breakEvenWorked !== undefined) {
      const mergedTradeData = { ...existingTrade, ...updateData };
      const beValidation = BECalculationsService.validateBEFields(mergedTradeData);

      if (!beValidation.isValid) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid Break-Even Analysis fields',
            errors: beValidation.errors,
            warnings: beValidation.warnings,
            statusCode: 400
          }
        });
        return;
      }

      // Log warnings if any
      if (beValidation.warnings.length > 0) {
        console.warn('BE field warnings for trade update:', beValidation.warnings);
      }
    }

    // Recalculate metrics if price data changed
    const metrics = calculateTradeMetrics({ ...existingTrade, ...updateData });

    const trade = await prisma.trade.update({
      where: { id: req.params.id },
      data: {
        ...updateData,
        ...metrics
      },
    });

    // Update account balance after updating trade
    try {
      await accountService.recalculateAccountBalance(existingTrade.accountId, userId);
    } catch (balanceError) {
      console.warn('Failed to update account balance after updating trade:', balanceError);
      // Don't fail the trade update if balance update fails
    }

    res.json({
      success: true,
      data: trade
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTrade = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Temporarily use a default test user ID for development
    const userId = req.userId || 'test-user-id';
    
    // Check if trade exists and belongs to user
    const trade = await prisma.trade.findFirst({
      where: {
        id: req.params.id,
        userId
      }
    });

    if (!trade) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Trade not found',
          statusCode: 404
        }
      });
      return;
    }

    // Store accountId before deletion for balance update
    const accountId = trade.accountId;

    await prisma.trade.delete({
      where: { id: req.params.id }
    });

    // Update account balance after deleting trade
    try {
      await accountService.recalculateAccountBalance(accountId, userId);
    } catch (balanceError) {
      console.warn('Failed to update account balance after deleting trade:', balanceError);
      // Don't fail the trade deletion if balance update fails
    }

    res.json({
      success: true,
      message: 'Trade deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const bulkDelete = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { ids } = req.body;

    // Temporarily use a default test user ID for development
    const userId = req.userId || 'test-user-id';

    // Get affected accounts before deletion for balance updates
    const tradesToDelete = await prisma.trade.findMany({
      where: {
        id: { in: ids },
        userId
      },
      select: {
        accountId: true
      }
    });

    const affectedAccountIds = [...new Set(tradesToDelete.map(t => t.accountId))];

    const result = await prisma.trade.deleteMany({
      where: {
        id: { in: ids },
        userId
      }
    });

    // Update balance for all affected accounts
    for (const accountId of affectedAccountIds) {
      try {
        await accountService.recalculateAccountBalance(accountId, userId);
      } catch (balanceError) {
        console.warn(`Failed to update account balance for account ${accountId} after bulk delete:`, balanceError);
        // Continue with other accounts even if one fails
      }
    }

    res.json({
      success: true,
      data: {
        deleted: result.count
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createQuickTrade = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const startTime = Date.now();

    // Temporarily use a default test user ID for development
    const userId = req.userId || 'test-user-id';

    // Ensure test user exists (minimal check for performance)
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: 'test@example.com',
        password: 'test-password',
        name: 'Test User'
      }
    });

    // Get accountId from request or use default account
    let accountId = req.body.accountId;

    if (!accountId) {
      // Quick account lookup/creation
      const defaultAccount = await accountService.getDefaultAccount(userId);
      if (!defaultAccount) {
        const newAccount = await accountService.createAccount(userId, {
          name: 'Default Account',
          creationDate: new Date(),
          initialBalance: 10000,
          currency: 'USD'
        });
        accountId = newAccount.id;
      } else {
        accountId = defaultAccount.id;
      }
    }

    // Handle both JSON and FormData requests
    let tradeData: any;
    let imageFile: any = null;

    if (req.body.tradeData) {
      // FormData request with image
      tradeData = JSON.parse(req.body.tradeData);
      imageFile = req.file;
    } else {
      // Regular JSON request
      tradeData = req.body;
    }

    // Extract minimal required fields for quick entry
    const { symbol, direction, entryPrice, quantity, stopLoss, result } = tradeData;

    // Validate required fields
    if (!symbol || !direction || !entryPrice || !quantity) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Missing required fields: symbol, direction, entryPrice, quantity',
          statusCode: 400
        }
      });
      return;
    }

    // Auto-derive market from symbol if not provided
    const market = req.body.market || symbol;

    // Convert points to dollars based on symbol
    // The 'result' field contains points, we need to convert to dollars
    const resultPoints = result ? Number(result) : 0;
    const pnlValue = resultPoints !== 0 ? convertPointsToDollars(symbol, resultPoints, Number(quantity)) : 0;

    let resultEnum = null;
    if (pnlValue > 0) {
      resultEnum = 'WIN';
    } else if (pnlValue < 0) {
      resultEnum = 'LOSS';
    } else if (pnlValue === 0) {
      resultEnum = 'BREAKEVEN';
    }

    // Quick trade data with smart defaults
    const quickTradeData = {
      userId,
      accountId,
      symbol: symbol.toUpperCase(),
      market: market.toUpperCase(),
      direction,
      orderType: 'MARKET', // Default to market order for quick entry
      entryDate: new Date(),
      entryPrice: Number(entryPrice),
      quantity: Number(quantity),
      exitDate: new Date(), // Set exit date since we have the result
      exitPrice: null, // We'll calculate this if needed
      stopLoss: stopLoss ? Number(stopLoss) : null,
      takeProfit: null,
      maxFavorablePrice: null,
      maxAdversePrice: null,
      maxPotentialProfit: null,
      maxDrawdown: null,
      breakEvenWorked: false,
      timeframe: null,
      result: resultEnum,
      notes: 'Quick Logger Entry',
      imageUrl: null,
      source: 'QUICK_LOGGER',
      pnl: pnlValue
    };

    // Calculate basic metrics (minimal calculation for speed)
    const metrics = calculateTradeMetrics(quickTradeData);

    // Merge with calculated metrics, but keep our PnL value
    const finalTradeData = {
      ...quickTradeData,
      pnl: pnlValue, // Keep the user-provided result value
      pnlPercentage: metrics.pnlPercentage,
      commission: metrics.commission || 0,
      netPnl: pnlValue - (metrics.commission || 0), // Net PnL = PnL - Commission
      efficiency: metrics.efficiency,
      rMultiple: metrics.rMultiple,
    };

    // Handle image URL if file was uploaded
    if (imageFile) {
      finalTradeData.imageUrl = `/uploads/trade-images/${imageFile.filename}`;
    }

    // Create trade with optimized single transaction
    const trade = await prisma.trade.create({
      data: finalTradeData,
    });

    // Skip balance update for quick entry (can be done async)
    // This saves ~20-30ms per request
    setImmediate(async () => {
      try {
        await accountService.recalculateAccountBalance(accountId, userId);
      } catch (error) {
        console.warn('Background balance update failed:', error);
      }
    });

    const responseTime = Date.now() - startTime;

    res.status(201).json({
      success: true,
      data: trade,
      meta: {
        source: 'QUICK_LOGGER',
        responseTime: `${responseTime}ms`
      }
    });
  } catch (error) {
    console.error('Error in createQuickTrade:', error);

    res.status(400).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to create quick trade',
        statusCode: 400,
        source: 'QUICK_LOGGER'
      }
    });
  }
};