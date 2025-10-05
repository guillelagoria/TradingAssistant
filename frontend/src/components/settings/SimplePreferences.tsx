import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  DollarSign,
  Star,
  Palette,
  Globe,
  Plus,
  X,
  Save
} from 'lucide-react';
import { toast } from 'sonner';

interface SimplePreferencesData {
  favoriteSymbols: string[];
  theme: 'light' | 'dark' | 'system';
  currency: string;
  dateFormat: string;
  timezone: string;
}

const DEFAULT_PREFERENCES: SimplePreferencesData = {
  favoriteSymbols: ['ES', 'NQ', 'YM', 'RTY'],
  theme: 'system',
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  timezone: 'UTC'
};

const POPULAR_SYMBOLS = [
  'ES', 'NQ', 'YM', 'RTY', // Futures
  'SPY', 'QQQ', 'IWM', // ETFs
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', // Stocks
  'EURUSD', 'GBPUSD', 'USDJPY', // Forex
  'BTCUSD', 'ETHUSD' // Crypto
];

export function SimplePreferences() {
  const [preferences, setPreferences] = useState<SimplePreferencesData>(() => {
    const saved = localStorage.getItem('trading-preferences');
    return saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
  });

  const [newSymbol, setNewSymbol] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = <K extends keyof SimplePreferencesData>(
    field: K,
    value: SimplePreferencesData[K]
  ) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleAddSymbol = () => {
    const symbol = newSymbol.trim().toUpperCase();
    if (symbol && !preferences.favoriteSymbols.includes(symbol)) {
      handleChange('favoriteSymbols', [...preferences.favoriteSymbols, symbol]);
      setNewSymbol('');
    }
  };

  const handleRemoveSymbol = (symbol: string) => {
    handleChange(
      'favoriteSymbols',
      preferences.favoriteSymbols.filter(s => s !== symbol)
    );
  };

  const handleSave = () => {
    localStorage.setItem('trading-preferences', JSON.stringify(preferences));
    setHasChanges(false);
    toast.success('Preferences saved successfully');
  };

  const handleReset = () => {
    setPreferences(DEFAULT_PREFERENCES);
    setHasChanges(true);
    toast.info('Preferences reset to defaults');
  };

  return (
    <div className="space-y-6">
      {/* Trading Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5" />
            Trading Defaults
          </CardTitle>
          <CardDescription>
            Default values that will be pre-filled when creating new trades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Favorite Symbols Section */}
          <div className="space-y-3">
            <div>
              <Label className="flex items-center gap-2 text-base">
                <Star className="h-4 w-4" />
                Favorite Symbols
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Quick access symbols for the trade form
              </p>
            </div>

            {/* Current Favorites */}
            <div className="flex flex-wrap gap-2">
              {preferences.favoriteSymbols.map((symbol) => (
                <Badge
                  key={symbol}
                  variant="secondary"
                  className="flex items-center gap-1 px-3 py-1"
                >
                  {symbol}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-red-100 ml-1"
                    onClick={() => handleRemoveSymbol(symbol)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>

            {/* Add New Symbol */}
            <div className="flex gap-2">
              <Input
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                placeholder="Add symbol (e.g., AAPL)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSymbol();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddSymbol}
                disabled={!newSymbol.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Add Popular Symbols */}
            <div className="space-y-2">
              <Label className="text-sm">Quick Add:</Label>
              <div className="flex flex-wrap gap-1">
                {POPULAR_SYMBOLS
                  .filter(symbol => !preferences.favoriteSymbols.includes(symbol))
                  .slice(0, 10)
                  .map((symbol) => (
                    <Button
                      key={symbol}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => handleChange('favoriteSymbols', [...preferences.favoriteSymbols, symbol])}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {symbol}
                    </Button>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
        {hasChanges && (
          <CardFooter className="border-t border-border/50 bg-muted/20 px-6 py-4">
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" onClick={handleReset}>
                Reset to Defaults
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-5 w-5" />
            Display Settings
          </CardTitle>
          <CardDescription>
            Customize the appearance and formatting of your trading diary
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={preferences.theme}
                onValueChange={(value: any) => handleChange('theme', value)}
              >
                <SelectTrigger id="theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency Symbol</Label>
              <Select
                value={preferences.currency}
                onValueChange={(value) => handleChange('currency', value)}
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">$ USD</SelectItem>
                  <SelectItem value="EUR">€ EUR</SelectItem>
                  <SelectItem value="GBP">£ GBP</SelectItem>
                  <SelectItem value="JPY">¥ JPY</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-format">Date Format</Label>
              <Select
                value={preferences.dateFormat}
                onValueChange={(value) => handleChange('dateFormat', value)}
              >
                <SelectTrigger id="date-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2023)</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (31/12/2023)</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2023-12-31)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={preferences.timezone}
                onValueChange={(value) => handleChange('timezone', value)}
              >
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="EST">EST (US Eastern)</SelectItem>
                  <SelectItem value="CST">CST (US Central)</SelectItem>
                  <SelectItem value="PST">PST (US Pacific)</SelectItem>
                  <SelectItem value="GMT">GMT (London)</SelectItem>
                  <SelectItem value="CET">CET (Europe)</SelectItem>
                  <SelectItem value="JST">JST (Tokyo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        {hasChanges && (
          <CardFooter className="border-t border-border/50 bg-muted/20 px-6 py-4">
            <div className="flex justify-end w-full">
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Current Settings Summary */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-sm">Current Settings Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium">Symbols</div>
              <div className="text-muted-foreground">{preferences.favoriteSymbols.length} favorites</div>
            </div>
            <div>
              <div className="font-medium">Theme</div>
              <div className="text-muted-foreground capitalize">{preferences.theme}</div>
            </div>
            <div>
              <div className="font-medium">Currency</div>
              <div className="text-muted-foreground">{preferences.currency}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
