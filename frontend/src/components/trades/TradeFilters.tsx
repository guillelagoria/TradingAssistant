import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TradeFilters as TradeFiltersType, 
  TradeDirection, 
  TradeResult, 
  Strategy, 
  TradeStatus 
} from '@/types';
import { useTradeStore } from '@/store/tradeStore';

interface TradeFiltersProps {
  onFiltersChange?: (filters: TradeFiltersType) => void;
  className?: string;
}

function TradeFilters({ onFiltersChange, className }: TradeFiltersProps) {
  const { filters, setFilters, clearFilters } = useTradeStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof TradeFiltersType, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters({ [key]: value });
    onFiltersChange?.(newFilters);
  };

  const handleClearFilters = () => {
    clearFilters();
    onFiltersChange?.({});
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== null && value !== ''
    ).length;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-base">Filters</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-8 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2 text-xs"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Always visible filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Symbol Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Symbol</label>
            <Input
              placeholder="Search symbols..."
              value={filters.symbol || ''}
              onChange={(e) => handleFilterChange('symbol', e.target.value)}
              className="h-8"
            />
          </div>

          {/* Direction Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Direction</label>
            <Select
              value={filters.direction || ''}
              onValueChange={(value) => 
                handleFilterChange('direction', value || undefined)
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="All directions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All directions</SelectItem>
                <SelectItem value={TradeDirection.LONG}>Long</SelectItem>
                <SelectItem value={TradeDirection.SHORT}>Short</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Result Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Result</label>
            <Select
              value={filters.result || ''}
              onValueChange={(value) => 
                handleFilterChange('result', value || undefined)
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="All results" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All results</SelectItem>
                <SelectItem value={TradeResult.WIN}>Win</SelectItem>
                <SelectItem value={TradeResult.LOSS}>Loss</SelectItem>
                <SelectItem value={TradeResult.BREAKEVEN}>Breakeven</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Expandable filters */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strategy Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Strategy</label>
                <Select
                  value={filters.strategy || ''}
                  onValueChange={(value) => 
                    handleFilterChange('strategy', value || undefined)
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="All strategies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All strategies</SelectItem>
                    <SelectItem value={Strategy.SCALPING}>Scalping</SelectItem>
                    <SelectItem value={Strategy.DAY_TRADING}>Day Trading</SelectItem>
                    <SelectItem value={Strategy.SWING}>Swing</SelectItem>
                    <SelectItem value={Strategy.POSITION}>Position</SelectItem>
                    <SelectItem value={Strategy.CUSTOM}>Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Timeframe Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Timeframe</label>
                <Select
                  value={filters.timeframe || ''}
                  onValueChange={(value) => 
                    handleFilterChange('timeframe', value || undefined)
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="All timeframes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All timeframes</SelectItem>
                    <SelectItem value="1m">1 Minute</SelectItem>
                    <SelectItem value="5m">5 Minutes</SelectItem>
                    <SelectItem value="15m">15 Minutes</SelectItem>
                    <SelectItem value="30m">30 Minutes</SelectItem>
                    <SelectItem value="1h">1 Hour</SelectItem>
                    <SelectItem value="4h">4 Hours</SelectItem>
                    <SelectItem value="1d">1 Day</SelectItem>
                    <SelectItem value="1w">1 Week</SelectItem>
                    <SelectItem value="1M">1 Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">From Date</label>
                <div className="relative">
                  <Input
                    type="date"
                    value={filters.dateFrom ? format(filters.dateFrom, 'yyyy-MM-dd') : ''}
                    onChange={(e) => 
                      handleFilterChange('dateFrom', e.target.value ? new Date(e.target.value) : undefined)
                    }
                    className="h-8"
                  />
                  <CalendarIcon className="absolute right-3 top-2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <div className="relative">
                  <Input
                    type="date"
                    value={filters.dateTo ? format(filters.dateTo, 'yyyy-MM-dd') : ''}
                    onChange={(e) => 
                      handleFilterChange('dateTo', e.target.value ? new Date(e.target.value) : undefined)
                    }
                    className="h-8"
                  />
                  <CalendarIcon className="absolute right-3 top-2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* P&L Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Min P&L ($)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={filters.pnlMin ?? ''}
                  onChange={(e) => 
                    handleFilterChange('pnlMin', e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                  className="h-8"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Max P&L ($)</label>
                <Input
                  type="number"
                  placeholder="1000.00"
                  value={filters.pnlMax ?? ''}
                  onChange={(e) => 
                    handleFilterChange('pnlMax', e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                  className="h-8"
                />
              </div>
            </div>

            {/* Quick Filter Buttons */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Filters</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                    handleFilterChange('dateFrom', weekAgo);
                    handleFilterChange('dateTo', today);
                  }}
                  className="h-7 text-xs"
                >
                  Last 7 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                    handleFilterChange('dateFrom', monthAgo);
                    handleFilterChange('dateTo', today);
                  }}
                  className="h-7 text-xs"
                >
                  Last 30 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleFilterChange('result', TradeResult.WIN);
                  }}
                  className="h-7 text-xs"
                >
                  Winning trades
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleFilterChange('result', TradeResult.LOSS);
                  }}
                  className="h-7 text-xs"
                >
                  Losing trades
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {activeFiltersCount > 0 && (
          <div className="pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              {filters.symbol && (
                <Badge variant="outline" className="text-xs">
                  Symbol: {filters.symbol}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFilterChange('symbol', undefined)}
                    className="h-auto p-0 ml-1 text-xs"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filters.direction && (
                <Badge variant="outline" className="text-xs">
                  Direction: {filters.direction}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFilterChange('direction', undefined)}
                    className="h-auto p-0 ml-1 text-xs"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filters.result && (
                <Badge variant="outline" className="text-xs">
                  Result: {filters.result}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFilterChange('result', undefined)}
                    className="h-auto p-0 ml-1 text-xs"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filters.strategy && (
                <Badge variant="outline" className="text-xs">
                  Strategy: {filters.strategy}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFilterChange('strategy', undefined)}
                    className="h-auto p-0 ml-1 text-xs"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {(filters.dateFrom || filters.dateTo) && (
                <Badge variant="outline" className="text-xs">
                  Date: {filters.dateFrom ? format(filters.dateFrom, 'MMM dd') : '...'} - {filters.dateTo ? format(filters.dateTo, 'MMM dd') : '...'}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleFilterChange('dateFrom', undefined);
                      handleFilterChange('dateTo', undefined);
                    }}
                    className="h-auto p-0 ml-1 text-xs"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TradeFilters;