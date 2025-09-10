import { Trade, TradeDirection, TradeStats } from '@/types';
import { calculateTradeStats } from './tradeCalculations';

export interface WhatIfScenario {
  id: string;
  name: string;
  description: string;
  category: 'entry' | 'exit' | 'risk' | 'selection' | 'management';
  color: string;
}

export interface WhatIfResult {
  scenario: WhatIfScenario;
  originalStats: TradeStats;
  improvedStats: TradeStats;
  improvement: {
    totalPnlImprovement: number;
    totalPnlImprovementPercent: number;
    winRateImprovement: number;
    profitFactorImprovement: number;
    avgRMultipleImprovement: number;
    tradesAffected: number;
  };
  insights: string[];
}

export interface WhatIfAnalysisResult {
  originalStats: TradeStats;
  scenarios: WhatIfResult[];
  topImprovements: WhatIfResult[];
  summary: {
    bestScenario: WhatIfResult;
    totalPotentialImprovement: number;
    keyInsights: string[];
  };
}

// Available What-If scenarios
export const WHAT_IF_SCENARIOS: WhatIfScenario[] = [
  {
    id: 'better_entry',
    name: 'Better Entry Timing',
    description: 'What if you had 5% better entry prices on all trades?',
    category: 'entry',
    color: '#10B981' // emerald
  },
  {
    id: 'better_exit',
    name: 'Better Exit Timing',
    description: 'What if you had 5% better exit prices on all trades?',
    category: 'exit',
    color: '#3B82F6' // blue
  },
  {
    id: 'proper_position_sizing',
    name: 'Proper Position Sizing',
    description: 'What if you risked exactly 2% on every trade?',
    category: 'risk',
    color: '#8B5CF6' // violet
  },
  {
    id: 'winning_setups_only',
    name: 'Winning Setups Only',
    description: 'What if you only traded your winning setups?',
    category: 'selection',
    color: '#F59E0B' // amber
  },
  {
    id: 'tighter_stops',
    name: 'Tighter Stop Losses',
    description: 'What if you had 20% tighter stop losses?',
    category: 'risk',
    color: '#EF4444' // red
  },
  {
    id: 'scaling_out',
    name: 'Position Scaling',
    description: 'What if you scaled out 50% at first target?',
    category: 'management',
    color: '#06B6D4' // cyan
  }
];

/**
 * Calculate better entry timing scenario
 * Improves entry prices by 5% in favor of the trade direction
 */
function calculateBetterEntry(trades: Trade[]): Trade[] {
  return trades.map(trade => {
    if (!trade.exitPrice) return trade; // Skip open trades
    
    const improvement = 0.05; // 5% improvement
    let newEntryPrice: number;
    
    if (trade.direction === TradeDirection.LONG) {
      // For long trades, better entry = lower entry price
      newEntryPrice = trade.entryPrice * (1 - improvement);
    } else {
      // For short trades, better entry = higher entry price
      newEntryPrice = trade.entryPrice * (1 + improvement);
    }
    
    // Recalculate PnL with new entry price
    const priceChange = trade.exitPrice - newEntryPrice;
    const pnl = trade.direction === TradeDirection.LONG 
      ? priceChange * trade.quantity
      : -priceChange * trade.quantity;
    
    const pnlPercentage = (pnl / (newEntryPrice * trade.quantity)) * 100;
    
    return {
      ...trade,
      entryPrice: newEntryPrice,
      pnl,
      pnlPercentage,
      netPnl: pnl - trade.commission
    };
  });
}

/**
 * Calculate better exit timing scenario
 * Improves exit prices by 5% in favor of the trade direction
 */
function calculateBetterExit(trades: Trade[]): Trade[] {
  return trades.map(trade => {
    if (!trade.exitPrice) return trade; // Skip open trades
    
    const improvement = 0.05; // 5% improvement
    let newExitPrice: number;
    
    if (trade.direction === TradeDirection.LONG) {
      // For long trades, better exit = higher exit price
      newExitPrice = trade.exitPrice * (1 + improvement);
    } else {
      // For short trades, better exit = lower exit price
      newExitPrice = trade.exitPrice * (1 - improvement);
    }
    
    // Recalculate PnL with new exit price
    const priceChange = newExitPrice - trade.entryPrice;
    const pnl = trade.direction === TradeDirection.LONG 
      ? priceChange * trade.quantity
      : -priceChange * trade.quantity;
    
    const pnlPercentage = (pnl / (trade.entryPrice * trade.quantity)) * 100;
    
    return {
      ...trade,
      exitPrice: newExitPrice,
      pnl,
      pnlPercentage,
      netPnl: pnl - trade.commission
    };
  });
}

/**
 * Calculate proper position sizing scenario
 * Adjusts all trades to risk exactly 2% of account
 */
function calculateProperPositionSizing(trades: Trade[], accountSize: number = 100000): Trade[] {
  const targetRiskPercent = 0.02; // 2%
  
  return trades.map(trade => {
    if (!trade.exitPrice || !trade.stopLoss) return trade; // Skip if no exit or stop loss
    
    const riskPerShare = Math.abs(trade.entryPrice - trade.stopLoss);
    const targetRiskAmount = accountSize * targetRiskPercent;
    const newQuantity = Math.floor(targetRiskAmount / riskPerShare);
    
    if (newQuantity <= 0) return trade;
    
    // Recalculate PnL with new quantity
    const priceChange = trade.exitPrice - trade.entryPrice;
    const pnl = trade.direction === TradeDirection.LONG 
      ? priceChange * newQuantity
      : -priceChange * newQuantity;
    
    const pnlPercentage = (pnl / (trade.entryPrice * newQuantity)) * 100;
    const newCommission = (trade.commission / trade.quantity) * newQuantity; // Scale commission
    
    return {
      ...trade,
      quantity: newQuantity,
      pnl,
      pnlPercentage,
      commission: newCommission,
      netPnl: pnl - newCommission
    };
  });
}

/**
 * Calculate winning setups only scenario
 * Removes all losing trades to see potential of best setups
 */
function calculateWinningSetupsOnly(trades: Trade[]): Trade[] {
  return trades.filter(trade => trade.pnl > 0);
}

/**
 * Calculate tighter stop losses scenario
 * Reduces stop loss distance by 20%, may convert some wins to losses
 */
function calculateTighterStops(trades: Trade[]): Trade[] {
  return trades.map(trade => {
    if (!trade.stopLoss || !trade.exitPrice) return trade;
    
    const stopImprovement = 0.2; // 20% tighter
    const stopDistance = Math.abs(trade.entryPrice - trade.stopLoss);
    const newStopDistance = stopDistance * (1 - stopImprovement);
    
    let newStopLoss: number;
    if (trade.direction === TradeDirection.LONG) {
      newStopLoss = trade.entryPrice - newStopDistance;
    } else {
      newStopLoss = trade.entryPrice + newStopDistance;
    }
    
    // Check if trade would have hit the new stop loss
    const wouldHitStop = trade.maxAdversePrice ? 
      (trade.direction === TradeDirection.LONG ? 
        trade.maxAdversePrice <= newStopLoss :
        trade.maxAdversePrice >= newStopLoss) : false;
    
    if (wouldHitStop) {
      // Trade would have been stopped out
      const priceChange = newStopLoss - trade.entryPrice;
      const pnl = trade.direction === TradeDirection.LONG 
        ? priceChange * trade.quantity
        : -priceChange * trade.quantity;
      
      const pnlPercentage = (pnl / (trade.entryPrice * trade.quantity)) * 100;
      
      return {
        ...trade,
        stopLoss: newStopLoss,
        exitPrice: newStopLoss,
        pnl,
        pnlPercentage,
        netPnl: pnl - trade.commission
      };
    }
    
    // Trade would have continued to original exit
    return {
      ...trade,
      stopLoss: newStopLoss
    };
  });
}

/**
 * Calculate position scaling scenario
 * Exits 50% of position at breakeven, lets 50% run to target
 */
function calculateScalingOut(trades: Trade[]): Trade[] {
  return trades.map(trade => {
    if (!trade.exitPrice || trade.pnl <= 0) return trade; // Only apply to winning trades
    
    // Assume scaling out at 50% profit point
    const halfPosition = trade.quantity * 0.5;
    const scalingPrice = trade.entryPrice + (trade.exitPrice - trade.entryPrice) * 0.5;
    
    // Calculate PnL from scaled position
    const firstHalfPnl = trade.direction === TradeDirection.LONG 
      ? (scalingPrice - trade.entryPrice) * halfPosition
      : (trade.entryPrice - scalingPrice) * halfPosition;
    
    const secondHalfPnl = trade.direction === TradeDirection.LONG 
      ? (trade.exitPrice - trade.entryPrice) * halfPosition
      : (trade.entryPrice - trade.exitPrice) * halfPosition;
    
    const totalPnl = firstHalfPnl + secondHalfPnl;
    const pnlPercentage = (totalPnl / (trade.entryPrice * trade.quantity)) * 100;
    
    // Assume higher commission due to additional trade
    const scaledCommission = trade.commission * 1.5;
    
    return {
      ...trade,
      pnl: totalPnl,
      pnlPercentage,
      commission: scaledCommission,
      netPnl: totalPnl - scaledCommission
    };
  });
}

/**
 * Generate insights based on scenario results
 */
function generateInsights(
  scenario: WhatIfScenario, 
  original: TradeStats, 
  improved: TradeStats,
  tradesAffected: number,
  totalTrades: number
): string[] {
  const insights: string[] = [];
  
  const pnlImprovement = improved.netPnl - original.netPnl;
  const winRateImprovement = improved.winRate - original.winRate;
  const profitFactorImprovement = improved.profitFactor - original.profitFactor;
  
  // General improvement insight
  if (pnlImprovement > 0) {
    insights.push(`This scenario could improve your total P&L by $${pnlImprovement.toFixed(2)} (${((pnlImprovement / Math.abs(original.netPnl)) * 100).toFixed(1)}%).`);
  }
  
  // Win rate insight
  if (winRateImprovement > 5) {
    insights.push(`Win rate would increase by ${winRateImprovement.toFixed(1)}%, from ${original.winRate.toFixed(1)}% to ${improved.winRate.toFixed(1)}%.`);
  }
  
  // Profit factor insight
  if (profitFactorImprovement > 0.2) {
    insights.push(`Profit factor would improve from ${original.profitFactor.toFixed(2)} to ${improved.profitFactor.toFixed(2)}.`);
  }
  
  // Scenario-specific insights
  switch (scenario.id) {
    case 'better_entry':
      insights.push('Focus on improving entry timing through better market analysis and patience.');
      insights.push('Consider using limit orders instead of market orders when possible.');
      break;
      
    case 'better_exit':
      insights.push('Develop clear exit criteria and stick to your trading plan.');
      insights.push('Consider using trailing stops to capture more upside on winning trades.');
      break;
      
    case 'proper_position_sizing':
      insights.push('Consistent 2% risk per trade provides better risk-adjusted returns.');
      insights.push('Use position sizing calculators to determine optimal trade size.');
      break;
      
    case 'winning_setups_only':
      const affectedPercent = (tradesAffected / totalTrades) * 100;
      insights.push(`${affectedPercent.toFixed(1)}% of your trades were losing setups that could be avoided.`);
      insights.push('Analyze losing trades to identify patterns and avoid similar setups.');
      break;
      
    case 'tighter_stops':
      insights.push('Tighter stops can reduce losses but may increase the number of stopped-out trades.');
      insights.push('Balance stop loss placement with market volatility and support/resistance levels.');
      break;
      
    case 'scaling_out':
      insights.push('Scaling out of positions can help lock in profits while maintaining upside potential.');
      insights.push('Consider partial profit-taking strategies for larger position sizes.');
      break;
  }
  
  return insights;
}

/**
 * Calculate improvement metrics between original and improved stats
 */
function calculateImprovement(original: TradeStats, improved: TradeStats, tradesAffected: number): WhatIfResult['improvement'] {
  return {
    totalPnlImprovement: improved.netPnl - original.netPnl,
    totalPnlImprovementPercent: original.netPnl !== 0 
      ? ((improved.netPnl - original.netPnl) / Math.abs(original.netPnl)) * 100 
      : 0,
    winRateImprovement: improved.winRate - original.winRate,
    profitFactorImprovement: improved.profitFactor - original.profitFactor,
    avgRMultipleImprovement: improved.avgRMultiple - original.avgRMultiple,
    tradesAffected
  };
}

/**
 * Main function to run What-If analysis on trades
 */
export function runWhatIfAnalysis(trades: Trade[]): WhatIfAnalysisResult {
  if (trades.length === 0) {
    const emptyStats = calculateTradeStats([]);
    return {
      originalStats: emptyStats,
      scenarios: [],
      topImprovements: [],
      summary: {
        bestScenario: {} as WhatIfResult,
        totalPotentialImprovement: 0,
        keyInsights: ['No trades available for analysis.']
      }
    };
  }
  
  const originalStats = calculateTradeStats(trades);
  const results: WhatIfResult[] = [];
  
  // Calculate each scenario
  for (const scenario of WHAT_IF_SCENARIOS) {
    let modifiedTrades: Trade[];
    let tradesAffected = 0;
    
    switch (scenario.id) {
      case 'better_entry':
        modifiedTrades = calculateBetterEntry(trades);
        tradesAffected = trades.filter(t => t.exitPrice).length;
        break;
        
      case 'better_exit':
        modifiedTrades = calculateBetterExit(trades);
        tradesAffected = trades.filter(t => t.exitPrice).length;
        break;
        
      case 'proper_position_sizing':
        modifiedTrades = calculateProperPositionSizing(trades);
        tradesAffected = trades.filter(t => t.exitPrice && t.stopLoss).length;
        break;
        
      case 'winning_setups_only':
        modifiedTrades = calculateWinningSetupsOnly(trades);
        tradesAffected = trades.length - modifiedTrades.length;
        break;
        
      case 'tighter_stops':
        modifiedTrades = calculateTighterStops(trades);
        tradesAffected = trades.filter(t => t.stopLoss && t.exitPrice).length;
        break;
        
      case 'scaling_out':
        modifiedTrades = calculateScalingOut(trades);
        tradesAffected = trades.filter(t => t.pnl > 0).length;
        break;
        
      default:
        modifiedTrades = trades;
        break;
    }
    
    const improvedStats = calculateTradeStats(modifiedTrades);
    const improvement = calculateImprovement(originalStats, improvedStats, tradesAffected);
    const insights = generateInsights(scenario, originalStats, improvedStats, tradesAffected, trades.length);
    
    results.push({
      scenario,
      originalStats,
      improvedStats,
      improvement,
      insights
    });
  }
  
  // Sort by total PnL improvement
  const topImprovements = [...results]
    .sort((a, b) => b.improvement.totalPnlImprovement - a.improvement.totalPnlImprovement)
    .slice(0, 3);
  
  const bestScenario = topImprovements[0];
  const totalPotentialImprovement = topImprovements.reduce(
    (sum, result) => sum + Math.max(0, result.improvement.totalPnlImprovement), 
    0
  );
  
  // Generate key insights
  const keyInsights: string[] = [];
  if (bestScenario) {
    keyInsights.push(`${bestScenario.scenario.name} offers the highest improvement potential: $${bestScenario.improvement.totalPnlImprovement.toFixed(2)}.`);
    
    const highImpactScenarios = topImprovements.filter(r => r.improvement.totalPnlImprovementPercent > 10);
    if (highImpactScenarios.length > 0) {
      keyInsights.push(`${highImpactScenarios.length} scenarios could improve your returns by more than 10%.`);
    }
    
    const winRateScenarios = results.filter(r => r.improvement.winRateImprovement > 5);
    if (winRateScenarios.length > 0) {
      keyInsights.push(`Focus on ${winRateScenarios[0].scenario.name.toLowerCase()} to significantly improve win rate.`);
    }
  }
  
  return {
    originalStats,
    scenarios: results,
    topImprovements,
    summary: {
      bestScenario,
      totalPotentialImprovement,
      keyInsights
    }
  };
}

/**
 * Get comparison data for charting
 */
export interface ComparisonChartData {
  scenario: string;
  originalPnL: number;
  improvedPnL: number;
  improvement: number;
  color: string;
}

export function getComparisonChartData(analysisResult: WhatIfAnalysisResult): ComparisonChartData[] {
  return analysisResult.scenarios.map(result => ({
    scenario: result.scenario.name,
    originalPnL: result.originalStats.netPnl,
    improvedPnL: result.improvedStats.netPnl,
    improvement: result.improvement.totalPnlImprovement,
    color: result.scenario.color
  }));
}