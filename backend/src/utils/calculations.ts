import { TradeDirection } from '@prisma/client';

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
 * Calculate individual trade metrics
 */
export function calculateTradeMetrics(tradeData: any) {
  const {
    direction,
    entryPrice,
    exitPrice,
    quantity,
    stopLoss,
    takeProfit,
    maxFavorablePrice,
    maxAdversePrice
  } = tradeData;

  // If no exit price, return zeros (open trade)
  if (!exitPrice) {
    return {
      pnl: 0,
      pnlPercentage: 0,
      efficiency: 0,
      rMultiple: 0,
      commission: calculateCommission(entryPrice, quantity),
      netPnl: 0
    };
  }

  // Calculate basic P&L
  const priceChange = exitPrice - entryPrice;
  const pnl = direction === TradeDirection.LONG 
    ? priceChange * quantity 
    : -priceChange * quantity;

  const pnlPercentage = (pnl / (entryPrice * quantity)) * 100;

  // Calculate commission (simplified - could be more complex based on broker)
  const commission = calculateCommission(entryPrice, quantity) + calculateCommission(exitPrice, quantity);

  const netPnl = pnl - commission;

  // Calculate R-Multiple (Risk-Reward ratio)
  let rMultiple = 0;
  if (stopLoss) {
    const riskPerShare = Math.abs(entryPrice - stopLoss);
    const risk = riskPerShare * quantity;
    rMultiple = risk > 0 ? pnl / risk : 0;
  }

  // Calculate efficiency (how much of the potential move was captured)
  let efficiency = 0;
  if (maxFavorablePrice && maxAdversePrice) {
    const totalMove = Math.abs(maxFavorablePrice - maxAdversePrice);
    const capturedMove = Math.abs(exitPrice - entryPrice);
    efficiency = totalMove > 0 ? (capturedMove / totalMove) * 100 : 0;
  } else if (maxFavorablePrice) {
    const potentialMove = direction === TradeDirection.LONG 
      ? maxFavorablePrice - entryPrice
      : entryPrice - maxFavorablePrice;
    const actualMove = direction === TradeDirection.LONG 
      ? exitPrice - entryPrice
      : entryPrice - exitPrice;
    efficiency = potentialMove > 0 ? (actualMove / potentialMove) * 100 : 0;
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

/**
 * Calculate commission based on simple percentage model
 * In a real app, this would be more sophisticated based on broker rules
 */
function calculateCommission(price: number, quantity: number, rate: number = 0.001): number {
  // Simple percentage-based commission (0.1% default)
  return price * quantity * rate;
}

/**
 * Calculate position size based on risk amount and stop loss
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