import { TradeDirection } from '@prisma/client';
import { marketService } from '../services/market.service';

export interface TradeStats {
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  breakevenTrades: number;
  winRate: number;
  totalPnl: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  maxWin: number;
  maxLoss: number;
  avgRMultiple: number;
  avgEfficiency: number;
  totalCommission: number;
  netPnl: number;
  currentWinStreak: number;
  currentLossStreak: number;
  maxWinStreak: number;
  maxLossStreak: number;
}

/**
 * Calculate winning and losing streaks from trades
 */
export function calculateStreaks(trades: any[]) {
  if (trades.length === 0) {
    return {
      currentWinStreak: 0,
      currentLossStreak: 0,
      maxWinStreak: 0,
      maxLossStreak: 0
    };
  }

  // Sort trades by date to get chronological order - use exitDate if available, otherwise entryDate
  const sortedTrades = [...trades].sort((a, b) => {
    const dateA = new Date(a.exitDate || a.entryDate);
    const dateB = new Date(b.exitDate || b.entryDate);
    return dateA.getTime() - dateB.getTime();
  });

  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let tempWinStreak = 0;
  let tempLossStreak = 0;

  // Iterate through trades to calculate streaks
  for (let i = 0; i < sortedTrades.length; i++) {
    const trade = sortedTrades[i];
    const pnl = trade.pnl || 0;

    if (pnl > 0) {
      // Winning trade
      tempWinStreak++;
      tempLossStreak = 0;

      // Update max win streak
      if (tempWinStreak > maxWinStreak) {
        maxWinStreak = tempWinStreak;
      }
    } else if (pnl < 0) {
      // Losing trade
      tempLossStreak++;
      tempWinStreak = 0;

      // Update max loss streak
      if (tempLossStreak > maxLossStreak) {
        maxLossStreak = tempLossStreak;
      }
    } else {
      // Breakeven trade - reset both streaks
      tempWinStreak = 0;
      tempLossStreak = 0;
    }
  }

  // Current streaks are the last calculated temp streaks
  currentWinStreak = tempWinStreak;
  currentLossStreak = tempLossStreak;

  return {
    currentWinStreak,
    currentLossStreak,
    maxWinStreak,
    maxLossStreak
  };
}

/**
 * Calculate comprehensive statistics from an array of trades
 */
export function calculateTradeStats(trades: any[]): TradeStats {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winTrades: 0,
      lossTrades: 0,
      breakevenTrades: 0,
      winRate: 0,
      totalPnl: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      maxWin: 0,
      maxLoss: 0,
      avgRMultiple: 0,
      avgEfficiency: 0,
      totalCommission: 0,
      netPnl: 0,
      currentWinStreak: 0,
      currentLossStreak: 0,
      maxWinStreak: 0,
      maxLossStreak: 0
    };
  }

  const completedTrades = trades.filter(trade => trade.exitPrice !== null && trade.exitPrice !== undefined);
  
  if (completedTrades.length === 0) {
    return {
      totalTrades: trades.length,
      winTrades: 0,
      lossTrades: 0,
      breakevenTrades: 0,
      winRate: 0,
      totalPnl: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      maxWin: 0,
      maxLoss: 0,
      avgRMultiple: 0,
      avgEfficiency: 0,
      totalCommission: 0,
      netPnl: 0,
      currentWinStreak: 0,
      currentLossStreak: 0,
      maxWinStreak: 0,
      maxLossStreak: 0
    };
  }

  // Separate winning, losing, and breakeven trades
  const winningTrades = completedTrades.filter(trade => (trade.pnl || 0) > 0);
  const losingTrades = completedTrades.filter(trade => (trade.pnl || 0) < 0);
  const breakevenTrades = completedTrades.filter(trade => (trade.pnl || 0) === 0);

  // Calculate basic metrics
  const totalPnl = completedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const totalCommission = completedTrades.reduce((sum, trade) => sum + (trade.commission || 0), 0);
  const netPnl = totalPnl - totalCommission;

  // Win/Loss statistics
  const totalWins = winningTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0));
  
  const avgWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;

  // Profit factor
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

  // Max win/loss
  const maxWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl || 0)) : 0;
  const maxLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl || 0)) : 0;

  // R-Multiple and Efficiency averages
  const rMultiples = completedTrades
    .map(trade => trade.rMultiple || 0)
    .filter(r => !isNaN(r) && isFinite(r));
  const avgRMultiple = rMultiples.length > 0 ? rMultiples.reduce((sum, r) => sum + r, 0) / rMultiples.length : 0;

  const efficiencies = completedTrades
    .map(trade => trade.efficiency || 0)
    .filter(e => !isNaN(e) && isFinite(e));
  const avgEfficiency = efficiencies.length > 0 ? efficiencies.reduce((sum, e) => sum + e, 0) / efficiencies.length : 0;

  // Calculate streaks
  const streakData = calculateStreaks(completedTrades);

  return {
    totalTrades: trades.length,
    winTrades: winningTrades.length,
    lossTrades: losingTrades.length,
    breakevenTrades: breakevenTrades.length,
    winRate: completedTrades.length > 0 ? (winningTrades.length / completedTrades.length) * 100 : 0,
    totalPnl,
    avgWin,
    avgLoss,
    profitFactor,
    maxWin,
    maxLoss,
    avgRMultiple,
    avgEfficiency,
    totalCommission,
    netPnl,
    currentWinStreak: streakData.currentWinStreak,
    currentLossStreak: streakData.currentLossStreak,
    maxWinStreak: streakData.maxWinStreak,
    maxLossStreak: streakData.maxLossStreak
  };
}

/**
 * Calculate individual trade metrics with market-aware calculations
 */
export function calculateTradeMetrics(tradeData: any) {
  const {
    direction,
    entryPrice,
    exitPrice,
    quantity,
    stopLoss,
    maxFavorablePrice,
    maxAdversePrice,
    mae,
    mfe,
    market = 'ES' // Default to ES if not specified
  } = tradeData;

  // Get market specification for accurate calculations
  const marketSpec = marketService.getMarket(market);
  if (!marketSpec) {
    throw new Error(`Market not found: ${market}`);
  }

  // If no exit price, return zeros (open trade)
  if (!exitPrice) {
    const commission = marketService.calculateCommission(quantity, marketSpec, false); // One-way commission for open trade
    return {
      pnl: 0,
      pnlPercentage: 0,
      efficiency: 0,
      rMultiple: 0,
      commission,
      netPnl: 0
    };
  }

  // Calculate P&L using market-specific calculations
  const pnlResult = marketService.calculatePnL(
    entryPrice,
    exitPrice,
    quantity,
    market,
    direction === TradeDirection.LONG ? 'LONG' : 'SHORT',
    true
  );

  const pnl = pnlResult.grossPnL;
  const commission = pnlResult.commission;
  const netPnl = pnlResult.netPnL;

  // Calculate percentage P&L based on contract value
  const contractValue = marketSpec.category === 'futures'
    ? entryPrice * marketSpec.pointValue * quantity
    : entryPrice * quantity;

  const pnlPercentage = contractValue > 0 ? (pnl / contractValue) * 100 : 0;

  // Calculate R-Multiple using market service
  let rMultiple = 0;
  if (stopLoss) {
    rMultiple = marketService.calculateRMultiple(
      entryPrice,
      exitPrice,
      stopLoss,
      direction === TradeDirection.LONG ? 'LONG' : 'SHORT'
    );
  }

  // Calculate efficiency using market service
  let efficiency = 0;
  if (maxFavorablePrice) {
    efficiency = marketService.calculateEfficiency(
      entryPrice,
      exitPrice,
      maxFavorablePrice,
      direction === TradeDirection.LONG ? 'LONG' : 'SHORT'
    );
  } else if (maxFavorablePrice && maxAdversePrice) {
    const totalMove = Math.abs(maxFavorablePrice - maxAdversePrice);
    const capturedMove = Math.abs(exitPrice - entryPrice);
    efficiency = totalMove > 0 ? (capturedMove / totalMove) * 100 : 0;
  }

  // Calculate advanced efficiency metrics if MAE/MFE data is available
  let advancedMetrics = {};
  if (mae && mfe) {
    const advanced = calculateAdvancedEfficiency(
      entryPrice,
      exitPrice,
      mae,
      mfe,
      stopLoss,
      direction === TradeDirection.LONG ? 'LONG' : 'SHORT'
    );
    advancedMetrics = {
      maeEfficiency: Number(advanced.maeEfficiency.toFixed(2)),
      mfeEfficiency: Number(advanced.mfeEfficiency.toFixed(2)),
      riskRealization: Number(advanced.riskRealization.toFixed(2))
    };
  }

  // Analyze data quality
  const dataQualityAnalysis = analyzeTradeDataQuality(tradeData);

  return {
    pnl: Number(pnl.toFixed(2)),
    pnlPercentage: Number(pnlPercentage.toFixed(2)),
    efficiency: Number(Math.max(0, Math.min(100, efficiency)).toFixed(2)),
    rMultiple: Number(rMultiple.toFixed(2)),
    commission: Number(commission.toFixed(2)),
    netPnl: Number(netPnl.toFixed(2)),
    ...advancedMetrics,
    hasAdvancedData: dataQualityAnalysis.hasAdvancedData,
    dataQuality: dataQualityAnalysis.dataQuality
  };
}

// Removed unused _calculateCommission function - use marketService.calculateCommission() instead

/**
 * Market-aware commission calculation
 */
export function calculateMarketCommission(quantity: number, market: string = 'ES', isRoundTurn: boolean = true): number {
  const marketSpec = marketService.getMarket(market);
  if (!marketSpec) {
    throw new Error(`Market not found: ${market}`);
  }

  return marketService.calculateCommission(quantity, marketSpec, isRoundTurn);
}

/**
 * Calculate position size based on risk amount and stop loss
 * @deprecated Use marketService.calculatePositionSize() for market-aware calculations
 */
export function calculatePositionSize(
  entryPrice: number,
  stopLoss: number,
  riskAmount: number
): number {
  const riskPerShare = Math.abs(entryPrice - stopLoss);
  return riskPerShare > 0 ? Math.floor(riskAmount / riskPerShare) : 0;
}

/**
 * Market-aware position size calculation
 */
export function calculateMarketPositionSize(
  riskAmount: number,
  entryPrice: number,
  stopLoss: number,
  market: string = 'ES'
): number {
  const marketSpec = marketService.getMarket(market);
  if (!marketSpec) {
    throw new Error(`Market not found: ${market}`);
  }

  return marketService.calculatePositionSize(riskAmount, entryPrice, stopLoss, marketSpec);
}

/**
 * Calculate risk-reward ratio
 */
export function calculateRiskReward(
  entryPrice: number,
  stopLoss: number,
  takeProfit: number
): number {
  const risk = Math.abs(entryPrice - stopLoss);
  const reward = Math.abs(takeProfit - entryPrice);
  return risk > 0 ? reward / risk : 0;
}

/**
 * Calculate advanced efficiency metrics from MAE/MFE data
 */
export function calculateAdvancedEfficiency(
  entryPrice: number,
  exitPrice: number,
  mae: number,
  mfe: number,
  stopLoss?: number,
  direction: 'LONG' | 'SHORT' = 'LONG'
) {
  const pnl = direction === 'LONG' ? exitPrice - entryPrice : entryPrice - exitPrice;

  // MFE Efficiency: How much of the maximum favorable move was captured
  let mfeEfficiency = 0;
  if (mfe && mfe !== 0) {
    const maxPotentialPnl = direction === 'LONG' ? mfe - entryPrice : entryPrice - mfe;
    mfeEfficiency = maxPotentialPnl > 0 ? (pnl / maxPotentialPnl) * 100 : 0;
  }

  // MAE Efficiency: How well the trade avoided the maximum adverse move
  let maeEfficiency = 0;
  if (mae && mae !== 0) {
    const maxAdversePnl = direction === 'LONG' ? mae - entryPrice : entryPrice - mae;
    // Higher is better - means less of the adverse move was experienced
    maeEfficiency = maxAdversePnl < 0 ? (1 - Math.abs(pnl / maxAdversePnl)) * 100 : 100;
  }

  // Risk Realization: How much of the stop loss distance was actually hit
  let riskRealization = 0;
  if (stopLoss && mae) {
    const stopDistance = Math.abs(entryPrice - stopLoss);
    const maeDistance = Math.abs(entryPrice - mae);
    riskRealization = stopDistance > 0 ? (maeDistance / stopDistance) * 100 : 0;
  }

  return {
    mfeEfficiency: Math.max(0, Math.min(100, mfeEfficiency)),
    maeEfficiency: Math.max(0, Math.min(100, maeEfficiency)),
    riskRealization: Math.max(0, Math.min(100, riskRealization))
  };
}

/**
 * Analyze data quality of a trade and set appropriate flags
 */
export function analyzeTradeDataQuality(tradeData: any): { hasAdvancedData: boolean; dataQuality: 'BASIC' | 'ENHANCED' | 'COMPLETE' } {
  const hasMAE = tradeData.mae !== null && tradeData.mae !== undefined;
  const hasMFE = tradeData.mfe !== null && tradeData.mfe !== undefined;
  const hasETD = tradeData.etd !== null && tradeData.etd !== undefined;
  const hasBars = tradeData.bars !== null && tradeData.bars !== undefined;
  const hasNT8Fields = Boolean(
    tradeData.tradeNumber ||
    tradeData.instrumentFull ||
    tradeData.nt8Strategy ||
    tradeData.entryName ||
    tradeData.exitName
  );

  // Determine data quality level
  let dataQuality: 'BASIC' | 'ENHANCED' | 'COMPLETE';
  let hasAdvancedData = false;

  if (hasNT8Fields && hasMAE && hasMFE && hasETD && hasBars) {
    dataQuality = 'COMPLETE';
    hasAdvancedData = true;
  } else if ((hasMAE && hasMFE) || hasNT8Fields) {
    dataQuality = 'ENHANCED';
    hasAdvancedData = true;
  } else {
    dataQuality = 'BASIC';
    hasAdvancedData = false;
  }

  return { hasAdvancedData, dataQuality };
}

/**
 * Calculate comprehensive trade statistics based on data quality
 */
export function calculateAdaptiveTradeStats(trades: any[]): TradeStats & {
  advancedMetrics?: {
    avgMFEEfficiency: number;
    avgMAEEfficiency: number;
    avgRiskRealization: number;
    dataQualityDistribution: Record<string, number>;
  };
} {
  const basicStats = calculateTradeStats(trades);

  // Separate trades by data quality
  const enhancedTrades = trades.filter(t => t.hasAdvancedData && (t.mae || t.mfe));

  if (enhancedTrades.length === 0) {
    return basicStats;
  }

  // Calculate advanced metrics
  const mfeEfficiencies = enhancedTrades
    .map(t => t.mfeEfficiency)
    .filter(e => e !== null && e !== undefined && !isNaN(e));

  const maeEfficiencies = enhancedTrades
    .map(t => t.maeEfficiency)
    .filter(e => e !== null && e !== undefined && !isNaN(e));

  const riskRealizations = enhancedTrades
    .map(t => t.riskRealization)
    .filter(r => r !== null && r !== undefined && !isNaN(r));

  // Data quality distribution
  const dataQualityDistribution = trades.reduce((acc, trade) => {
    const quality = trade.dataQuality || 'BASIC';
    acc[quality] = (acc[quality] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    ...basicStats,
    advancedMetrics: {
      avgMFEEfficiency: mfeEfficiencies.length > 0 ? mfeEfficiencies.reduce((a, b) => a + b, 0) / mfeEfficiencies.length : 0,
      avgMAEEfficiency: maeEfficiencies.length > 0 ? maeEfficiencies.reduce((a, b) => a + b, 0) / maeEfficiencies.length : 0,
      avgRiskRealization: riskRealizations.length > 0 ? riskRealizations.reduce((a, b) => a + b, 0) / riskRealizations.length : 0,
      dataQualityDistribution
    }
  };
}