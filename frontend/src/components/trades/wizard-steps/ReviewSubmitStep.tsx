import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  DollarSign,
  Calendar,
  Clock,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TradeDirection, OrderType, Strategy, Timeframe } from '@/types';
import { ContractSpecification } from '@/types/market';
import {
  formatPrice,
  calculatePnL,
  calculateMarginRequirement,
  calculateCommission
} from '@/utils/marketCalculations';

interface ReviewSubmitStepProps {
  data: {
    selectedMarket?: ContractSpecification;
    symbol?: string;
    direction?: TradeDirection;
    entryPrice?: number;
    quantity?: number;
    entryDate?: Date;
    orderType?: OrderType;
    stopLoss?: number;
    takeProfit?: number;
    strategy?: Strategy;
    timeframe?: Timeframe;
    riskAmount?: number;
    riskPercentage?: number;
    accountBalance?: number;
    notes?: string;
  };
  updateData: (updates: any) => void;
  errors: Record<string, string>;
  isLastStep: boolean;
}

export function ReviewSubmitStep({
  data,
  updateData,
  errors,
  isLastStep
}: ReviewSubmitStepProps) {

  if (!data.selectedMarket || !data.entryPrice || !data.quantity || !data.direction) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Missing required trade information</p>
      </div>
    );
  }

  // Calculate all trade metrics
  const margin = calculateMarginRequirement(data.quantity, data.selectedMarket, true);
  const commission = calculateCommission(data.quantity, data.selectedMarket, true);
  const positionValue = data.entryPrice * data.selectedMarket.pointValue * data.quantity;

  // Calculate potential outcomes
  let maxLoss = 0;
  let maxProfit = 0;
  let riskRewardRatio = 0;

  if (data.stopLoss) {
    const lossCalc = calculatePnL(
      data.entryPrice,
      data.stopLoss,
      data.quantity,
      data.selectedMarket,
      data.direction,
      true
    );
    maxLoss = lossCalc.netPnL;
  }

  if (data.takeProfit) {
    const profitCalc = calculatePnL(
      data.entryPrice,
      data.takeProfit,
      data.quantity,
      data.selectedMarket,
      data.direction,
      true
    );
    maxProfit = profitCalc.netPnL;
  }

  if (maxLoss < 0 && maxProfit > 0) {
    riskRewardRatio = maxProfit / Math.abs(maxLoss);
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPriceForDisplay = (price: number): string => {
    return formatPrice(price, data.selectedMarket!);
  };

  const getDirectionColor = () => {
    return data.direction === TradeDirection.LONG
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';
  };

  const getDirectionIcon = () => {
    return data.direction === TradeDirection.LONG ? TrendingUp : TrendingDown;
  };

  const DirectionIcon = getDirectionIcon();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Review Your Trade</h2>
        <p className="text-muted-foreground">
          Please review all details before creating your trade
        </p>
      </div>

      {/* Trade Summary Header */}
      <Card className={cn(
        "border-2 bg-gradient-to-r",
        data.direction === TradeDirection.LONG
          ? "from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200"
          : "from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200"
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={cn(
                "w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl",
                data.selectedMarket.symbol === 'ES' ? "bg-blue-600" : "bg-green-600"
              )}>
                {data.selectedMarket.symbol}
              </div>
              <div>
                <h3 className="text-2xl font-bold flex items-center space-x-2">
                  <DirectionIcon className={cn("w-6 h-6", getDirectionColor())} />
                  <span className={getDirectionColor()}>{data.direction}</span>
                  <span>{data.selectedMarket.name}</span>
                </h3>
                <p className="text-muted-foreground">
                  {data.quantity} contract{data.quantity !== 1 ? 's' : ''} at {formatPriceForDisplay(data.entryPrice)}
                </p>
              </div>
            </div>
            <Badge variant="default" className="text-lg px-4 py-2">
              {formatCurrency(positionValue)} Position
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Trade Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Trade Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Market:</span>
                <span className="font-medium">{data.selectedMarket.symbol}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Direction:</span>
                <Badge variant={data.direction === TradeDirection.LONG ? 'default' : 'destructive'}>
                  {data.direction}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Entry Price:</span>
                <span className="font-medium">{formatPriceForDisplay(data.entryPrice)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Quantity:</span>
                <span className="font-medium">{data.quantity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Order Type:</span>
                <span className="font-medium">{data.orderType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Strategy:</span>
                <span className="font-medium">{data.strategy?.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Timeframe:</span>
                <span className="font-medium">{data.timeframe}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Entry Date:</span>
                <span className="font-medium">{format(data.entryDate!, 'MMM dd, yyyy')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Risk Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {data.stopLoss && (
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium">Stop Loss</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatPriceForDisplay(data.stopLoss)}</div>
                    <div className="text-xs text-muted-foreground">
                      Max Loss: {formatCurrency(Math.abs(maxLoss))}
                    </div>
                  </div>
                </div>
              )}

              {data.takeProfit && (
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium">Take Profit</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatPriceForDisplay(data.takeProfit)}</div>
                    <div className="text-xs text-muted-foreground">
                      Max Profit: {formatCurrency(maxProfit)}
                    </div>
                  </div>
                </div>
              )}

              {riskRewardRatio > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium">Risk:Reward</span>
                  </div>
                  <div className="font-medium">1:{riskRewardRatio.toFixed(1)}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Position Value:</span>
                <span className="font-medium">{formatCurrency(positionValue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Margin Required:</span>
                <span className="font-medium">{formatCurrency(margin)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Commission:</span>
                <span className="font-medium">{formatCurrency(commission)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Risk Amount:</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  {formatCurrency(data.riskAmount || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Risk Percentage:</span>
                <span className="font-medium">
                  {(data.riskPercentage || 0).toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Account Balance:</span>
                <span className="font-medium">{formatCurrency(data.accountBalance || 0)}</span>
              </div>
            </div>

            {/* Risk Assessment */}
            <Separator />
            <div className="space-y-2">
              {(data.riskPercentage || 0) <= 2 && (
                <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Good risk management</span>
                </div>
              )}
              {(data.riskPercentage || 0) > 2 && (data.riskPercentage || 0) <= 3 && (
                <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Moderate risk level</span>
                </div>
              )}
              {(data.riskPercentage || 0) > 3 && (
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">High risk - consider reducing position</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Additional Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <Label htmlFor="notes">Trade Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes about this trade..."
                  value={data.notes || ''}
                  onChange={(e) => updateData({ notes: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Add context about market conditions, setup reasons, or other relevant information.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Final Checklist */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardHeader>
          <CardTitle className="flex items-center text-green-700 dark:text-green-300">
            <CheckCircle className="w-5 h-5 mr-2" />
            Ready to Submit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Market selected: {data.selectedMarket.symbol}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Direction & price confirmed</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Position size calculated</span>
              </div>
            </div>
            <div className="space-y-2">
              {data.stopLoss ? (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Stop loss set</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span>No stop loss (risky)</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Risk management reviewed</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>All details verified</span>
              </div>
            </div>
          </div>

          {isLastStep && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-200 text-center">
                Click the <strong>{data.direction} Trade</strong> button below to create your trade!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="text-sm text-destructive font-medium mb-2">
            Please fix the following issues:
          </div>
          <ul className="text-sm text-destructive space-y-1">
            {Object.entries(errors).map(([field, message]) => (
              <li key={field}>• {message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}