import { TradeDirection, TradeFormData, TradeCalculationResult, PositionSizeCalculation, Trade } from '../types/trade';

// Default commission settings - can be made configurable later
const DEFAULT_COMMISSION_RATE = 0.001; // 0.1%
const DEFAULT_MIN_COMMISSION = 1.0;

/**
 * Calculate PnL for a trade
 */
export function calculatePnL(
  direction: TradeDirection,
  entryPrice: number,
  exitPrice: number,
  quantity: number
): number {
  if (direction === TradeDirection.LONG) {
    return (exitPrice - entryPrice) * quantity;
  } else {
    return (entryPrice - exitPrice) * quantity;
  }
}

/**
 * Calculate PnL percentage
 */
export function calculatePnLPercentage(
  direction: TradeDirection,
  entryPrice: number,
  exitPrice: number
): number {
  if (direction === TradeDirection.LONG) {
    return ((exitPrice - entryPrice) / entryPrice) * 100;
  } else {
    return ((entryPrice - exitPrice) / entryPrice) * 100;
  }
}

/**
 * Calculate commission for a trade
 */
export function calculateCommission(
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  commissionRate: number = DEFAULT_COMMISSION_RATE,
  minCommission: number = DEFAULT_MIN_COMMISSION
): number {
  const entryValue = entryPrice * quantity;
  const exitValue = exitPrice * quantity;
  const totalValue = entryValue + exitValue;
  
  const commission = totalValue * commissionRate;
  return Math.max(commission, minCommission * 2); // 2x because we have entry + exit
}

/**
 * Calculate R-multiple (Risk/Reward ratio)
 * R-multiple = Actual PnL / Risk Amount
 */
export function calculateRMultiple(
  actualPnL: number,
  riskAmount: number
): number {
  if (riskAmount === 0) return 0;
  return actualPnL / Math.abs(riskAmount);
}

/**
 * Calculate efficiency (how much of the favorable move was captured)
 */
export function calculateEfficiency(
  direction: TradeDirection,
  entryPrice: number,
  exitPrice: number,
  maxFavorablePrice?: number
): number {
  if (!maxFavorablePrice) return 0;
  
  let actualMove: number;
  let potentialMove: number;
  
  if (direction === TradeDirection.LONG) {
    actualMove = exitPrice - entryPrice;
    potentialMove = maxFavorablePrice - entryPrice;
  } else {
    actualMove = entryPrice - exitPrice;
    potentialMove = entryPrice - maxFavorablePrice;
  }
  
  if (potentialMove <= 0) return 0;
  return Math.max(0, Math.min(100, (actualMove / potentialMove) * 100));
}

/**
 * Calculate position size based on risk parameters
 */
export function calculatePositionSize(
  accountBalance: number,
  riskPercentage: number,
  entryPrice: number,
  stopLoss: number,
  direction: TradeDirection
): PositionSizeCalculation {
  const riskAmount = (accountBalance * riskPercentage) / 100;
  
  let riskPerShare: number;
  if (direction === TradeDirection.LONG) {
    riskPerShare = entryPrice - stopLoss;
  } else {
    riskPerShare = stopLoss - entryPrice;
  }
  
  if (riskPerShare <= 0) {
    return {
      positionSize: 0,
      riskAmount: 0,
      sharesOrContracts: 0
    };
  }
  
  const sharesOrContracts = Math.floor(riskAmount / riskPerShare);
  const actualPositionSize = sharesOrContracts * entryPrice;
  const actualRiskAmount = sharesOrContracts * riskPerShare;
  
  return {
    positionSize: actualPositionSize,
    riskAmount: actualRiskAmount,
    sharesOrContracts: sharesOrContracts
  };
}

/**
 * Calculate holding period in minutes
 */
export function calculateHoldingPeriod(entryDate: Date, exitDate: Date): number {
  return Math.floor((exitDate.getTime() - entryDate.getTime()) / (1000 * 60));
}

/**
 * Calculate maximum drawdown during the trade
 */
export function calculateMaxDrawdown(
  direction: TradeDirection,
  entryPrice: number,
  maxAdversePrice?: number
): number {
  if (!maxAdversePrice) return 0;
  
  if (direction === TradeDirection.LONG) {
    return Math.max(0, entryPrice - maxAdversePrice);
  } else {
    return Math.max(0, maxAdversePrice - entryPrice);
  }
}

/**
 * Calculate maximum gain during the trade
 */
export function calculateMaxGain(
  direction: TradeDirection,
  entryPrice: number,
  maxFavorablePrice?: number
): number {
  if (!maxFavorablePrice) return 0;
  
  if (direction === TradeDirection.LONG) {
    return Math.max(0, maxFavorablePrice - entryPrice);
  } else {
    return Math.max(0, entryPrice - maxFavorablePrice);
  }
}

/**
 * Comprehensive trade calculation
 */
export function calculateTradeMetrics(trade: TradeFormData): TradeCalculationResult {
  if (!trade.exitPrice || !trade.exitDate) {
    return {
      pnl: 0,
      pnlPercentage: 0,
      efficiency: 0,
      rMultiple: 0,
      commission: 0,
      netPnl: 0
    };
  }
  
  const pnl = calculatePnL(
    trade.direction,
    trade.entryPrice,
    trade.exitPrice,
    trade.quantity
  );
  
  const pnlPercentage = calculatePnLPercentage(
    trade.direction,
    trade.entryPrice,
    trade.exitPrice
  );
  
  const commission = calculateCommission(
    trade.entryPrice,
    trade.exitPrice,
    trade.quantity
  );
  
  const netPnl = pnl - commission;
  
  const efficiency = calculateEfficiency(
    trade.direction,
    trade.entryPrice,
    trade.exitPrice,
    trade.maxFavorablePrice
  );
  
  const riskAmount = trade.riskAmount || 0;
  const rMultiple = calculateRMultiple(pnl, riskAmount);
  
  const holdingPeriod = calculateHoldingPeriod(
    trade.entryDate,
    trade.exitDate
  );
  
  const maxDrawdown = calculateMaxDrawdown(
    trade.direction,
    trade.entryPrice,
    trade.maxAdversePrice
  );
  
  const maxGain = calculateMaxGain(
    trade.direction,
    trade.entryPrice,
    trade.maxFavorablePrice
  );
  
  return {
    pnl,
    pnlPercentage,
    efficiency,
    rMultiple,
    commission,
    netPnl,
    holdingPeriod,
    maxDrawdown,
    maxGain
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
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format R-multiple values
 */
export function formatRMultiple(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}R`;
}

/**
 * Calculate trade statistics from an array of trades
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
  const closedTrades = trades.filter(trade => trade.exitPrice && trade.exitDate);
  const winTrades = closedTrades.filter(trade => trade.pnl > 0);
  const lossTrades = closedTrades.filter(trade => trade.pnl < 0);
  const breakevenTrades = closedTrades.filter(trade => trade.pnl === 0);
  
  const totalPnl = closedTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  const totalCommission = closedTrades.reduce((sum, trade) => sum + trade.commission, 0);
  const netPnl = totalPnl - totalCommission;
  
  const winRate = closedTrades.length > 0 ? (winTrades.length / closedTrades.length) * 100 : 0;
  
  const avgWin = winTrades.length > 0 ? winTrades.reduce((sum, trade) => sum + trade.pnl, 0) / winTrades.length : 0;
  const avgLoss = lossTrades.length > 0 ? Math.abs(lossTrades.reduce((sum, trade) => sum + trade.pnl, 0)) / lossTrades.length : 0;
  
  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;
  
  const maxWin = winTrades.length > 0 ? Math.max(...winTrades.map(trade => trade.pnl)) : 0;
  const maxLoss = lossTrades.length > 0 ? Math.min(...lossTrades.map(trade => trade.pnl)) : 0;
  
  const avgRMultiple = closedTrades.length > 0 ? closedTrades.reduce((sum, trade) => sum + trade.rMultiple, 0) / closedTrades.length : 0;
  const avgEfficiency = closedTrades.length > 0 ? closedTrades.reduce((sum, trade) => sum + trade.efficiency, 0) / closedTrades.length : 0;
  
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