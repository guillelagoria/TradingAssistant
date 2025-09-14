import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  Target, 
  Shield, 
  Clock, 
  Calculator, 
  Star,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Settings2
} from 'lucide-react';

import { StrategyManager } from './StrategyManager';
import { FavoriteSymbols } from './FavoriteSymbols';
import { CommissionSettings } from './CommissionSettings';
import MarketConfiguration from './MarketConfiguration';

import type { TradingPreferences as TradingPrefs } from '@/types/user';
import { cn } from '@/lib/utils';

interface TradingPreferencesProps {
  preferences: TradingPrefs;
  onUpdate: (preferences: Partial<TradingPrefs>) => void;
  validationErrors?: Record<string, string>;
}

export function TradingPreferences({ 
  preferences, 
  onUpdate, 
  validationErrors = {} 
}: TradingPreferencesProps) {
  const [activeTab, setActiveTab] = useState('basic');
  
  const handleInputChange = (field: keyof TradingPrefs, value: any) => {
    onUpdate({ [field]: value });
  };

  const handleAutoCalculateChange = (field: keyof TradingPrefs['autoCalculate'], value: boolean) => {
    onUpdate({
      autoCalculate: {
        ...preferences.autoCalculate,
        [field]: value
      }
    });
  };

  const addSymbol = (symbol: string) => {
    if (!symbol.trim() || preferences.favoriteSymbols.includes(symbol.trim().toUpperCase())) {
      return;
    }
    onUpdate({
      favoriteSymbols: [...preferences.favoriteSymbols, symbol.trim().toUpperCase()]
    });
  };

  const removeSymbol = (symbol: string) => {
    onUpdate({
      favoriteSymbols: preferences.favoriteSymbols.filter(s => s !== symbol)
    });
  };

  const addStrategy = (strategy: string) => {
    if (!strategy.trim() || preferences.favoriteStrategies.includes(strategy.trim())) {
      return;
    }
    onUpdate({
      favoriteStrategies: [...preferences.favoriteStrategies, strategy.trim()]
    });
  };

  const removeStrategy = (strategy: string) => {
    onUpdate({
      favoriteStrategies: preferences.favoriteStrategies.filter(s => s !== strategy)
    });
  };

  const addTimeframe = (timeframe: string) => {
    if (!timeframe.trim() || preferences.defaultTimeframes.includes(timeframe.trim())) {
      return;
    }
    onUpdate({
      defaultTimeframes: [...preferences.defaultTimeframes, timeframe.trim()]
    });
  };

  const removeTimeframe = (timeframe: string) => {
    onUpdate({
      defaultTimeframes: preferences.defaultTimeframes.filter(t => t !== timeframe)
    });
  };

  const commonSymbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD', 'EURGBP', 'EURJPY', 'GBPJPY'];
  const commonTimeframes = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN'];
  const timezones = [
    'UTC', 'EST', 'CST', 'PST', 'GMT', 'CET', 'JST', 'AEST', 'IST', 'HKT'
  ];

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="basic" className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          Basic Settings
        </TabsTrigger>
        <TabsTrigger value="markets" className="flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          Markets
        </TabsTrigger>
        <TabsTrigger value="strategies" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Strategies
        </TabsTrigger>
        <TabsTrigger value="symbols" className="flex items-center gap-2">
          <Star className="h-4 w-4" />
          Symbols
        </TabsTrigger>
        <TabsTrigger value="commissions" className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Commissions
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="basic" className="space-y-6">
      {/* Default Trading Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5" />
            Default Trading Parameters
          </CardTitle>
          <CardDescription>
            Set default values that will be pre-filled when creating new trades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="default-commission">Default Commission ($)</Label>
              <Input
                id="default-commission"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={preferences.defaultCommission}
                onChange={(e) => handleInputChange('defaultCommission', parseFloat(e.target.value) || 0)}
                className={cn(validationErrors.defaultCommission && 'border-red-500')}
              />
              {validationErrors.defaultCommission && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.defaultCommission}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Commission per trade (broker fees, spreads, etc.)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position-size">Default Position Size (%)</Label>
              <Input
                id="position-size"
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                placeholder="2.0"
                value={preferences.defaultPositionSizePercent}
                onChange={(e) => handleInputChange('defaultPositionSizePercent', parseFloat(e.target.value) || 2)}
                className={cn(validationErrors.defaultPositionSizePercent && 'border-red-500')}
              />
              {validationErrors.defaultPositionSizePercent && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.defaultPositionSizePercent}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Percentage of account balance per trade (1-100%)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stop-loss">Default Stop Loss (%)</Label>
              <Input
                id="stop-loss"
                type="number"
                min="0.1"
                max="50"
                step="0.1"
                placeholder="2.0"
                value={preferences.defaultStopLossPercent || ''}
                onChange={(e) => handleInputChange('defaultStopLossPercent', parseFloat(e.target.value) || undefined)}
              />
              <p className="text-xs text-muted-foreground">
                Default stop loss distance from entry (optional)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="take-profit">Default Take Profit (%)</Label>
              <Input
                id="take-profit"
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                placeholder="4.0"
                value={preferences.defaultTakeProfitPercent || ''}
                onChange={(e) => handleInputChange('defaultTakeProfitPercent', parseFloat(e.target.value) || undefined)}
              />
              <p className="text-xs text-muted-foreground">
                Default take profit distance from entry (optional)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Risk Management
          </CardTitle>
          <CardDescription>
            Configure risk tolerance and management parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="risk-tolerance">Risk Tolerance per Trade (%)</Label>
            <Input
              id="risk-tolerance"
              type="number"
              min="0.1"
              max="10"
              step="0.1"
              placeholder="1.0"
              value={preferences.riskTolerancePercent}
              onChange={(e) => handleInputChange('riskTolerancePercent', parseFloat(e.target.value) || 1)}
              className={cn(validationErrors.riskTolerancePercent && 'border-red-500')}
            />
            {validationErrors.riskTolerancePercent && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {validationErrors.riskTolerancePercent}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Maximum percentage of account to risk per trade (0.5-5% recommended)
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3 text-green-600" />
              Conservative: 0.5-1% | 
              <Target className="h-3 w-3 text-yellow-600" />
              Moderate: 1-2% | 
              <AlertCircle className="h-3 w-3 text-red-600" />
              Aggressive: 2-5%
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Trading Timezone</Label>
            <Select
              value={preferences.timezone}
              onValueChange={(value) => handleInputChange('timezone', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Timezone for trade timestamps and market session analysis
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Favorite Symbols */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="h-5 w-5" />
            Favorite Trading Symbols
          </CardTitle>
          <CardDescription>
            Manage your preferred trading instruments for quick access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {preferences.favoriteSymbols.map((symbol) => (
              <Badge
                key={symbol}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {symbol}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-3 w-3 hover:bg-red-100"
                  onClick={() => removeSymbol(symbol)}
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Add Symbol</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. EURUSD"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addSymbol((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  addSymbol(input.value);
                  input.value = '';
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Quick Add Common Symbols:</Label>
            <div className="flex flex-wrap gap-1">
              {commonSymbols
                .filter(symbol => !preferences.favoriteSymbols.includes(symbol))
                .map((symbol) => (
                  <Button
                    key={symbol}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => addSymbol(symbol)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {symbol}
                  </Button>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default Timeframes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Default Timeframes
          </CardTitle>
          <CardDescription>
            Select timeframes commonly used for your trading analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {preferences.defaultTimeframes.map((timeframe) => (
              <Badge
                key={timeframe}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {timeframe}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-3 w-3 hover:bg-red-100"
                  onClick={() => removeTimeframe(timeframe)}
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            ))}
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Quick Add Common Timeframes:</Label>
            <div className="flex flex-wrap gap-1">
              {commonTimeframes
                .filter(tf => !preferences.defaultTimeframes.includes(tf))
                .map((timeframe) => (
                  <Button
                    key={timeframe}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => addTimeframe(timeframe)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {timeframe}
                  </Button>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trading Strategies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5" />
            Trading Strategies
          </CardTitle>
          <CardDescription>
            Manage your trading strategies for categorizing trades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {preferences.favoriteStrategies.map((strategy) => (
              <Badge
                key={strategy}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {strategy}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-3 w-3 hover:bg-red-100"
                  onClick={() => removeStrategy(strategy)}
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Add Strategy</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Trend Following"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addStrategy((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  addStrategy(input.value);
                  input.value = '';
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default-strategy">Default Strategy</Label>
            <Select
              value={preferences.defaultStrategy || ''}
              onValueChange={(value) => handleInputChange('defaultStrategy', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select default strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {preferences.favoriteStrategies.map((strategy) => (
                  <SelectItem key={strategy} value={strategy}>
                    {strategy}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Strategy automatically selected when creating new trades
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Calculate Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5" />
            Auto-Calculate Settings
          </CardTitle>
          <CardDescription>
            Configure which metrics should be automatically calculated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label className="text-sm font-normal">P&L Calculation</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically calculate profit and loss
                </p>
              </div>
              <Switch
                checked={preferences.autoCalculate.pnl}
                onCheckedChange={(checked) => handleAutoCalculateChange('pnl', checked)}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label className="text-sm font-normal">R-Multiple</Label>
                <p className="text-xs text-muted-foreground">
                  Risk-to-reward ratio calculation
                </p>
              </div>
              <Switch
                checked={preferences.autoCalculate.rMultiple}
                onCheckedChange={(checked) => handleAutoCalculateChange('rMultiple', checked)}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label className="text-sm font-normal">Efficiency</Label>
                <p className="text-xs text-muted-foreground">
                  Trade execution efficiency metrics
                </p>
              </div>
              <Switch
                checked={preferences.autoCalculate.efficiency}
                onCheckedChange={(checked) => handleAutoCalculateChange('efficiency', checked)}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label className="text-sm font-normal">Max Favorable Price</Label>
                <p className="text-xs text-muted-foreground">
                  Track maximum favorable excursion
                </p>
              </div>
              <Switch
                checked={preferences.autoCalculate.maxFavorablePrice}
                onCheckedChange={(checked) => handleAutoCalculateChange('maxFavorablePrice', checked)}
              />
            </div>

            <div className="flex items-center justify-between space-x-2 md:col-span-2">
              <div className="space-y-0.5">
                <Label className="text-sm font-normal">Max Adverse Price</Label>
                <p className="text-xs text-muted-foreground">
                  Track maximum adverse excursion for drawdown analysis
                </p>
              </div>
              <Switch
                checked={preferences.autoCalculate.maxAdversePrice}
                onCheckedChange={(checked) => handleAutoCalculateChange('maxAdversePrice', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      </TabsContent>

      <TabsContent value="markets">
        <MarketConfiguration />
      </TabsContent>

      <TabsContent value="strategies">
        <StrategyManager />
      </TabsContent>

      <TabsContent value="symbols">
        <FavoriteSymbols />
      </TabsContent>

      <TabsContent value="commissions">
        <CommissionSettings />
      </TabsContent>

      {/* Settings Summary */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Settings2 className="h-4 w-4" />
            Current Settings Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium">Commission</div>
              <div className="text-muted-foreground">${preferences.defaultCommission}</div>
            </div>
            <div>
              <div className="font-medium">Position Size</div>
              <div className="text-muted-foreground">{preferences.defaultPositionSizePercent}%</div>
            </div>
            <div>
              <div className="font-medium">Risk Tolerance</div>
              <div className="text-muted-foreground">{preferences.riskTolerancePercent}%</div>
            </div>
            <div>
              <div className="font-medium">Favorite Symbols</div>
              <div className="text-muted-foreground">{preferences.favoriteSymbols.length} symbols</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Tabs>
  );
}