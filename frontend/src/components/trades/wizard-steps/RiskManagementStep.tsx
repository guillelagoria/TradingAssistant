import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Shield, Target, TrendingDown, TrendingUp, Calculator, Lightbulb, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TradeDirection } from '@/types';
import { ContractSpecification } from '@/types/market';
import { formatPrice, calculatePnL } from '@/utils/marketCalculations';

interface RiskManagementStepProps {
  data: {
    selectedMarket?: ContractSpecification;
    direction?: TradeDirection;
    entryPrice?: number;
    quantity?: number;
    stopLoss?: number;
    takeProfit?: number;
    stopLossPercent?: number;
    takeProfitPercent?: number;
  };
  updateData: (updates: any) => void;
  errors: Record<string, string>;
  onNext: () => void;
  canProceed: boolean;
}

export function RiskManagementStep({
  data,
  updateData,
  errors,
  onNext,
  canProceed
}: RiskManagementStepProps) {
  const stopLossRef = useRef<HTMLInputElement>(null);
  const [usePercentages, setUsePercentages] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Auto-focus first input
  useEffect(() => {
    if (stopLossRef.current) {
      stopLossRef.current.focus();
    }
  }, []);

  // Initialize with smart defaults
  useEffect(() => {
    if (data.selectedMarket && data.entryPrice && !data.stopLoss && !data.takeProfit) {
      const defaults = data.selectedMarket.riskDefaults;
      const entryPrice = data.entryPrice;

      let stopLoss: number;
      let takeProfit: number;

      if (data.direction === TradeDirection.LONG) {
        stopLoss = entryPrice * (1 - defaults.defaultStopLossPercent / 100);
        takeProfit = entryPrice * (1 + defaults.defaultTakeProfitPercent / 100);
      } else {
        stopLoss = entryPrice * (1 + defaults.defaultStopLossPercent / 100);
        takeProfit = entryPrice * (1 - defaults.defaultTakeProfitPercent / 100);
      }

      updateData({
        stopLoss,
        takeProfit,
        stopLossPercent: defaults.defaultStopLossPercent,
        takeProfitPercent: defaults.defaultTakeProfitPercent
      });
    }
  }, [data.selectedMarket, data.entryPrice, data.direction, data.stopLoss, data.takeProfit, updateData]);

  // Risk/Reward calculations
  const calculations = useMemo(() => {
    if (!data.selectedMarket || !data.entryPrice || !data.quantity) {
      return {
        riskAmount: 0,
        rewardAmount: 0,
        riskRewardRatio: 0,
        stopDistancePips: 0,
        takeProfitDistancePips: 0,
        maxLoss: 0,
        maxProfit: 0
      };
    }

    const entryPrice = data.entryPrice;
    const quantity = data.quantity;
    const pointValue = data.selectedMarket.pointValue;

    let riskAmount = 0;
    let rewardAmount = 0;
    let stopDistancePips = 0;
    let takeProfitDistancePips = 0;

    if (data.stopLoss) {
      if (data.direction === TradeDirection.LONG) {
        stopDistancePips = entryPrice - data.stopLoss;
      } else {
        stopDistancePips = data.stopLoss - entryPrice;
      }
      riskAmount = Math.abs(stopDistancePips * pointValue * quantity);
    }

    if (data.takeProfit) {
      if (data.direction === TradeDirection.LONG) {
        takeProfitDistancePips = data.takeProfit - entryPrice;
      } else {
        takeProfitDistancePips = entryPrice - data.takeProfit;
      }
      rewardAmount = Math.abs(takeProfitDistancePips * pointValue * quantity);
    }

    const riskRewardRatio = riskAmount > 0 ? rewardAmount / riskAmount : 0;

    // Calculate P&L with fees
    let maxLoss = 0;
    let maxProfit = 0;

    if (data.stopLoss) {
      const lossCalc = calculatePnL(
        entryPrice,
        data.stopLoss,
        quantity,
        data.selectedMarket,
        data.direction!,
        true
      );
      maxLoss = lossCalc.netPnL;
    }

    if (data.takeProfit) {
      const profitCalc = calculatePnL(
        entryPrice,
        data.takeProfit,
        quantity,
        data.selectedMarket,
        data.direction!,
        true
      );
      maxProfit = profitCalc.netPnL;
    }

    return {
      riskAmount,
      rewardAmount,
      riskRewardRatio,
      stopDistancePips,
      takeProfitDistancePips,
      maxLoss,
      maxProfit
    };
  }, [data.selectedMarket, data.entryPrice, data.quantity, data.stopLoss, data.takeProfit, data.direction]);

  const handleStopLossChange = (value: string) => {
    const price = parseFloat(value);
    if (!isNaN(price) && price > 0) {
      updateData({ stopLoss: price });

      // Calculate percentage if entry price is available
      if (data.entryPrice) {
        let percent: number;
        if (data.direction === TradeDirection.LONG) {
          percent = ((data.entryPrice - price) / data.entryPrice) * 100;
        } else {
          percent = ((price - data.entryPrice) / data.entryPrice) * 100;
        }
        updateData({ stopLossPercent: Math.abs(percent) });
      }
    } else if (value === '') {
      updateData({ stopLoss: undefined });
    }
  };

  const handleTakeProfitChange = (value: string) => {
    const price = parseFloat(value);
    if (!isNaN(price) && price > 0) {
      updateData({ takeProfit: price });

      // Calculate percentage if entry price is available
      if (data.entryPrice) {
        let percent: number;
        if (data.direction === TradeDirection.LONG) {
          percent = ((price - data.entryPrice) / data.entryPrice) * 100;
        } else {
          percent = ((data.entryPrice - price) / data.entryPrice) * 100;
        }
        updateData({ takeProfitPercent: Math.abs(percent) });
      }
    } else if (value === '') {
      updateData({ takeProfit: undefined });
    }
  };

  const handleStopLossPercentChange = (value: string) => {
    const percent = parseFloat(value);
    if (!isNaN(percent) && percent >= 0 && data.entryPrice) {
      let price: number;
      if (data.direction === TradeDirection.LONG) {
        price = data.entryPrice * (1 - percent / 100);
      } else {
        price = data.entryPrice * (1 + percent / 100);
      }
      updateData({
        stopLossPercent: percent,
        stopLoss: price
      });
    } else if (value === '') {
      updateData({ stopLossPercent: undefined });
    }
  };

  const handleTakeProfitPercentChange = (value: string) => {
    const percent = parseFloat(value);
    if (!isNaN(percent) && percent >= 0 && data.entryPrice) {
      let price: number;
      if (data.direction === TradeDirection.LONG) {
        price = data.entryPrice * (1 + percent / 100);
      } else {
        price = data.entryPrice * (1 - percent / 100);
      }
      updateData({
        takeProfitPercent: percent,
        takeProfit: price
      });
    } else if (value === '') {
      updateData({ takeProfitPercent: undefined });
    }
  };

  const handleQuickRatio = (ratio: number) => {
    if (data.stopLoss && data.entryPrice) {
      const stopDistance = Math.abs(data.entryPrice - data.stopLoss);
      const profitDistance = stopDistance * ratio;

      let takeProfit: number;
      if (data.direction === TradeDirection.LONG) {
        takeProfit = data.entryPrice + profitDistance;
      } else {
        takeProfit = data.entryPrice - profitDistance;
      }

      updateData({ takeProfit });
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getRiskRewardColor = (ratio: number): string => {
    if (ratio >= 2) return 'text-green-600 dark:text-green-400';
    if (ratio >= 1.5) return 'text-yellow-600 dark:text-yellow-400';
    if (ratio >= 1) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatPriceForDisplay = (price: number): string => {
    return data.selectedMarket ? formatPrice(price, data.selectedMarket) : price.toFixed(2);
  };

  if (!data.selectedMarket || !data.entryPrice || !data.quantity) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Please complete previous steps first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Risk Management</h2>
        <p className="text-muted-foreground">
          Set your stop loss and take profit levels to protect your capital
        </p>
      </div>

      {/* Input Mode Toggle */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calculator className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium">Input Method</div>
                <div className="text-sm text-muted-foreground">
                  Choose how you want to set your levels
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Label htmlFor="input-mode" className={cn(!usePercentages && "text-muted-foreground")}>
                Prices
              </Label>
              <Switch
                id="input-mode"
                checked={usePercentages}
                onCheckedChange={setUsePercentages}
              />
              <Label htmlFor="input-mode" className={cn(usePercentages && "text-primary")}>
                Percentages
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Stop Loss */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-red-600 dark:text-red-400">
              <Shield className="w-5 h-5 mr-2" />
              Stop Loss
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {usePercentages ? (
              <div>
                <Label htmlFor="stopLossPercent">Stop Loss Percentage (%)</Label>
                <Input
                  ref={stopLossRef}
                  id="stopLossPercent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={data.stopLossPercent || ''}
                  onChange={(e) => handleStopLossPercentChange(e.target.value)}
                  placeholder="e.g., 1.5"
                  className={errors.stopLoss ? "border-destructive" : ""}
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="stopLoss">Stop Loss Price</Label>
                <Input
                  ref={stopLossRef}
                  id="stopLoss"
                  type="number"
                  step={data.selectedMarket.tickSize}
                  value={data.stopLoss || ''}
                  onChange={(e) => handleStopLossChange(e.target.value)}
                  placeholder="Stop loss price"
                  className={errors.stopLoss ? "border-destructive" : ""}
                />
              </div>
            )}

            {errors.stopLoss && (
              <p className="text-sm text-destructive">{errors.stopLoss}</p>
            )}

            {/* Current Values Display */}
            {data.stopLoss && (
              <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Price:</span>
                    <span className="font-medium">{formatPriceForDisplay(data.stopLoss)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Percentage:</span>
                    <span className="font-medium">{data.stopLossPercent?.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Distance:</span>
                    <span className="font-medium">{calculations.stopDistancePips.toFixed(2)} points</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Loss:</span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      {formatCurrency(Math.abs(calculations.maxLoss))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick SL Suggestions */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Quick Set</Label>
              <div className="grid grid-cols-3 gap-2">
                {[0.5, 1.0, 1.5].map(percent => {
                  const price = data.direction === TradeDirection.LONG
                    ? data.entryPrice! * (1 - percent / 100)
                    : data.entryPrice! * (1 + percent / 100);

                  return (
                    <Button
                      key={percent}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateData({
                          stopLoss: price,
                          stopLossPercent: percent
                        });
                      }}
                      className="text-xs"
                    >
                      {percent}%
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Take Profit */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-green-600 dark:text-green-400">
              <Target className="w-5 h-5 mr-2" />
              Take Profit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {usePercentages ? (
              <div>
                <Label htmlFor="takeProfitPercent">Take Profit Percentage (%)</Label>
                <Input
                  id="takeProfitPercent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  value={data.takeProfitPercent || ''}
                  onChange={(e) => handleTakeProfitPercentChange(e.target.value)}
                  placeholder="e.g., 2.0"
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="takeProfit">Take Profit Price</Label>
                <Input
                  id="takeProfit"
                  type="number"
                  step={data.selectedMarket.tickSize}
                  value={data.takeProfit || ''}
                  onChange={(e) => handleTakeProfitChange(e.target.value)}
                  placeholder="Take profit price"
                />
              </div>
            )}

            {/* Current Values Display */}
            {data.takeProfit && (
              <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Price:</span>
                    <span className="font-medium">{formatPriceForDisplay(data.takeProfit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Percentage:</span>
                    <span className="font-medium">{data.takeProfitPercent?.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Distance:</span>
                    <span className="font-medium">{calculations.takeProfitDistancePips.toFixed(2)} points</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Profit:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(calculations.maxProfit)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Risk-Reward Ratio Buttons */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Risk:Reward Ratio</Label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map(ratio => (
                  <Button
                    key={ratio}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickRatio(ratio)}
                    className="text-xs"
                    disabled={!data.stopLoss}
                  >
                    1:{ratio}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk-Reward Analysis */}
      {data.stopLoss && data.takeProfit && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              Risk-Reward Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Risk Amount</div>
                <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                  {formatCurrency(calculations.riskAmount)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Reward Amount</div>
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(calculations.rewardAmount)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Risk:Reward</div>
                <div className={cn("text-lg font-semibold", getRiskRewardColor(calculations.riskRewardRatio))}>
                  1:{calculations.riskRewardRatio.toFixed(1)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Net P&L Range</div>
                <div className="text-lg font-semibold">
                  {formatCurrency(calculations.maxLoss)} to {formatCurrency(calculations.maxProfit)}
                </div>
              </div>
            </div>

            {/* Risk Evaluation */}
            <div className="mt-4">
              {calculations.riskRewardRatio >= 2 && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <div className="text-sm text-green-700 dark:text-green-300">
                    Excellent risk-reward ratio! This trade has good profit potential.
                  </div>
                </div>
              )}

              {calculations.riskRewardRatio >= 1 && calculations.riskRewardRatio < 2 && (
                <div className="flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    Acceptable risk-reward ratio. Consider increasing your target for better returns.
                  </div>
                </div>
              )}

              {calculations.riskRewardRatio > 0 && calculations.riskRewardRatio < 1 && (
                <div className="flex items-start space-x-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="text-sm text-red-700 dark:text-red-300">
                    <div className="font-medium">Poor Risk-Reward Ratio</div>
                    <div>Your potential loss exceeds potential profit. Consider adjusting your levels.</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Hint */}
      {canProceed && (
        <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
          <p className="text-sm text-green-700 dark:text-green-200 text-center">
            ✓ Risk management configured! Press <kbd className="px-1.5 py-0.5 bg-green-200 dark:bg-green-800 rounded text-xs">Enter</kbd> to review your trade
          </p>
        </div>
      )}
    </div>
  );
}