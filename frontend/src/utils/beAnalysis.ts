/**
 * Break-Even Analysis Calculations and Utilities
 */

import { Trade } from '@/types/trade';
import {
  BEAnalysisMetrics,
  BECalculationInput,
  BECalculationResult,
  BERecommendation,
  TradeWithBEAnalysis,
  BEStatsByStrategy,
  BEOptimizationScenario
} from '@/types/beAnalysis';

/**
 * Calculate BE efficiency for a single trade
 */
export function calculateBEEfficiency(input: BECalculationInput): BECalculationResult {
  const {
    entryPrice,
    exitPrice,
    stopLoss,
    takeProfit,
    maxPotentialProfit,
    maxDrawdown,
    breakEvenWorked,
    direction
  } = input;

  // Calculate basic metrics
  const actualProfit = Math.abs(exitPrice - entryPrice);
  const maxPossibleProfit = maxPotentialProfit ? Math.abs(maxPotentialProfit - entryPrice) : actualProfit;
  const stopLossDistance = Math.abs(entryPrice - stopLoss);
  const drawdownFromEntry = maxDrawdown ? Math.abs(maxDrawdown - entryPrice) : 0;

  // Profit capture rate: how much of max potential was captured
  const profitCaptureRate = maxPossibleProfit > 0 ? (actualProfit / maxPossibleProfit) * 100 : 0;

  // BE efficiency: how well the BE strategy worked
  let beEfficiency = 0;
  if (breakEvenWorked !== undefined) {
    if (breakEvenWorked) {
      // BE worked - protected the trade
      beEfficiency = profitCaptureRate > 0 ? Math.min(100, profitCaptureRate * 1.2) : 80;
    } else {
      // BE failed - could have made more profit
      const missedProfitPercentage = 100 - profitCaptureRate;
      beEfficiency = Math.max(0, 100 - (missedProfitPercentage * 1.5));
    }
  }

  // Drawdown tolerance: how much drawdown relative to stop loss
  const drawdownTolerance = stopLossDistance > 0 ? (drawdownFromEntry / stopLossDistance) * 100 : 0;

  // Optimal BE distance calculation
  let optimalBEDistance = 0;
  if (takeProfit) {
    const targetDistance = Math.abs(takeProfit - entryPrice);
    // Generally optimal BE is between 30-50% of target distance
    optimalBEDistance = targetDistance * 0.4;
  } else {
    // If no target, use 40% of achieved profit
    optimalBEDistance = actualProfit * 0.4;
  }

  // Risk-reward with BE
  const riskRewardWithBE = stopLossDistance > 0 ? actualProfit / stopLossDistance : 0;

  // Potential improvement if optimal BE was used
  let potentialImprovement = 0;
  if (breakEvenWorked === false && maxPossibleProfit > actualProfit) {
    // Estimate how much better it could have been with optimal BE
    potentialImprovement = ((maxPossibleProfit - actualProfit) / actualProfit) * 100;
  }

  return {
    profitCaptureRate,
    beEfficiency,
    drawdownTolerance,
    optimalBEDistance,
    riskRewardWithBE,
    potentialImprovement
  };
}

/**
 * Calculate aggregated BE metrics for a portfolio of trades
 */
export function calculatePortfolioBEMetrics(trades: Trade[]): BEAnalysisMetrics {
  const tradesWithBE = trades.filter(trade => trade.breakEvenWorked !== undefined);
  const beWorkedTrades = tradesWithBE.filter(trade => trade.breakEvenWorked === true);
  const beFailedTrades = tradesWithBE.filter(trade => trade.breakEvenWorked === false);

  const beSuccessRate = tradesWithBE.length > 0 ? (beWorkedTrades.length / tradesWithBE.length) * 100 : 0;
  const beFailureRate = 100 - beSuccessRate;

  // Calculate profit capture rates
  let totalProfitCapture = 0;
  let validProfitCaptureCount = 0;

  let totalMissedProfit = 0;
  let totalProtectedProfit = 0;
  let totalDrawdown = 0;
  let validDrawdownCount = 0;

  for (const trade of tradesWithBE) {
    const calculation = calculateBEEfficiency({
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice || trade.entryPrice,
      stopLoss: trade.stopLoss || 0,
      takeProfit: trade.takeProfit,
      maxPotentialProfit: trade.maxPotentialProfit,
      maxDrawdown: trade.maxDrawdown,
      breakEvenWorked: trade.breakEvenWorked,
      direction: trade.direction.toLowerCase() as 'long' | 'short'
    });

    if (calculation.profitCaptureRate > 0) {
      totalProfitCapture += calculation.profitCaptureRate;
      validProfitCaptureCount++;
    }

    if (calculation.drawdownTolerance > 0) {
      totalDrawdown += calculation.drawdownTolerance;
      validDrawdownCount++;
    }

    const actualProfit = trade.pnl || 0;
    const maxPossibleProfit = trade.maxPotentialProfit ?
      Math.abs(trade.maxPotentialProfit - trade.entryPrice) : actualProfit;

    if (trade.breakEvenWorked) {
      totalProtectedProfit += Math.max(0, actualProfit);
    } else if (maxPossibleProfit > actualProfit) {
      totalMissedProfit += (maxPossibleProfit - actualProfit);
    }
  }

  const avgProfitCaptureRate = validProfitCaptureCount > 0 ? totalProfitCapture / validProfitCaptureCount : 0;
  const avgDrawdownBeforeBE = validDrawdownCount > 0 ? totalDrawdown / validDrawdownCount : 0;

  // Calculate BE distances
  let totalBEDistance = 0;
  let beDistanceCount = 0;

  for (const trade of tradesWithBE) {
    if (trade.takeProfit) {
      const targetDistance = Math.abs(trade.takeProfit - trade.entryPrice);
      totalBEDistance += targetDistance * 0.4; // Assuming 40% is typical BE placement
      beDistanceCount++;
    }
  }

  const avgBEDistance = beDistanceCount > 0 ? totalBEDistance / beDistanceCount : 0;
  const optimalBELevel = avgBEDistance * 1.1; // 10% optimization

  // Performance comparison
  const totalPnlWithBE = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const estimatedPnlWithoutBE = totalPnlWithBE + totalMissedProfit - (totalProtectedProfit * 0.3);

  return {
    beSuccessRate,
    beFailureRate,
    avgBEDistance,
    optimalBELevel,
    avgProfitCaptureRate,
    missedProfitFromBE: totalMissedProfit,
    protectedProfitFromBE: totalProtectedProfit,
    avgDrawdownBeforeBE,
    drawdownTolerance: avgDrawdownBeforeBE,
    riskReductionFromBE: (totalProtectedProfit / Math.max(1, Math.abs(totalPnlWithBE))) * 100,
    performanceWithBE: totalPnlWithBE,
    performanceWithoutBE: estimatedPnlWithoutBE,
    beImpact: totalPnlWithBE - estimatedPnlWithoutBE
  };
}

/**
 * Generate BE recommendations based on historical performance
 */
export function generateBERecommendation(trades: Trade[]): BERecommendation {
  const metrics = calculatePortfolioBEMetrics(trades);
  const tradesWithBE = trades.filter(trade => trade.breakEvenWorked !== undefined);

  let shouldUseBE = true;
  let confidence = 50;
  const reasoning: string[] = [];

  // Analyze success rate
  if (metrics.beSuccessRate >= 70) {
    reasoning.push(`High BE success rate (${metrics.beSuccessRate.toFixed(1)}%)`);
    confidence += 20;
  } else if (metrics.beSuccessRate < 40) {
    reasoning.push(`Low BE success rate (${metrics.beSuccessRate.toFixed(1)}%)`);
    confidence -= 15;
    shouldUseBE = false;
  }

  // Analyze profit impact
  if (metrics.beImpact > 0) {
    reasoning.push(`BE improves overall performance (+${metrics.beImpact.toFixed(2)})`);
    confidence += 15;
  } else if (metrics.beImpact < -100) {
    reasoning.push(`BE significantly hurts performance (${metrics.beImpact.toFixed(2)})`);
    confidence -= 20;
    shouldUseBE = false;
  }

  // Analyze profit capture
  if (metrics.avgProfitCaptureRate >= 80) {
    reasoning.push(`Excellent profit capture rate (${metrics.avgProfitCaptureRate.toFixed(1)}%)`);
    confidence += 10;
  } else if (metrics.avgProfitCaptureRate < 50) {
    reasoning.push(`Poor profit capture rate (${metrics.avgProfitCaptureRate.toFixed(1)}%)`);
    confidence -= 10;
  }

  // Sample size consideration
  if (tradesWithBE.length < 10) {
    reasoning.push('Limited data - recommendations may change with more trades');
    confidence = Math.min(confidence, 60);
  }

  const optimalBEDistance = metrics.optimalBELevel;
  const optimalBETrigger = optimalBEDistance * 1.5; // Move to BE after 1.5x the distance

  const alternatives = [
    {
      strategy: 'no-be' as const,
      expectedImprovement: metrics.beImpact < 0 ? Math.abs(metrics.beImpact) : -metrics.beImpact * 0.3,
      description: 'Never use break-even stops'
    },
    {
      strategy: 'aggressive-be' as const,
      expectedImprovement: metrics.beSuccessRate > 60 ? metrics.beImpact * 0.2 : -metrics.beImpact * 0.1,
      description: 'Move to BE quickly (20-30% of target)'
    },
    {
      strategy: 'conservative-be' as const,
      expectedImprovement: metrics.avgProfitCaptureRate < 70 ? metrics.beImpact * 0.15 : -metrics.beImpact * 0.05,
      description: 'Move to BE later (60-70% of target)'
    },
    {
      strategy: 'trailing-be' as const,
      expectedImprovement: metrics.beImpact * 0.3,
      description: 'Use trailing break-even stops'
    }
  ];

  return {
    shouldUseBE,
    optimalBEDistance,
    optimalBETrigger,
    confidence: Math.max(0, Math.min(100, confidence)),
    reasoning,
    alternatives: alternatives.sort((a, b) => b.expectedImprovement - a.expectedImprovement)
  };
}

/**
 * Generate BE statistics by strategy
 */
export function calculateBEStatsByStrategy(trades: Trade[]): BEStatsByStrategy[] {
  const strategiesMap = new Map<string, Trade[]>();

  // Group trades by strategy
  trades.forEach(trade => {
    const strategy = trade.strategy?.toString() || 'Unknown';
    if (!strategiesMap.has(strategy)) {
      strategiesMap.set(strategy, []);
    }
    strategiesMap.get(strategy)!.push(trade);
  });

  return Array.from(strategiesMap.entries()).map(([strategy, strategyTrades]) => {
    const tradesWithBE = strategyTrades.filter(trade => trade.breakEvenWorked !== undefined);
    const beWorkedCount = tradesWithBE.filter(trade => trade.breakEvenWorked === true).length;
    const beFailedCount = tradesWithBE.length - beWorkedCount;

    const metrics = calculatePortfolioBEMetrics(strategyTrades);

    return {
      strategy,
      totalTrades: strategyTrades.length,
      tradesWithBE: tradesWithBE.length,
      beWorkedCount,
      beFailedCount,
      beSuccessRate: metrics.beSuccessRate,
      profitProtected: metrics.protectedProfitFromBE,
      profitMissed: metrics.missedProfitFromBE,
      netBEImpact: metrics.beImpact,
      currentBESettings: {
        avgBEDistance: metrics.avgBEDistance,
        avgBETrigger: metrics.avgBEDistance * 1.5
      },
      optimalBESettings: {
        recommendedDistance: metrics.optimalBELevel,
        recommendedTrigger: metrics.optimalBELevel * 1.5,
        expectedImprovement: metrics.beImpact > 0 ? metrics.beImpact * 0.2 : Math.abs(metrics.beImpact) * 0.5
      }
    };
  });
}

/**
 * Create what-if scenarios for BE optimization
 */
export function generateBEOptimizationScenarios(trades: Trade[]): BEOptimizationScenario[] {
  const baseMetrics = calculatePortfolioBEMetrics(trades);

  const scenarios: BEOptimizationScenario[] = [
    {
      scenarioName: 'No Break-Even',
      description: 'Never use break-even stops - let trades run to original targets',
      beLevel: 0,
      beTrigger: 0,
      useTrailingBE: false,
      expectedSuccessRate: 0,
      expectedProfitCapture: 100,
      expectedRiskReduction: 0,
      recommendationScore: baseMetrics.beImpact < 0 ? 85 : 25
    },
    {
      scenarioName: 'Aggressive BE (25%)',
      description: 'Move to break-even quickly at 25% of target profit',
      beLevel: 25,
      beTrigger: 30,
      useTrailingBE: false,
      expectedSuccessRate: baseMetrics.beSuccessRate * 1.2,
      expectedProfitCapture: Math.max(40, baseMetrics.avgProfitCaptureRate * 0.8),
      expectedRiskReduction: 70,
      recommendationScore: baseMetrics.beSuccessRate > 60 ? 75 : 45
    },
    {
      scenarioName: 'Moderate BE (40%)',
      description: 'Standard break-even at 40% of target profit',
      beLevel: 40,
      beTrigger: 50,
      useTrailingBE: false,
      expectedSuccessRate: baseMetrics.beSuccessRate,
      expectedProfitCapture: baseMetrics.avgProfitCaptureRate,
      expectedRiskReduction: 50,
      recommendationScore: 70
    },
    {
      scenarioName: 'Conservative BE (60%)',
      description: 'Late break-even at 60% of target profit',
      beLevel: 60,
      beTrigger: 70,
      useTrailingBE: false,
      expectedSuccessRate: baseMetrics.beSuccessRate * 0.8,
      expectedProfitCapture: Math.min(95, baseMetrics.avgProfitCaptureRate * 1.15),
      expectedRiskReduction: 30,
      recommendationScore: baseMetrics.avgProfitCaptureRate < 60 ? 80 : 55
    },
    {
      scenarioName: 'Trailing BE',
      description: 'Use trailing break-even that follows price movement',
      beLevel: 30,
      beTrigger: 40,
      useTrailingBE: true,
      expectedSuccessRate: baseMetrics.beSuccessRate * 1.1,
      expectedProfitCapture: Math.min(90, baseMetrics.avgProfitCaptureRate * 1.2),
      expectedRiskReduction: 60,
      recommendationScore: 85
    }
  ];

  // Sort by recommendation score
  return scenarios.sort((a, b) => b.recommendationScore - a.recommendationScore);
}

/**
 * Format BE metrics for display
 */
export function formatBEMetrics(metrics: BEAnalysisMetrics) {
  return {
    beSuccessRate: `${metrics.beSuccessRate.toFixed(1)}%`,
    profitCapture: `${metrics.avgProfitCaptureRate.toFixed(1)}%`,
    beImpact: metrics.beImpact >= 0 ? `+$${metrics.beImpact.toFixed(2)}` : `-$${Math.abs(metrics.beImpact).toFixed(2)}`,
    protectedProfit: `$${metrics.protectedProfitFromBE.toFixed(2)}`,
    missedProfit: `$${metrics.missedProfitFromBE.toFixed(2)}`
  };
}

/**
 * Validate BE analysis data
 */
export function validateBEData(input: BECalculationInput): string[] {
  const errors: string[] = [];

  if (input.maxPotentialProfit && input.maxPotentialProfit <= input.entryPrice && input.direction === 'long') {
    errors.push('Max potential profit must be higher than entry price for long trades');
  }

  if (input.maxPotentialProfit && input.maxPotentialProfit >= input.entryPrice && input.direction === 'short') {
    errors.push('Max potential profit must be lower than entry price for short trades');
  }

  if (input.maxDrawdown && input.maxDrawdown >= input.entryPrice && input.direction === 'long') {
    errors.push('Max drawdown must be lower than entry price for long trades');
  }

  if (input.maxDrawdown && input.maxDrawdown <= input.entryPrice && input.direction === 'short') {
    errors.push('Max drawdown must be higher than entry price for short trades');
  }

  return errors;
}