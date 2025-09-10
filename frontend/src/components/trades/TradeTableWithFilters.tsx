import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List, Settings2 } from 'lucide-react';
import { Trade, TradeFilters, FilterPreset } from '@/types';
import { useTradeStore } from '@/store/tradeStore';
import { AdvancedFilters } from '@/components/filters';
import { getActiveFiltersCount } from '@/utils/filterHelpers';
import TradeTable from './TradeTable';
import { cn } from '@/lib/utils';

interface TradeTableWithFiltersProps {
  onView?: (trade: Trade) => void;
  onEdit?: (trade: Trade) => void;
  onDelete?: (trade: Trade) => void;
  className?: string;
  showExport?: boolean;
  exportTitle?: string;
  showFilters?: boolean;
  showPresets?: boolean;
  defaultFiltersOpen?: boolean;
}

type ViewMode = 'table' | 'grid';

export function TradeTableWithFilters({
  onView,
  onEdit,
  onDelete,
  className,
  showExport = true,
  exportTitle = "Export Trades",
  showFilters = true,
  showPresets = true,
  defaultFiltersOpen = false
}: TradeTableWithFiltersProps) {
  const {
    trades,
    filters,
    loading,
    getFilteredTrades,
    getSortedTrades,
    setFilters,
    clearFilters,
    customPresets,
    savePreset,
    deletePreset,
    loadCustomPresets
  } = useTradeStore();

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [isMobile, setIsMobile] = useState(false);

  // Load custom presets on mount
  useEffect(() => {
    loadCustomPresets();
  }, [loadCustomPresets]);

  // Handle responsive view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const filteredTrades = getSortedTrades(getFilteredTrades());
  const activeFiltersCount = getActiveFiltersCount(filters);
  const hasActiveFilters = activeFiltersCount > 0;

  const handleFiltersChange = (newFilters: TradeFilters) => {
    // Update filters in the store
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== filters[key as keyof TradeFilters]) {
        setFilters({ [key]: value });
      }
    });
  };

  const handleSavePreset = (preset: Omit<FilterPreset, 'id'>) => {
    savePreset(preset);
  };

  const handleDeletePreset = (presetId: string) => {
    deletePreset(presetId);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with View Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            Trade History
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {filteredTrades.length} of {trades.length}
              </Badge>
            )}
          </h2>
          
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border p-1">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-8 px-3"
            >
              <List className="h-4 w-4 mr-1" />
              Table
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 px-3"
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Grid
            </Button>
          </div>

          <Button variant="outline" size="sm">
            <Settings2 className="h-4 w-4 mr-1" />
            Columns
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <>
          <AdvancedFilters
            filters={filters}
            trades={trades}
            onFiltersChange={handleFiltersChange}
            onClearFilters={clearFilters}
            resultCount={filteredTrades.length}
            customPresets={customPresets}
            onSavePreset={handleSavePreset}
            onDeletePreset={handleDeletePreset}
            showPresets={showPresets}
            defaultOpen={defaultFiltersOpen}
            mobile={isMobile}
          />
          
          <Separator />
        </>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {filteredTrades.length} of {trades.length} trades
          {hasActiveFilters && (
            <span className="ml-2">
              ({activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} applied)
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <span>Total P&L: {/* Calculate total */}</span>
          <span>Win Rate: {/* Calculate win rate */}%</span>
        </div>
      </div>

      {/* Trade Table */}
      {viewMode === 'table' && (
        <TradeTable
          trades={filteredTrades}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          loading={loading}
          showExport={showExport}
          exportTitle={exportTitle}
        />
      )}

      {/* Grid View - Future Implementation */}
      {viewMode === 'grid' && (
        <Card>
          <div className="p-8 text-center text-muted-foreground">
            <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Grid View Coming Soon</h3>
            <p>Grid view for trades is under development. Please use table view for now.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setViewMode('table')}
            >
              Switch to Table View
            </Button>
          </div>
        </Card>
      )}

      {/* Search Results Highlight */}
      {filters.searchTerm && (
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          Search results for "{filters.searchTerm}" - {filteredTrades.length} matches found
        </div>
      )}

      {/* Performance Metrics */}
      {filteredTrades.length > 0 && hasActiveFilters && (
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">Filtered Results Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Total Trades</div>
              <div className="font-medium">{filteredTrades.length}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Winning Trades</div>
              <div className="font-medium text-green-600">
                {filteredTrades.filter(t => t.pnl > 0).length}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Losing Trades</div>
              <div className="font-medium text-red-600">
                {filteredTrades.filter(t => t.pnl < 0).length}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Total P&L</div>
              <div className={cn(
                "font-medium",
                filteredTrades.reduce((acc, t) => acc + t.pnl, 0) >= 0 
                  ? "text-green-600" 
                  : "text-red-600"
              )}>
                ${filteredTrades.reduce((acc, t) => acc + t.pnl, 0).toFixed(2)}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default TradeTableWithFilters;