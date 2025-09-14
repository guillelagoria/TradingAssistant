import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  TrendingUp,
  Settings,
  Star,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  Plus,
  DollarSign,
  Calculator,
  Shield,
  Clock,
} from 'lucide-react';

import useSettingsStore from '@/store/settingsStore';
import {
  type ContractSpecification,
  type MarketPreset,
  MarketCategory,
  Exchange,
  PositionSizingMethod,
} from '@/types/market';
import { formatCurrency } from '@/utils/formatting';

export default function MarketConfiguration() {
  const {
    marketConfigs,
    marketPresets,
    marketPreferences,
    selectedMarket,
    setSelectedMarket,
    updateMarketConfig,
    toggleMarketActive,
    addPreferredMarket,
    removePreferredMarket,
    setDefaultMarket,
    addQuickAccessMarket,
    removeQuickAccessMarket,
    applyMarketPreset,
    getTradeDefaults,
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [editingMarket, setEditingMarket] = useState<string | null>(null);

  // Market overview with key metrics
  const renderMarketOverview = () => (
    <div className="space-y-6">
      {/* Market Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Active Market
          </CardTitle>
          <CardDescription>
            Select your primary trading market for auto-populated defaults
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="market-select">Market Selection</Label>
              <Select
                value={selectedMarket?.id || ''}
                onValueChange={setSelectedMarket}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a market" />
                </SelectTrigger>
                <SelectContent>
                  {marketConfigs
                    .filter(m => m.isActive)
                    .map((market) => (
                      <SelectItem key={market.id} value={market.id}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {market.symbol}
                          </Badge>
                          {market.name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {selectedMarket && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (marketPreferences.preferredMarkets.includes(selectedMarket.id)) {
                      removePreferredMarket(selectedMarket.id);
                    } else {
                      addPreferredMarket(selectedMarket.id);
                    }
                  }}
                >
                  <Star
                    className={`h-4 w-4 ${
                      marketPreferences.preferredMarkets.includes(selectedMarket.id)
                        ? 'fill-yellow-400 text-yellow-400'
                        : ''
                    }`}
                  />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDefaultMarket(selectedMarket.id)}
                  disabled={marketPreferences.defaultMarket === selectedMarket.id}
                >
                  Set Default
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Market Details */}
      {selectedMarket && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Contract Specifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Contract Specs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Point Value:</span>
                <span className="font-mono">{formatCurrency(selectedMarket.pointValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tick Size:</span>
                <span className="font-mono">{selectedMarket.tickSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tick Value:</span>
                <span className="font-mono">{formatCurrency(selectedMarket.tickValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Exchange:</span>
                <Badge variant="outline">{selectedMarket.exchange}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Margin Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Margin Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Initial:</span>
                <span className="font-mono">{formatCurrency(selectedMarket.initialMargin)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Maintenance:</span>
                <span className="font-mono">{formatCurrency(selectedMarket.maintenanceMargin)}</span>
              </div>
              {selectedMarket.dayTradingMargin && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Day Trading:</span>
                  <span className="font-mono">{formatCurrency(selectedMarket.dayTradingMargin)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk Defaults */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Risk Defaults
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Stop Loss:</span>
                <span className="font-mono">{selectedMarket.riskDefaults.defaultStopLossPercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Take Profit:</span>
                <span className="font-mono">{selectedMarket.riskDefaults.defaultTakeProfitPercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Risk/Trade:</span>
                <span className="font-mono">{selectedMarket.riskDefaults.riskPerTradePercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Max Contracts:</span>
                <span className="font-mono">{selectedMarket.riskDefaults.maxPositionSize}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Market Presets */}
      <Card>
        <CardHeader>
          <CardTitle>Market Presets</CardTitle>
          <CardDescription>
            Quick setup configurations for different trading styles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {marketPresets.map((preset) => (
              <div
                key={preset.id}
                className="p-4 border rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{preset.name}</h3>
                  {preset.isDefault && (
                    <Badge variant="secondary">Default</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {preset.description}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{preset.contractSpecs.length} markets</span>
                  <span>•</span>
                  <span>Updated {new Date(preset.createdAt).toLocaleDateString()}</span>
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => applyMarketPreset(preset.id)}
                >
                  Apply Preset
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // All markets table
  const renderMarketsTable = () => (
    <Card>
      <CardHeader>
        <CardTitle>Available Markets</CardTitle>
        <CardDescription>
          Manage your trading markets and their configurations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Market</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Exchange</TableHead>
              <TableHead>Point Value</TableHead>
              <TableHead>Margin</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {marketConfigs.map((market) => (
              <TableRow key={market.id}>
                <TableCell>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{market.symbol}</Badge>
                      <span className="font-medium">{market.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {market.description}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {market.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {market.exchange}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono">
                  {formatCurrency(market.pointValue)}
                </TableCell>
                <TableCell className="font-mono">
                  {formatCurrency(market.initialMargin)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={market.isActive}
                      onCheckedChange={() => toggleMarketActive(market.id)}
                    />
                    {marketPreferences.preferredMarkets.includes(market.id) && (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    )}
                    {marketPreferences.defaultMarket === market.id && (
                      <Badge variant="default" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMarket(market.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingMarket(market.id)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  // Quick access markets
  const renderQuickAccess = () => {
    const quickAccessMarkets = marketConfigs.filter(m =>
      marketPreferences.quickAccessMarkets.includes(m.id)
    );

    return (
      <Card>
        <CardHeader>
          <CardTitle>Quick Access Markets</CardTitle>
          <CardDescription>
            Markets that appear in the trade form for quick selection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickAccessMarkets.map((market) => {
              const defaults = getTradeDefaults(market.id, 100000);

              return (
                <div
                  key={market.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{market.symbol}</Badge>
                      <span className="font-medium">{market.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuickAccessMarket(market.id)}
                    >
                      <EyeOff className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tick Value:</span>
                      <span className="font-mono">{formatCurrency(market.tickValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Commission:</span>
                      <span className="font-mono">{formatCurrency(defaults.commission || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Risk %:</span>
                      <span className="font-mono">{defaults.riskPercentage}%</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedMarket(market.id)}
                  >
                    Select Market
                  </Button>
                </div>
              );
            })}

            {/* Add quick access button */}
            <div className="p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center space-y-2">
              <Plus className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Add Market</span>
              <Select onValueChange={addQuickAccessMarket}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select market" />
                </SelectTrigger>
                <SelectContent>
                  {marketConfigs
                    .filter(m =>
                      m.isActive &&
                      !marketPreferences.quickAccessMarkets.includes(m.id)
                    )
                    .map((market) => (
                      <SelectItem key={market.id} value={market.id}>
                        {market.symbol} - {market.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Market Configuration</h2>
        <p className="text-muted-foreground">
          Configure your trading markets and set up smart defaults for ES, NQ, and other instruments
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="markets">All Markets</TabsTrigger>
          <TabsTrigger value="quick-access">Quick Access</TabsTrigger>
          <TabsTrigger value="presets">Presets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {renderMarketOverview()}
        </TabsContent>

        <TabsContent value="markets">
          {renderMarketsTable()}
        </TabsContent>

        <TabsContent value="quick-access">
          {renderQuickAccess()}
        </TabsContent>

        <TabsContent value="presets">
          <Card>
            <CardHeader>
              <CardTitle>Market Presets</CardTitle>
              <CardDescription>
                Create and manage market configuration presets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Preset management functionality will be implemented here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}