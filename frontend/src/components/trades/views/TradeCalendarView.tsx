import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
  parseISO,
  isValid
} from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Trade, TradeStatus, TradeResult } from '@/types';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  Eye,
  Plus
} from 'lucide-react';

interface TradeCalendarViewProps {
  trades: Trade[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  onDayClick: (date: Date, trades: Trade[]) => void;
  loading?: boolean;
  className?: string;
}

interface DayData {
  date: Date;
  trades: Trade[];
  totalPnl: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  openTradeCount: number;
  symbols: string[];
}

interface CalendarDayProps {
  dayData: DayData;
  isCurrentMonth: boolean;
  isToday: boolean;
  onClick: () => void;
}

// Individual Calendar Day Component
function CalendarDay({ dayData, isCurrentMonth, isToday, onClick }: CalendarDayProps) {
  const [isHovered, setIsHovered] = useState(false);

  const { date, trades, totalPnl, tradeCount, winCount, lossCount, openTradeCount, symbols } = dayData;
  const hasAnyTrades = tradeCount > 0;
  const isProfitable = totalPnl > 0;
  const isBreakeven = totalPnl === 0 && hasAnyTrades;

  // Get the dominant color based on P&L
  const getDayColor = () => {
    if (!hasAnyTrades) return 'default';
    if (isProfitable) return 'green';
    if (isBreakeven) return 'amber';
    return 'red';
  };

  const color = getDayColor();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value));
  };

  const dayVariants = {
    initial: { scale: 0.95, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        duration: 0.5,
        bounce: 0.2
      }
    },
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.98 }
  };

  return (
    <motion.div
      variants={dayVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className={cn(
        "relative cursor-pointer group",
        !isCurrentMonth && "opacity-40"
      )}
    >
      <Card className={cn(
        "min-h-[80px] sm:min-h-[100px] transition-all duration-200 hover:shadow-md relative overflow-hidden",
        !isCurrentMonth && "bg-muted/30",
        isToday && "ring-1 sm:ring-2 ring-blue-500 ring-offset-1 sm:ring-offset-2",
        hasAnyTrades && !isCurrentMonth && "bg-background/50",
        !hasAnyTrades && "hover:bg-muted/40"
      )}>

        {/* Background glow effect for days with trades */}
        {hasAnyTrades && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 0.1 : 0.05 }}
            className={cn(
              "absolute inset-0",
              color === 'green' && "bg-gradient-to-br from-emerald-500 to-green-600",
              color === 'red' && "bg-gradient-to-br from-rose-500 to-red-600",
              color === 'amber' && "bg-gradient-to-br from-amber-500 to-orange-600"
            )}
          />
        )}

        <CardContent className="p-2 h-full flex flex-col relative z-10">
          {/* Date header */}
          <div className="flex items-center justify-between mb-2">
            <span className={cn(
              "text-sm font-medium",
              isToday && "text-blue-600 font-bold",
              !isCurrentMonth && "text-muted-foreground",
              isCurrentMonth && !isToday && "text-foreground"
            )}>
              {format(date, 'd')}
            </span>

            {hasAnyTrades && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring" }}
              >
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs px-1.5 py-0.5 font-medium border-0",
                    color === 'green' && "bg-emerald-500/20 text-emerald-700",
                    color === 'red' && "bg-rose-500/20 text-rose-700",
                    color === 'amber' && "bg-amber-500/20 text-amber-700"
                  )}
                >
                  {tradeCount}
                </Badge>
              </motion.div>
            )}
          </div>

          {/* Trade information */}
          {hasAnyTrades ? (
            <div className="flex-1 space-y-1">
              {/* P&L */}
              <div className="flex items-center justify-between">
                <motion.span
                  className={cn(
                    "text-xs font-semibold",
                    color === 'green' && "text-emerald-600",
                    color === 'red' && "text-rose-600",
                    color === 'amber' && "text-amber-600"
                  )}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {isProfitable ? '+' : ''}
                  {formatCurrency(totalPnl)}
                </motion.span>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 }}
                  className={cn(
                    "p-1 rounded",
                    color === 'green' && "bg-emerald-500/20",
                    color === 'red' && "bg-rose-500/20",
                    color === 'amber' && "bg-amber-500/20"
                  )}
                >
                  {isProfitable ? (
                    <TrendingUp className="h-3 w-3 text-emerald-600" />
                  ) : totalPnl < 0 ? (
                    <TrendingDown className="h-3 w-3 text-rose-600" />
                  ) : (
                    <BarChart3 className="h-3 w-3 text-amber-600" />
                  )}
                </motion.div>
              </div>

              {/* Win/Loss breakdown */}
              {(winCount > 0 || lossCount > 0) && (
                <motion.div
                  className="flex items-center gap-1 text-xs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {winCount > 0 && (
                    <span className="text-emerald-600 font-medium">
                      {winCount}W
                    </span>
                  )}
                  {winCount > 0 && lossCount > 0 && (
                    <span className="text-muted-foreground">•</span>
                  )}
                  {lossCount > 0 && (
                    <span className="text-rose-600 font-medium">
                      {lossCount}L
                    </span>
                  )}
                </motion.div>
              )}

              {/* Open trades indicator */}
              {openTradeCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 }}
                  className="flex items-center gap-1"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-xs text-blue-600 font-medium">
                    {openTradeCount} Open
                  </span>
                </motion.div>
              )}

              {/* Top symbols */}
              {symbols.length > 0 && (
                <motion.div
                  className="flex flex-wrap gap-1 mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {symbols.slice(0, 2).map((symbol, index) => (
                    <Badge
                      key={symbol}
                      variant="outline"
                      className="text-[10px] px-1 py-0 h-4 bg-background/50 border-border/50"
                    >
                      {symbol}
                    </Badge>
                  ))}
                  {symbols.length > 2 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1 py-0 h-4 bg-background/50 border-border/50"
                    >
                      +{symbols.length - 2}
                    </Badge>
                  )}
                </motion.div>
              )}
            </div>
          ) : (
            // Empty day hover effect
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex-1 flex items-center justify-center"
                >
                  <div className="text-center">
                    <Plus className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                    <span className="text-xs text-muted-foreground">Add Trade</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function TradeCalendarView({
  trades,
  currentMonth,
  onMonthChange,
  onDayClick,
  loading = false,
  className
}: TradeCalendarViewProps) {

  // Group trades by date
  const tradesByDate = useMemo(() => {
    const grouped = new Map<string, Trade[]>();

    trades.forEach(trade => {
      const entryDate = typeof trade.entryDate === 'string'
        ? parseISO(trade.entryDate)
        : trade.entryDate;

      if (!isValid(entryDate)) return;

      const dateKey = format(entryDate, 'yyyy-MM-dd');

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(trade);
    });

    return grouped;
  }, [trades]);

  // Generate calendar days with performance optimization
  const calendarDays = useMemo(() => {
    const startDate = startOfWeek(startOfMonth(currentMonth));
    const endDate = endOfWeek(endOfMonth(currentMonth));

    return eachDayOfInterval({ start: startDate, end: endDate }).map(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const dayTrades = tradesByDate.get(dateKey) || [];

      const totalPnl = dayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const winCount = dayTrades.filter(t => t.result === TradeResult.WIN || (t.pnl > 0 && t.status === TradeStatus.CLOSED)).length;
      const lossCount = dayTrades.filter(t => t.result === TradeResult.LOSS || (t.pnl < 0 && t.status === TradeStatus.CLOSED)).length;
      const openTradeCount = dayTrades.filter(t => t.status === TradeStatus.OPEN).length;
      const symbols = [...new Set(dayTrades.map(t => t.symbol))];

      return {
        date,
        trades: dayTrades,
        totalPnl,
        tradeCount: dayTrades.length,
        winCount,
        lossCount,
        openTradeCount,
        symbols
      };
    });
  }, [currentMonth, tradesByDate]);

  const handlePrevMonth = () => {
    onMonthChange(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1));
  };

  const handleDayClick = (dayData: DayData) => {
    onDayClick(dayData.date, dayData.trades);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">
              {format(currentMonth, 'MMMM yyyy')}
            </CardTitle>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevMonth}
              disabled={loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              disabled={loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-6">
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
          {weekDays.map(day => (
            <div
              key={day}
              className="text-center text-sm font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {[...Array(35)].map((_, i) => (
              <Skeleton key={i} className="h-[80px] sm:h-[100px] w-full" />
            ))}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-7 gap-1 sm:gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <AnimatePresence mode="wait">
              {calendarDays.map((dayData, index) => (
                <CalendarDay
                  key={format(dayData.date, 'yyyy-MM-dd')}
                  dayData={dayData}
                  isCurrentMonth={isSameMonth(dayData.date, currentMonth)}
                  isToday={isToday(dayData.date)}
                  onClick={() => handleDayClick(dayData)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty state for no trades */}
        {!loading && trades.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No Trades Found
            </h3>
            <p className="text-sm text-muted-foreground/70 mb-4">
              Start by adding your first trade to see it appear on the calendar.
            </p>
            <Button
              onClick={() => onDayClick(new Date(), [])}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add First Trade
            </Button>
          </motion.div>
        )}

        {/* Legend */}
        <motion.div
          className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-border"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full" />
            <span className="text-xs text-muted-foreground">Profitable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-rose-500 rounded-full" />
            <span className="text-xs text-muted-foreground">Loss</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full" />
            <span className="text-xs text-muted-foreground">Breakeven</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">Open Trades</span>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}