import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../server';
import { 
  calculateDashboardStats,
  calculateProfitLossChart,
  calculateEfficiencyAnalysis,
  calculateWhatIfScenarios,
  calculateStrategyPerformance
} from '../services/stats.service';

export const getDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    const where: any = { userId: req.userId };
    
    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) where.entryDate.gte = new Date(String(startDate));
      if (endDate) where.entryDate.lte = new Date(String(endDate));
    }

    const trades = await prisma.trade.findMany({
      where,
      orderBy: { entryDate: 'asc' }
    });

    const stats = calculateDashboardStats(trades);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

export const getProfitLossChart = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { period = 'month', startDate, endDate } = req.query;
    
    const where: any = { 
      userId: req.userId,
      exitDate: { not: null }
    };
    
    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) where.entryDate.gte = new Date(String(startDate));
      if (endDate) where.entryDate.lte = new Date(String(endDate));
    }

    const trades = await prisma.trade.findMany({
      where,
      orderBy: { entryDate: 'asc' }
    });

    const chartData = calculateProfitLossChart(trades, String(period));

    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    next(error);
  }
};

export const getEfficiencyAnalysis = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    const where: any = { 
      userId: req.userId,
      exitDate: { not: null },
      maxFavorablePrice: { not: null },
      maxAdversePrice: { not: null }
    };
    
    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) where.entryDate.gte = new Date(String(startDate));
      if (endDate) where.entryDate.lte = new Date(String(endDate));
    }

    const trades = await prisma.trade.findMany({
      where,
      orderBy: { entryDate: 'asc' }
    });

    const analysis = calculateEfficiencyAnalysis(trades);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
};

export const getWhatIfAnalysis = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { scenario, startDate, endDate } = req.query;
    
    const where: any = { 
      userId: req.userId,
      exitDate: { not: null }
    };
    
    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) where.entryDate.gte = new Date(String(startDate));
      if (endDate) where.entryDate.lte = new Date(String(endDate));
    }

    const trades = await prisma.trade.findMany({
      where,
      orderBy: { entryDate: 'asc' }
    });

    const analysis = calculateWhatIfScenarios(trades, String(scenario));

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
};

export const getStrategyPerformance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    const where: any = { 
      userId: req.userId,
      exitDate: { not: null },
      strategyId: { not: null }
    };
    
    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) where.entryDate.gte = new Date(String(startDate));
      if (endDate) where.entryDate.lte = new Date(String(endDate));
    }

    const trades = await prisma.trade.findMany({
      where,
      include: { strategy: true },
      orderBy: { entryDate: 'asc' }
    });

    const performance = calculateStrategyPerformance(trades);

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    next(error);
  }
};