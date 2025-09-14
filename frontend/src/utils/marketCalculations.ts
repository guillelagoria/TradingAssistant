// Market calculation utilities for futures and other trading instruments

import {
  ContractSpecification,
  MarketCalculations,
  MarketValidation,
  PositionSizingMethod,
  MarketCategory
} from '@/types/market';

/**
 * Calculate the total value of a contract position
 */
export function calculateContractValue(
  price: number,
  contractSpec: ContractSpecification,
  quantity: number = 1
): number {
  if (contractSpec.category === MarketCategory.FUTURES) {
    // For futures: price * point value * quantity
    return price * contractSpec.pointValue * quantity;
  }

  // For other instruments: price * contract size * quantity
  return price * contractSpec.contractSize * quantity;
}

/**
 * Calculate margin requirement for a position
 */
export function calculateMarginRequirement(
  contracts: number,
  contractSpec: ContractSpecification,
  isDayTrade: boolean = false
): number {
  const marginPerContract = isDayTrade && contractSpec.dayTradingMargin
    ? contractSpec.dayTradingMargin
    : contractSpec.initialMargin;

  return marginPerContract * contracts;
}

/**
 * Calculate total commission for a trade
 */
export function calculateCommission(
  contracts: number,
  contractSpec: ContractSpecification,
  isRoundTurn: boolean = true
): number {
  const commission = contractSpec.defaultCommission;
  let totalCommission = 0;

  // Base commission
  totalCommission += commission.amount * contracts;

  // Add fees
  if (commission.exchange) totalCommission += commission.exchange * contracts;
  if (commission.clearing) totalCommission += commission.clearing * contracts;
  if (commission.nfa) totalCommission += commission.nfa * contracts;
  if (commission.regulation) totalCommission += commission.regulation * contracts;

  // Apply minimum/maximum if specified
  if (commission.minimum && totalCommission < commission.minimum) {
    totalCommission = commission.minimum;
  }
  if (commission.maximum && totalCommission > commission.maximum) {
    totalCommission = commission.maximum;
  }

  // If not round turn (one-way), divide by 2
  if (!isRoundTurn) {
    totalCommission /= 2;
  }

  return totalCommission;
}

/**
 * Calculate position size based on risk parameters
 */
export function calculatePositionSize(
  riskAmount: number,
  entryPrice: number,
  stopPrice: number,
  contractSpec: ContractSpecification,
  method: PositionSizingMethod = PositionSizingMethod.RISK_BASED
): number {
  if (riskAmount <= 0 || entryPrice <= 0 || stopPrice <= 0) return 0;

  const priceDifference = Math.abs(entryPrice - stopPrice);
  if (priceDifference === 0) return 0;

  let positionSize = 0;

  switch (method) {
    case PositionSizingMethod.RISK_BASED:
      if (contractSpec.category === MarketCategory.FUTURES) {
        // For futures: risk amount / (price difference * point value)
        positionSize = riskAmount / (priceDifference * contractSpec.pointValue);
      } else {
        // For other instruments
        positionSize = riskAmount / (priceDifference * contractSpec.contractSize);
      }
      break;

    case PositionSizingMethod.FIXED:
      positionSize = 1; // Return 1 contract as base
      break;

    case PositionSizingMethod.PERCENTAGE:
      // This would need account balance - placeholder
      positionSize = 1;
      break;

    case PositionSizingMethod.VOLATILITY:
      // This would need volatility data - placeholder
      positionSize = 1;
      break;
  }

  // Ensure position size doesn't exceed maximum
  const maxSize = contractSpec.riskDefaults.maxPositionSize;
  return Math.min(Math.floor(positionSize), maxSize);
}

/**
 * Calculate pip/tick value for a contract
 */
export function calculatePipValue(contractSpec: ContractSpecification): number {
  return contractSpec.tickValue;
}

/**
 * Format price according to contract specifications
 */
export function formatPrice(price: number, contractSpec: ContractSpecification): string {
  const decimals = contractSpec.precision;
  return price.toFixed(decimals);
}

/**
 * Calculate profit/loss for a position
 */
export function calculatePnL(
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  contractSpec: ContractSpecification,
  direction: 'LONG' | 'SHORT',
  includeFees: boolean = true
): { grossPnL: number; netPnL: number; commission: number } {
  let grossPnL = 0;

  if (contractSpec.category === MarketCategory.FUTURES) {
    const priceDiff = direction === 'LONG' ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
    grossPnL = priceDiff * contractSpec.pointValue * quantity;
  } else {
    const priceDiff = direction === 'LONG' ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
    grossPnL = priceDiff * contractSpec.contractSize * quantity;
  }

  const commission = includeFees ? calculateCommission(quantity, contractSpec, true) : 0;
  const netPnL = grossPnL - commission;

  return { grossPnL, netPnL, commission };
}

/**
 * Calculate R-multiple for a trade
 */
export function calculateRMultiple(
  entryPrice: number,
  exitPrice: number,
  stopPrice: number,
  direction: 'LONG' | 'SHORT'
): number {
  const exitMove = direction === 'LONG' ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
  const riskMove = direction === 'LONG' ? (entryPrice - stopPrice) : (stopPrice - entryPrice);

  if (riskMove === 0) return 0;
  return exitMove / riskMove;
}

/**
 * Calculate trade efficiency
 */
export function calculateTradeEfficiency(
  entryPrice: number,
  exitPrice: number,
  maxFavorablePrice: number,
  direction: 'LONG' | 'SHORT'
): number {
  const actualMove = direction === 'LONG' ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
  const maxMove = direction === 'LONG' ? (maxFavorablePrice - entryPrice) : (entryPrice - maxFavorablePrice);

  if (maxMove === 0) return 0;
  return (actualMove / maxMove) * 100;
}

/**
 * Generate smart defaults for a trade form based on market
 */
export function generateTradeDefaults(
  contractSpec: ContractSpecification,
  accountBalance: number = 100000,
  entryPrice?: number
) {
  const defaults = contractSpec.riskDefaults;
  const riskAmount = (accountBalance * defaults.riskPerTradePercent) / 100;

  const result: any = {
    // Commission
    commission: contractSpec.defaultCommission.amount,

    // Position sizing
    riskPercentage: defaults.riskPerTradePercent,
    riskAmount: riskAmount,
    maxPositionSize: defaults.maxPositionSize,

    // Risk management
    stopLossPercent: defaults.defaultStopLossPercent,
    takeProfitPercent: defaults.defaultTakeProfitPercent,

    // Market specific
    tickSize: contractSpec.tickSize,
    tickValue: contractSpec.tickValue,
    pointValue: contractSpec.pointValue,
    currency: contractSpec.currency,

    // Margin requirements
    initialMargin: contractSpec.initialMargin,
    dayTradingMargin: contractSpec.dayTradingMargin,
  };

  // Calculate suggested position size if entry price provided
  if (entryPrice && defaults.defaultStopLossPercent > 0) {
    const stopPrice = entryPrice * (1 - defaults.defaultStopLossPercent / 100);
    const suggestedSize = calculatePositionSize(
      riskAmount,
      entryPrice,
      stopPrice,
      contractSpec,
      defaults.defaultPositionSizing
    );

    result.suggestedQuantity = suggestedSize;
    result.suggestedStopLoss = stopPrice;
    result.suggestedTakeProfit = entryPrice * (1 + defaults.defaultTakeProfitPercent / 100);
  }

  return result;
}

// Validation functions
export const marketValidation: MarketValidation = {
  validatePrice: (price: number, contractSpec: ContractSpecification): boolean => {
    if (price <= 0) return false;

    // Check if price is a valid increment
    const remainder = (price * Math.pow(10, contractSpec.precision)) % (contractSpec.tickSize * Math.pow(10, contractSpec.precision));
    return Math.abs(remainder) < 0.0001; // Account for floating point precision
  },

  validateQuantity: (quantity: number, contractSpec: ContractSpecification): boolean => {
    if (quantity <= 0) return false;
    if (!Number.isInteger(quantity)) return false;
    if (quantity > contractSpec.riskDefaults.maxPositionSize) return false;

    return true;
  },

  validateRiskParameters: (
    stopLoss: number,
    takeProfit: number,
    entryPrice: number,
    contractSpec: ContractSpecification
  ): string[] => {
    const errors: string[] = [];

    if (stopLoss <= 0) {
      errors.push('Stop loss must be positive');
    }

    if (takeProfit <= 0) {
      errors.push('Take profit must be positive');
    }

    if (entryPrice <= 0) {
      errors.push('Entry price must be positive');
    }

    // Add more validation logic based on market type
    return errors;
  }
};

// Market calculations implementation
export const marketCalculations: MarketCalculations = {
  calculateContractValue,
  calculateMarginRequirement,
  calculateCommission,
  calculatePositionSize,
  calculatePipValue,
  formatPrice,
};

// Additional utility functions are exported inline above