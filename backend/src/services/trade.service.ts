import { TradeDirection, PrismaClient } from '@prisma/client';
import { calculateTradeMetrics as calcMetrics } from '../utils/calculations';
import { marketService } from './market.service';

const prisma = new PrismaClient();

interface TradeData {
  direction: TradeDirection;
  entryPrice: number;
  exitPrice?: number | null;
  quantity: number;
  stopLoss?: number | null;
  takeProfit?: number | null;
  maxFavorablePrice?: number | null;
  maxAdversePrice?: number | null;
  commission?: number;
  market?: string;
}

export const calculateTradeMetrics = (trade: TradeData) => {
  // Use the updated market-aware calculations from utils
  try {
    return calcMetrics(trade);
  } catch (error) {
    console.warn('Failed to calculate market-aware metrics, falling back to basic calculation:', error);

    // Fallback to basic calculation if market-aware calculation fails
    const {
      direction,
      entryPrice,
      exitPrice,
      quantity,
      stopLoss,
      maxFavorablePrice,
      maxAdversePrice,
      commission = 0
    } = trade;

    // If no exit price, return null metrics
    if (!exitPrice) {
      return {
        pnl: null,
        pnlPercentage: null,
        netPnl: null,
        efficiency: null,
        rMultiple: null,
        result: null
      };
    }

    // Calculate P&L
    let pnl: number;
    if (direction === 'LONG') {
      pnl = (exitPrice - entryPrice) * quantity;
    } else {
      pnl = (entryPrice - exitPrice) * quantity;
    }

    // Calculate net P&L (after commission)
    const netPnl = pnl - commission;

    // Calculate P&L percentage
    const pnlPercentage = (pnl / (entryPrice * quantity)) * 100;

    // Determine result
    let result: 'WIN' | 'LOSS' | 'BREAKEVEN';
    if (netPnl > 0) {
      result = 'WIN';
    } else if (netPnl < 0) {
      result = 'LOSS';
    } else {
      result = 'BREAKEVEN';
    }

    // Calculate R-Multiple if stop loss is provided
    let rMultiple: number | null = null;
    if (stopLoss) {
      const risk = Math.abs(entryPrice - stopLoss) * quantity;
      if (risk > 0) {
        rMultiple = netPnl / risk;
      }
    }

    // Calculate efficiency if max prices are provided
    let efficiency: number | null = null;
    if (maxFavorablePrice && maxAdversePrice) {
      let maxPossibleProfit: number;
      let actualProfit: number;

      if (direction === 'LONG') {
        maxPossibleProfit = (maxFavorablePrice - entryPrice) * quantity;
        actualProfit = Math.max(0, pnl);
      } else {
        maxPossibleProfit = (entryPrice - maxAdversePrice) * quantity;
        actualProfit = Math.max(0, pnl);
      }

      if (maxPossibleProfit > 0) {
        efficiency = (actualProfit / maxPossibleProfit) * 100;
      }
    }

    return {
      pnl,
      pnlPercentage,
      netPnl,
      efficiency,
      rMultiple,
      result
    };
  }
};

export const calculateRiskReward = (
  entryPrice: number,
  stopLoss: number | null,
  takeProfit: number | null
): number | null => {
  if (!stopLoss || !takeProfit) return null;

  const risk = Math.abs(entryPrice - stopLoss);
  const reward = Math.abs(takeProfit - entryPrice);

  if (risk === 0) return null;

  return reward / risk;
};

export class TradeService {
  /**
   * Get user trades with optional filtering
   */
  static async getUserTrades(
    userId: string, 
    options?: {
      tradeIds?: string[];
      includeCalculations?: boolean;
      includeOpen?: boolean;
    }
  ) {
    const where: any = { userId };
    
    if (options?.tradeIds && options.tradeIds.length > 0) {
      where.id = { in: options.tradeIds };
    }
    
    if (!options?.includeOpen) {
      where.exitPrice = { not: null };
    }

    const trades = await prisma.trade.findMany({
      where,
      orderBy: { entryDate: 'desc' }
    });

    // Add calculations if requested
    if (options?.includeCalculations) {
      return trades.map(trade => {
        const calculations = calcMetrics(trade);
        return {
          ...trade,
          ...calculations
        };
      });
    }

    return trades;
  }

  /**
   * Get a single trade by ID
   */
  static async getTrade(tradeId: string, userId: string) {
    const trade = await prisma.trade.findFirst({
      where: { id: tradeId, userId }
    });

    if (!trade) {
      throw new Error('Trade not found');
    }

    const calculations = calcMetrics(trade);
    return {
      ...trade,
      ...calculations
    };
  }
}