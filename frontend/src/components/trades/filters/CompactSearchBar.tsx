import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  Download,
  Trash2,
  X,
  Settings,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTradeStore } from '@/store/tradeStore';
import { TradeFilters } from '@/types';

interface CompactSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTrades: string[];
  onBulkDelete: () => void;
  onExportCSV: () => void;
  onToggleFilters: () => void;
  showFilters: boolean;
  className?: string;
}

function CompactSearchBar({
  searchQuery,
  onSearchChange,
  selectedTrades,
  onBulkDelete,
  onExportCSV,
  onToggleFilters,
  showFilters,
  className
}: CompactSearchBarProps) {
  const { filters, trades } = useTradeStore();
  const [isFocused, setIsFocused] = useState(false);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    if (!filters) return 0;
    return Object.entries(filters).filter(([key, value]) => {
      if (value === undefined || value === null || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }).length;
  }, [filters]);

  // Get readable filter summary
  const filterSummary = useMemo(() => {
    const summaryItems: string[] = [];

    if (filters?.direction) summaryItems.push(filters.direction);
    if (filters?.result) summaryItems.push(filters.result.toLowerCase());
    if (filters?.strategy) summaryItems.push(filters.strategy.toLowerCase().replace('_', ' '));
    if (filters?.dateFrom || filters?.dateTo) summaryItems.push('date range');
    if (filters?.pnlMin !== undefined || filters?.pnlMax !== undefined) summaryItems.push('P&L range');

    return summaryItems;
  }, [filters]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-gradient-to-r from-background/80 to-background/60 backdrop-blur-sm",
        "border border-border/50 rounded-xl shadow-lg",
        "p-3",
        className
      )}
    >
      {/* Main Search Row */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className={cn(
            "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors",
            isFocused ? "text-primary" : "text-muted-foreground"
          )} />
          <Input
            placeholder="Search trades, symbols, strategies..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              "pl-10 pr-4 h-9 bg-background/50 border-border/50",
              "focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
              "transition-all duration-200"
            )}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filters Toggle */}
        <Button
          variant={showFilters ? "default" : "outline"}
          onClick={onToggleFilters}
          size="sm"
          className={cn(
            "h-9 gap-2 transition-all duration-200",
            showFilters && "bg-primary/10 border-primary/30"
          )}
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          <AnimatePresence>
            {activeFiltersCount > 0 && (
              <motion.div
                key="filter-badge"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <Badge
                  variant="secondary"
                  className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 ml-1"
                >
                  {activeFiltersCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
          <ChevronDown className={cn(
            "h-3 w-3 transition-transform duration-200",
            showFilters && "rotate-180"
          )} />
        </Button>

        {/* Selected Trades Actions */}
        <AnimatePresence>
          {selectedTrades.length > 0 && (
            <motion.div
              key="selected-actions"
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              className="flex items-center gap-2"
            >
              <Badge variant="outline" className="text-xs">
                {selectedTrades.length} selected
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkDelete}
                className="h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Export Button */}
        <Button
          variant="outline"
          onClick={onExportCSV}
          disabled={trades.length === 0}
          size="sm"
          className="h-9 gap-2"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>

      {/* Active Filters Summary */}
      <AnimatePresence>
        {activeFiltersCount > 0 && (
          <motion.div
            key="filters-summary"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 pt-3 border-t border-border/30"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium">
                Active filters:
              </span>
              {filterSummary.map((filter, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs bg-primary/10 text-primary border-primary/20"
                >
                  {filter}
                </Badge>
              ))}
              <Badge
                variant="outline"
                className="text-xs text-muted-foreground"
              >
                {trades.length} result{trades.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default CompactSearchBar;