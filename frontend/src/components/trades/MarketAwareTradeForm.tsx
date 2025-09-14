import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  AlertCircle,
  Calculator,
  DollarSign,
  Info,
  TrendingUp,
  TrendingDown,
  Zap,
} from 'lucide-react';

import { useMarketDefaults, useQuickAccessMarkets } from '@/hooks/useMarketDefaults';
import { formatCurrency, formatPercentage } from '@/utils/formatting';

interface MarketAwareTradeFormProps {
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
}

interface TradeFormData {
  marketId: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  quantity: number;
  stopLoss?: number;
  takeProfit?: number;
  riskAmount?: number;
}

export default function MarketAwareTradeForm({
  onSubmit,
  onCancel,
}: MarketAwareTradeFormProps) {
  const [selectedMarketId, setSelectedMarketId] = useState<string>('');
  const [entryPrice, setEntryPrice] = useState<number | undefined>();
  const quickAccessMarkets = useQuickAccessMarkets();

  // Get smart defaults based on selected market and entry price
  const {
    defaults,
    activeMarket,
    isLoading,
    recalculatePositionSize,
    calculateMarginRequirement,
    validatePrice,
    roundToTick,
  } = useMarketDefaults({
    marketId: selectedMarketId,
    entryPrice,
    accountBalance: 100000, // This would come from user settings
    autoCalculate: true,
  });

  const form = useForm<TradeFormData>({
    defaultValues: {
      marketId: '',
      symbol: '',
      direction: 'LONG',
      entryPrice: 0,
      quantity: 1,
      stopLoss: 0,
      takeProfit: 0,
      riskAmount: 0,
    },
  });

  // Update form when defaults change
  useEffect(() => {
    if (defaults && activeMarket) {
      form.setValue('symbol', defaults.symbol);

      if (defaults.suggestedQuantity) {
        form.setValue('quantity', defaults.suggestedQuantity);
      }

      if (defaults.suggestedStopLoss) {
        form.setValue('stopLoss', defaults.suggestedStopLoss);
      }

      if (defaults.suggestedTakeProfit) {
        form.setValue('takeProfit', defaults.suggestedTakeProfit);
      }

      if (defaults.suggestedRiskAmount) {
        form.setValue('riskAmount', defaults.suggestedRiskAmount);
      }
    }
  }, [defaults, activeMarket, form]);

  const handleMarketChange = (marketId: string) => {
    setSelectedMarketId(marketId);
    form.setValue('marketId', marketId);
  };

  const handleEntryPriceChange = (value: string) => {
    const price = parseFloat(value) || 0;
    if (activeMarket && validatePrice(price)) {
      const roundedPrice = roundToTick(price);
      setEntryPrice(roundedPrice);
      form.setValue('entryPrice', roundedPrice);
    } else {
      setEntryPrice(price);
      form.setValue('entryPrice', price);
    }
  };

  const calculateSuggestions = () => {
    const formData = form.getValues();
    if (!activeMarket || !formData.entryPrice || !formData.riskAmount) return;

    const direction = formData.direction;
    const riskPercent = defaults?.defaultStopLossPercent || 1;
    const stopPrice = direction === 'LONG'
      ? formData.entryPrice * (1 - riskPercent / 100)
      : formData.entryPrice * (1 + riskPercent / 100);

    const suggestedQuantity = recalculatePositionSize(
      formData.riskAmount,
      formData.entryPrice,
      stopPrice
    );

    form.setValue('quantity', suggestedQuantity);
    form.setValue('stopLoss', roundToTick(stopPrice));

    const takeProfitPercent = defaults?.defaultTakeProfitPercent || 2;
    const takeProfitPrice = direction === 'LONG'
      ? formData.entryPrice * (1 + takeProfitPercent / 100)
      : formData.entryPrice * (1 - takeProfitPercent / 100);

    form.setValue('takeProfit', roundToTick(takeProfitPrice));
  };

  const handleSubmit = (data: TradeFormData) => {
    if (onSubmit) {
      onSubmit({
        ...data,
        marketConfig: activeMarket,
        calculatedMetrics: {
          marginRequirement: calculateMarginRequirement(data.quantity),
          commission: (defaults?.commission || 0) * data.quantity,
        },
      });
    }
  };

  const currentQuantity = form.watch('quantity') || 0;
  const marginRequired = calculateMarginRequirement(currentQuantity);

  return (
    <div className="space-y-6">
      {/* Market Selection Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Market Selection
          </CardTitle>
          <CardDescription>
            Select your trading market for smart defaults and validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="market-select">Trading Market</Label>
                <Select value={selectedMarketId} onValueChange={handleMarketChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a market" />
                  </SelectTrigger>
                  <SelectContent>
                    {quickAccessMarkets.map((market) => (
                      <SelectItem key={market.id} value={market.id}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{market.symbol}</Badge>
                          <span>{market.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {market.exchange}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {activeMarket && (
                <div className="space-y-2">
                  <Label>Market Info</Label>
                  <div className="p-3 bg-muted rounded-md space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Point Value:</span>
                      <span className="font-mono">{formatCurrency(activeMarket.pointValue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tick Size:</span>
                      <span className="font-mono">{activeMarket.tickSize}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Commission:</span>
                      <span className="font-mono">{formatCurrency(defaults?.commission || 0)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {activeMarket && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Smart defaults enabled for {activeMarket.name}.
                  Risk tolerance: {formatPercentage(defaults?.riskPercentage || 0)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trade Details Form */}
      {activeMarket && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Trade Details
                </CardTitle>
                <CardDescription>
                  Enter your trade parameters with smart validation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Symbol (auto-filled) */}
                  <FormField
                    control={form.control}
                    name="symbol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Symbol</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                        <FormDescription>
                          Auto-filled from market selection
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Direction */}
                  <FormField
                    control={form.control}
                    name="direction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Direction</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="LONG">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                Long
                              </div>
                            </SelectItem>
                            <SelectItem value="SHORT">
                              <div className="flex items-center gap-2">
                                <TrendingDown className="h-4 w-4 text-red-600" />
                                Short
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Entry Price */}
                  <FormField
                    control={form.control}
                    name="entryPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entry Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step={activeMarket.tickSize}
                            placeholder={`Min: ${activeMarket.tickSize}`}
                            {...field}
                            onChange={(e) => handleEntryPriceChange(e.target.value)}
                          />
                        </FormControl>
                        <FormDescription>
                          Tick size: {activeMarket.tickSize}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Risk Amount */}
                  <FormField
                    control={form.control}
                    name="riskAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risk Amount ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="10"
                            placeholder={formatCurrency(defaults?.suggestedRiskAmount || 1000)}
                            {...field}
                            onChange={(e) => {
                              field.onChange(parseFloat(e.target.value) || 0);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Suggested: {formatCurrency(defaults?.suggestedRiskAmount || 1000)}
                          ({formatPercentage(defaults?.riskPercentage || 0)} of account)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Quantity (calculated) */}
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity (Contracts)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max={activeMarket.riskDefaults.maxPositionSize}
                            {...field}
                            onChange={(e) => {
                              field.onChange(parseInt(e.target.value) || 1);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Max: {activeMarket.riskDefaults.maxPositionSize} contracts
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Stop Loss (suggested) */}
                  <FormField
                    control={form.control}
                    name="stopLoss"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stop Loss</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step={activeMarket.tickSize}
                            {...field}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              field.onChange(roundToTick(value));
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Suggested: {formatPercentage(defaults?.defaultStopLossPercent || 0)} from entry
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Take Profit (suggested) */}
                  <FormField
                    control={form.control}
                    name="takeProfit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Take Profit</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step={activeMarket.tickSize}
                            {...field}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              field.onChange(roundToTick(value));
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Suggested: {formatPercentage(defaults?.defaultTakeProfitPercent || 0)} from entry
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Auto-calculate button */}
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={calculateSuggestions}
                    className="flex items-center gap-2"
                    disabled={!entryPrice || !form.getValues('riskAmount')}
                  >
                    <Zap className="h-4 w-4" />
                    Apply Smart Defaults
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Calculated Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Trade Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-muted rounded-md">
                    <div className="text-sm text-muted-foreground">Margin Required</div>
                    <div className="text-lg font-semibold">
                      {formatCurrency(marginRequired)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(activeMarket.initialMargin)}/contract
                    </div>
                  </div>

                  <div className="p-3 bg-muted rounded-md">
                    <div className="text-sm text-muted-foreground">Commission</div>
                    <div className="text-lg font-semibold">
                      {formatCurrency((defaults?.commission || 0) * currentQuantity)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Round turn
                    </div>
                  </div>

                  <div className="p-3 bg-muted rounded-md">
                    <div className="text-sm text-muted-foreground">Contract Value</div>
                    <div className="text-lg font-semibold">
                      {entryPrice ? formatCurrency(entryPrice * activeMarket.pointValue * currentQuantity) : '-'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      At current price
                    </div>
                  </div>
                </div>

                {form.getValues('stopLoss') > 0 && form.getValues('takeProfit') > 0 && (
                  <div className="mt-4 p-3 border rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Risk/Reward Ratio:</span>
                      <span className="font-semibold">
                        {form.getValues('direction') === 'LONG'
                          ? ((form.getValues('takeProfit') - (entryPrice || 0)) / ((entryPrice || 0) - form.getValues('stopLoss'))).toFixed(2)
                          : (((entryPrice || 0) - form.getValues('takeProfit')) / (form.getValues('stopLoss') - (entryPrice || 0))).toFixed(2)
                        }:1
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button type="submit" className="flex-1">
                Create Trade
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      )}

      {!activeMarket && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-semibold">Select a Market</h3>
              <p className="text-muted-foreground">
                Choose a trading market to enable smart defaults and validation
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}