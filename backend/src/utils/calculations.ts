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
      netPnl: 0
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
      netPnl: 0
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
    netPnl
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

  return {
    pnl: Number(pnl.toFixed(2)),
    pnlPercentage: Number(pnlPercentage.toFixed(2)),
    efficiency: Number(Math.max(0, Math.min(100, efficiency)).toFixed(2)),
    rMultiple: Number(rMultiple.toFixed(2)),
    commission: Number(commission.toFixed(2)),
    netPnl: Number(netPnl.toFixed(2))
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