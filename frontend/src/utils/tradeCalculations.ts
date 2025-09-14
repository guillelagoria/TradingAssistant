import { MarketInfo, Direction, NewTrade, TradeDirection, TradeFormData } from '../types/trade';

/**
 * Simplified trade calculation utilities for the new single-form interface
 * Adapted from the comprehensive backend calculations but optimized for frontend use
 */

export interface TradeMetrics {
  pnlPoints: number;
  pnlUsd: number;
  pnlPercentage: number;
  riskPoints: number;
  rewardPoints: number;
  riskRewardRatio: number;
  efficiency: number;
  commission: number;
  netPnl: number;
  rMultiple: number;
}

/**
 * Calculate comprehensive trade metrics
 */
export function calculateTradeMetrics(
  entryPrice: number,
  exitPrice: number,
  stopLoss: number,
  takeProfit: number,
  market: MarketInfo,
  maxFavorablePrice?: number
): TradeMetrics {
  const direction = determineDirection(entryPrice, exitPrice);

  // P&L calculations
  const pnlPoints = calculatePnLPoints(entryPrice, exitPrice, direction);
  const grossPnlUsd = pnlPoints * market.pointValue;
  const commission = market.commission;
  const netPnl = grossPnlUsd - commission;

  // P&L percentage calculation
  const pnlPercentage = entryPrice > 0 ? ((exitPrice - entryPrice) / entryPrice) * 100 * (direction === 'long' ? 1 : -1) : 0;

  // Risk/Reward calculations
  const riskPoints = calculateRiskPoints(entryPrice, stopLoss, direction);
  const rewardPoints = calculateRewardPoints(entryPrice, takeProfit, direction);
  const riskRewardRatio = riskPoints > 0 ? rewardPoints / riskPoints : 0;

  // R-Multiple calculation
  const rMultiple = riskPoints > 0 ? pnlPoints / riskPoints : 0;

  // Efficiency calculation
  const efficiency = calculateEfficiency(entryPrice, exitPrice, maxFavorablePrice, direction);

  return {
    pnlPoints: Number(pnlPoints.toFixed(2)),
    pnlUsd: Number(grossPnlUsd.toFixed(2)),
    pnlPercentage: Number(pnlPercentage.toFixed(2)),
    riskPoints: Number(riskPoints.toFixed(2)),
    rewardPoints: Number(rewardPoints.toFixed(2)),
    riskRewardRatio: Number(riskRewardRatio.toFixed(2)),
    efficiency: Number(efficiency.toFixed(1)),
    commission: Number(commission.toFixed(2)),
    netPnl: Number(netPnl.toFixed(2)),
    rMultiple: Number(rMultiple.toFixed(2)),
  };
}

/**
 * Determine trade direction based on entry and exit prices
 */
export function determineDirection(entryPrice: number, exitPrice: number): Direction {
  return exitPrice > entryPrice ? 'long' : 'short';
}

/**
 * Calculate P&L in points
 */
export function calculatePnLPoints(
  entryPrice: number,
  exitPrice: number,
  direction: Direction
): number {
  if (direction === 'long') {
    return exitPrice - entryPrice;
  } else {
    return entryPrice - exitPrice;
  }
}

/**
 * Calculate risk in points
 */
export function calculateRiskPoints(
  entryPrice: number,
  stopLoss: number,
  direction: Direction
): number {
  if (direction === 'long') {
    return entryPrice - stopLoss;
  } else {
    return stopLoss - entryPrice;
  }
}

/**
 * Calculate reward in points
 */
export function calculateRewardPoints(
  entryPrice: number,
  takeProfit: number,
  direction: Direction
): number {
  if (direction === 'long') {
    return takeProfit - entryPrice;
  } else {
    return entryPrice - takeProfit;
  }
}

/**
 * Calculate risk-reward ratio
 */
export function calculateRiskRewardRatio(
  entryPrice: number,
  stopLoss: number,
  takeProfit: number
): number {
  const direction = determineDirection(entryPrice, takeProfit);
  const risk = calculateRiskPoints(entryPrice, stopLoss, direction);
  const reward = calculateRewardPoints(entryPrice, takeProfit, direction);

  return risk > 0 ? reward / risk : 0;
}

/**
 * Calculate trade efficiency based on maximum favorable price
 */
export function calculateEfficiency(
  entryPrice: number,
  exitPrice: number,
  maxFavorablePrice: number | undefined,
  direction: Direction
): number {
  if (!maxFavorablePrice) return 0;

  let maxMove: number;
  let actualMove: number;

  if (direction === 'long') {
    maxMove = maxFavorablePrice - entryPrice;
    actualMove = exitPrice - entryPrice;
  } else {
    maxMove = entryPrice - maxFavorablePrice;
    actualMove = entryPrice - exitPrice;
  }

  if (maxMove <= 0) return 0;
  return Math.min(100, Math.max(0, (actualMove / maxMove) * 100));
}

/**
 * Calculate position size based on risk amount and market specifications
 */
export function calculatePositionSize(
  riskAmountUsd: number,
  entryPrice: number,
  stopLoss: number,
  market: MarketInfo
): number {
  const direction = determineDirection(entryPrice, entryPrice > stopLoss ? entryPrice + 1 : entryPrice - 1);
  const riskPoints = calculateRiskPoints(entryPrice, stopLoss, direction);
  const riskPerContract = riskPoints * market.pointValue;

  return riskPerContract > 0 ? Math.floor(riskAmountUsd / riskPerContract) : 0;
}

/**
 * Validate trade setup for logical consistency
 */
export function validateTradeSetup(
  entryPrice: number,
  exitPrice: number,
  stopLoss: number,
  takeProfit: number,
  market?: MarketInfo
): string[] {
  const errors: string[] = [];

  // Basic price validation
  if (entryPrice <= 0) errors.push('Entry price must be greater than zero');
  if (exitPrice <= 0) errors.push('Exit price must be greater than zero');
  if (stopLoss <= 0) errors.push('Stop loss must be greater than zero');
  if (takeProfit <= 0) errors.push('Take profit must be greater than zero');

  if (errors.length > 0) return errors;

  // Direction-based validation
  const direction = determineDirection(entryPrice, exitPrice);

  if (direction === 'long') {
    if (stopLoss >= entryPrice) {
      errors.push('Stop loss must be below entry price for long trades');
    }
    if (takeProfit <= entryPrice) {
      errors.push('Take profit must be above entry price for long trades');
    }
  } else {
    if (stopLoss <= entryPrice) {
      errors.push('Stop loss must be above entry price for short trades');
    }
    if (takeProfit >= entryPrice) {
      errors.push('Take profit must be below entry price for short trades');
    }
  }

  // Market-specific validation
  if (market) {
    const prices = [entryPrice, exitPrice, stopLoss, takeProfit];
    prices.forEach((price, index) => {
      const priceNames = ['entry price', 'exit price', 'stop loss', 'take profit'];
      if (!isValidPriceIncrement(price, market)) {
        errors.push(`${priceNames[index]} must be a valid increment for ${market.symbol} (tick size: ${market.tickSize})`);
      }
    });
  }

  return errors;
}

/**
 * Check if a price respects the market's tick size
 */
export function isValidPriceIncrement(price: number, market: MarketInfo): boolean {
  if (!market.tickSize) return true;

  const remainder = price % market.tickSize;
  return Math.abs(remainder) < 0.0001 || Math.abs(remainder - market.tickSize) < 0.0001;
}

/**
 * Round price to the nearest valid tick for the market
 */
export function roundToNearestTick(price: number, market: MarketInfo): number {
  if (!market.tickSize) return price;
  return Math.round(price / market.tickSize) * market.tickSize;
}

/**
 * Format price according to market conventions
 */
export function formatMarketPrice(price: number, market: MarketInfo): string {
  let decimals = 2;
  if (market.tickSize >= 1) decimals = 0;
  else if (market.tickSize >= 0.1) decimals = 1;
  else if (market.tickSize >= 0.01) decimals = 2;
  else if (market.tickSize >= 0.001) decimals = 3;

  return price.toFixed(decimals);
}

/**
 * Calculate trade statistics for a collection of trades
 */
export function calculateTradeStatistics(trades: NewTrade[]) {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winTrades: 0,
      lossTrades: 0,
      winRate: 0,
      totalPnl: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      maxWin: 0,
      maxLoss: 0,
      avgEfficiency: 0,
      totalCommissions: 0,
      netPnl: 0,
    };
  }

  const winningTrades = trades.filter(t => t.pnlUsd > 0);
  const losingTrades = trades.filter(t => t.pnlUsd < 0);

  const totalPnl = trades.reduce((sum, t) => sum + t.pnlUsd, 0);
  const totalCommissions = trades.reduce((sum, t) => sum + t.marketInfo.commission, 0);
  const netPnl = totalPnl - totalCommissions;

  const totalWins = winningTrades.reduce((sum, t) => sum + t.pnlUsd, 0);
  const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnlUsd, 0));

  const avgWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;

  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

  const maxWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnlUsd)) : 0;
  const maxLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnlUsd)) : 0;

  const avgEfficiency = trades.length > 0
    ? trades.reduce((sum, t) => sum + t.efficiency, 0) / trades.length
    : 0;

  return {
    totalTrades: trades.length,
    winTrades: winningTrades.length,
    lossTrades: losingTrades.length,
    winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
    totalPnl: Number(totalPnl.toFixed(2)),
    avgWin: Number(avgWin.toFixed(2)),
    avgLoss: Number(avgLoss.toFixed(2)),
    profitFactor: Number(profitFactor.toFixed(2)),
    maxWin: Number(maxWin.toFixed(2)),
    maxLoss: Number(maxLoss.toFixed(2)),
    avgEfficiency: Number(avgEfficiency.toFixed(1)),
    totalCommissions: Number(totalCommissions.toFixed(2)),
    netPnl: Number(netPnl.toFixed(2)),
  };
}

/**
 * Calculate trade statistics from an array of trades (compatible with Trade type)
 */
export function calculateTradeStats(trades: Trade[]): {
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
} {
  const closedTrades = trades.filter(trade => trade.exitPrice && trade.exitPrice > 0);
  const winTrades = closedTrades.filter(trade => (trade.pnl || 0) > 0);
  const lossTrades = closedTrades.filter(trade => (trade.pnl || 0) < 0);
  const breakevenTrades = closedTrades.filter(trade => (trade.pnl || 0) === 0);

  const totalPnl = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const totalCommission = closedTrades.reduce((sum, trade) => sum + (trade.commission || 0), 0);
  const netPnl = totalPnl - totalCommission;

  const winRate = closedTrades.length > 0 ? (winTrades.length / closedTrades.length) * 100 : 0;

  const avgWin = winTrades.length > 0 ? winTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0) / winTrades.length : 0;
  const avgLoss = lossTrades.length > 0 ? Math.abs(lossTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0)) / lossTrades.length : 0;

  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;

  const maxWin = winTrades.length > 0 ? Math.max(...winTrades.map(trade => trade.pnl || 0)) : 0;
  const maxLoss = lossTrades.length > 0 ? Math.min(...lossTrades.map(trade => trade.pnl || 0)) : 0;

  const avgRMultiple = closedTrades.length > 0 ? closedTrades.reduce((sum, trade) => sum + (trade.rMultiple || 0), 0) / closedTrades.length : 0;
  const avgEfficiency = closedTrades.length > 0 ? closedTrades.reduce((sum, trade) => sum + (trade.efficiency || 0), 0) / closedTrades.length : 0;

  return {
    totalTrades: closedTrades.length,
    winTrades: winTrades.length,
    lossTrades: lossTrades.length,
    breakevenTrades: breakevenTrades.length,
    winRate,
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
 * Validate trade data for calculations
 */
export function validateTradeData(trade: Partial<TradeFormData>): string[] {
  const errors: string[] = [];

  if (!trade.symbol?.trim()) {
    errors.push('Symbol is required');
  }

  if (!trade.direction) {
    errors.push('Direction is required');
  }

  if (!trade.entryPrice || trade.entryPrice <= 0) {
    errors.push('Entry price must be greater than 0');
  }

  if (!trade.quantity || trade.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }

  if (!trade.entryDate) {
    errors.push('Entry date is required');
  }

  if (trade.exitPrice && trade.exitPrice <= 0) {
    errors.push('Exit price must be greater than 0');
  }

  if (trade.exitDate && trade.entryDate && trade.exitDate < trade.entryDate) {
    errors.push('Exit date must be after entry date');
  }

  if (trade.stopLoss && trade.entryPrice) {
    if (trade.direction === TradeDirection.LONG && trade.stopLoss >= trade.entryPrice) {
      errors.push('Stop loss for LONG position must be below entry price');
    }
    if (trade.direction === TradeDirection.SHORT && trade.stopLoss <= trade.entryPrice) {
      errors.push('Stop loss for SHORT position must be above entry price');
    }
  }

  if (trade.takeProfit && trade.entryPrice) {
    if (trade.direction === TradeDirection.LONG && trade.takeProfit <= trade.entryPrice) {
      errors.push('Take profit for LONG position must be above entry price');
    }
    if (trade.direction === TradeDirection.SHORT && trade.takeProfit >= trade.entryPrice) {
      errors.push('Take profit for SHORT position must be below entry price');
    }
  }

  if (trade.riskPercentage && (trade.riskPercentage <= 0 || trade.riskPercentage > 100)) {
    errors.push('Risk percentage must be between 0 and 100');
  }

  return errors;
}

/**
 * Format currency values
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number | undefined | null, decimals: number = 2): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0%';
  }
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format R-multiple values
 */
export function formatRMultiple(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0.00R';
  }
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}R`;
}