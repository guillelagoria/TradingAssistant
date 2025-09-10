import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../server';
import { calculateTradeMetrics } from '../services/trade.service';

export const getTrades = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      symbol,
      strategy,
      direction,
      result,
      startDate,
      endDate,
      sortBy = 'entryDate',
      sortOrder = 'desc'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    
    // Temporarily use a default test user ID for development
    // TODO: Remove when authentication is properly implemented
    const userId = req.userId || 'test-user-id';
    
    const where: any = {
      userId
    };

    if (symbol) where.symbol = { contains: String(symbol), mode: 'insensitive' };
    if (strategy) where.strategy = String(strategy);
    if (direction) where.direction = String(direction);
    if (result) where.result = String(result);
    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) where.entryDate.gte = new Date(String(startDate));
      if (endDate) where.entryDate.lte = new Date(String(endDate));
    }

    const [trades, total] = await Promise.all([
      prisma.trade.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [String(sortBy)]: String(sortOrder) }
      }),
      prisma.trade.count({ where })
    ]);

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
    // Temporarily use a default test user ID for development
    const userId = req.userId || 'test-user-id';
    
    const tradeData = {
      ...req.body,
      userId,
      entryDate: new Date(req.body.entryDate),
      exitDate: req.body.exitDate ? new Date(req.body.exitDate) : null
    };

    // Calculate trade metrics
    const metrics = calculateTradeMetrics(tradeData);
    
    const trade = await prisma.trade.create({
      data: {
        ...tradeData,
        ...metrics
      },
    });

    res.status(201).json({
      success: true,
      data: trade
    });
  } catch (error) {
    next(error);
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

    // Recalculate metrics if price data changed
    const metrics = calculateTradeMetrics({ ...existingTrade, ...updateData });

    const trade = await prisma.trade.update({
      where: { id: req.params.id },
      data: {
        ...updateData,
        ...metrics
      },
    });

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

    await prisma.trade.delete({
      where: { id: req.params.id }
    });

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
    
    const result = await prisma.trade.deleteMany({
      where: {
        id: { in: ids },
        userId
      }
    });

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