/**
 * Break-Even Metrics Service
 * Aggregated metrics and analytics specifically for Break-Even effectiveness
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface BEMetricsTimeframe {
  period: '1m' | '3m' | '6m' | '1y' | 'all';
  startDate?: Date;
  endDate?: Date;
}

interface BEEffectivenessMetrics {
  totalTrades: number;
  tradesWithBE: number;
  beUsageRate: number;
  beSuccessRate: number;
  avgProtectedAmount: number;
  avgMissedProfit: number;
  netBEImpact: number;
  bestPerformingStrategy?: string;
  worstPerformingStrategy?: string;
  byStrategy: BEStrategyMetrics[];
  bySymbol: BESymbolMetrics[];
  byTimeframe: BETimeframeMetrics[];
  trends: BETrendMetrics;
}

interface BEStrategyMetrics {
  strategy: string;
  totalTrades: number;
  beUsageRate: number;
  beSuccessRate: number;
  netImpact: number;
  recommendation: 'increase' | 'decrease' | 'optimize' | 'maintain';
}

interface BESymbolMetrics {
  symbol: string;
  totalTrades: number;
  beUsageRate: number;
  beSuccessRate: number;
  avgVolatility: number;
  netImpact: number;
  recommendation: string;
}

interface BETimeframeMetrics {
  timeframe: string;
  totalTrades: number;
  beUsageRate: number;
  beSuccessRate: number;
  netImpact: number;
  recommendation: string;
}

interface BETrendMetrics {
  monthlyBEUsage: Array<{ month: string; usage: number; success: number }>;
  quarterly: Array<{ quarter: string; netImpact: number; improvement: number }>;
  yearOverYear?: Array<{ year: number; metrics: BEEffectivenessMetrics }>;
}

interface RiskAdjustedMetrics {
  sharpeRatioWithBE: number;
  sharpeRatioWithoutBE: number;
  maxDrawdownWithBE: number;
  maxDrawdownWithoutBE: number;
  calmarRatioWithBE: number;
  calmarRatioWithoutBE: number;
  volatilityReduction: number;
  riskAdjustedReturn: number;
}

interface BEPortfolioImpact {
  totalPortfolioValue: number;
  beContribution: number;
  beContributionPercent: number;
  alternativeScenario: number;
  totalOpportunityValue: number;
  efficiency: number;
}

export class BEMetricsService {

  /**
   * Get comprehensive BE effectiveness metrics
   */
  static async getBEEffectivenessMetrics(
    userId: string,
    timeframe: BEMetricsTimeframe = { period: 'all' }
  ): Promise<BEEffectivenessMetrics> {
    const whereClause = this.buildWhereClause(userId, timeframe);

    const [allTrades, tradesWithBE] = await Promise.all([
      prisma.trade.findMany({
        where: whereClause,
        include: { strategy: true },
        orderBy: { entryDate: 'desc' }
      }),
      prisma.trade.findMany({
        where: {
          ...whereClause,
          breakEvenWorked: { not: null }
        },
        include: { strategy: true },
        orderBy: { entryDate: 'desc' }
      })
    ]);

    const totalTrades = allTrades.length;
    const tradesWithBECount = tradesWithBE.length;
    const beUsageRate = totalTrades > 0 ? (tradesWithBECount / totalTrades) * 100 : 0;

    const successfulBE = tradesWithBE.filter(t => t.breakEvenWorked === true);
    const beSuccessRate = tradesWithBECount > 0 ? (successfulBE.length / tradesWithBECount) * 100 : 0;

    // Calculate protected and missed amounts
    let totalProtected = 0;
    let totalMissed = 0;
    let protectedCount = 0;
    let missedCount = 0;

    for (const trade of tradesWithBE) {
      if (trade.breakEvenWorked && trade.pnl && trade.pnl > 0) {
        totalProtected += trade.pnl;
        protectedCount++;
      } else if (!trade.breakEvenWorked && trade.maxPotentialProfit && trade.exitPrice) {
        const missed = this.calculateMissedProfit(trade);
        if (missed > 0) {
          totalMissed += missed;
          missedCount++;
        }
      }
    }

    const avgProtectedAmount = protectedCount > 0 ? totalProtected / protectedCount : 0;
    const avgMissedProfit = missedCount > 0 ? totalMissed / missedCount : 0;
    const netBEImpact = totalProtected - totalMissed;

    // Calculate by-strategy metrics
    const byStrategy = await this.calculateBEByStrategy(userId, timeframe);
    const bySymbol = await this.calculateBEBySymbol(userId, timeframe);
    const byTimeframe = await this.calculateBEByTimeframe(userId, timeframe);

    // Find best and worst performing strategies
    const bestStrategy = byStrategy.reduce((best, current) =>
      current.netImpact > best.netImpact ? current : best,
      byStrategy[0]
    );
    const worstStrategy = byStrategy.reduce((worst, current) =>
      current.netImpact < worst.netImpact ? current : worst,
      byStrategy[0]
    );

    // Calculate trends
    const trends = await this.calculateBETrends(userId, timeframe);

    return {
      totalTrades,
      tradesWithBE: tradesWithBECount,
      beUsageRate,
      beSuccessRate,
      avgProtectedAmount,
      avgMissedProfit,
      netBEImpact,
      bestPerformingStrategy: bestStrategy?.strategy,
      worstPerformingStrategy: worstStrategy?.strategy,
      byStrategy,
      bySymbol,
      byTimeframe,
      trends
    };
  }

  /**
   * Calculate risk-adjusted metrics comparing BE vs non-BE performance
   */
  static async calculateRiskAdjustedMetrics(
    userId: string,
    timeframe: BEMetricsTimeframe = { period: 'all' }
  ): Promise<RiskAdjustedMetrics> {
    const whereClause = this.buildWhereClause(userId, timeframe);

    const trades = await prisma.trade.findMany({
      where: {
        ...whereClause,
        exitPrice: { not: null },
        pnl: { not: null }
      },
      orderBy: { entryDate: 'asc' }
    });

    const beTradesReturns = [];
    const nonBETradesReturns = [];

    for (const trade of trades) {
      if (trade.pnl !== null) {
        const returnPct = (trade.pnl / (trade.entryPrice * trade.quantity)) * 100;

        if (trade.breakEvenWorked !== null) {
          beTradesReturns.push(returnPct);
        } else {
          nonBETradesReturns.push(returnPct);
        }
      }
    }

    // Calculate Sharpe ratios (assuming risk-free rate of 2%)
    const riskFreeRate = 2;
    const sharpeRatioWithBE = this.calculateSharpeRatio(beTradesReturns, riskFreeRate);
    const sharpeRatioWithoutBE = this.calculateSharpeRatio(nonBETradesReturns, riskFreeRate);

    // Calculate maximum drawdowns
    const maxDrawdownWithBE = this.calculateMaxDrawdown(beTradesReturns);
    const maxDrawdownWithoutBE = this.calculateMaxDrawdown(nonBETradesReturns);

    // Calculate Calmar ratios
    const avgReturnBE = beTradesReturns.length > 0 ?
      beTradesReturns.reduce((a, b) => a + b, 0) / beTradesReturns.length : 0;
    const avgReturnNonBE = nonBETradesReturns.length > 0 ?
      nonBETradesReturns.reduce((a, b) => a + b, 0) / nonBETradesReturns.length : 0;

    const calmarRatioWithBE = maxDrawdownWithBE !== 0 ? avgReturnBE / Math.abs(maxDrawdownWithBE) : 0;
    const calmarRatioWithoutBE = maxDrawdownWithoutBE !== 0 ? avgReturnNonBE / Math.abs(maxDrawdownWithoutBE) : 0;

    // Calculate volatility reduction
    const volatilityBE = this.calculateVolatility(beTradesReturns);
    const volatilityNonBE = this.calculateVolatility(nonBETradesReturns);
    const volatilityReduction = volatilityNonBE > 0 ? ((volatilityNonBE - volatilityBE) / volatilityNonBE) * 100 : 0;

    // Risk-adjusted return comparison
    const riskAdjustedReturn = sharpeRatioWithBE - sharpeRatioWithoutBE;

    return {
      sharpeRatioWithBE,
      sharpeRatioWithoutBE,
      maxDrawdownWithBE,
      maxDrawdownWithoutBE,
      calmarRatioWithBE,
      calmarRatioWithoutBE,
      volatilityReduction,
      riskAdjustedReturn
    };
  }

  /**
   * Calculate BE portfolio impact
   */
  static async calculateBEPortfolioImpact(
    userId: string,
    accountSize: number = 100000,
    timeframe: BEMetricsTimeframe = { period: 'all' }
  ): Promise<BEPortfolioImpact> {
    const whereClause = this.buildWhereClause(userId, timeframe);

    const trades = await prisma.trade.findMany({
      where: {
        ...whereClause,
        exitPrice: { not: null },
        netPnl: { not: null }
      }
    });

    let totalNetPnL = 0;
    let totalBEContribution = 0;
    let totalOpportunityValue = 0;

    for (const trade of trades) {
      if (trade.netPnl !== null) {
        totalNetPnL += trade.netPnl;

        if (trade.breakEvenWorked === true && trade.netPnl > 0) {
          // BE protected this profit
          totalBEContribution += trade.netPnl;
        } else if (trade.breakEvenWorked === false) {
          // Calculate missed opportunity
          const missed = this.calculateMissedProfit(trade);
          totalOpportunityValue += missed;
        }
      }
    }

    const totalPortfolioValue = accountSize + totalNetPnL;
    const beContributionPercent = totalPortfolioValue > accountSize ?
      (totalBEContribution / (totalPortfolioValue - accountSize)) * 100 : 0;

    // Alternative scenario: what if all BE opportunities were captured
    const alternativeScenario = totalNetPnL + totalOpportunityValue - totalBEContribution;
    const efficiency = totalOpportunityValue > 0 ?
      (totalBEContribution / (totalBEContribution + totalOpportunityValue)) * 100 : 100;

    return {
      totalPortfolioValue,
      beContribution: totalBEContribution,
      beContributionPercent,
      alternativeScenario,
      totalOpportunityValue,
      efficiency
    };
  }

  /**
   * Generate BE optimization recommendations based on metrics
   */
  static async generateBEOptimizationRecommendations(
    userId: string,
    timeframe: BEMetricsTimeframe = { period: 'all' }
  ): Promise<{
    priority: 'high' | 'medium' | 'low';
    recommendations: string[];
    actionItems: Array<{ action: string; impact: string; difficulty: string }>;
  }> {
    const [metrics, , portfolioImpact] = await Promise.all([
      this.getBEEffectivenessMetrics(userId, timeframe),
      this.calculateRiskAdjustedMetrics(userId, timeframe),
      this.calculateBEPortfolioImpact(userId, 100000, timeframe)
    ]);

    const recommendations: string[] = [];
    const actionItems: Array<{ action: string; impact: string; difficulty: string }> = [];
    let priority: 'high' | 'medium' | 'low' = 'medium';

    // High priority recommendations
    if (metrics.netBEImpact < -500) {
      priority = 'high';
      recommendations.push(
        `Your BE strategy is currently costing you $${Math.abs(metrics.netBEImpact).toFixed(2)} - consider reducing BE usage`
      );
      actionItems.push({
        action: 'Reduce break-even usage by 50% for the next 20 trades',
        impact: 'High - could recover significant lost profits',
        difficulty: 'Low'
      });
    }

    if (metrics.beSuccessRate < 30 && metrics.beUsageRate > 50) {
      priority = 'high';
      recommendations.push(
        `Low BE success rate (${metrics.beSuccessRate.toFixed(1)}%) with high usage - optimize timing`
      );
      actionItems.push({
        action: 'Move BE triggers from current level to 60% of target profit',
        impact: 'High - should improve success rate',
        difficulty: 'Medium'
      });
    }

    // Medium priority recommendations
    if (portfolioImpact.efficiency < 60) {
      recommendations.push(
        `BE efficiency is ${portfolioImpact.efficiency.toFixed(1)}% - room for improvement in timing`
      );
      actionItems.push({
        action: 'Analyze BE timing patterns and adjust trigger levels',
        impact: 'Medium - gradual improvement',
        difficulty: 'Medium'
      });
    }

    // Strategy-specific recommendations
    const underperformingStrategies = metrics.byStrategy
      .filter(s => s.netImpact < -100)
      .sort((a, b) => a.netImpact - b.netImpact)
      .slice(0, 3);

    for (const strategy of underperformingStrategies) {
      recommendations.push(
        `Strategy "${strategy.strategy}" shows BE underperformance (-$${Math.abs(strategy.netImpact).toFixed(2)})`
      );
      actionItems.push({
        action: `Review BE usage for ${strategy.strategy} strategy`,
        impact: 'Medium',
        difficulty: 'Low'
      });
    }

    // Low priority recommendations
    if (metrics.beUsageRate < 20 && metrics.netBEImpact > 100) {
      priority = priority === 'high' ? 'high' : 'low';
      recommendations.push(
        `Low BE usage (${metrics.beUsageRate.toFixed(1)}%) but positive impact - consider increasing usage`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Your BE strategy appears to be performing well - maintain current approach');
      priority = 'low';
    }

    return {
      priority,
      recommendations,
      actionItems
    };
  }

  // Private helper methods

  private static buildWhereClause(userId: string, timeframe: BEMetricsTimeframe) {
    const where: any = { userId };

    if (timeframe.period !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (timeframe.period) {
        case '1m':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case '3m':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        case '6m':
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
          break;
        case '1y':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        default:
          startDate = new Date('2020-01-01');
      }

      where.entryDate = {
        gte: timeframe.startDate || startDate,
        lte: timeframe.endDate || now
      };
    }

    return where;
  }

  private static calculateMissedProfit(trade: any): number {
    if (!trade.maxPotentialProfit || !trade.exitPrice) return 0;

    const isLong = trade.direction === 'LONG';
    const actualProfit = isLong ?
      (trade.exitPrice - trade.entryPrice) * trade.quantity :
      (trade.entryPrice - trade.exitPrice) * trade.quantity;

    const maxProfit = isLong ?
      (trade.maxPotentialProfit - trade.entryPrice) * trade.quantity :
      (trade.entryPrice - trade.maxPotentialProfit) * trade.quantity;

    return Math.max(0, maxProfit - actualProfit);
  }

  private static async calculateBEByStrategy(
    userId: string,
    timeframe: BEMetricsTimeframe
  ): Promise<BEStrategyMetrics[]> {
    const whereClause = this.buildWhereClause(userId, timeframe);

    const trades = await prisma.trade.findMany({
      where: whereClause,
      include: { strategy: true }
    });

    const strategyMap = new Map<string, any[]>();

    for (const trade of trades) {
      const strategyName = trade.strategy?.name || 'No Strategy';
      if (!strategyMap.has(strategyName)) {
        strategyMap.set(strategyName, []);
      }
      strategyMap.get(strategyName)!.push(trade);
    }

    return Array.from(strategyMap.entries()).map(([strategy, strategyTrades]) => {
      const totalTrades = strategyTrades.length;
      const beTradesCount = strategyTrades.filter(t => t.breakEvenWorked !== null).length;
      const beUsageRate = totalTrades > 0 ? (beTradesCount / totalTrades) * 100 : 0;

      const beTrades = strategyTrades.filter(t => t.breakEvenWorked !== null);
      const successfulBE = beTrades.filter(t => t.breakEvenWorked === true);
      const beSuccessRate = beTrades.length > 0 ? (successfulBE.length / beTrades.length) * 100 : 0;

      let netImpact = 0;
      for (const trade of beTrades) {
        if (trade.breakEvenWorked && trade.pnl && trade.pnl > 0) {
          netImpact += trade.pnl;
        } else if (!trade.breakEvenWorked) {
          netImpact -= this.calculateMissedProfit(trade);
        }
      }

      let recommendation: 'increase' | 'decrease' | 'optimize' | 'maintain' = 'maintain';
      if (netImpact < -100) {
        recommendation = 'decrease';
      } else if (netImpact > 200 && beUsageRate < 50) {
        recommendation = 'increase';
      } else if (beSuccessRate < 50) {
        recommendation = 'optimize';
      }

      return {
        strategy,
        totalTrades,
        beUsageRate,
        beSuccessRate,
        netImpact,
        recommendation
      };
    });
  }

  private static async calculateBEBySymbol(
    userId: string,
    timeframe: BEMetricsTimeframe
  ): Promise<BESymbolMetrics[]> {
    const whereClause = this.buildWhereClause(userId, timeframe);

    const trades = await prisma.trade.findMany({
      where: whereClause
    });

    const symbolMap = new Map<string, any[]>();

    for (const trade of trades) {
      if (!symbolMap.has(trade.symbol)) {
        symbolMap.set(trade.symbol, []);
      }
      symbolMap.get(trade.symbol)!.push(trade);
    }

    return Array.from(symbolMap.entries()).map(([symbol, symbolTrades]) => {
      const totalTrades = symbolTrades.length;
      const beTradesCount = symbolTrades.filter(t => t.breakEvenWorked !== null).length;
      const beUsageRate = totalTrades > 0 ? (beTradesCount / totalTrades) * 100 : 0;

      const beTrades = symbolTrades.filter(t => t.breakEvenWorked !== null);
      const successfulBE = beTrades.filter(t => t.breakEvenWorked === true);
      const beSuccessRate = beTrades.length > 0 ? (successfulBE.length / beTrades.length) * 100 : 0;

      // Calculate average volatility (price range)
      let totalVolatility = 0;
      let volatilityCount = 0;
      for (const trade of symbolTrades) {
        if (trade.maxFavorablePrice && trade.maxAdversePrice) {
          const range = Math.abs(trade.maxFavorablePrice - trade.maxAdversePrice);
          const avgPrice = (trade.maxFavorablePrice + trade.maxAdversePrice) / 2;
          totalVolatility += (range / avgPrice) * 100;
          volatilityCount++;
        }
      }
      const avgVolatility = volatilityCount > 0 ? totalVolatility / volatilityCount : 0;

      let netImpact = 0;
      for (const trade of beTrades) {
        if (trade.breakEvenWorked && trade.pnl && trade.pnl > 0) {
          netImpact += trade.pnl;
        } else if (!trade.breakEvenWorked) {
          netImpact -= this.calculateMissedProfit(trade);
        }
      }

      let recommendation = 'Standard BE approach suitable';
      if (avgVolatility > 5 && beSuccessRate < 40) {
        recommendation = 'High volatility - consider wider BE triggers';
      } else if (avgVolatility < 2 && beSuccessRate > 70) {
        recommendation = 'Low volatility - can use tighter BE levels';
      }

      return {
        symbol,
        totalTrades,
        beUsageRate,
        beSuccessRate,
        avgVolatility,
        netImpact,
        recommendation
      };
    });
  }

  private static async calculateBEByTimeframe(
    userId: string,
    timeframe: BEMetricsTimeframe
  ): Promise<BETimeframeMetrics[]> {
    const whereClause = this.buildWhereClause(userId, timeframe);

    const trades = await prisma.trade.findMany({
      where: whereClause
    });

    const timeframeMap = new Map<string, any[]>();

    for (const trade of trades) {
      const tf = trade.timeframe || 'Unknown';
      if (!timeframeMap.has(tf)) {
        timeframeMap.set(tf, []);
      }
      timeframeMap.get(tf)!.push(trade);
    }

    return Array.from(timeframeMap.entries()).map(([tf, tfTrades]) => {
      const totalTrades = tfTrades.length;
      const beTradesCount = tfTrades.filter(t => t.breakEvenWorked !== null).length;
      const beUsageRate = totalTrades > 0 ? (beTradesCount / totalTrades) * 100 : 0;

      const beTrades = tfTrades.filter(t => t.breakEvenWorked !== null);
      const successfulBE = beTrades.filter(t => t.breakEvenWorked === true);
      const beSuccessRate = beTrades.length > 0 ? (successfulBE.length / beTrades.length) * 100 : 0;

      let netImpact = 0;
      for (const trade of beTrades) {
        if (trade.breakEvenWorked && trade.pnl && trade.pnl > 0) {
          netImpact += trade.pnl;
        } else if (!trade.breakEvenWorked) {
          netImpact -= this.calculateMissedProfit(trade);
        }
      }

      let recommendation = 'Current BE approach is adequate';
      if (tf.includes('1m') || tf.includes('5m')) {
        recommendation = 'Short timeframes - consider quicker BE triggers';
      } else if (tf.includes('1h') || tf.includes('4h')) {
        recommendation = 'Longer timeframes - can allow more profit development';
      }

      return {
        timeframe: tf,
        totalTrades,
        beUsageRate,
        beSuccessRate,
        netImpact,
        recommendation
      };
    });
  }

  private static async calculateBETrends(
    userId: string,
    timeframe: BEMetricsTimeframe
  ): Promise<BETrendMetrics> {
    const whereClause = this.buildWhereClause(userId, timeframe);

    const trades = await prisma.trade.findMany({
      where: whereClause,
      orderBy: { entryDate: 'asc' }
    });

    // Group by month
    const monthlyData = new Map<string, any[]>();
    for (const trade of trades) {
      const month = trade.entryDate.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyData.has(month)) {
        monthlyData.set(month, []);
      }
      monthlyData.get(month)!.push(trade);
    }

    const monthlyBEUsage = Array.from(monthlyData.entries()).map(([month, monthTrades]) => {
      const beTradesCount = monthTrades.filter(t => t.breakEvenWorked !== null).length;
      const usage = monthTrades.length > 0 ? (beTradesCount / monthTrades.length) * 100 : 0;

      const successfulBE = monthTrades.filter(t => t.breakEvenWorked === true).length;
      const success = beTradesCount > 0 ? (successfulBE / beTradesCount) * 100 : 0;

      return { month, usage, success };
    });

    // Group by quarter (simplified)
    const quarterly: Array<{ quarter: string; netImpact: number; improvement: number }> = [];

    return {
      monthlyBEUsage,
      quarterly
    };
  }

  private static calculateSharpeRatio(returns: number[], riskFreeRate: number): number {
    if (returns.length === 0) return 0;

    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    return stdDev !== 0 ? (avgReturn - riskFreeRate) / stdDev : 0;
  }

  private static calculateMaxDrawdown(returns: number[]): number {
    if (returns.length === 0) return 0;

    let peak = returns[0];
    let maxDD = 0;

    for (let i = 1; i < returns.length; i++) {
      if (returns[i] > peak) {
        peak = returns[i];
      }

      const drawdown = (peak - returns[i]) / peak * 100;
      if (drawdown > maxDD) {
        maxDD = drawdown;
      }
    }

    return maxDD;
  }

  private static calculateVolatility(returns: number[]): number {
    if (returns.length === 0) return 0;

    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;

    return Math.sqrt(variance);
  }
}