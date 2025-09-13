import { useState, useEffect } from 'react';
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
import { TradeTable, TradeFilters, TradeDetails } from '@/components/trades';
import { StatsCards } from '@/components/dashboard';
import { ConfirmDialog } from '@/components/shared';
import { useTradeStore } from '@/store/tradeStore';
import { Trade } from '@/types';
import { 
  Plus, 
  Download, 
  Search,
  Filter,
  Trash2,
  RefreshCw,
  MoreHorizontal
} from 'lucide-react';

function TradeHistory() {
  const navigate = useNavigate();
  const { 
    trades, 
    loading, 
    error, 
    fetchTrades, 
    deleteTrade,
    pagination,
    filters,
    stats
  } = useTradeStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [showTradeDetails, setShowTradeDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Fetch trades on component mount
  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const handleAddTrade = () => {
    navigate('/trades/new');
  };

  const handleViewTrade = (trade: Trade) => {
    setSelectedTrade(trade);
    setShowTradeDetails(true);
  };

  const handleEditTrade = (trade: Trade) => {
    navigate(`/trades/${trade.id}/edit`);
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
        console.error('Failed to delete trade:', error);
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
      await Promise.all(selectedTrades.map(id => deleteTrade(id)));
      setSelectedTrades([]);
      setShowBulkDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete trades:', error);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTrades(trades.map(trade => trade.id));
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

  const filteredTrades = trades.filter(trade =>
    searchQuery === '' || 
    trade.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trade.strategy.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (trade.notes && trade.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => fetchTrades()}
            disabled={loading}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleAddTrade} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Trade
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Search and Actions Bar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search trades..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                size="sm"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {Object.keys(filters).length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {Object.keys(filters).length}
                  </Badge>
                )}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {selectedTrades.length > 0 && (
                <>
                  <Badge variant="outline">
                    {selectedTrades.length} selected
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={handleExportCSV}
                disabled={trades.length === 0}
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Filters */}
        {showFilters && (
          <CardContent className="pt-0">
            <TradeFilters />
          </CardContent>
        )}
      </Card>

      {/* Selection Controls */}
      {trades.length > 0 && (
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

      {/* Trades Table */}
      <TradeTable
        trades={filteredTrades}
        onView={handleViewTrade}
        onEdit={handleEditTrade}
        onDelete={handleDeleteTrade}
        loading={loading}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
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
      <TradeDetails
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
    </div>
  );
}

export default TradeHistory;