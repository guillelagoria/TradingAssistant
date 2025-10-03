import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  XCircle,
  Info
} from 'lucide-react';
import { ExportDialog } from '../export';
import UnifiedTradeEditModal from './UnifiedTradeEditModal';

interface EnhancedTradeTableProps {
  trades?: Trade[];
  onView?: (trade: Trade) => void;
  onEdit?: (trade: Trade) => void;
  onDelete?: (trade: Trade) => void;
  loading?: boolean;
  showExport?: boolean;
  exportTitle?: string;
  selectedTrades?: string[];
  onSelectTrade?: (tradeId: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  showSelection?: boolean;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03
    }
  }
};

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  }
};

function EnhancedTradeTable({
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
}: EnhancedTradeTableProps) {
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
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // Unified Edit Modal State
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Image Lightbox State
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSort = (field: keyof Trade) => {
    const newDirection =
      sortConfig.field === field && sortConfig.direction === 'asc'
        ? 'desc'
        : 'asc';

    setSortConfig({ field, direction: newDirection });
  };

  const getSortIcon = (field: keyof Trade) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="ml-2 h-4 w-4 text-primary" />
      : <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
  };

  // Enhanced Result Badge with better prominence
  const getResultBadge = (result?: TradeResult, pnl?: number) => {
    if (!result) return null;

    const config = {
      [TradeResult.WIN]: {
        className: "bg-profit text-white border-0 font-bold shadow-sm shadow-profit/50",
        icon: <TrendingUp className="h-3 w-3" />
      },
      [TradeResult.LOSS]: {
        className: "bg-loss text-white border-0 font-bold shadow-sm shadow-loss/50",
        icon: <TrendingDown className="h-3 w-3" />
      },
      [TradeResult.BREAKEVEN]: {
        className: "bg-muted-foreground text-white border-0 font-bold",
        icon: null
      }
    } as const;

    const badgeConfig = config[result];

    return (
      <Badge className={cn("text-xs px-2 py-1 flex items-center gap-1", badgeConfig.className)}>
        {badgeConfig.icon}
        {result.toUpperCase()}
      </Badge>
    );
  };

  const getDirectionIcon = (direction: TradeDirection) => {
    return direction === TradeDirection.LONG
      ? <TrendingUp className="h-4 w-4 text-profit" />
      : <TrendingDown className="h-4 w-4 text-loss" />;
  };

  // Professional currency formatting
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

  const handleEditModalClose = (open: boolean) => {
    setIsEditModalOpen(open);
    if (!open) {
      setEditingTrade(null);
      setUpdateError(null);
    }
  };

  // Success/Error feedback effects
  useEffect(() => {
    if (updateSuccess) {
      const timer = setTimeout(() => setUpdateSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [updateSuccess]);

  useEffect(() => {
    if (updateError) {
      const timer = setTimeout(() => setUpdateError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [updateError]);

  useEffect(() => {
    const handleTradeUpdated = async () => {
      try {
        setUpdateSuccess(true);
        if (activeAccount) {
          await refreshTradesForAccount(activeAccount.id);
        }
      } catch (error) {
        setUpdateError('Failed to refresh trade data after update');
      }
    };

    if (!isEditModalOpen && editingTrade && updateSuccess) {
      handleTradeUpdated();
    }
  }, [isEditModalOpen, editingTrade, activeAccount, refreshTradesForAccount, updateSuccess]);

  // Enhanced loading state
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="h-16 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg animate-pulse"
              />
            ))}
          </motion.div>
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

  // Mobile Card View with enhanced design
  if (isMobile) {
    return (
      <motion.div
        className="space-y-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {showExport && (
          <div className="flex justify-end">
            {renderExportButton()}
          </div>
        )}
        <AnimatePresence>
          {trades.map((trade, index) => (
            <motion.div
              key={trade.id}
              variants={rowVariants}
              layout
            >
              <Card className={cn(
                "p-4 border-l-4 transition-all duration-200",
                trade.netPnl > 0 && "border-l-profit bg-gradient-to-r from-profit/5 to-transparent",
                trade.netPnl < 0 && "border-l-loss bg-gradient-to-r from-loss/5 to-transparent",
                trade.netPnl === 0 && "border-l-muted"
              )}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {showSelection && onSelectTrade && (
                      <Checkbox
                        checked={selectedTrades.includes(trade.id)}
                        onCheckedChange={(checked) => onSelectTrade(trade.id, checked as boolean)}
                      />
                    )}
                    {getDirectionIcon(trade.direction)}
                    <span className="font-semibold text-lg">{trade.symbol}</span>
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

                <div className="grid grid-cols-2 gap-4 text-sm">
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
                      "font-mono font-bold tabular-nums text-lg",
                      trade.netPnl > 0 ? "text-profit" : trade.netPnl < 0 ? "text-loss" : "text-muted-foreground"
                    )}>
                      {formatCurrency(trade.netPnl)}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">P&L %:</span>
                    <div className={cn(
                      "font-mono font-bold tabular-nums text-lg",
                      trade.netPnl > 0 ? "text-profit" : trade.netPnl < 0 ? "text-loss" : "text-muted-foreground"
                    )}>
                      {formatPercentage(
                        trade.entryPrice && trade.entryPrice > 0
                          ? (trade.netPnl / (trade.entryPrice * trade.quantity)) * 100
                          : 0
                      )}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Date:</span>
                    <div className="font-medium">
                      {format(new Date(trade.entryDate), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Enhanced Desktop Table View
  return (
    <>
      <Card className="border-0 shadow-lg">
        {showExport && (
          <div className="flex items-center justify-between p-4 border-b bg-muted/30">
            <h3 className="text-lg font-semibold">{exportTitle}</h3>
            {renderExportButton()}
          </div>
        )}
        <CardContent className="p-0">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 bg-muted/50">
                  {showSelection && (
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedTrades.length === trades.length && trades.length > 0}
                        onCheckedChange={onSelectAll}
                      />
                    </TableHead>
                  )}
                  <TableHead className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('symbol')}
                      className="h-8 p-0 font-bold uppercase text-xs tracking-wider hover:text-foreground"
                    >
                      Symbol
                      {getSortIcon('symbol')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                    Result
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('entryDate')}
                      className="h-8 p-0 font-bold uppercase text-xs tracking-wider hover:text-foreground"
                    >
                      Date
                      {getSortIcon('entryDate')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider font-bold text-muted-foreground">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('netPnl')}
                      className="h-8 p-0 font-bold uppercase text-xs tracking-wider hover:text-foreground"
                    >
                      Net P&L
                      {getSortIcon('netPnl')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider font-bold text-muted-foreground">
                    P&L %
                  </TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider font-bold text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort('maxAdversePrice')}
                            className="h-8 p-0 font-bold uppercase text-xs tracking-wider hover:text-foreground"
                          >
                            MAE
                            {getSortIcon('maxAdversePrice')}
                            <Info className="h-3 w-3 ml-1 text-muted-foreground/50" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Max Adverse Excursion</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider font-bold text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort('maxFavorablePrice')}
                            className="h-8 p-0 font-bold uppercase text-xs tracking-wider hover:text-foreground"
                          >
                            MFE
                            {getSortIcon('maxFavorablePrice')}
                            <Info className="h-3 w-3 ml-1 text-muted-foreground/50" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Max Favorable Excursion</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider font-bold text-muted-foreground">
                    Entry
                  </TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider font-bold text-muted-foreground">
                    Exit
                  </TableHead>
                  <TableHead className="w-[70px] text-xs uppercase tracking-wider font-bold text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {trades.map((trade, index) => (
                    <motion.tr
                      key={trade.id}
                      variants={rowVariants}
                      className={cn(
                        "group relative border-b border-border/50",
                        "hover:bg-muted/50 transition-all duration-200",
                        hoveredRow === trade.id && "shadow-sm"
                      )}
                      onMouseEnter={() => setHoveredRow(trade.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        borderLeft: `3px solid ${
                          trade.netPnl > 0 ? 'hsl(var(--profit))' :
                          trade.netPnl < 0 ? 'hsl(var(--loss))' :
                          'transparent'
                        }`
                      }}
                    >
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
                          <span className="tracking-tight text-base">{trade.symbol}</span>
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
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(trade.entryDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-mono font-bold tabular-nums text-base",
                        trade.netPnl > 0 ? "text-profit" : trade.netPnl < 0 ? "text-loss" : "text-muted-foreground"
                      )}>
                        {formatCurrency(trade.netPnl)}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-mono font-bold tabular-nums text-base",
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
                      <TableCell className="text-right font-mono font-medium tabular-nums text-sm text-muted-foreground">
                        {formatCurrency(trade.entryPrice)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium tabular-nums text-sm text-muted-foreground">
                        {trade.exitPrice ? formatCurrency(trade.exitPrice) : (
                          <Badge variant="outline" className="font-mono text-xs">OPEN</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
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
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </motion.div>
        </CardContent>
      </Card>

      {/* Success/Error Feedback */}
      <AnimatePresence>
        {updateSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 profit-bg border border-profit/20 rounded-lg p-4 shadow-lg"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-profit" />
              <span className="text-sm font-medium text-profit">
                Trade updated successfully!
              </span>
            </div>
          </motion.div>
        )}

        {updateError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 loss-bg border border-loss/20 rounded-lg p-4 shadow-lg"
          >
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-loss" />
              <span className="text-sm font-medium text-loss">
                {updateError}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unified Edit Modal */}
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

export default EnhancedTradeTable;
