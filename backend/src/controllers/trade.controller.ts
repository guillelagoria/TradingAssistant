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
      strategyId,
      direction,
      result,
      startDate,
      endDate,
      sortBy = 'entryDate',
      sortOrder = 'desc'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {
      userId: req.userId
    };

    if (symbol) where.symbol = { contains: String(symbol), mode: 'insensitive' };
    if (strategyId) where.strategyId = String(strategyId);
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
        orderBy: { [String(sortBy)]: String(sortOrder) },
        include: {
          strategy: true
        }
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
    const trade = await prisma.trade.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      },
      include: {
        strategy: true
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
    const tradeData = {
      ...req.body,
      userId: req.userId!,
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
      include: {
        strategy: true
      }
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
    // Check if trade exists and belongs to user
    const existingTrade = await prisma.trade.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
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
      include: {
        strategy: true
      }
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
    // Check if trade exists and belongs to user
    const trade = await prisma.trade.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
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

    const result = await prisma.trade.deleteMany({
      where: {
        id: { in: ids },
        userId: req.userId
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