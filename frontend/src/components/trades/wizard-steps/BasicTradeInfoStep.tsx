import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TrendingUp, TrendingDown, Calendar as CalendarIcon, Clock, AlertCircle, Lightbulb } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TradeDirection, OrderType, Strategy, Timeframe } from '@/types';
import { ContractSpecification } from '@/types/market';
import { formatPrice } from '@/utils/marketCalculations';

interface BasicTradeInfoStepProps {
  data: {
    selectedMarket?: ContractSpecification;
    symbol?: string;
    direction?: TradeDirection;
    entryPrice?: number;
    entryDate?: Date;
    orderType?: OrderType;
    strategy?: Strategy;
    timeframe?: Timeframe;
  };
  updateData: (updates: any) => void;
  errors: Record<string, string>;
  onNext: () => void;
  canProceed: boolean;
}

export function BasicTradeInfoStep({
  data,
  updateData,
  errors,
  onNext,
  canProceed
}: BasicTradeInfoStepProps) {
  const directionRef = useRef<HTMLButtonElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const [suggestedPrices, setSuggestedPrices] = useState({
    current: 0,
    support: 0,
    resistance: 0
  });

  // Auto-focus on first input when step loads
  useEffect(() => {
    if (!data.direction && directionRef.current) {
      directionRef.current.focus();
    } else if (data.direction && !data.entryPrice && priceRef.current) {
      priceRef.current.focus();
    }
  }, [data.direction, data.entryPrice]);

  // Generate suggested prices based on selected market (mock data for demo)
  useEffect(() => {
    if (data.selectedMarket) {
      // In a real app, this would come from a price feed or API
      const basePrice = data.selectedMarket.symbol === 'ES' ? 4500 : 15800;
      setSuggestedPrices({
        current: basePrice,
        support: basePrice - (data.selectedMarket.pointValue * 2),
        resistance: basePrice + (data.selectedMarket.pointValue * 2)
      });

      // Auto-fill current price if not set
      if (!data.entryPrice) {
        updateData({ entryPrice: basePrice });
      }
    }
  }, [data.selectedMarket, updateData, data.entryPrice]);

  const handleDirectionSelect = (direction: TradeDirection) => {
    updateData({ direction });

    // Auto-focus price input after direction selection
    setTimeout(() => {
      if (priceRef.current) {
        priceRef.current.focus();
      }
    }, 100);
  };

  const handlePriceChange = (value: string) => {
    const price = parseFloat(value);
    if (!isNaN(price) && price > 0) {
      updateData({ entryPrice: price });
    } else if (value === '') {
      updateData({ entryPrice: undefined });
    }
  };

  const handlePriceSuggestion = (price: number) => {
    updateData({ entryPrice: price });
    if (priceRef.current) {
      priceRef.current.focus();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Tab') {
      return; // Let normal tab behavior work
    }

    if (event.key === 'Enter' && canProceed) {
      event.preventDefault();
      onNext();
    }
  };

  const formatPriceForDisplay = (price: number): string => {
    return data.selectedMarket ? formatPrice(price, data.selectedMarket) : price.toFixed(2);
  };

  if (!data.selectedMarket) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Please select a market first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" onKeyDown={handleKeyDown}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Trade Details</h2>
        <p className="text-muted-foreground">
          Configure the basic parameters for your {data.selectedMarket.symbol} trade
        </p>
      </div>

      {/* Market Info Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold",
                data.selectedMarket.symbol === 'ES' ? "bg-blue-600" : "bg-green-600"
              )}>
                {data.selectedMarket.symbol}
              </div>
              <div>
                <h3 className="font-semibold">{data.selectedMarket.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Point Value: ${data.selectedMarket.pointValue} |
                  Tick Size: {data.selectedMarket.tickSize}
                </p>
              </div>
            </div>
            <Badge variant="secondary">Selected Market</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Direction Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Trade Direction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button
                ref={directionRef}
                variant={data.direction === TradeDirection.LONG ? "default" : "outline"}
                onClick={() => handleDirectionSelect(TradeDirection.LONG)}
                className={cn(
                  "h-16 flex flex-col space-y-1",
                  data.direction === TradeDirection.LONG && "bg-green-600 hover:bg-green-700"
                )}
              >
                <TrendingUp className="w-6 h-6" />
                <span className="font-semibold">LONG</span>
                <span className="text-xs opacity-75">Buy</span>
              </Button>

              <Button
                variant={data.direction === TradeDirection.SHORT ? "default" : "outline"}
                onClick={() => handleDirectionSelect(TradeDirection.SHORT)}
                className={cn(
                  "h-16 flex flex-col space-y-1",
                  data.direction === TradeDirection.SHORT && "bg-red-600 hover:bg-red-700"
                )}
              >
                <TrendingDown className="w-6 h-6" />
                <span className="font-semibold">SHORT</span>
                <span className="text-xs opacity-75">Sell</span>
              </Button>
            </div>
            {errors.direction && (
              <p className="text-sm text-destructive mt-2">{errors.direction}</p>
            )}
          </CardContent>
        </Card>

        {/* Entry Price */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Entry Price
              <Lightbulb className="w-4 h-4 text-yellow-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <Label htmlFor="entryPrice">Price ({data.selectedMarket.currency})</Label>
                <Input
                  ref={priceRef}
                  id="entryPrice"
                  type="number"
                  step={data.selectedMarket.tickSize}
                  value={data.entryPrice || ''}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="Enter price..."
                  className={errors.entryPrice ? "border-destructive" : ""}
                />
                {errors.entryPrice && (
                  <p className="text-sm text-destructive mt-1">{errors.entryPrice}</p>
                )}
              </div>

              {/* Price Suggestions */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Quick Fill</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePriceSuggestion(suggestedPrices.current)}
                    className="text-xs"
                  >
                    Current: {formatPriceForDisplay(suggestedPrices.current)}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePriceSuggestion(suggestedPrices.support)}
                    className="text-xs"
                  >
                    Support: {formatPriceForDisplay(suggestedPrices.support)}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePriceSuggestion(suggestedPrices.resistance)}
                    className="text-xs"
                  >
                    Resistance: {formatPriceForDisplay(suggestedPrices.resistance)}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Entry Date & Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2" />
              Entry Date & Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data.entryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.entryDate ? format(data.entryDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={data.entryDate}
                    onSelect={(date) => updateData({ entryDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.entryDate && (
                <p className="text-sm text-destructive mt-1">{errors.entryDate}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Type & Strategy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="orderType">Order Type</Label>
              <Select
                value={data.orderType}
                onValueChange={(value) => updateData({ orderType: value as OrderType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select order type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={OrderType.MARKET}>Market</SelectItem>
                  <SelectItem value={OrderType.LIMIT}>Limit</SelectItem>
                  <SelectItem value={OrderType.STOP}>Stop</SelectItem>
                  <SelectItem value={OrderType.STOP_LIMIT}>Stop Limit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="strategy">Strategy</Label>
              <Select
                value={data.strategy}
                onValueChange={(value) => updateData({ strategy: value as Strategy })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Strategy.SCALPING}>Scalping</SelectItem>
                  <SelectItem value={Strategy.DAY_TRADING}>Day Trading</SelectItem>
                  <SelectItem value={Strategy.SWING}>Swing</SelectItem>
                  <SelectItem value={Strategy.POSITION}>Position</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timeframe">Timeframe</Label>
              <Select
                value={data.timeframe}
                onValueChange={(value) => updateData({ timeframe: value as Timeframe })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Timeframe.M1}>1 Minute</SelectItem>
                  <SelectItem value={Timeframe.M5}>5 Minutes</SelectItem>
                  <SelectItem value={Timeframe.M15}>15 Minutes</SelectItem>
                  <SelectItem value={Timeframe.M30}>30 Minutes</SelectItem>
                  <SelectItem value={Timeframe.H1}>1 Hour</SelectItem>
                  <SelectItem value={Timeframe.H4}>4 Hours</SelectItem>
                  <SelectItem value={Timeframe.D1}>Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Hint */}
      {canProceed && (
        <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
          <p className="text-sm text-green-700 dark:text-green-200 text-center">
            ✓ Ready to proceed! Press <kbd className="px-1.5 py-0.5 bg-green-200 dark:bg-green-800 rounded text-xs">Enter</kbd> to continue to position sizing
          </p>
        </div>
      )}
    </div>
  );
}