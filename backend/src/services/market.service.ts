import {
  ContractSpecification,
  MarketPreferences,
  MarketDefaultsResponse,
  MarketCalculationResult,
  TradeValidationResult,
  AVAILABLE_CONTRACTS,
  ES_FUTURES,
  NQ_FUTURES,
  getMarketById,
  getMarketBySymbol,
  PositionSizingMethod,
  MarketCategory
} from '../types/market';

export class MarketService {
  /**
   * Get all available markets
   */
  getAllMarkets(): ContractSpecification[] {
    return AVAILABLE_CONTRACTS;
  }

  /**
   * Get market by symbol or ID
   */
  getMarket(identifier: string): ContractSpecification | null {
    return getMarketById(identifier) || getMarketBySymbol(identifier);
  }

  /**
   * Get market specifications for a specific market
   */
  getMarketSpecifications(marketSymbol: string): ContractSpecification | null {
    const market = this.getMarket(marketSymbol);
    return market;
  }

  /**
   * Calculate smart defaults for a trade based on market
   */
  calculateTradeDefaults(
    marketSymbol: string,
    accountBalance: number = 100000,
    entryPrice?: number
  ): MarketDefaultsResponse {
    const market = this.getMarket(marketSymbol);
    if (!market) {
      throw new Error(`Market not found: ${marketSymbol}`);
    }

    const defaults = market.riskDefaults;
    const riskAmount = (accountBalance * defaults.riskPerTradePercent) / 100;

    const result: MarketDefaultsResponse = {
      tickSize: market.tickSize,
      tickValue: market.tickValue,
      pointValue: market.pointValue,
      currency: market.currency,
      commission: market.defaultCommission.amount,
      initialMargin: market.initialMargin,
      dayTradingMargin: market.dayTradingMargin,
      riskPercentage: defaults.riskPerTradePercent,
      riskAmount: riskAmount,
      maxPositionSize: defaults.maxPositionSize,
      stopLossPercent: defaults.defaultStopLossPercent,
      takeProfitPercent: defaults.defaultTakeProfitPercent,
    };

    // Calculate suggested position size if entry price provided
    if (entryPrice && defaults.defaultStopLossPercent > 0) {
      const stopPrice = entryPrice * (1 - defaults.defaultStopLossPercent / 100);
      const suggestedSize = this.calculatePositionSize(
        riskAmount,
        entryPrice,
        stopPrice,
        market,
        defaults.defaultPositionSizing
      );

      result.suggestedQuantity = suggestedSize;
      result.suggestedStopLoss = Number(stopPrice.toFixed(market.precision));
      result.suggestedTakeProfit = Number(
        (entryPrice * (1 + defaults.defaultTakeProfitPercent / 100)).toFixed(market.precision)
      );
    }

    return result;
  }

  /**
   * Calculate position size based on risk parameters
   */
  calculatePositionSize(
    riskAmount: number,
    entryPrice: number,
    stopPrice: number,
    market: ContractSpecification,
    method: PositionSizingMethod = PositionSizingMethod.RISK_BASED
  ): number {
    if (riskAmount <= 0 || entryPrice <= 0 || stopPrice <= 0) return 0;

    const priceDifference = Math.abs(entryPrice - stopPrice);
    if (priceDifference === 0) return 0;

    let positionSize = 0;

    switch (method) {
      case PositionSizingMethod.RISK_BASED:
        if (market.category === MarketCategory.FUTURES) {
          positionSize = riskAmount / (priceDifference * market.pointValue);
        } else {
          positionSize = riskAmount / (priceDifference * market.contractSize);
        }
        break;

      case PositionSizingMethod.FIXED:
        positionSize = 1;
        break;

      case PositionSizingMethod.PERCENTAGE:
        positionSize = 1; // Placeholder - would need account balance
        break;

      case PositionSizingMethod.VOLATILITY:
        positionSize = 1; // Placeholder - would need volatility data
        break;
    }

    return Math.min(Math.floor(positionSize), market.riskDefaults.maxPositionSize);
  }

  /**
   * Calculate total commission for a trade
   */
  calculateCommission(
    contracts: number,
    market: ContractSpecification,
    isRoundTurn: boolean = true
  ): number {
    const commission = market.defaultCommission;
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

    return Number(totalCommission.toFixed(2));
  }

  /**
   * Calculate P&L for a position with market-specific calculations
   */
  calculatePnL(
    entryPrice: number,
    exitPrice: number,
    quantity: number,
    marketSymbol: string,
    direction: 'LONG' | 'SHORT',
    includeFees: boolean = true
  ): MarketCalculationResult {
    const market = this.getMarket(marketSymbol);
    if (!market) {
      throw new Error(`Market not found: ${marketSymbol}`);
    }

    let grossPnL = 0;

    if (market.category === MarketCategory.FUTURES) {
      const priceDiff = direction === 'LONG' ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
      grossPnL = priceDiff * market.pointValue * quantity;
    } else {
      const priceDiff = direction === 'LONG' ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
      grossPnL = priceDiff * market.contractSize * quantity;
    }

    const commission = includeFees ? this.calculateCommission(quantity, market, true) : 0;
    const netPnL = grossPnL - commission;

    // Calculate contract value
    const contractValue = market.category === MarketCategory.FUTURES
      ? entryPrice * market.pointValue * quantity
      : entryPrice * market.contractSize * quantity;

    return {
      grossPnL: Number(grossPnL.toFixed(2)),
      commission: commission,
      netPnL: Number(netPnL.toFixed(2)),
      contractValue: Number(contractValue.toFixed(2))
    };
  }

  /**
   * Calculate R-multiple for a trade
   */
  calculateRMultiple(
    entryPrice: number,
    exitPrice: number,
    stopPrice: number,
    direction: 'LONG' | 'SHORT'
  ): number {
    const exitMove = direction === 'LONG' ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
    const riskMove = direction === 'LONG' ? (entryPrice - stopPrice) : (stopPrice - entryPrice);

    if (riskMove === 0) return 0;
    return Number((exitMove / riskMove).toFixed(2));
  }

  /**
   * Calculate trade efficiency
   */
  calculateEfficiency(
    entryPrice: number,
    exitPrice: number,
    maxFavorablePrice: number,
    direction: 'LONG' | 'SHORT'
  ): number {
    const actualMove = direction === 'LONG' ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
    const maxMove = direction === 'LONG' ? (maxFavorablePrice - entryPrice) : (entryPrice - maxFavorablePrice);

    if (maxMove === 0) return 0;
    return Number(((actualMove / maxMove) * 100).toFixed(2));
  }

  /**
   * Validate trade parameters against market specifications
   */
  validateTrade(
    entryPrice: number,
    quantity: number,
    marketSymbol: string,
    stopLoss?: number,
    takeProfit?: number
  ): TradeValidationResult {
    const market = this.getMarket(marketSymbol);
    if (!market) {
      return {
        isValid: false,
        errors: [`Market not found: ${marketSymbol}`]
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate price tick alignment
    if (!this.isPriceValidForTick(entryPrice, market)) {
      errors.push(`Entry price ${entryPrice} is not aligned to tick size ${market.tickSize}`);
    }

    // Validate quantity
    if (quantity <= 0) {
      errors.push('Quantity must be positive');
    }

    if (!Number.isInteger(quantity)) {
      errors.push('Quantity must be a whole number');
    }

    if (quantity > market.riskDefaults.maxPositionSize) {
      errors.push(`Quantity ${quantity} exceeds maximum position size ${market.riskDefaults.maxPositionSize}`);
    }

    // Validate stop loss
    if (stopLoss !== undefined) {
      if (stopLoss <= 0) {
        errors.push('Stop loss must be positive');
      } else if (!this.isPriceValidForTick(stopLoss, market)) {
        errors.push(`Stop loss ${stopLoss} is not aligned to tick size ${market.tickSize}`);
      }
    }

    // Validate take profit
    if (takeProfit !== undefined) {
      if (takeProfit <= 0) {
        errors.push('Take profit must be positive');
      } else if (!this.isPriceValidForTick(takeProfit, market)) {
        errors.push(`Take profit ${takeProfit} is not aligned to tick size ${market.tickSize}`);
      }
    }

    // Add warnings for risk management
    const contractValue = entryPrice * market.pointValue * quantity;
    const marginRequired = market.initialMargin * quantity;

    if (contractValue > 1000000) {
      warnings.push(`Large contract value: $${contractValue.toLocaleString()}`);
    }

    if (marginRequired > 100000) {
      warnings.push(`High margin requirement: $${marginRequired.toLocaleString()}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check if price is aligned to market tick size
   */
  private isPriceValidForTick(price: number, market: ContractSpecification): boolean {
    const tickMultiplier = Math.pow(10, market.precision);
    const priceInTicks = Math.round(price * tickMultiplier);
    const tickSizeInTicks = Math.round(market.tickSize * tickMultiplier);

    return (priceInTicks % tickSizeInTicks) === 0;
  }

  /**
   * Round price to nearest valid tick
   */
  roundToValidTick(price: number, market: ContractSpecification): number {
    const tickMultiplier = Math.pow(10, market.precision);
    const tickSizeInTicks = Math.round(market.tickSize * tickMultiplier);
    const priceInTicks = Math.round(price * tickMultiplier);
    const roundedTicks = Math.round(priceInTicks / tickSizeInTicks) * tickSizeInTicks;

    return Number((roundedTicks / tickMultiplier).toFixed(market.precision));
  }

  /**
   * Get default market for user (fallback to ES)
   */
  getDefaultMarket(): ContractSpecification {
    return ES_FUTURES;
  }

  /**
   * Calculate margin requirement
   */
  calculateMarginRequirement(
    contracts: number,
    marketSymbol: string,
    isDayTrade: boolean = false
  ): number {
    const market = this.getMarket(marketSymbol);
    if (!market) {
      throw new Error(`Market not found: ${marketSymbol}`);
    }

    const marginPerContract = isDayTrade && market.dayTradingMargin
      ? market.dayTradingMargin
      : market.initialMargin;

    return marginPerContract * contracts;
  }

  /**
   * Format price according to market specifications
   */
  formatPrice(price: number, marketSymbol: string): string {
    const market = this.getMarket(marketSymbol);
    if (!market) {
      return price.toFixed(2);
    }

    return price.toFixed(market.precision);
  }
}

// Export singleton instance
export const marketService = new MarketService();