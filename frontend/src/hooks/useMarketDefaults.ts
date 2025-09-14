import { useEffect, useState, useMemo } from 'react';
import useSettingsStore from '@/store/settingsStore';
import { ContractSpecification } from '@/types/market';
import { generateTradeDefaults, calculatePositionSize } from '@/utils/marketCalculations';

export interface TradeDefaults {
  // Market information
  symbol: string;
  tickSize: number;
  tickValue: number;
  pointValue: number;
  currency: string;

  // Commission
  commission: number;
  commissionType: 'per_contract' | 'per_share' | 'percentage';

  // Risk management defaults
  defaultStopLossPercent: number;
  defaultTakeProfitPercent: number;
  riskPercentage: number;
  maxPositionSize: number;

  // Calculated suggestions
  suggestedQuantity?: number;
  suggestedStopLoss?: number;
  suggestedTakeProfit?: number;
  suggestedRiskAmount?: number;

  // Margin requirements
  initialMargin: number;
  dayTradingMargin?: number;
  marginRequirement?: number;

  // Position sizing
  positionSizingMethod: string;
}

interface UseMarketDefaultsOptions {
  marketId?: string;
  entryPrice?: number;
  accountBalance?: number;
  riskAmount?: number;
  autoCalculate?: boolean;
}

/**
 * Hook to get smart defaults for trade forms based on selected market
 */
export function useMarketDefaults({
  marketId,
  entryPrice,
  accountBalance = 100000,
  riskAmount,
  autoCalculate = true,
}: UseMarketDefaultsOptions = {}) {
  const {
    selectedMarket,
    getMarketConfig,
    getTradeDefaults,
    calculatePositionSize: calculatePos,
    marketPreferences,
  } = useSettingsStore();

  const [defaults, setDefaults] = useState<TradeDefaults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get the active market configuration
  const activeMarket = useMemo(() => {
    if (marketId) {
      return getMarketConfig(marketId);
    }
    if (selectedMarket) {
      return selectedMarket;
    }
    // Fallback to default market
    const defaultMarketId = marketPreferences.defaultMarket;
    if (defaultMarketId) {
      return getMarketConfig(defaultMarketId);
    }
    return null;
  }, [marketId, selectedMarket, getMarketConfig, marketPreferences.defaultMarket]);

  // Calculate defaults whenever dependencies change
  useEffect(() => {
    if (!activeMarket || !autoCalculate) return;

    setIsLoading(true);

    try {
      const baseDefaults = getTradeDefaults(activeMarket.id, accountBalance, entryPrice);

      const tradeDefaults: TradeDefaults = {
        // Market information
        symbol: activeMarket.symbol,
        tickSize: activeMarket.tickSize,
        tickValue: activeMarket.tickValue,
        pointValue: activeMarket.pointValue,
        currency: activeMarket.currency,

        // Commission
        commission: activeMarket.defaultCommission.amount,
        commissionType: activeMarket.defaultCommission.type,

        // Risk management
        defaultStopLossPercent: activeMarket.riskDefaults.defaultStopLossPercent,
        defaultTakeProfitPercent: activeMarket.riskDefaults.defaultTakeProfitPercent,
        riskPercentage: activeMarket.riskDefaults.riskPerTradePercent,
        maxPositionSize: activeMarket.riskDefaults.maxPositionSize,

        // Margin requirements
        initialMargin: activeMarket.initialMargin,
        dayTradingMargin: activeMarket.dayTradingMargin,

        // Position sizing
        positionSizingMethod: activeMarket.riskDefaults.defaultPositionSizing,

        // Include calculated suggestions from baseDefaults
        ...baseDefaults,
      };

      // Calculate additional suggestions if we have entry price
      if (entryPrice && entryPrice > 0) {
        const calculatedRiskAmount = riskAmount || (accountBalance * tradeDefaults.riskPercentage) / 100;
        const stopPrice = entryPrice * (1 - tradeDefaults.defaultStopLossPercent / 100);

        const suggestedSize = calculatePos(
          activeMarket.id,
          calculatedRiskAmount,
          entryPrice,
          stopPrice
        );

        tradeDefaults.suggestedQuantity = suggestedSize;
        tradeDefaults.suggestedStopLoss = stopPrice;
        tradeDefaults.suggestedTakeProfit = entryPrice * (1 + tradeDefaults.defaultTakeProfitPercent / 100);
        tradeDefaults.suggestedRiskAmount = calculatedRiskAmount;
        tradeDefaults.marginRequirement = tradeDefaults.initialMargin * suggestedSize;
      }

      setDefaults(tradeDefaults);
    } catch (error) {
      console.error('Error calculating trade defaults:', error);
      setDefaults(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    activeMarket,
    entryPrice,
    accountBalance,
    riskAmount,
    autoCalculate,
    getTradeDefaults,
    calculatePos,
  ]);

  // Method to recalculate position size based on risk
  const recalculatePositionSize = (newRiskAmount: number, newEntryPrice: number, newStopPrice: number) => {
    if (!activeMarket) return 0;

    return calculatePos(
      activeMarket.id,
      newRiskAmount,
      newEntryPrice,
      newStopPrice
    );
  };

  // Method to calculate margin requirement for a given quantity
  const calculateMarginRequirement = (quantity: number, isDayTrade: boolean = false) => {
    if (!activeMarket) return 0;

    const marginPerContract = isDayTrade && activeMarket.dayTradingMargin
      ? activeMarket.dayTradingMargin
      : activeMarket.initialMargin;

    return marginPerContract * quantity;
  };

  // Method to validate price against tick size
  const validatePrice = (price: number) => {
    if (!activeMarket) return true;

    const remainder = (price * Math.pow(10, activeMarket.precision)) %
                     (activeMarket.tickSize * Math.pow(10, activeMarket.precision));
    return Math.abs(remainder) < 0.0001;
  };

  // Method to round price to nearest tick
  const roundToTick = (price: number) => {
    if (!activeMarket) return price;

    const tickIncrement = activeMarket.tickSize;
    return Math.round(price / tickIncrement) * tickIncrement;
  };

  // Method to get market-specific validation rules
  const getValidationRules = () => {
    if (!activeMarket) return {};

    return {
      minPrice: activeMarket.tickSize,
      maxPositionSize: activeMarket.riskDefaults.maxPositionSize,
      tickSize: activeMarket.tickSize,
      precision: activeMarket.precision,
    };
  };

  return {
    defaults,
    activeMarket,
    isLoading,

    // Utility methods
    recalculatePositionSize,
    calculateMarginRequirement,
    validatePrice,
    roundToTick,
    getValidationRules,

    // Quick access to common values
    tickSize: activeMarket?.tickSize,
    tickValue: activeMarket?.tickValue,
    pointValue: activeMarket?.pointValue,
    symbol: activeMarket?.symbol,
    commission: activeMarket?.defaultCommission.amount,
  };
}

/**
 * Hook to get quick access markets for trade form dropdowns
 */
export function useQuickAccessMarkets() {
  const { marketConfigs, marketPreferences } = useSettingsStore();

  return useMemo(() => {
    return marketConfigs
      .filter(market =>
        market.isActive &&
        marketPreferences.quickAccessMarkets.includes(market.id)
      )
      .sort((a, b) => {
        // Sort by preference order
        const aIndex = marketPreferences.quickAccessMarkets.indexOf(a.id);
        const bIndex = marketPreferences.quickAccessMarkets.indexOf(b.id);
        return aIndex - bIndex;
      });
  }, [marketConfigs, marketPreferences.quickAccessMarkets]);
}

/**
 * Hook for market-aware form validation
 */
export function useMarketValidation(marketId?: string) {
  const { validateMarketData } = useSettingsStore();

  const validate = (formData: any) => {
    if (!marketId) return [];
    return validateMarketData(marketId, formData);
  };

  return { validate };
}