import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  TradeFilters,
  TradeCalendarView,
  TradeCalendarViewWithPopover,
  DayDetailPopover,
  CompactSearchBar,
  ModernFilterSystem
} from '@/components/trades';
import EnhancedTradeDetails from '@/components/trades/EnhancedTradeDetails';
import EnhancedTradeTable from '@/components/trades/EnhancedTradeTable';
import { AnimatedStatsCards } from '@/components/dashboard';
import { ConfirmDialog } from '@/components/shared';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import QuickTradeDialog from '@/components/trades/QuickTradeDialog';
import { useQuickTradeShortcuts } from '@/hooks/useQuickTradeShortcuts';
import { useTradeStore } from '@/store/tradeStore';
import { useActiveAccount } from '@/store/accountStore';
import { Trade } from '@/types';
import {
  Plus,
  Download,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  MoreHorizontal,
  Table,
  Calendar,
  Upload,
  Zap,
  Keyboard
} from 'lucide-react';

function TradeHistory() {
  const navigate = useNavigate();
  const activeAccount = useActiveAccount();
  const {
    trades,
    loading,
    error,
    fetchTrades,
    deleteTrade,
    bulkDeleteTrades,
    pagination,
    filters,
    stats,
    refreshTradesForAccount,
    getAllTradeIds
  } = useTradeStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [showTradeDetails, setShowTradeDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Calendar view state
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  // Quick Trade state
  const [quickTradeOpen, setQuickTradeOpen] = useState(false);
  const [quickTradeDirection, setQuickTradeDirection] = useState<'LONG' | 'SHORT' | undefined>();

  // Fetch trades on component mount or when active account changes
  useEffect(() => {

    if (activeAccount) {
      refreshTradesForAccount(activeAccount.id);
    } else {
    }
  }, [activeAccount, refreshTradesForAccount]);

  const handleOpenQuickTrade = (direction?: 'LONG' | 'SHORT') => {
    setQuickTradeDirection(direction);
    setQuickTradeOpen(true);
  };

  const handleCloseQuickTrade = (open: boolean) => {
    setQuickTradeOpen(open);
    if (!open) {
      setQuickTradeDirection(undefined);
    }
  };

  // Setup keyboard shortcuts
  useQuickTradeShortcuts({
    onOpenQuickTrade: handleOpenQuickTrade,
    enabled: true
  });

  const handleImportTrades = () => {
    navigate('/import');
  };

  const handleViewTrade = (trade: Trade) => {
    setSelectedTrade(trade);
    setShowTradeDetails(true);
  };

  const handleEditTrade = (trade: Trade) => {
    // Edit functionality can be added to Quick Trade Dialog in the future
    console.log('Edit trade:', trade);
  };

  const handleDeleteTrade = (trade: Trade) => {
    setTradeToDelete(trade);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTrade = async () => {
    if (tradeToDelete) {
      try {
        await deleteTrade(tradeToDelete.id);
        setShowDeleteConfirm(false);
        setTradeToDelete(null);
      } catch (error) {
      }
    }
  };

  const handleBulkDelete = () => {
    if (selectedTrades.length > 0) {
      setShowBulkDeleteConfirm(true);
    }
  };

  const confirmBulkDelete = async () => {
    try {
      await bulkDeleteTrades(selectedTrades);
      setSelectedTrades([]);
      setShowBulkDeleteConfirm(false);
    } catch (error) {
    }
  };

  const handleSelectAll = async (checked: boolean) => {
    if (checked) {
      // Get ALL trade IDs, not just visible ones
      const allTradeIds = await getAllTradeIds();
      setSelectedTrades(allTradeIds);
    } else {
      setSelectedTrades([]);
    }
  };

  const handleSelectTrade = (tradeId: string, checked: boolean) => {
    if (checked) {
      setSelectedTrades(prev => [...prev, tradeId]);
    } else {
      setSelectedTrades(prev => prev.filter(id => id !== tradeId));
    }
  };

  const handleExportCSV = () => {
    if (trades.length === 0) return;

    const headers = [
      'Symbol', 'Direction', 'Entry Date', 'Entry Price', 'Exit Date', 'Exit Price',
      'Quantity', 'P&L', 'P&L %', 'R-Multiple', 'Strategy', 'Notes'
    ];

    const csvData = trades.map(trade => [
      trade.symbol,
      trade.direction,
      new Date(trade.entryDate).toISOString().split('T')[0],
      trade.entryPrice,
      trade.exitDate ? new Date(trade.exitDate).toISOString().split('T')[0] : '',
      trade.exitPrice || '',
      trade.quantity,
      trade.pnl,
      trade.pnlPercentage,
      trade.rMultiple,
      trade.strategy,
      trade.notes || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trades-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calendar handlers
  const handleAddTradeForDate = (date: Date) => {
    navigate('/trades/new', { state: { date } });
  };

  const handleMonthChange = (newMonth: Date) => {
    setCalendarMonth(newMonth);
  };

  const filteredTrades = useMemo(() => {


    const result = trades.filter(trade => {
    // Apply search query first
    if (searchQuery !== '') {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        trade.symbol?.toLowerCase().includes(searchLower) ||
        trade.strategy?.toLowerCase().includes(searchLower) ||
        trade.notes?.toLowerCase().includes(searchLower) ||
        (trade.strategy === 'CUSTOM' && trade.customStrategy?.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;
    }

    // Apply filters from store
    if (filters) {
      // Direction filter
      if (filters.direction && trade.direction !== filters.direction) {
        return false;
      }

      // Result filter
      if (filters.result && trade.result !== filters.result) {
        return false;
      }

      // Strategy filter
      if (filters.strategy && trade.strategy !== filters.strategy) {
        return false;
      }

      // Timeframe filter
      if (filters.timeframe && trade.timeframe !== filters.timeframe) {
        return false;
      }

      // Symbol filter
      if (filters.symbol && !trade.symbol?.toLowerCase().includes(filters.symbol.toLowerCase())) {
        return false;
      }

      // Date range filters
      if (filters.dateFrom || filters.dateTo) {
        const tradeDate = new Date(trade.entryDate);
        if (filters.dateFrom && tradeDate < filters.dateFrom) {
          return false;
        }
        if (filters.dateTo && tradeDate > filters.dateTo) {
          return false;
        }
      }

      // P&L range filters
      if (filters.pnlMin !== undefined && trade.pnl < filters.pnlMin) {
        return false;
      }
      if (filters.pnlMax !== undefined && trade.pnl > filters.pnlMax) {
        return false;
      }

      // R-Multiple range filters
      if (filters.rMultipleMin !== undefined && trade.rMultiple < filters.rMultipleMin) {
        return false;
      }
      if (filters.rMultipleMax !== undefined && trade.rMultiple > filters.rMultipleMax) {
        return false;
      }

      // Position size filters
      if (filters.positionSizeMin !== undefined && (trade.positionSize || 0) < filters.positionSizeMin) {
        return false;
      }
      if (filters.positionSizeMax !== undefined && (trade.positionSize || 0) > filters.positionSizeMax) {
        return false;
      }

      // Holding period filters (calculate from entry/exit dates)
      if (filters.holdingPeriodMin !== undefined || filters.holdingPeriodMax !== undefined) {
        let holdingPeriodMinutes = 0;
        if (trade.exitDate) {
          const entryTime = new Date(trade.entryDate).getTime();
          const exitTime = new Date(trade.exitDate).getTime();
          holdingPeriodMinutes = (exitTime - entryTime) / (1000 * 60); // Convert to minutes
        }

        if (filters.holdingPeriodMin !== undefined && holdingPeriodMinutes < filters.holdingPeriodMin) {
          return false;
        }
        if (filters.holdingPeriodMax !== undefined && holdingPeriodMinutes > filters.holdingPeriodMax) {
          return false;
        }
      }
    }

    return true;
  });

    return result;
  }, [trades, searchQuery, filters]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Trade History</h1>
          <p className="text-muted-foreground">
            View and manage all your trading records.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              onClick={() => setViewMode('table')}
              size="sm"
              className="rounded-r-none border-0 flex-1 sm:flex-initial"
            >
              <Table className="h-4 w-4 mr-1" />
              <span className="hidden xs:inline">Table</span>
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              onClick={() => setViewMode('calendar')}
              size="sm"
              className="rounded-l-none border-0 flex-1 sm:flex-initial"
            >
              <Calendar className="h-4 w-4 mr-1" />
              <span className="hidden xs:inline">Calendar</span>
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={() => fetchTrades()}
            disabled={loading}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {/* Quick Trade and Import removed - already in sidebar */}
        </div>
      </div>

      {/* Stats Cards - Inline context for quick overview */}
      <AnimatedStatsCards className="mb-6" />

      {/* Compact Search and Filter System */}
      <CompactSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTrades={selectedTrades}
        onBulkDelete={handleBulkDelete}
        onExportCSV={handleExportCSV}
        onToggleFilters={() => setShowFilters(!showFilters)}
        showFilters={showFilters}
      />

      {/* Modern Filter System */}
      {showFilters && (
        <ModernFilterSystem />
      )}

      {/* Selection Controls - Only show in table view */}
      {viewMode === 'table' && trades.length > 0 && (
        <div className="flex items-center gap-4 px-4 py-2 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectedTrades.length === trades.length && trades.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              Select all trades
            </label>
          </div>
          <div className="text-sm text-muted-foreground">
            {selectedTrades.length} of {trades.length} trades selected
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <p>Error loading trades: {error}</p>
              <Button onClick={() => fetchTrades()} className="mt-2" variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trades Display - Table or Calendar */}
      {viewMode === 'table' ? (
        <EnhancedTradeTable
          trades={filteredTrades}
          onView={handleViewTrade}
          onEdit={handleEditTrade}
          onDelete={handleDeleteTrade}
          loading={loading}
          showSelection={true}
          selectedTrades={selectedTrades}
          onSelectTrade={handleSelectTrade}
          onSelectAll={handleSelectAll}
        />
      ) : (
        <TradeCalendarViewWithPopover
          trades={filteredTrades}
          currentMonth={calendarMonth}
          onMonthChange={handleMonthChange}
          onViewTrade={handleViewTrade}
          onEditTrade={handleEditTrade}
          onDeleteTrade={handleDeleteTrade}
          onAddTrade={handleAddTradeForDate}
          loading={loading}
        />
      )}

      {/* Pagination - Only show in table view */}
      {viewMode === 'table' && pagination.totalPages > 1 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} trades
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchTrades(filters, pagination.page - 1)}
                  disabled={pagination.page <= 1 || loading}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchTrades(filters, pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trade Details Modal */}
      <EnhancedTradeDetails
        trade={selectedTrade}
        open={showTradeDetails}
        onOpenChange={setShowTradeDetails}
        onEdit={handleEditTrade}
      />

      {/* Delete Confirmation Dialogs */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Trade"
        description={`Are you sure you want to delete the trade for ${tradeToDelete?.symbol}? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={confirmDeleteTrade}
        variant="destructive"
      />

      <ConfirmDialog
        open={showBulkDeleteConfirm}
        onOpenChange={setShowBulkDeleteConfirm}
        title="Delete Multiple Trades"
        description={`Are you sure you want to delete ${selectedTrades.length} selected trades? This action cannot be undone.`}
        confirmText="Delete All"
        onConfirm={confirmBulkDelete}
        variant="destructive"
      />

      {/* Quick Trade Dialog */}
      <QuickTradeDialog
        open={quickTradeOpen}
        onOpenChange={handleCloseQuickTrade}
        prefilledDirection={quickTradeDirection}
      />
    </div>
  );
}

export default TradeHistory;