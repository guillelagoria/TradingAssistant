/**
 * Break-Even Analysis Service
 * Handles BE optimization scenarios and what-if analysis
 */

import { PrismaClient, TradeDirection } from '@prisma/client';

const prisma = new PrismaClient();

interface BEAnalysisInput {
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit?: number;
  maxPotentialProfit?: number;
  maxDrawdown?: number;
  breakEvenWorked?: boolean;
  direction: TradeDirection;
}

interface BEOptimizationScenario {
  scenarioName: string;
  description: string;
  beLevel: number;
  beTrigger: number;
  useTrailingBE: boolean;
  expectedSuccessRate: number;
  expectedProfitCapture: number;
  expectedRiskReduction: number;
  recommendationScore: number;
  simulatedProfit?: number;
  simulatedLoss?: number;
}

interface BEAnalysisResult {
  profitCaptureRate: number;
  beEfficiency: number;
  drawdownTolerance: number;
  optimalBEDistance: number;
  riskRewardWithBE: number;
  potentialImprovement: number;
  missedProfitAmount: number;
  protectedAmount: number;
}

interface PortfolioBEMetrics {
  totalTrades: number;
  tradesWithBE: number;
  beSuccessRate: number;
  avgProfitCaptureRate: number;
  totalProtectedProfit: number;
  totalMissedProfit: number;
  netBEImpact: number;
  optimalBELevel: number;
  recommendedStrategy: string;
}

export class BEAnalysisService {

  /**
   * Calculate BE analysis metrics for a single trade
   */
  static calculateBEMetrics(trade: BEAnalysisInput): BEAnalysisResult {
    const {
      entryPrice,
      exitPrice,
      stopLoss,
      takeProfit,
      maxPotentialProfit,
      maxDrawdown,
      breakEvenWorked,
      direction
    } = trade;

    const isLong = direction === 'LONG';

    // Calculate basic profit/loss
    const actualProfit = isLong ?
      (exitPrice - entryPrice) :
      (entryPrice - exitPrice);

    // Calculate max potential profit
    const maxPossibleProfit = maxPotentialProfit ?
      (isLong ? (maxPotentialProfit - entryPrice) : (entryPrice - maxPotentialProfit)) :
      actualProfit;

    // Risk calculation
    const riskAmount = Math.abs(entryPrice - stopLoss);
    const drawdownAmount = maxDrawdown ?
      (isLong ? Math.max(0, entryPrice - maxDrawdown) : Math.max(0, maxDrawdown - entryPrice)) :
      0;

    // Profit capture rate
    const profitCaptureRate = maxPossibleProfit > 0 ?
      Math.max(0, (actualProfit / maxPossibleProfit) * 100) : 0;

    // BE efficiency calculation
    let beEfficiency = 0;
    if (breakEvenWorked !== undefined) {
      if (breakEvenWorked) {
        // BE worked - reward based on profit capture
        beEfficiency = Math.min(100, 60 + (profitCaptureRate * 0.4));
      } else {
        // BE failed - penalize based on missed opportunity
        const missedPercent = Math.max(0, 100 - profitCaptureRate);
        beEfficiency = Math.max(0, 100 - (missedPercent * 1.2));
      }
    }

    // Drawdown tolerance
    const drawdownTolerance = riskAmount > 0 ? (drawdownAmount / riskAmount) * 100 : 0;

    // Optimal BE distance (typically 30-50% of target distance)
    let optimalBEDistance = 0;
    if (takeProfit) {
      const targetDistance = Math.abs(takeProfit - entryPrice);
      optimalBEDistance = targetDistance * 0.4; // 40% of target
    } else {
      // If no target, use 40% of achieved profit
      optimalBEDistance = Math.abs(actualProfit) * 0.4;
    }

    // Risk-reward with BE
    const riskRewardWithBE = riskAmount > 0 ? actualProfit / riskAmount : 0;

    // Potential improvement calculation
    const missedProfitAmount = Math.max(0, maxPossibleProfit - actualProfit);
    let potentialImprovement = 0;
    if (breakEvenWorked === false && missedProfitAmount > 0) {
      potentialImprovement = (missedProfitAmount / Math.max(1, Math.abs(actualProfit))) * 100;
    }

    // Protected amount (for successful BE)
    const protectedAmount = breakEvenWorked && actualProfit > 0 ? actualProfit : 0;

    return {
      profitCaptureRate,
      beEfficiency,
      drawdownTolerance,
      optimalBEDistance,
      riskRewardWithBE,
      potentialImprovement,
      missedProfitAmount,
      protectedAmount
    };
  }

  /**
   * Calculate portfolio-level BE metrics
   */
  static async calculatePortfolioBEMetrics(userId: string): Promise<PortfolioBEMetrics> {
    const trades = await prisma.trade.findMany({
      where: { userId },
      orderBy: { entryDate: 'desc' }
    });

    const tradesWithBE = trades.filter(trade => trade.breakEvenWorked !== null);
    const beWorkedTrades = tradesWithBE.filter(trade => trade.breakEvenWorked === true);

    if (tradesWithBE.length === 0) {
      return {
        totalTrades: trades.length,
        tradesWithBE: 0,
        beSuccessRate: 0,
        avgProfitCaptureRate: 0,
        totalProtectedProfit: 0,
        totalMissedProfit: 0,
        netBEImpact: 0,
        optimalBELevel: 0.4,
        recommendedStrategy: 'insufficient-data'
      };
    }

    // Calculate aggregated metrics
    let totalProfitCapture = 0;
    let totalProtectedProfit = 0;
    let totalMissedProfit = 0;
    let totalOptimalBEDistance = 0;
    let validMetricsCount = 0;

    for (const trade of tradesWithBE) {
      if (trade.exitPrice) {
        const beMetrics = this.calculateBEMetrics({
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice,
          stopLoss: trade.stopLoss || 0,
          takeProfit: trade.takeProfit || undefined,
          maxPotentialProfit: trade.maxPotentialProfit || undefined,
          maxDrawdown: trade.maxDrawdown || undefined,
          breakEvenWorked: trade.breakEvenWorked || undefined,
          direction: trade.direction
        });

        totalProfitCapture += beMetrics.profitCaptureRate;
        totalProtectedProfit += beMetrics.protectedAmount;
        totalMissedProfit += beMetrics.missedProfitAmount;
        totalOptimalBEDistance += beMetrics.optimalBEDistance;
        validMetricsCount++;
      }
    }

    const beSuccessRate = (beWorkedTrades.length / tradesWithBE.length) * 100;
    const avgProfitCaptureRate = validMetricsCount > 0 ? totalProfitCapture / validMetricsCount : 0;
    const avgOptimalBEDistance = validMetricsCount > 0 ? totalOptimalBEDistance / validMetricsCount : 0;
    const netBEImpact = totalProtectedProfit - totalMissedProfit;

    // Recommend strategy based on performance
    let recommendedStrategy = 'moderate-be';
    if (beSuccessRate > 70 && avgProfitCaptureRate > 75) {
      recommendedStrategy = 'aggressive-be';
    } else if (beSuccessRate < 40 || netBEImpact < -100) {
      recommendedStrategy = 'conservative-be';
    } else if (netBEImpact < -200) {
      recommendedStrategy = 'no-be';
    }

    return {
      totalTrades: trades.length,
      tradesWithBE: tradesWithBE.length,
      beSuccessRate,
      avgProfitCaptureRate,
      totalProtectedProfit,
      totalMissedProfit,
      netBEImpact,
      optimalBELevel: avgOptimalBEDistance > 0 ? avgOptimalBEDistance : 0.4,
      recommendedStrategy
    };
  }

  /**
   * Generate BE optimization scenarios
   */
  static async generateBEOptimizationScenarios(userId: string): Promise<BEOptimizationScenario[]> {
    const portfolioMetrics = await this.calculatePortfolioBEMetrics(userId);
    const trades = await prisma.trade.findMany({
      where: {
        userId,
        exitPrice: { not: null },
        takeProfit: { not: null }
      },
      orderBy: { entryDate: 'desc' },
      take: 100 // Analyze last 100 trades for scenarios
    });

    const scenarios: BEOptimizationScenario[] = [
      {
        scenarioName: 'No Break-Even',
        description: 'Never use break-even stops - let all trades run to original targets',
        beLevel: 0,
        beTrigger: 0,
        useTrailingBE: false,
        expectedSuccessRate: 0,
        expectedProfitCapture: 100,
        expectedRiskReduction: 0,
        recommendationScore: portfolioMetrics.netBEImpact < -50 ? 85 : 25
      },
      {
        scenarioName: 'Aggressive BE (20%)',
        description: 'Move to break-even very quickly at 20% of target profit',
        beLevel: 20,
        beTrigger: 25,
        useTrailingBE: false,
        expectedSuccessRate: Math.min(90, portfolioMetrics.beSuccessRate * 1.3),
        expectedProfitCapture: Math.max(35, portfolioMetrics.avgProfitCaptureRate * 0.7),
        expectedRiskReduction: 80,
        recommendationScore: portfolioMetrics.beSuccessRate > 65 ? 80 : 40
      },
      {
        scenarioName: 'Standard BE (40%)',
        description: 'Move to break-even at 40% of target profit (industry standard)',
        beLevel: 40,
        beTrigger: 50,
        useTrailingBE: false,
        expectedSuccessRate: portfolioMetrics.beSuccessRate,
        expectedProfitCapture: portfolioMetrics.avgProfitCaptureRate,
        expectedRiskReduction: 60,
        recommendationScore: 70
      },
      {
        scenarioName: 'Conservative BE (60%)',
        description: 'Move to break-even later at 60% of target profit',
        beLevel: 60,
        beTrigger: 70,
        useTrailingBE: false,
        expectedSuccessRate: Math.max(20, portfolioMetrics.beSuccessRate * 0.8),
        expectedProfitCapture: Math.min(95, portfolioMetrics.avgProfitCaptureRate * 1.2),
        expectedRiskReduction: 35,
        recommendationScore: portfolioMetrics.avgProfitCaptureRate < 60 ? 85 : 55
      },
      {
        scenarioName: 'Trailing BE',
        description: 'Use dynamic trailing break-even that follows price movement',
        beLevel: 30,
        beTrigger: 40,
        useTrailingBE: true,
        expectedSuccessRate: Math.min(85, portfolioMetrics.beSuccessRate * 1.15),
        expectedProfitCapture: Math.min(90, portfolioMetrics.avgProfitCaptureRate * 1.25),
        expectedRiskReduction: 70,
        recommendationScore: 90
      },
      {
        scenarioName: 'Volatility-Adjusted BE',
        description: 'Adjust BE placement based on market volatility and drawdown patterns',
        beLevel: 35,
        beTrigger: 45,
        useTrailingBE: false,
        expectedSuccessRate: Math.min(80, portfolioMetrics.beSuccessRate * 1.1),
        expectedProfitCapture: Math.min(85, portfolioMetrics.avgProfitCaptureRate * 1.15),
        expectedRiskReduction: 65,
        recommendationScore: 75
      }
    ];

    // Simulate results for each scenario using historical trades
    for (const scenario of scenarios) {
      let simulatedProfit = 0;
      let simulatedLoss = 0;
      let tradesAnalyzed = 0;

      for (const trade of trades.slice(0, 50)) { // Analyze subset for performance
        if (trade.exitPrice && trade.takeProfit) {
          const result = this.simulateScenario(trade, scenario);
          simulatedProfit += Math.max(0, result.simulatedPnL);
          simulatedLoss += Math.min(0, result.simulatedPnL);
          tradesAnalyzed++;
        }
      }

      scenario.simulatedProfit = tradesAnalyzed > 0 ? simulatedProfit / tradesAnalyzed : 0;
      scenario.simulatedLoss = tradesAnalyzed > 0 ? simulatedLoss / tradesAnalyzed : 0;

      // Adjust recommendation score based on simulation results
      const netSimulatedResult = scenario.simulatedProfit + scenario.simulatedLoss;
      if (netSimulatedResult > 20) {
        scenario.recommendationScore = Math.min(100, scenario.recommendationScore + 15);
      } else if (netSimulatedResult < -20) {
        scenario.recommendationScore = Math.max(0, scenario.recommendationScore - 15);
      }
    }

    // Sort by recommendation score
    return scenarios.sort((a, b) => b.recommendationScore - a.recommendationScore);
  }

  /**
   * Simulate a scenario on a historical trade
   */
  private static simulateScenario(trade: any, scenario: BEOptimizationScenario) {
    const isLong = trade.direction === 'LONG';
    const entryPrice = trade.entryPrice;
    const exitPrice = trade.exitPrice;
    const takeProfit = trade.takeProfit;
    const maxFavorable = trade.maxFavorablePrice;
    const maxDrawdown = trade.maxDrawdown;

    if (!maxFavorable || !takeProfit) {
      return { simulatedPnL: isLong ? (exitPrice - entryPrice) : (entryPrice - exitPrice) };
    }

    // Calculate where BE would be placed
    const targetDistance = Math.abs(takeProfit - entryPrice);
    const beDistance = targetDistance * (scenario.beLevel / 100);
    const bePrice = isLong ? entryPrice + beDistance : entryPrice - beDistance;

    // Calculate trigger point
    const triggerDistance = targetDistance * (scenario.beTrigger / 100);
    const triggerPrice = isLong ? entryPrice + triggerDistance : entryPrice - triggerDistance;

    // Simulate what would have happened
    let simulatedExitPrice = exitPrice;

    if (scenario.beLevel === 0) {
      // No BE - trade runs to completion
      simulatedExitPrice = exitPrice;
    } else {
      // Check if price reached trigger point
      const reachedTrigger = isLong ?
        (maxFavorable >= triggerPrice) :
        (maxFavorable <= triggerPrice);

      if (reachedTrigger) {
        // BE was activated
        if (scenario.useTrailingBE) {
          // Trailing BE - more sophisticated simulation needed
          simulatedExitPrice = this.simulateTrailingBE(trade, scenario);
        } else {
          // Standard BE
          const hitBE = isLong ?
            (maxDrawdown && maxDrawdown <= bePrice) :
            (maxDrawdown && maxDrawdown >= bePrice);

          if (hitBE) {
            simulatedExitPrice = bePrice; // Stopped at BE
          } else {
            simulatedExitPrice = exitPrice; // Continued to actual exit
          }
        }
      }
    }

    const simulatedPnL = isLong ?
      (simulatedExitPrice - entryPrice) :
      (entryPrice - simulatedExitPrice);

    return { simulatedPnL };
  }

  /**
   * Simulate trailing break-even behavior
   */
  private static simulateTrailingBE(trade: any, _scenario: BEOptimizationScenario) {
    // Simplified trailing BE simulation
    // In practice, this would need tick-by-tick data for accuracy
    const isLong = trade.direction === 'LONG';
    const entryPrice = trade.entryPrice;
    const exitPrice = trade.exitPrice;
    const maxFavorable = trade.maxFavorablePrice;
    const maxDrawdown = trade.maxDrawdown;

    if (!maxFavorable) return exitPrice;

    // Estimate trailing BE performance
    const profitFromEntry = isLong ?
      (maxFavorable - entryPrice) :
      (entryPrice - maxFavorable);

    // Assume trailing BE would lock in 70% of max favorable move
    const trailingBEPrice = isLong ?
      entryPrice + (profitFromEntry * 0.7) :
      entryPrice - (profitFromEntry * 0.7);

    // Check if drawdown would hit trailing BE
    if (maxDrawdown) {
      const wouldHitTrailingBE = isLong ?
        (maxDrawdown <= trailingBEPrice) :
        (maxDrawdown >= trailingBEPrice);

      if (wouldHitTrailingBE) {
        return trailingBEPrice;
      }
    }

    return exitPrice;
  }

  /**
   * Get BE analysis recommendations for a user
   */
  static async getBERecommendations(userId: string) {
    const [portfolioMetrics, scenarios] = await Promise.all([
      this.calculatePortfolioBEMetrics(userId),
      this.generateBEOptimizationScenarios(userId)
    ]);

    const topScenario = scenarios[0];

    const recommendations = {
      shouldUseBE: portfolioMetrics.netBEImpact > -50,
      recommendedStrategy: portfolioMetrics.recommendedStrategy,
      optimalBELevel: portfolioMetrics.optimalBELevel,
      confidence: this.calculateConfidence(portfolioMetrics),
      keyInsights: this.generateKeyInsights(portfolioMetrics),
      topScenario,
      portfolioMetrics,
      allScenarios: scenarios.slice(0, 5) // Return top 5 scenarios
    };

    return recommendations;
  }

  /**
   * Calculate confidence level in recommendations
   */
  private static calculateConfidence(metrics: PortfolioBEMetrics): number {
    let confidence = 50; // Base confidence

    // More data = higher confidence
    if (metrics.tradesWithBE >= 20) confidence += 20;
    else if (metrics.tradesWithBE >= 10) confidence += 10;
    else if (metrics.tradesWithBE < 5) confidence -= 20;

    // Clear patterns = higher confidence
    if (metrics.beSuccessRate > 70 || metrics.beSuccessRate < 30) confidence += 15;
    if (Math.abs(metrics.netBEImpact) > 100) confidence += 10;

    // Extreme values = lower confidence
    if (metrics.beSuccessRate > 90 || metrics.beSuccessRate < 10) confidence -= 10;

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Generate key insights from BE analysis
   */
  private static generateKeyInsights(metrics: PortfolioBEMetrics): string[] {
    const insights = [];

    if (metrics.beSuccessRate > 65) {
      insights.push(`High BE success rate (${metrics.beSuccessRate.toFixed(1)}%) suggests BE strategy is working well`);
    } else if (metrics.beSuccessRate < 35) {
      insights.push(`Low BE success rate (${metrics.beSuccessRate.toFixed(1)}%) indicates BE may be hurting performance`);
    }

    if (metrics.avgProfitCaptureRate > 80) {
      insights.push(`Excellent profit capture (${metrics.avgProfitCaptureRate.toFixed(1)}%) shows good trade management`);
    } else if (metrics.avgProfitCaptureRate < 50) {
      insights.push(`Low profit capture (${metrics.avgProfitCaptureRate.toFixed(1)}%) suggests room for improvement in exit timing`);
    }

    if (metrics.netBEImpact > 100) {
      insights.push(`BE strategy has added $${metrics.netBEImpact.toFixed(2)} to your bottom line`);
    } else if (metrics.netBEImpact < -100) {
      insights.push(`BE strategy has cost you $${Math.abs(metrics.netBEImpact).toFixed(2)} in missed profits`);
    }

    if (metrics.tradesWithBE < 10) {
      insights.push('Limited BE data available - recommendations will improve with more trades');
    }

    return insights;
  }
}