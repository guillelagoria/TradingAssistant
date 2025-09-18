import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  Filter,
  X,
  Zap,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTradeStore } from '@/store/tradeStore';
import {
  TradeDirection,
  TradeResult,
  Strategy,
  QuickFilterType,
  TradeFilters
} from '@/types';
import DateRangePicker from './DateRangePicker';
import MarketCategoryFilter, { MarketCategory } from './MarketCategoryFilter';

interface ModernFilterSystemProps {
  className?: string;
}

interface QuickFilterConfig {
  id: QuickFilterType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  getFilters: () => Partial<TradeFilters>;
}

const QUICK_FILTERS: QuickFilterConfig[] = [
  {
    id: QuickFilterType.WINNING_TRADES,
    label: 'Winners',
    icon: TrendingUp,
    color: 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100',
    description: 'Profitable trades only',
    getFilters: () => ({ result: TradeResult.WIN })
  },
  {
    id: QuickFilterType.LOSING_TRADES,
    label: 'Losers',
    icon: TrendingDown,
    color: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100',
    description: 'Loss-making trades only',
    getFilters: () => ({ result: TradeResult.LOSS })
  },
  {
    id: QuickFilterType.HIGH_R_MULTIPLE,
    label: 'High R:R',
    icon: Target,
    color: 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100',
    description: 'R-Multiple > 2',
    getFilters: () => ({ rMultipleMin: 2 })
  },
  {
    id: QuickFilterType.SHORT_TERM_TRADES,
    label: 'Scalping',
    icon: Zap,
    color: 'text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100',
    description: 'Short-term trades < 1 hour',
    getFilters: () => ({ holdingPeriodMax: 60 })
  },
  {
    id: QuickFilterType.LARGE_POSITIONS,
    label: 'Large Size',
    icon: DollarSign,
    color: 'text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100',
    description: 'Large position sizes',
    getFilters: () => ({ positionSizeMin: 1000 })
  }
];

function ModernFilterSystem({ className }: ModernFilterSystemProps) {
  const { filters, setFilters, clearFilters, trades } = useTradeStore();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Get unique symbols for market category filtering
  const uniqueSymbols = useMemo(() => {
    return Array.from(new Set(trades.map(trade => trade.symbol)));
  }, [trades]);

  // Market category state derived from filters
  const selectedMarketCategories = useMemo(() => {
    // This would be implemented based on your filter logic
    // For now, return empty array as placeholder
    return [] as MarketCategory[];
  }, [filters]);

  const handleFilterChange = (key: keyof TradeFilters, value: any) => {
    setFilters({ [key]: value });
  };

  const handleDateRangeChange = (range?: { from?: Date; to?: Date }) => {
    if (range?.from || range?.to) {
      setFilters({
        dateFrom: range?.from,
        dateTo: range?.to
      });
    } else {
      // Clear date filters
      const newFilters = { ...filters };
      delete newFilters.dateFrom;
      delete newFilters.dateTo;
      setFilters(newFilters);
    }
  };

  const handleMarketCategoriesChange = (categories: MarketCategory[]) => {
    // Implement market category filtering logic
    // This would update filters based on selected categories
    console.log('Market categories changed:', categories);
  };

  const handleQuickFilter = (quickFilter: QuickFilterConfig) => {
    const quickFilters = quickFilter.getFilters();
    console.log('ModernFilterSystem: Quick filter clicked:', {
      filterId: quickFilter.id,
      filterLabel: quickFilter.label,
      generatedFilters: quickFilters,
      currentFilters: filters
    });
    setFilters(quickFilters);
    console.log('ModernFilterSystem: Filters after setFilters:', filters);
  };

  const clearFilter = (key: keyof TradeFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
  };

  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (value === undefined || value === null || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }).length;
  }, [filters]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-gradient-to-r from-background/80 to-background/60 backdrop-blur-sm",
        "border border-border/50 rounded-xl shadow-lg overflow-hidden",
        className
      )}
    >
      {/* Main Filters Row */}
      <div className="p-4 space-y-3">
        {/* Quick Filters */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Quick Filters</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_FILTERS.map((quickFilter) => {
              const Icon = quickFilter.icon;
              return (
                <Button
                  key={quickFilter.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickFilter(quickFilter)}
                  className={cn(
                    "h-8 gap-2 transition-all duration-200",
                    quickFilter.color
                  )}
                  title={quickFilter.description}
                >
                  <Icon className="h-3 w-3" />
                  {quickFilter.label}
                </Button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Standard Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Date Range */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Date Range</label>
            <DateRangePicker
              value={{ from: filters.dateFrom, to: filters.dateTo }}
              onChange={handleDateRangeChange}
              className="w-full"
            />
          </div>

          {/* Market Categories */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Markets</label>
            <MarketCategoryFilter
              selectedCategories={selectedMarketCategories}
              onCategoriesChange={handleMarketCategoriesChange}
              symbols={uniqueSymbols}
              className="w-full"
            />
          </div>

          {/* Direction */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Direction</label>
            <Select
              value={filters.direction || 'all'}
              onValueChange={(value) =>
                handleFilterChange('direction', value === 'all' ? undefined : value)
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All directions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All directions</SelectItem>
                <SelectItem value={TradeDirection.LONG}>Long</SelectItem>
                <SelectItem value={TradeDirection.SHORT}>Short</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Result */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Result</label>
            <Select
              value={filters.result || 'all'}
              onValueChange={(value) =>
                handleFilterChange('result', value === 'all' ? undefined : value)
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All results" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All results</SelectItem>
                <SelectItem value={TradeResult.WIN}>Win</SelectItem>
                <SelectItem value={TradeResult.LOSS}>Loss</SelectItem>
                <SelectItem value={TradeResult.BREAKEVEN}>Breakeven</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between px-4 py-2 rounded-none border-t border-border/30 hover:bg-accent/50"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Advanced Filters</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform duration-200",
              isAdvancedOpen && "rotate-180"
            )} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 border-t border-border/30 bg-muted/20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Strategy */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Strategy</label>
                <Select
                  value={filters.strategy || 'all'}
                  onValueChange={(value) =>
                    handleFilterChange('strategy', value === 'all' ? undefined : value)
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All strategies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All strategies</SelectItem>
                    <SelectItem value={Strategy.SCALPING}>Scalping</SelectItem>
                    <SelectItem value={Strategy.DAY_TRADING}>Day Trading</SelectItem>
                    <SelectItem value={Strategy.SWING}>Swing</SelectItem>
                    <SelectItem value={Strategy.POSITION}>Position</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Symbol Search */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Symbol</label>
                <Input
                  placeholder="Search symbols..."
                  value={filters.symbol || ''}
                  onChange={(e) => handleFilterChange('symbol', e.target.value)}
                  className="h-9"
                />
              </div>

              {/* Timeframe */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Timeframe</label>
                <Select
                  value={filters.timeframe || 'all'}
                  onValueChange={(value) =>
                    handleFilterChange('timeframe', value === 'all' ? undefined : value)
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All timeframes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All timeframes</SelectItem>
                    <SelectItem value="1m">1 Minute</SelectItem>
                    <SelectItem value="5m">5 Minutes</SelectItem>
                    <SelectItem value="15m">15 Minutes</SelectItem>
                    <SelectItem value="30m">30 Minutes</SelectItem>
                    <SelectItem value="1h">1 Hour</SelectItem>
                    <SelectItem value="4h">4 Hours</SelectItem>
                    <SelectItem value="1d">1 Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* P&L Range */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Min P&L ($)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={filters.pnlMin ?? ''}
                  onChange={(e) =>
                    handleFilterChange('pnlMin', e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                  className="h-9"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Max P&L ($)</label>
                <Input
                  type="number"
                  placeholder="1000.00"
                  value={filters.pnlMax ?? ''}
                  onChange={(e) =>
                    handleFilterChange('pnlMax', e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                  className="h-9"
                />
              </div>

              {/* R-Multiple Range */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Min R-Multiple</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={filters.rMultipleMin ?? ''}
                  onChange={(e) =>
                    handleFilterChange('rMultipleMin', e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                  className="h-9"
                />
              </div>
            </div>

            {/* Active Filters Summary */}
            {activeFiltersCount > 0 && (
              <div className="mt-4 pt-4 border-t border-border/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Active Filters ({activeFiltersCount})
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="h-7 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(filters).map(([key, value]) => {
                    if (value === undefined || value === null || value === '') return null;
                    if (Array.isArray(value) && value.length === 0) return null;

                    let displayValue = String(value);
                    if (value instanceof Date) {
                      displayValue = value.toLocaleDateString();
                    }

                    return (
                      <Badge
                        key={key}
                        variant="secondary"
                        className="text-xs bg-primary/10 text-primary border-primary/20"
                      >
                        {key}: {displayValue}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => clearFilter(key as keyof TradeFilters)}
                          className="h-auto p-0 ml-1 text-xs hover:bg-destructive/20"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}

export default ModernFilterSystem;