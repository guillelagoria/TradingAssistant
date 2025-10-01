import { Trade } from '@prisma/client';
import { logger } from '../utils/logger';

export interface StopLossOptimization {
  avgMAEWinners: number;
  avgMAELosers: number;
  avgMAEWinnersPoints: number;
  avgMAELosersPoints: number;
  recommendedStop: number;
  recommendedStopPoints: number;
  stopsAvoided: number;
  stopsAvoidedPercent: number;
  percentile75MAE: number;
  insight: string;
  symbolPointValue: number;
}

export interface TakeProfitOptimization {
  avgMFEAchieved: number;
  avgMFEPoints: number;
  avgExitMFE: number;
  potentialLeftOnTable: number;
  recommendedTarget: number;
  recommendedTargetPoints: number;
  captureRate: number;
  partialExitSuggestion: string;
  insight: string;
  symbolPointValue: number;
}

export interface RiskRewardSetup {
  currentAvgRR: number;
  currentWinRate: number;
  currentExpectancy: number;
  suggestedStop: number;
  suggestedStopPoints: number;
  suggestedTarget: number;
  suggestedTargetPoints: number;
  suggestedRR: number;
  breakEvenWinRate: number;
  expectedPnLPerTrade: number;
  comparison: string;
  symbolPointValue: number;
}

export interface TimingEfficiency {
  bestEntryHours: Array<{ hour: number; avgPnL: number; winRate: number; trades: number }>;
  avgDurationWinners: number;
  avgDurationLosers: number;
  suggestedTimeStop: number;
  breakEvenStats: {
    reachedBE: number;
    reachedBEPercent: number;
    continuedProfit: number;
    continuedProfitPercent: number;
  };
  insight: string;
}

export interface OptimizationInsights {
  stopLoss: StopLossOptimization | null;
  takeProfit: TakeProfitOptimization | null;
  riskReward: RiskRewardSetup | null;
  timing: TimingEfficiency | null;
  minTradesRequired: number;
  currentTrades: number;
  hasEnoughData: boolean;
  dataQuality: {
    hasMAE: number;
    hasMFE: number;
    hasBE: number;
    hasAdvanced: number;
  };
}

export class TradeOptimizationService {
  private static readonly MIN_TRADES = 20;
  private static readonly POINT_VALUES: { [key: string]: number } = {
    ES: 50,    // E-mini S&P 500
    NQ: 20,    // E-mini NASDAQ
    YM: 5,     // E-mini Dow
    RTY: 50,   // E-mini Russell 2000
    MES: 5,    // Micro E-mini S&P 500
    MNQ: 2,    // Micro E-mini NASDAQ
  };

  /**
   * Get point value for a symbol
   */
  private static getPointValue(symbol: string): number {
    // Extract base symbol (remove month/year codes)
    const baseSymbol = symbol.replace(/[0-9]/g, '').toUpperCase();
    return this.POINT_VALUES[baseSymbol] || 50; // Default to ES value
  }

  /**
   * Calculate percentile value from array
   */
  private static percentile(arr: number[], percentile: number): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Calculate Stop Loss optimization
   */
  private static calculateStopLossOptimization(trades: Trade[]): StopLossOptimization | null {
    const tradesWithMAE = trades.filter(t => t.mae !== null && t.mae !== undefined);

    if (tradesWithMAE.length < this.MIN_TRADES) {
      return null;
    }

    const winners = tradesWithMAE.filter(t => (t.pnl || 0) > 0);
    const losers = tradesWithMAE.filter(t => (t.pnl || 0) < 0);

    if (winners.length === 0) return null;

    // Get primary symbol for point value calculation
    const symbolCounts = new Map<string, number>();
    trades.forEach(t => {
      symbolCounts.set(t.symbol, (symbolCounts.get(t.symbol) || 0) + 1);
    });
    const primarySymbol = Array.from(symbolCounts.entries()).sort((a, b) => b[1] - a[1])[0][0];
    const pointValue = this.getPointValue(primarySymbol);

    // Calculate average MAE for winners and losers
    const avgMAEWinners = winners.reduce((sum, t) => sum + Math.abs(t.mae!), 0) / winners.length;
    const avgMAELosers = losers.length > 0
      ? losers.reduce((sum, t) => sum + Math.abs(t.mae!), 0) / losers.length
      : avgMAEWinners * 2;

    // Calculate 75th percentile of MAE in winners (most winners stayed within this)
    const winnersMAE = winners.map(t => Math.abs(t.mae!));
    const percentile75MAE = this.percentile(winnersMAE, 75);

    // Recommended stop: 75th percentile + 15% buffer
    const recommendedStop = percentile75MAE * 1.15;
    const recommendedStopPoints = recommendedStop / pointValue;

    // Calculate how many premature stops would be avoided
    const wouldHaveBeenStopped = winners.filter(t => Math.abs(t.mae!) <= recommendedStop).length;
    const stopsAvoided = winners.length - wouldHaveBeenStopped;
    const stopsAvoidedPercent = (stopsAvoided / winners.length) * 100;

    let insight = '';
    if (stopsAvoidedPercent > 20) {
      insight = `${stopsAvoidedPercent.toFixed(0)}% of your winning trades had MAE within $${recommendedStop.toFixed(2)}`;
    } else if (avgMAEWinners < avgMAELosers * 0.5) {
      insight = 'Your winners typically have smaller adverse excursions. Current stops may be too wide.';
    } else {
      insight = `Recommended stop would have kept ${wouldHaveBeenStopped} of ${winners.length} winners alive.`;
    }

    return {
      avgMAEWinners,
      avgMAELosers,
      avgMAEWinnersPoints: avgMAEWinners / pointValue,
      avgMAELosersPoints: avgMAELosers / pointValue,
      recommendedStop,
      recommendedStopPoints,
      stopsAvoided,
      stopsAvoidedPercent,
      percentile75MAE,
      insight,
      symbolPointValue: pointValue
    };
  }

  /**
   * Calculate Take Profit optimization
   */
  private static calculateTakeProfitOptimization(trades: Trade[]): TakeProfitOptimization | null {
    const tradesWithMFE = trades.filter(t =>
      t.mfe !== null &&
      t.mfe !== undefined &&
      t.exitPrice !== null
    );

    if (tradesWithMFE.length < this.MIN_TRADES) {
      return null;
    }

    // Get primary symbol for point value calculation
    const symbolCounts = new Map<string, number>();
    trades.forEach(t => {
      symbolCounts.set(t.symbol, (symbolCounts.get(t.symbol) || 0) + 1);
    });
    const primarySymbol = Array.from(symbolCounts.entries()).sort((a, b) => b[1] - a[1])[0][0];
    const pointValue = this.getPointValue(primarySymbol);

    // Calculate average MFE achieved
    const avgMFEAchieved = tradesWithMFE.reduce((sum, t) => sum + Math.abs(t.mfe!), 0) / tradesWithMFE.length;

    // Calculate actual exit vs MFE
    const avgExitPnL = tradesWithMFE.reduce((sum, t) => sum + Math.abs(t.pnl || 0), 0) / tradesWithMFE.length;

    // Potential left on table
    const potentialLeftOnTable = avgMFEAchieved - avgExitPnL;

    // Recommended target: 70-75% of average MFE (professional capture rate)
    const recommendedTarget = avgMFEAchieved * 0.72;
    const recommendedTargetPoints = recommendedTarget / pointValue;

    // Calculate current capture rate
    const captureRate = avgExitPnL > 0 ? (avgExitPnL / avgMFEAchieved) * 100 : 0;

    // Partial exit suggestion
    let partialExitSuggestion = '';
    if (captureRate < 50) {
      partialExitSuggestion = `Consider taking 50% at ${(avgMFEAchieved * 0.5 / pointValue).toFixed(1)} pts, trail the rest`;
    } else if (captureRate < 70) {
      partialExitSuggestion = `Consider taking 50% at ${(avgMFEAchieved * 0.6 / pointValue).toFixed(1)} pts, 50% at ${(avgMFEAchieved * 0.9 / pointValue).toFixed(1)} pts`;
    } else {
      partialExitSuggestion = 'Your capture rate is good. Consider trailing stops to maximize.';
    }

    const insight = captureRate < 60
      ? `You're only capturing ${captureRate.toFixed(0)}% of potential profit. Consider earlier partial exits.`
      : `Good profit capture at ${captureRate.toFixed(0)}%. Focus on consistency.`;

    return {
      avgMFEAchieved,
      avgMFEPoints: avgMFEAchieved / pointValue,
      avgExitMFE: avgExitPnL,
      potentialLeftOnTable,
      recommendedTarget,
      recommendedTargetPoints,
      captureRate,
      partialExitSuggestion,
      insight,
      symbolPointValue: pointValue
    };
  }

  /**
   * Calculate Risk:Reward Setup optimization
   */
  private static calculateRiskRewardSetup(
    trades: Trade[],
    stopLoss: StopLossOptimization | null,
    takeProfit: TakeProfitOptimization | null
  ): RiskRewardSetup | null {
    const closedTrades = trades.filter(t => t.exitPrice !== null && t.netPnl !== null);

    if (closedTrades.length < this.MIN_TRADES) {
      return null;
    }

    // Get primary symbol for point value calculation
    const symbolCounts = new Map<string, number>();
    trades.forEach(t => {
      symbolCounts.set(t.symbol, (symbolCounts.get(t.symbol) || 0) + 1);
    });
    const primarySymbol = Array.from(symbolCounts.entries()).sort((a, b) => b[1] - a[1])[0][0];
    const pointValue = this.getPointValue(primarySymbol);

    // Current metrics
    const winners = closedTrades.filter(t => (t.pnl || 0) > 0);
    const losers = closedTrades.filter(t => (t.pnl || 0) < 0);

    const avgWin = winners.length > 0
      ? winners.reduce((sum, t) => sum + (t.netPnl!), 0) / winners.length
      : 0;
    const avgLoss = losers.length > 0
      ? Math.abs(losers.reduce((sum, t) => sum + (t.netPnl!), 0) / losers.length)
      : 0;

    const currentWinRate = (winners.length / closedTrades.length) * 100;
    const currentAvgRR = avgLoss > 0 ? avgWin / avgLoss : 0;
    const currentExpectancy = (currentWinRate / 100) * avgWin - ((100 - currentWinRate) / 100) * avgLoss;

    // Suggested setup based on optimization data
    const suggestedStop = stopLoss?.recommendedStop || avgLoss;
    const suggestedTarget = takeProfit?.recommendedTarget || avgWin;
    const suggestedRR = suggestedTarget / suggestedStop;

    // Calculate break-even win rate for suggested setup
    const breakEvenWinRate = (1 / (1 + suggestedRR)) * 100;

    // Expected P&L per trade with suggested setup
    const expectedPnLPerTrade = (currentWinRate / 100) * suggestedTarget -
                                ((100 - currentWinRate) / 100) * suggestedStop;

    let comparison = '';
    if (expectedPnLPerTrade > currentExpectancy) {
      const improvement = ((expectedPnLPerTrade - currentExpectancy) / Math.abs(currentExpectancy)) * 100;
      comparison = `${improvement.toFixed(0)}% improvement over current setup`;
    } else if (currentWinRate > breakEvenWinRate + 5) {
      comparison = `Your ${currentWinRate.toFixed(0)}% win rate exceeds required ${breakEvenWinRate.toFixed(0)}%`;
    } else {
      comparison = `Need ${breakEvenWinRate.toFixed(0)}% win rate to break even`;
    }

    return {
      currentAvgRR,
      currentWinRate,
      currentExpectancy,
      suggestedStop,
      suggestedStopPoints: suggestedStop / pointValue,
      suggestedTarget,
      suggestedTargetPoints: suggestedTarget / pointValue,
      suggestedRR,
      breakEvenWinRate,
      expectedPnLPerTrade,
      comparison,
      symbolPointValue: pointValue
    };
  }

  /**
   * Calculate Timing & Efficiency insights
   */
  private static calculateTimingEfficiency(trades: Trade[]): TimingEfficiency | null {
    const closedTrades = trades.filter(t => t.exitPrice !== null && t.exitDate !== null);

    if (closedTrades.length < this.MIN_TRADES) {
      return null;
    }

    // Analyze by entry hour
    const hourMap = new Map<number, { trades: Trade[]; totalPnL: number }>();

    closedTrades.forEach(trade => {
      const entryDate = new Date(trade.entryDate);
      const hour = entryDate.getHours();

      if (!hourMap.has(hour)) {
        hourMap.set(hour, { trades: [], totalPnL: 0 });
      }
      const hourData = hourMap.get(hour)!;
      hourData.trades.push(trade);
      hourData.totalPnL += trade.netPnl || 0;
    });

    // Calculate best entry hours
    const bestEntryHours = Array.from(hourMap.entries())
      .map(([hour, data]) => ({
        hour,
        avgPnL: data.totalPnL / data.trades.length,
        winRate: (data.trades.filter(t => (t.pnl || 0) > 0).length / data.trades.length) * 100,
        trades: data.trades.length
      }))
      .filter(h => h.trades >= 3) // Only include hours with significant data
      .sort((a, b) => b.avgPnL - a.avgPnL)
      .slice(0, 3);

    // Calculate average duration
    const tradesWithDuration = closedTrades.filter(t => t.durationMinutes !== null);
    const winners = tradesWithDuration.filter(t => (t.pnl || 0) > 0);
    const losers = tradesWithDuration.filter(t => (t.pnl || 0) < 0);

    const avgDurationWinners = winners.length > 0
      ? winners.reduce((sum, t) => sum + (t.durationMinutes!), 0) / winners.length
      : 0;
    const avgDurationLosers = losers.length > 0
      ? losers.reduce((sum, t) => sum + (t.durationMinutes!), 0) / losers.length
      : 0;

    // Suggested time stop: if no movement after X minutes
    const suggestedTimeStop = avgDurationWinners > 0
      ? Math.ceil(avgDurationWinners * 0.5)
      : 30;

    // Break-even statistics
    const tradesWithBE = trades.filter(t => t.breakEvenWorked !== null);
    const reachedBE = tradesWithBE.filter(t => t.breakEvenWorked === true).length;
    const continuedProfit = tradesWithBE.filter(t =>
      t.breakEvenWorked === true && (t.pnl || 0) > 0
    ).length;

    let insight = '';
    if (bestEntryHours.length > 0) {
      const bestHour = bestEntryHours[0];
      insight = `Best performance at ${bestHour.hour}:00-${bestHour.hour + 1}:00 with ${bestHour.winRate.toFixed(0)}% win rate`;
    } else {
      insight = 'Need more data to identify optimal trading hours';
    }

    return {
      bestEntryHours,
      avgDurationWinners,
      avgDurationLosers,
      suggestedTimeStop,
      breakEvenStats: {
        reachedBE,
        reachedBEPercent: tradesWithBE.length > 0 ? (reachedBE / tradesWithBE.length) * 100 : 0,
        continuedProfit,
        continuedProfitPercent: reachedBE > 0 ? (continuedProfit / reachedBE) * 100 : 0
      },
      insight
    };
  }

  /**
   * Get comprehensive optimization insights
   */
  static async getOptimizationInsights(trades: Trade[]): Promise<OptimizationInsights> {
    try {
      logger.info(`Calculating optimization insights for ${trades.length} trades`);

      // Data quality assessment
      const dataQuality = {
        hasMAE: trades.filter(t => t.mae !== null).length,
        hasMFE: trades.filter(t => t.mfe !== null).length,
        hasBE: trades.filter(t => t.breakEvenWorked !== null).length,
        hasAdvanced: trades.filter(t => t.hasAdvancedData === true).length
      };

      const hasEnoughData = trades.length >= this.MIN_TRADES;

      // Calculate each optimization component
      const stopLoss = this.calculateStopLossOptimization(trades);
      const takeProfit = this.calculateTakeProfitOptimization(trades);
      const riskReward = this.calculateRiskRewardSetup(trades, stopLoss, takeProfit);
      const timing = this.calculateTimingEfficiency(trades);

      return {
        stopLoss,
        takeProfit,
        riskReward,
        timing,
        minTradesRequired: this.MIN_TRADES,
        currentTrades: trades.length,
        hasEnoughData,
        dataQuality
      };
    } catch (error) {
      logger.error('Error calculating optimization insights:', error);
      throw error;
    }
  }
}
