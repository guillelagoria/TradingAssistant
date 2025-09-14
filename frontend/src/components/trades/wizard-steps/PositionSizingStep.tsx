import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Calculator, DollarSign, TrendingUp, AlertTriangle, Target, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TradeDirection } from '@/types';
import { ContractSpecification } from '@/types/market';
import {
  calculatePositionSize,
  calculateMarginRequirement,
  formatPrice
} from '@/utils/marketCalculations';

interface PositionSizingStepProps {
  data: {
    selectedMarket?: ContractSpecification;
    direction?: TradeDirection;
    entryPrice?: number;
    accountBalance?: number;
    riskAmount?: number;
    riskPercentage?: number;
    quantity?: number;
    suggestedQuantity?: number;
  };
  updateData: (updates: any) => void;
  errors: Record<string, string>;
  onNext: () => void;
  canProceed: boolean;
}

export function PositionSizingStep({
  data,
  updateData,
  errors,
  onNext,
  canProceed
}: PositionSizingStepProps) {
  const riskAmountRef = useRef<HTMLInputElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const [calculationMode, setCalculationMode] = useState<'risk' | 'quantity'>('risk');

  // Auto-focus first input
  useEffect(() => {
    if (riskAmountRef.current) {
      riskAmountRef.current.focus();
    }
  }, []);

  // Calculate derived values
  const calculations = useMemo(() => {
    if (!data.selectedMarket || !data.entryPrice || !data.accountBalance) {
      return {
        marginRequired: 0,
        positionValue: 0,
        riskPercent: 0,
        maxQuantity: 0,
        suggestedStopDistance: 0
      };
    }

    const quantity = data.quantity || 1;
    const marginRequired = calculateMarginRequirement(quantity, data.selectedMarket, true);
    const positionValue = data.entryPrice * data.selectedMarket.pointValue * quantity;

    let riskPercent = 0;
    if (data.riskAmount && data.accountBalance) {
      riskPercent = (data.riskAmount / data.accountBalance) * 100;
    }

    const maxQuantity = Math.floor((data.accountBalance * 0.3) / marginRequired); // Max 30% of account for margin
    const suggestedStopDistance = data.selectedMarket.riskDefaults.defaultStopLossPercent;

    return {
      marginRequired,
      positionValue,
      riskPercent,
      maxQuantity,
      suggestedStopDistance
    };
  }, [data.selectedMarket, data.entryPrice, data.quantity, data.accountBalance, data.riskAmount]);

  // Update calculations when risk amount changes
  useEffect(() => {
    if (calculationMode === 'risk' &&
        data.riskAmount &&
        data.entryPrice &&
        data.selectedMarket &&
        data.riskAmount > 0) {

      // Calculate stop loss price for position sizing
      const stopLossPercent = data.selectedMarket.riskDefaults.defaultStopLossPercent / 100;
      const stopPrice = data.direction === TradeDirection.LONG
        ? data.entryPrice * (1 - stopLossPercent)
        : data.entryPrice * (1 + stopLossPercent);

      const suggestedQuantity = calculatePositionSize(
        data.riskAmount,
        data.entryPrice,
        stopPrice,
        data.selectedMarket
      );

      const riskPercentage = data.accountBalance
        ? (data.riskAmount / data.accountBalance) * 100
        : 0;

      updateData({
        suggestedQuantity,
        quantity: suggestedQuantity,
        riskPercentage
      });
    }
  }, [data.riskAmount, data.entryPrice, data.selectedMarket, data.accountBalance, data.direction, calculationMode, updateData]);

  // Update risk amount when quantity changes in quantity mode
  useEffect(() => {
    if (calculationMode === 'quantity' &&
        data.quantity &&
        data.entryPrice &&
        data.selectedMarket &&
        data.quantity > 0) {

      const stopLossPercent = data.selectedMarket.riskDefaults.defaultStopLossPercent / 100;
      const stopDistance = data.entryPrice * stopLossPercent;
      const riskAmount = stopDistance * data.selectedMarket.pointValue * data.quantity;
      const riskPercentage = data.accountBalance
        ? (riskAmount / data.accountBalance) * 100
        : 0;

      updateData({
        riskAmount,
        riskPercentage
      });
    }
  }, [data.quantity, data.entryPrice, data.selectedMarket, data.accountBalance, calculationMode, updateData]);

  const handleRiskAmountChange = (value: string) => {
    const amount = parseFloat(value);
    if (!isNaN(amount) && amount >= 0) {
      updateData({ riskAmount: amount });
      setCalculationMode('risk');
    } else if (value === '') {
      updateData({ riskAmount: undefined });
    }
  };

  const handleQuantityChange = (value: string) => {
    const qty = parseInt(value);
    if (!isNaN(qty) && qty > 0) {
      updateData({ quantity: qty });
      setCalculationMode('quantity');
    } else if (value === '') {
      updateData({ quantity: undefined });
    }
  };

  const handleRiskSliderChange = (values: number[]) => {
    const riskPercent = values[0];
    const riskAmount = (data.accountBalance || 0) * (riskPercent / 100);
    updateData({
      riskPercentage: riskPercent,
      riskAmount: riskAmount
    });
    setCalculationMode('risk');
  };

  const handleAccountBalanceChange = (value: string) => {
    const balance = parseFloat(value);
    if (!isNaN(balance) && balance > 0) {
      updateData({ accountBalance: balance });
    } else if (value === '') {
      updateData({ accountBalance: undefined });
    }
  };

  const handleUseSuggested = () => {
    if (data.suggestedQuantity) {
      updateData({ quantity: data.suggestedQuantity });
      setCalculationMode('risk');
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

  const getRiskColorClass = (percent: number): string => {
    if (percent <= 1) return 'text-green-600 dark:text-green-400';
    if (percent <= 2) return 'text-yellow-600 dark:text-yellow-400';
    if (percent <= 3) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (!data.selectedMarket || !data.entryPrice) {
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
        <h2 className="text-2xl font-bold">Position Sizing</h2>
        <p className="text-muted-foreground">
          Calculate your position size based on risk management principles
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Account Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="accountBalance">Total Account Balance</Label>
                <Input
                  id="accountBalance"
                  type="number"
                  step="100"
                  value={data.accountBalance || ''}
                  onChange={(e) => handleAccountBalanceChange(e.target.value)}
                  placeholder="e.g., 100000"
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-sm font-medium mb-2">Quick Balance</div>
                <div className="grid grid-cols-3 gap-2">
                  {[50000, 100000, 250000].map(balance => (
                    <Button
                      key={balance}
                      variant="outline"
                      size="sm"
                      onClick={() => updateData({ accountBalance: balance })}
                      className="text-xs"
                    >
                      {formatCurrency(balance)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Risk Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="riskAmount">Risk Amount ($)</Label>
                <Input
                  ref={riskAmountRef}
                  id="riskAmount"
                  type="number"
                  step="10"
                  value={data.riskAmount || ''}
                  onChange={(e) => handleRiskAmountChange(e.target.value)}
                  placeholder="Amount to risk on this trade"
                  className={errors.riskAmount ? "border-destructive" : ""}
                />
                {errors.riskAmount && (
                  <p className="text-sm text-destructive mt-1">{errors.riskAmount}</p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Risk Percentage</Label>
                  <Badge variant="outline" className={getRiskColorClass(calculations.riskPercent)}>
                    {calculations.riskPercent.toFixed(1)}%
                  </Badge>
                </div>
                <Slider
                  value={[data.riskPercentage || 0]}
                  onValueChange={handleRiskSliderChange}
                  max={5}
                  min={0.1}
                  step={0.1}
                  className="mb-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Conservative (0.1%)</span>
                  <span>Aggressive (5%)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Position Size Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              Position Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="quantity">Number of Contracts</Label>
                <div className="flex space-x-2">
                  <Input
                    ref={quantityRef}
                    id="quantity"
                    type="number"
                    min="1"
                    max={calculations.maxQuantity}
                    value={data.quantity || ''}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    placeholder="Contracts"
                    className={cn(
                      errors.quantity ? "border-destructive" : "",
                      "flex-1"
                    )}
                  />
                  {data.suggestedQuantity && data.suggestedQuantity !== data.quantity && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUseSuggested}
                      className="whitespace-nowrap"
                    >
                      Use {data.suggestedQuantity}
                    </Button>
                  )}
                </div>
                {errors.quantity && (
                  <p className="text-sm text-destructive mt-1">{errors.quantity}</p>
                )}
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-sm font-medium mb-2 flex items-center">
                  <Info className="w-4 h-4 mr-1" />
                  Suggested Size
                </div>
                <div className="text-sm space-y-1">
                  <div>Based on {data.selectedMarket.riskDefaults.defaultStopLossPercent}% stop loss</div>
                  <div className="font-medium">
                    {data.suggestedQuantity || 0} contracts
                  </div>
                </div>
              </div>

              {calculations.maxQuantity > 0 && (
                <div className="text-xs text-muted-foreground">
                  Maximum position: {calculations.maxQuantity} contracts
                  (based on 30% account margin usage)
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Position Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Position Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Position Value</div>
                  <div className="font-semibold">
                    {formatCurrency(calculations.positionValue)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Margin Required</div>
                  <div className="font-semibold">
                    {formatCurrency(calculations.marginRequired)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Risk Amount</div>
                  <div className={cn("font-semibold", getRiskColorClass(calculations.riskPercent))}>
                    {formatCurrency(data.riskAmount || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Risk %</div>
                  <div className={cn("font-semibold", getRiskColorClass(calculations.riskPercent))}>
                    {calculations.riskPercent.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Risk Warning */}
              {calculations.riskPercent > 3 && (
                <div className="flex items-start space-x-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="text-sm text-red-700 dark:text-red-300">
                    <div className="font-medium">High Risk Warning</div>
                    <div>Risking more than 3% per trade is considered aggressive. Consider reducing your position size.</div>
                  </div>
                </div>
              )}

              {/* Good Risk */}
              {calculations.riskPercent > 0 && calculations.riskPercent <= 2 && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <div className="text-sm text-green-700 dark:text-green-300">
                    Good risk management - within recommended range
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Hint */}
      {canProceed && (
        <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
          <p className="text-sm text-green-700 dark:text-green-200 text-center">
            ✓ Position size calculated! Press <kbd className="px-1.5 py-0.5 bg-green-200 dark:bg-green-800 rounded text-xs">Enter</kbd> to continue to risk management
          </p>
        </div>
      )}
    </div>
  );
}