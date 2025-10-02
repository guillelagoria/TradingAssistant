import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState, ImagePreviewTooltip, ImageLightboxModal } from '@/components/shared';
import { Trade, TradeSortConfig, TradeDirection, TradeResult } from '@/types';
import { useTradeStore } from '@/store/tradeStore';
import { useActiveAccount } from '@/store/accountStore';
import { cn } from '@/lib/utils';
import {
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Eye,
  Trash2,
  TrendingUp,
  TrendingDown,
  Download,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { ExportDialog } from '../export';
import UnifiedTradeEditModal from './UnifiedTradeEditModal';

interface TradeTableProps {
  trades?: Trade[];
  onView?: (trade: Trade) => void;
  onEdit?: (trade: Trade) => void;
  onDelete?: (trade: Trade) => void;
  loading?: boolean;
  showExport?: boolean;
  exportTitle?: string;
  // Selection props
  selectedTrades?: string[];
  onSelectTrade?: (tradeId: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  showSelection?: boolean;
}

function TradeTable({
  trades: propTrades,
  onView,
  onEdit,
  onDelete,
  loading = false,
  showExport = true,
  exportTitle = "Export Trades",
  selectedTrades = [],
  onSelectTrade,
  onSelectAll,
  showSelection = false
}: TradeTableProps) {
  const {
    trades: storeTrades,
    sortConfig,
    setSortConfig,
    getFilteredTrades,
    getSortedTrades,
    refreshTradesForAccount
  } = useTradeStore();

  const activeAccount = useActiveAccount();
  const trades = propTrades || getSortedTrades(getFilteredTrades());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Unified Edit Modal State
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Image Lightbox State
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');

  // Handle window resize for responsive design
  useState(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  const handleSort = (field: keyof Trade) => {
    const newDirection = 
      sortConfig.field === field && sortConfig.direction === 'asc' 
        ? 'desc' 
        : 'asc';
    
    setSortConfig({ field, direction: newDirection });
  };

  const getSortIcon = (field: keyof Trade) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const getResultBadge = (result?: TradeResult, pnl?: number) => {
    if (!result) return null;
    
    const variants = {
      [TradeResult.WIN]: 'default',
      [TradeResult.LOSS]: 'destructive',
      [TradeResult.BREAKEVEN]: 'secondary'
    } as const;

    return (
      <Badge variant={variants[result]}>
        {result.toLowerCase()}
      </Badge>
    );
  };

  const getDirectionIcon = (direction: TradeDirection) => {
    return direction === TradeDirection.LONG
      ? <TrendingUp className="h-4 w-4 text-profit" />
      : <TrendingDown className="h-4 w-4 text-loss" />;
  };

  // Professional currency formatting - always 2 decimals
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Professional percentage formatting
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Smart modal selection logic
  // Unified edit handler - ALL trades now use the unified modal
  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
    setIsEditModalOpen(true);
  };

  const handleImageClick = (imageUrl: string, tradeSymbol: string) => {
    setLightboxImageUrl(imageUrl);
    setLightboxTitle(`${tradeSymbol} Trade Screenshot`);
  };

  const closeLightbox = () => {
    setLightboxImageUrl(null);
    setLightboxTitle('');
  };

  // Unified modal close handler
  const handleEditModalClose = (open: boolean) => {
    setIsEditModalOpen(open);
    if (!open) {
      setEditingTrade(null);
      // Clear any error states when modal closes
      setUpdateError(null);
    }
  };

  // Success feedback effect - auto-hide after 3 seconds
  useEffect(() => {
    if (updateSuccess) {
      const timer = setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [updateSuccess]);

  // Error feedback effect - auto-hide after 5 seconds
  useEffect(() => {
    if (updateError) {
      const timer = setTimeout(() => {
        setUpdateError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [updateError]);

  // Listen for successful trade updates and refresh data
  useEffect(() => {
    const handleTradeUpdated = async () => {
      try {
        setUpdateSuccess(true);
        // Refresh trades data to get updated stats
        if (activeAccount) {
          await refreshTradesForAccount(activeAccount.id);
        }
      } catch (error) {
        setUpdateError('Failed to refresh trade data after update');
      }
    };

    // Check if modal was just closed after successful update
    if (!isEditModalOpen && editingTrade && updateSuccess) {
      handleTradeUpdated();
    }
  }, [isEditModalOpen, editingTrade, activeAccount, refreshTradesForAccount, updateSuccess]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <EmptyState
        title="No trades found"
        description="Start by recording your first trade to see it here."
        actionLabel="Add Trade"
        onAction={() => window.location.href = '/trades/new'}
      />
    );
  }

  // Export functionality
  const renderExportButton = () => {
    if (!showExport) return null;
    
    return (
      <ExportDialog 
        trades={trades}
        trigger={
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        }
      />
    );
  };

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Export button for mobile */}
        {showExport && (
          <div className="flex justify-end">
            {renderExportButton()}
          </div>
        )}
        {trades.map((trade) => (
          <Card key={trade.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {showSelection && onSelectTrade && (
                  <Checkbox
                    checked={selectedTrades.includes(trade.id)}
                    onCheckedChange={(checked) => onSelectTrade(trade.id, checked as boolean)}
                  />
                )}
                {getDirectionIcon(trade.direction)}
                <span className="font-semibold">{trade.symbol}</span>
                {getResultBadge(trade.result, trade.netPnl)}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView?.(trade)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEditTrade(trade)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(trade)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Entry:</span>
                <div className="font-mono font-semibold tabular-nums">{formatCurrency(trade.entryPrice)}</div>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Exit:</span>
                <div className="font-mono font-semibold tabular-nums">
                  {trade.exitPrice ? formatCurrency(trade.exitPrice) : 'Open'}
                </div>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Net P&L:</span>
                <div className={cn(
                  "font-mono font-bold tabular-nums",
                  trade.netPnl > 0 ? "text-profit" : trade.netPnl < 0 ? "text-loss" : "text-muted-foreground"
                )}>
                  {formatCurrency(trade.netPnl)}
                </div>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">MAE/MFE:</span>
                <div className="font-mono font-medium tabular-nums text-sm">
                  <span className="text-loss">
                    {trade.maxAdversePrice ? formatCurrency(trade.maxAdversePrice) : '-'}
                  </span>
                  {' / '}
                  <span className="text-profit">
                    {trade.maxFavorablePrice ? formatCurrency(trade.maxFavorablePrice) : '-'}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Date:</span>
                <div className="font-medium">
                  {format(new Date(trade.entryDate), 'MMM dd, yyyy')}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Desktop Table View
  const desktopContent = (
    <Card>
      {/* Table header with export button */}
      {showExport && (
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{exportTitle}</h3>
          {renderExportButton()}
        </div>
      )}
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-b-2">
              {showSelection && (
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedTrades.length === trades.length && trades.length > 0}
                    onCheckedChange={onSelectAll}
                  />
                </TableHead>
              )}
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('symbol')}
                  className="h-8 p-0 font-semibold uppercase text-xs tracking-wider hover:text-foreground"
                >
                  Symbol
                  {getSortIcon('symbol')}
                </Button>
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Status</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Direction</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('entryDate')}
                  className="h-8 p-0 font-semibold uppercase text-xs tracking-wider hover:text-foreground"
                >
                  Entry Date
                  {getSortIcon('entryDate')}
                </Button>
              </TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('netPnl')}
                  className="h-8 p-0 font-semibold uppercase text-xs tracking-wider hover:text-foreground"
                >
                  Net P&L
                  {getSortIcon('netPnl')}
                </Button>
              </TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">P&L %</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('maxAdversePrice')}
                  className="h-8 p-0 font-semibold uppercase text-xs tracking-wider hover:text-foreground"
                >
                  MAE
                  {getSortIcon('maxAdversePrice')}
                </Button>
              </TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('maxFavorablePrice')}
                  className="h-8 p-0 font-semibold uppercase text-xs tracking-wider hover:text-foreground"
                >
                  MFE
                  {getSortIcon('maxFavorablePrice')}
                </Button>
              </TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('entryPrice')}
                  className="h-8 p-0 font-semibold uppercase text-xs tracking-wider hover:text-foreground"
                >
                  Entry
                  {getSortIcon('entryPrice')}
                </Button>
              </TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">Exit</TableHead>
              <TableHead className="w-[70px] text-xs uppercase tracking-wider font-semibold text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade) => (
              <TableRow key={trade.id} className="hover:bg-muted/30 transition-colors border-b border-border/50">
                {showSelection && (
                  <TableCell>
                    <Checkbox
                      checked={selectedTrades.includes(trade.id)}
                      onCheckedChange={(checked) => onSelectTrade?.(trade.id, checked as boolean)}
                    />
                  </TableCell>
                )}
                <TableCell className="font-semibold font-mono">
                  <div className="flex items-center gap-2">
                    {getDirectionIcon(trade.direction)}
                    <span className="tracking-tight">{trade.symbol}</span>
                    {trade.imageUrl && (
                      <ImagePreviewTooltip
                        imageUrl={trade.imageUrl}
                        onImageClick={() => handleImageClick(trade.imageUrl!, trade.symbol)}
                        size="sm"
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {getResultBadge(trade.result, trade.netPnl)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={trade.direction === TradeDirection.LONG ? "default" : "secondary"}
                    className="font-mono text-xs"
                  >
                    {trade.direction}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {format(new Date(trade.entryDate), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-mono font-bold tabular-nums text-sm",
                  trade.netPnl > 0 ? "text-profit" : trade.netPnl < 0 ? "text-loss" : "text-muted-foreground"
                )}>
                  {formatCurrency(trade.netPnl)}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-mono font-semibold tabular-nums text-sm",
                  trade.netPnl > 0 ? "text-profit" : trade.netPnl < 0 ? "text-loss" : "text-muted-foreground"
                )}>
                  {formatPercentage(
                    trade.entryPrice && trade.entryPrice > 0
                      ? (trade.netPnl / (trade.entryPrice * trade.quantity)) * 100
                      : 0
                  )}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums text-sm text-loss">
                  {trade.maxAdversePrice ? formatCurrency(trade.maxAdversePrice) : '-'}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums text-sm text-profit">
                  {trade.maxFavorablePrice ? formatCurrency(trade.maxFavorablePrice) : '-'}
                </TableCell>
                <TableCell className="text-right font-mono font-medium tabular-nums text-sm">
                  {formatCurrency(trade.entryPrice)}
                </TableCell>
                <TableCell className="text-right font-mono font-medium tabular-nums text-sm">
                  {trade.exitPrice ? formatCurrency(trade.exitPrice) : (
                    <Badge variant="outline" className="font-mono text-xs">OPEN</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView?.(trade)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditTrade(trade)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete?.(trade)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  // Return mobile or desktop content with enhanced modal
  return (
    <>
      {isMobile ? (
        <div className="space-y-4">
          {/* Export button for mobile */}
          {showExport && (
            <div className="flex justify-end">
              {renderExportButton()}
            </div>
          )}
          {trades.map((trade) => (
            <Card key={trade.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {showSelection && onSelectTrade && (
                    <Checkbox
                      checked={selectedTrades.includes(trade.id)}
                      onCheckedChange={(checked) => onSelectTrade(trade.id, checked as boolean)}
                    />
                  )}
                  {getDirectionIcon(trade.direction)}
                  <span className="font-semibold">{trade.symbol}</span>
                  {getResultBadge(trade.result, trade.netPnl)}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView?.(trade)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditTrade(trade)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete?.(trade)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Entry:</span>
                  <div className="font-medium">{formatCurrency(trade.entryPrice)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Exit:</span>
                  <div className="font-medium">
                    {trade.exitPrice ? formatCurrency(trade.exitPrice) : 'Open'}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Net P&L:</span>
                  <div className={cn(
                    "font-medium",
                    trade.netPnl > 0 ? "text-profit" : trade.netPnl < 0 ? "text-loss" : "text-muted-foreground"
                  )}>
                    {formatCurrency(trade.netPnl)}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">MAE/MFE:</span>
                  <div className="font-medium">
                    <span className="text-loss">
                      {trade.maxAdversePrice ? formatCurrency(trade.maxAdversePrice) : '-'}
                    </span>
                    {' / '}
                    <span className="text-profit">
                      {trade.maxFavorablePrice ? formatCurrency(trade.maxFavorablePrice) : '-'}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <div className="font-medium">
                    {format(new Date(trade.entryDate), 'MMM dd, yyyy')}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        desktopContent
      )}

      {/* Success/Error Feedback */}
      {updateSuccess && (
        <div className="fixed top-4 right-4 z-50 profit-bg border border-profit/20 rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-profit" />
            <span className="text-sm font-medium text-profit">
              Trade updated successfully!
            </span>
          </div>
        </div>
      )}

      {updateError && (
        <div className="fixed top-4 right-4 z-50 loss-bg border border-loss/20 rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-loss" />
            <span className="text-sm font-medium text-loss">
              {updateError}
            </span>
          </div>
        </div>
      )}

      {/* Unified Edit Modal for all trades */}
      <UnifiedTradeEditModal
        open={isEditModalOpen}
        onOpenChange={handleEditModalClose}
        trade={editingTrade}
      />

      {/* Image Lightbox Modal */}
      {lightboxImageUrl && (
        <ImageLightboxModal
          isOpen={!!lightboxImageUrl}
          onClose={closeLightbox}
          imageUrl={lightboxImageUrl}
          title={lightboxTitle}
          downloadFilename={`${lightboxTitle.replace(/\s+/g, '-').toLowerCase()}.jpg`}
        />
      )}
    </>
  );
}

export default TradeTable;