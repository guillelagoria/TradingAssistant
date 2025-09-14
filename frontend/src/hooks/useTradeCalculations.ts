import { useState, useEffect, useCallback, useMemo } from 'react';
import { MarketInfo, TradeCalculations, Direction } from '../types/trade';
import { debounce } from 'lodash';

interface UseTradeCalculationsOptions {
  debounceMs?: number;
  autoCalculate?: boolean;
}

interface TradeInputs {
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  exitPrice: number;
  maxFavorablePrice?: number;
  maxAdversePrice?: number;
  marketInfo: MarketInfo | null;
}

/**
 * Custom hook for real-time trade calculations with debouncing
 * Provides comprehensive trade metrics calculation with performance optimization
 */
export function useTradeCalculations(
  inputs: TradeInputs,
  options: UseTradeCalculationsOptions = {}
) {
  const { debounceMs = 300, autoCalculate = true } = options;

  const [calculations, setCalculations] = useState<TradeCalculations>({
    direction: 'long',
    pnlPoints: 0,
    pnlUsd: 0,
    riskPoints: 0,
    rewardPoints: 0,
    riskRewardRatio: 0,
    efficiency: 0,
    isValid: false,
    errors: [],
  });

  const [isCalculating, setIsCalculating] = useState(false);

  // Determine trade direction
  const getDirection = useCallback((entry: number, exit: number): Direction => {
    return exit > entry ? 'long' : 'short';
  }, []);

  // Calculate P&L in points
  const calculatePnLPoints = useCallback((entry: number, exit: number, direction: Direction): number => {
    if (direction === 'long') {
      return exit - entry;
    } else {
      return entry - exit;
    }
  }, []);

  // Calculate P&L in USD
  const calculatePnLUsd = useCallback((pnlPoints: number, market: MarketInfo): number => {
    return pnlPoints * market.pointValue;
  }, []);

  // Calculate risk in points
  const calculateRiskPoints = useCallback((entry: number, stopLoss: number, direction: Direction): number => {
    if (direction === 'long') {
      return entry - stopLoss;
    } else {
      return stopLoss - entry;
    }
  }, []);

  // Calculate reward in points
  const calculateRewardPoints = useCallback((entry: number, takeProfit: number, direction: Direction): number => {
    if (direction === 'long') {
      return takeProfit - entry;
    } else {
      return entry - takeProfit;
    }
  }, []);

  // Calculate risk-reward ratio
  const calculateRiskReward = useCallback((risk: number, reward: number): number => {
    return risk > 0 ? reward / risk : 0;
  }, []);

  // Calculate efficiency based on max favorable price
  const calculateEfficiency = useCallback((
    entry: number,
    exit: number,
    maxFavorable: number | undefined,
    direction: Direction
  ): number => {
    if (!maxFavorable) return 0;

    let maxMove: number;
    let actualMove: number;

    if (direction === 'long') {
      maxMove = maxFavorable - entry;
      actualMove = exit - entry;
    } else {
      maxMove = entry - maxFavorable;
      actualMove = entry - exit;
    }

    if (maxMove <= 0) return 0;
    return Math.min(100, Math.max(0, (actualMove / maxMove) * 100));
  }, []);

  // Validate inputs
  const validateInputs = useCallback((inputs: TradeInputs): string[] => {
    const errors: string[] = [];

    if (!inputs.marketInfo) {
      errors.push('Market information is required');
    }

    if (inputs.entryPrice <= 0) {
      errors.push('Entry price must be greater than zero');
    }

    if (inputs.exitPrice <= 0) {
      errors.push('Exit price must be greater than zero');
    }

    if (inputs.stopLoss <= 0) {
      errors.push('Stop loss must be greater than zero');
    }

    if (inputs.takeProfit <= 0) {
      errors.push('Take profit must be greater than zero');
    }

    // Validate risk management logic
    const direction = getDirection(inputs.entryPrice, inputs.exitPrice);

    if (direction === 'long') {
      if (inputs.stopLoss >= inputs.entryPrice) {
        errors.push('Stop loss must be below entry price for long trades');
      }
      if (inputs.takeProfit <= inputs.entryPrice) {
        errors.push('Take profit must be above entry price for long trades');
      }
    } else {
      if (inputs.stopLoss <= inputs.entryPrice) {
        errors.push('Stop loss must be above entry price for short trades');
      }
      if (inputs.takeProfit >= inputs.entryPrice) {
        errors.push('Take profit must be below entry price for short trades');
      }
    }

    return errors;
  }, [getDirection]);

  // Main calculation function
  const performCalculations = useCallback((inputs: TradeInputs): TradeCalculations => {
    const errors = validateInputs(inputs);

    if (errors.length > 0 || !inputs.marketInfo) {
      return {
        direction: 'long',
        pnlPoints: 0,
        pnlUsd: 0,
        riskPoints: 0,
        rewardPoints: 0,
        riskRewardRatio: 0,
        efficiency: 0,
        isValid: false,
        errors,
      };
    }

    const direction = getDirection(inputs.entryPrice, inputs.exitPrice);
    const pnlPoints = calculatePnLPoints(inputs.entryPrice, inputs.exitPrice, direction);
    const pnlUsd = calculatePnLUsd(pnlPoints, inputs.marketInfo) - inputs.marketInfo.commission;
    const riskPoints = calculateRiskPoints(inputs.entryPrice, inputs.stopLoss, direction);
    const rewardPoints = calculateRewardPoints(inputs.entryPrice, inputs.takeProfit, direction);
    const riskRewardRatio = calculateRiskReward(riskPoints, rewardPoints);
    const efficiency = calculateEfficiency(
      inputs.entryPrice,
      inputs.exitPrice,
      inputs.maxFavorablePrice,
      direction
    );

    return {
      direction,
      pnlPoints: Number(pnlPoints.toFixed(2)),
      pnlUsd: Number(pnlUsd.toFixed(2)),
      riskPoints: Number(riskPoints.toFixed(2)),
      rewardPoints: Number(rewardPoints.toFixed(2)),
      riskRewardRatio: Number(riskRewardRatio.toFixed(2)),
      efficiency: Number(efficiency.toFixed(1)),
      isValid: true,
      errors: [],
    };
  }, [
    validateInputs,
    getDirection,
    calculatePnLPoints,
    calculatePnLUsd,
    calculateRiskPoints,
    calculateRewardPoints,
    calculateRiskReward,
    calculateEfficiency,
  ]);

  // Debounced calculation function
  const debouncedCalculate = useMemo(
    () => debounce((inputs: TradeInputs) => {
      setIsCalculating(true);
      const result = performCalculations(inputs);
      setCalculations(result);
      setIsCalculating(false);
    }, debounceMs),
    [performCalculations, debounceMs]
  );

  // Manual calculate function (immediate)
  const calculateNow = useCallback(() => {
    const result = performCalculations(inputs);
    setCalculations(result);
    return result;
  }, [inputs, performCalculations]);

  // Auto-calculate on input changes
  useEffect(() => {
    if (autoCalculate) {
      debouncedCalculate(inputs);
    }

    return () => {
      debouncedCalculate.cancel();
    };
  }, [inputs, autoCalculate, debouncedCalculate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedCalculate.cancel();
    };
  }, [debouncedCalculate]);

  return {
    calculations,
    isCalculating,
    calculateNow,
    // Individual calculation functions for external use
    utils: {
      getDirection,
      calculatePnLPoints,
      calculatePnLUsd,
      calculateRiskPoints,
      calculateRewardPoints,
      calculateRiskReward,
      calculateEfficiency,
      validateInputs,
    },
  };
}

export default useTradeCalculations;