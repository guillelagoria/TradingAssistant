import { useState } from 'react';
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
import { EmptyState } from '@/components/shared';
import { Trade, TradeSortConfig, TradeDirection, TradeResult } from '@/types';
import { useTradeStore } from '@/store/tradeStore';
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
  Download
} from 'lucide-react';
import { ExportDialog } from '../export';

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
    getSortedTrades 
  } = useTradeStore();
  
  const trades = propTrades || getSortedTrades(getFilteredTrades());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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
      ? <TrendingUp className="h-4 w-4 text-green-500" />
      : <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

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
                {getResultBadge(trade.result, trade.pnl)}
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
                  <DropdownMenuItem onClick={() => onEdit?.(trade)}>
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
                <span className="text-muted-foreground">P&L:</span>
                <div className={cn(
                  "font-medium",
                  trade.pnl > 0 ? "text-green-600" : trade.pnl < 0 ? "text-red-600" : "text-gray-600"
                )}>
                  {formatCurrency(trade.pnl)}
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
    );
  }

  // Desktop Table View
  return (
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
            <TableRow>
              {showSelection && (
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedTrades.length === trades.length && trades.length > 0}
                    onCheckedChange={onSelectAll}
                  />
                </TableHead>
              )}
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('symbol')}
                  className="h-8 p-0 font-semibold"
                >
                  Symbol
                  {getSortIcon('symbol')}
                </Button>
              </TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('entryDate')}
                  className="h-8 p-0 font-semibold"
                >
                  Entry Date
                  {getSortIcon('entryDate')}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('entryPrice')}
                  className="h-8 p-0 font-semibold"
                >
                  Entry Price
                  {getSortIcon('entryPrice')}
                </Button>
              </TableHead>
              <TableHead className="text-right">Exit Price</TableHead>
              <TableHead className="text-right">
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('pnl')}
                  className="h-8 p-0 font-semibold"
                >
                  P&L
                  {getSortIcon('pnl')}
                </Button>
              </TableHead>
              <TableHead className="text-right">P&L %</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade) => (
              <TableRow key={trade.id} className="hover:bg-muted/50">
                {showSelection && (
                  <TableCell>
                    <Checkbox
                      checked={selectedTrades.includes(trade.id)}
                      onCheckedChange={(checked) => onSelectTrade?.(trade.id, checked as boolean)}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {getDirectionIcon(trade.direction)}
                    {trade.symbol}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={trade.direction === TradeDirection.LONG ? "default" : "secondary"}>
                    {trade.direction}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(trade.entryDate), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(trade.entryPrice)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {trade.exitPrice ? formatCurrency(trade.exitPrice) : (
                    <Badge variant="outline">Open</Badge>
                  )}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-medium",
                  trade.pnl > 0 ? "text-green-600" : trade.pnl < 0 ? "text-red-600" : "text-gray-600"
                )}>
                  {formatCurrency(trade.pnl)}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-medium",
                  trade.pnlPercentage > 0 ? "text-green-600" : trade.pnlPercentage < 0 ? "text-red-600" : "text-gray-600"
                )}>
                  {formatPercentage(trade.pnlPercentage)}
                </TableCell>
                <TableCell>
                  {getResultBadge(trade.result, trade.pnl)}
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
                      <DropdownMenuItem onClick={() => onEdit?.(trade)}>
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
}

export default TradeTable;