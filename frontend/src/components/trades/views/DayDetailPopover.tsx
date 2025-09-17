import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Trade, TradeDirection, TradeStatus, TradeResult } from '@/types';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  Plus,
  Calendar,
  Minus,
  DollarSign,
  Target,
  X
} from 'lucide-react';

interface DayDetailPopoverProps {
  trades: Trade[];
  date: Date;
  isOpen: boolean;
  onClose: () => void;
  onViewTrade: (trade: Trade) => void;
  onEditTrade?: (trade: Trade) => void;
  onDeleteTrade?: (trade: Trade) => void;
  onAddTrade?: (date: Date) => void;
  children: React.ReactNode;
}

interface TradeCardProps {
  trade: Trade;
  onView: (trade: Trade) => void;
  onEdit?: (trade: Trade) => void;
  onDelete?: (trade: Trade) => void;
}

// Hook to detect mobile screen size
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
}

// Mini Trade Card Component
function TradeCard({ trade, onView, onEdit, onDelete }: TradeCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value));
  };

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'HH:mm');
  };

  const getPnlColor = () => {
    if (trade.pnl > 0) return 'text-emerald-600';
    if (trade.pnl < 0) return 'text-rose-600';
    return 'text-amber-600';
  };

  const getPnlBgColor = () => {
    if (trade.pnl > 0) return 'bg-emerald-500/10 border-emerald-500/20';
    if (trade.pnl < 0) return 'bg-rose-500/10 border-rose-500/20';
    return 'bg-amber-500/10 border-amber-500/20';
  };

  const getDirectionIcon = () => {
    return trade.direction === TradeDirection.LONG ? (
      <TrendingUp className="h-3 w-3" />
    ) : (
      <TrendingDown className="h-3 w-3" />
    );
  };

  const getStatusBadge = () => {
    if (trade.status === TradeStatus.OPEN) {
      return (
        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1 animate-pulse" />
          Open
        </Badge>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "relative rounded-lg border bg-card p-3 transition-all duration-200 cursor-pointer group",
        getPnlBgColor(),
        "hover:shadow-md hover:border-opacity-40"
      )}
      onClick={() => onView(trade)}
    >
      {/* Background gradient overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 0.05 : 0 }}
        className={cn(
          "absolute inset-0 rounded-lg",
          trade.pnl > 0 && "bg-gradient-to-br from-emerald-500 to-green-600",
          trade.pnl < 0 && "bg-gradient-to-br from-rose-500 to-red-600",
          trade.pnl === 0 && "bg-gradient-to-br from-amber-500 to-orange-600"
        )}
      />

      <div className="relative z-10">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={cn("p-1 rounded", getPnlBgColor())}>
              {getDirectionIcon()}
            </div>
            <span className="font-semibold text-sm">{trade.symbol}</span>
            {getStatusBadge()}
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatTime(trade.entryDate)}
          </div>
        </div>

        {/* P&L Row */}
        <div className="flex items-center justify-between mb-2">
          <span className={cn("font-bold text-sm", getPnlColor())}>
            {trade.pnl >= 0 ? '+' : ''}
            {formatCurrency(trade.pnl)}
          </span>

          {trade.efficiency && (
            <span className="text-xs text-muted-foreground">
              {Math.round(trade.efficiency)}% eff
            </span>
          )}
        </div>

        {/* Entry Price & Status */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Entry: ${trade.entryPrice}</span>
          {trade.exitPrice && <span>Exit: ${trade.exitPrice}</span>}
        </div>

        {/* Action Buttons - Show on Hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="flex items-center gap-1 pt-2 border-t border-border/50"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(trade);
                }}
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>

              {onEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(trade);
                  }}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}

              {onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(trade);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Day Summary Component
function DaySummary({ trades, date }: { trades: Trade[]; date: Date }) {
  const totalPnl = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const winTrades = trades.filter(t => t.pnl > 0).length;
  const lossTrades = trades.filter(t => t.pnl < 0).length;
  const winRate = trades.length > 0 ? (winTrades / trades.length) * 100 : 0;
  const openTrades = trades.filter(t => t.status === TradeStatus.OPEN).length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value));
  };

  const getPnlColor = () => {
    if (totalPnl > 0) return 'text-emerald-600';
    if (totalPnl < 0) return 'text-rose-600';
    return 'text-amber-600';
  };

  const getPnlIcon = () => {
    if (totalPnl > 0) return <TrendingUp className="h-4 w-4" />;
    if (totalPnl < 0) return <TrendingDown className="h-4 w-4" />;
    return <BarChart3 className="h-4 w-4" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Date Header */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-lg">
          {format(date, 'EEEE, MMM d, yyyy')}
        </h3>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total P&L */}
        <div className="flex items-center gap-2">
          <div className={cn("p-2 rounded-lg", totalPnl > 0 ? "bg-emerald-500/10" : totalPnl < 0 ? "bg-rose-500/10" : "bg-amber-500/10")}>
            <div className={getPnlColor()}>
              {getPnlIcon()}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total P&L</p>
            <p className={cn("font-bold", getPnlColor())}>
              {totalPnl >= 0 ? '+' : ''}
              {formatCurrency(totalPnl)}
            </p>
          </div>
        </div>

        {/* Trade Count */}
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Trades</p>
            <p className="font-bold">{trades.length}</p>
          </div>
        </div>
      </div>

      {/* Win Rate & Stats */}
      <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-emerald-600 font-medium">{winTrades}W</span>
          <span className="text-rose-600 font-medium">{lossTrades}L</span>
          {openTrades > 0 && (
            <span className="text-blue-600 font-medium">{openTrades} Open</span>
          )}
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Win Rate: </span>
          <span className="font-medium">{Math.round(winRate)}%</span>
        </div>
      </div>
    </motion.div>
  );
}

// Main DayDetailPopover Component
export default function DayDetailPopover({
  trades,
  date,
  isOpen,
  onClose,
  onViewTrade,
  onEditTrade,
  onDeleteTrade,
  onAddTrade,
  children
}: DayDetailPopoverProps) {
  const isMobile = useIsMobile();

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Handle outside click for popover
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      onClose();
    }
  }, [onClose]);

  // Content component
  const Content = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      {/* Day Summary */}
      <DaySummary trades={trades} date={date} />

      {/* Add New Trade Button */}
      {onAddTrade && (
        <Button
          onClick={() => onAddTrade(date)}
          className="w-full gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          Add New Trade for This Day
        </Button>
      )}

      {/* Trades List */}
      {trades.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Trades ({trades.length})</h4>
          </div>

          {/* Scrollable trades container with explicit styling */}
          <div
            className="relative border border-border/20 rounded-lg"
            style={{ height: '400px' }}
          >
            <div
              className="h-full overflow-y-auto overflow-x-hidden px-3 py-2"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent'
              }}
            >
              <div className="space-y-2">
                <AnimatePresence>
                  {trades.map((trade, index) => (
                    <motion.div
                      key={trade.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: { delay: index * 0.1 }
                      }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <TradeCard
                        trade={trade}
                        onView={onViewTrade}
                        onEdit={onEditTrade}
                        onDelete={onDeleteTrade}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Scroll indicator */}
            {trades.length > 3 && (
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md border border-border/20">
                Scroll for more
              </div>
            )}
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-6 text-muted-foreground"
        >
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No trades on this day</p>
        </motion.div>
      )}
    </motion.div>
  );

  // Mobile version (Sheet)
  if (isMobile) {
    return (
      <>
        {children}
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
          <SheetContent
            side="bottom"
            className="rounded-t-lg max-h-[80vh] overflow-hidden"
          >
            <SheetHeader className="text-left pb-4">
              <SheetTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Day Details
              </SheetTitle>
              <SheetDescription>
                Trading activity for {format(date, 'EEEE, MMM d, yyyy')}
              </SheetDescription>
            </SheetHeader>

            <div className="overflow-y-auto">
              <Content />
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop version (Popover)
  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-96 p-4 backdrop-blur-md bg-background/95 border-border/50",
          "shadow-xl shadow-black/5 overflow-visible",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        )}
        align="start"
        sideOffset={8}
      >
        {/* Close button for desktop */}
        <button
          onClick={onClose}
          className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <Content />
      </PopoverContent>
    </Popover>
  );
}