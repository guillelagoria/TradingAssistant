import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTradeStore } from '@/store/tradeStore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Calendar, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { formatCurrency, CHART_COLORS } from '@/utils/chartHelpers';
import { format, startOfDay, subDays, parseISO, isValid } from 'date-fns';
import { Trade } from '@/types';

interface AnimatedDailyPnLChartProps {
  height?: number;
  className?: string;
}

interface DailyPnLData {
  date: string;
  pnl: number;
  trades: number;
  formattedDate: string;
  dateObj: Date;
  winTrades: number;
  lossTrades: number;
}

type TimePeriod = '7d' | '30d' | '60d';

const TIME_PERIODS: Record<TimePeriod, { label: string; days: number }> = {
  '7d': { label: 'Last 7 Days', days: 7 },
  '30d': { label: 'Last 30 Days', days: 30 },
  '60d': { label: 'Last 60 Days', days: 60 },
};

/**
 * AnimatedDailyPnLChart Component
 *
 * Displays daily P&L performance with the following features:
 * - Time period filters (7, 30, 60 days)
 * - Accurate data calculations from trades
 * - Performance optimizations (React.memo, useMemo)
 * - Professional visual design
 * - Smooth animations
 */
const AnimatedDailyPnLChart: React.FC<AnimatedDailyPnLChartProps> = React.memo(({
  height = 300,
  className
}) => {
  const { trades } = useTradeStore();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30d');
  const [animatedData, setAnimatedData] = useState<DailyPnLData[]>([]);
  const [showChart, setShowChart] = useState(false);

  /**
   * Generate daily P&L data with accurate calculations
   * - Uses exitDate (or entryDate if no exit) for grouping
   * - Sums all trades per day correctly
   * - Handles timezone properly using date-fns
   * - Filters by selected time period
   */
  const generateDailyPnLData = useMemo((): DailyPnLData[] => {
    if (!trades || trades.length === 0) return [];

    const days = TIME_PERIODS[selectedPeriod].days;
    const endDate = startOfDay(new Date());
    const startDate = startOfDay(subDays(endDate, days - 1));

    // Initialize all dates in range with zero P&L
    const dailyData = new Map<string, DailyPnLData>();

    for (let i = 0; i < days; i++) {
      const date = subDays(endDate, days - 1 - i);
      const dateKey = format(date, 'yyyy-MM-dd');
      dailyData.set(dateKey, {
        date: dateKey,
        pnl: 0,
        trades: 0,
        formattedDate: format(date, 'MMM dd'),
        dateObj: date,
        winTrades: 0,
        lossTrades: 0,
      });
    }

    // Process trades and aggregate by day
    trades.forEach(trade => {
      // Skip trades without P&L data
      if (trade.netPnl === undefined && trade.pnl === undefined) return;

      // Use exitDate if available, otherwise entryDate
      const dateToUse = trade.exitDate || trade.entryDate;
      if (!dateToUse) return;

      // Parse date safely
      let tradeDate: Date;
      try {
        tradeDate = typeof dateToUse === 'string' ? parseISO(dateToUse) : new Date(dateToUse);
        if (!isValid(tradeDate)) return;
        tradeDate = startOfDay(tradeDate);
      } catch {
        return;
      }

      // Check if trade is within the selected period
      if (tradeDate < startDate || tradeDate > endDate) return;

      const dateKey = format(tradeDate, 'yyyy-MM-dd');
      const existing = dailyData.get(dateKey);

      if (existing) {
        const tradePnl = trade.netPnl ?? trade.pnl ?? 0;
        existing.pnl += tradePnl;
        existing.trades += 1;

        // Track win/loss trades
        if (tradePnl > 0) {
          existing.winTrades += 1;
        } else if (tradePnl < 0) {
          existing.lossTrades += 1;
        }
      }
    });

    // Convert to array and sort chronologically
    return Array.from(dailyData.values()).sort((a, b) =>
      a.dateObj.getTime() - b.dateObj.getTime()
    );
  }, [trades, selectedPeriod]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    const totalPnL = generateDailyPnLData.reduce((sum, d) => sum + d.pnl, 0);
    const tradingDays = generateDailyPnLData.filter(d => d.trades > 0);
    const avgDailyPnL = tradingDays.length > 0 ? totalPnL / tradingDays.length : 0;
    const profitDays = generateDailyPnLData.filter(d => d.pnl > 0).length;
    const lossDays = generateDailyPnLData.filter(d => d.pnl < 0).length;
    const totalTrades = generateDailyPnLData.reduce((sum, d) => sum + d.trades, 0);

    return {
      totalPnL,
      avgDailyPnL,
      profitDays,
      lossDays,
      tradingDays: tradingDays.length,
      totalTrades,
    };
  }, [generateDailyPnLData]);

  // Animate chart data when it changes
  useEffect(() => {
    if (generateDailyPnLData.length > 0) {
      setShowChart(true);
      setAnimatedData([]);

      // Stagger animation for each bar
      generateDailyPnLData.forEach((item, index) => {
        setTimeout(() => {
          setAnimatedData(prev => [...prev, item]);
        }, index * 20); // Fast animation
      });
    } else {
      setShowChart(false);
      setAnimatedData([]);
    }
  }, [generateDailyPnLData]);

  // Custom tooltip with detailed information
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload as DailyPnLData;
    const isProfit = data.pnl >= 0;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-background/95 backdrop-blur-md border border-border rounded-lg shadow-xl p-3 min-w-[180px]"
      >
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-semibold">{data.formattedDate}</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center gap-6">
            <span className="text-xs text-muted-foreground">Daily P&L:</span>
            <span className={cn(
              "text-sm font-bold",
              isProfit ? "text-emerald-500" : "text-rose-500"
            )}>
              {formatCurrency(data.pnl)}
            </span>
          </div>
          <div className="flex justify-between items-center gap-6">
            <span className="text-xs text-muted-foreground">Trades:</span>
            <span className="text-xs font-semibold">{data.trades}</span>
          </div>
          {data.trades > 0 && (
            <>
              <div className="flex justify-between items-center gap-6">
                <span className="text-xs text-muted-foreground">Wins:</span>
                <span className="text-xs font-semibold text-emerald-500">{data.winTrades}</span>
              </div>
              <div className="flex justify-between items-center gap-6">
                <span className="text-xs text-muted-foreground">Losses:</span>
                <span className="text-xs font-semibold text-rose-500">{data.lossTrades}</span>
              </div>
              <div className="flex justify-between items-center gap-6">
                <span className="text-xs text-muted-foreground">Avg/Trade:</span>
                <span className={cn(
                  "text-xs font-semibold",
                  data.pnl / data.trades >= 0 ? "text-emerald-500" : "text-rose-500"
                )}>
                  {formatCurrency(data.pnl / data.trades)}
                </span>
              </div>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  // Empty state when no trades
  if (trades.length === 0) {
    return (
      <Card className={cn("backdrop-blur-sm bg-background/95 border-border shadow-lg", className)}>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Daily P&L</CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div
            className="flex flex-col items-center justify-center text-muted-foreground"
            style={{ height }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              className="w-20 h-20 mx-auto mb-4"
              animate={{
                scaleY: [1, 1.2, 0.8, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <BarChart3 className="w-full h-full text-muted-foreground/30" />
            </motion.div>
            <p className="text-sm font-medium">No daily P&L data available</p>
            <p className="text-xs mt-1 text-muted-foreground/70">
              Add some trades to see daily performance
            </p>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "backdrop-blur-sm bg-background/95 border-border shadow-lg overflow-hidden relative",
      className
    )}>
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, transparent 0%, ${stats.avgDailyPnL >= 0 ? '#10b981' : '#f43f5e'} 100%)`
        }}
        animate={{
          opacity: [0.05, 0.1, 0.05],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <CardHeader className="relative pb-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold mb-1">
              Daily P&L
            </CardTitle>
            <motion.p
              className="text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {stats.profitDays} profit days, {stats.lossDays} loss days ({stats.totalTrades} trades)
            </motion.p>
          </div>

          {/* Time period filter */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as TimePeriod)}>
              <TabsList className="grid grid-cols-3 w-[240px]">
                <TabsTrigger value="7d" className="text-xs">7 Days</TabsTrigger>
                <TabsTrigger value="30d" className="text-xs">30 Days</TabsTrigger>
                <TabsTrigger value="60d" className="text-xs">60 Days</TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>
        </div>

        {/* Average stats */}
        <motion.div
          className="mt-3 flex items-center justify-between px-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div>
            <div className="text-xs text-muted-foreground">Avg Daily P&L</div>
            <div className={cn(
              "text-lg font-bold",
              stats.avgDailyPnL >= 0 ? "text-emerald-500" : "text-rose-500"
            )}>
              {formatCurrency(stats.avgDailyPnL)}
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.tradingDays > 0 ? `${stats.tradingDays} trading days` : 'No trading days'}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-muted-foreground">Total P&L</div>
            <div className={cn(
              "text-lg font-bold",
              stats.totalPnL >= 0 ? "text-emerald-500" : "text-rose-500"
            )}>
              {formatCurrency(stats.totalPnL)}
            </div>
            <div className="text-xs text-muted-foreground">
              {TIME_PERIODS[selectedPeriod].label}
            </div>
          </div>
        </motion.div>
      </CardHeader>

      <CardContent className="relative pt-2">
        <AnimatePresence mode="wait">
          {showChart && animatedData.length > 0 && (
            <motion.div
              key={selectedPeriod}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ResponsiveContainer width="100%" height={height}>
                <BarChart
                  data={animatedData}
                  margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                >
                  {/* Gradient definitions */}
                  <defs>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.6}/>
                    </linearGradient>
                    <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={CHART_COLORS.grid}
                    opacity={0.3}
                    vertical={false}
                  />

                  <XAxis
                    dataKey="formattedDate"
                    fontSize={10}
                    stroke={CHART_COLORS.text}
                    opacity={0.7}
                    interval={selectedPeriod === '7d' ? 0 : selectedPeriod === '30d' ? 3 : 6}
                    tick={{ fontSize: 10 }}
                    axisLine={{ stroke: CHART_COLORS.grid }}
                    tickLine={{ stroke: CHART_COLORS.grid }}
                  />

                  <YAxis
                    fontSize={10}
                    stroke={CHART_COLORS.text}
                    opacity={0.7}
                    tickFormatter={(value) => formatCurrency(value)}
                    tick={{ fontSize: 10 }}
                    axisLine={{ stroke: CHART_COLORS.grid }}
                    tickLine={{ stroke: CHART_COLORS.grid }}
                    width={70}
                  />

                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />

                  <ReferenceLine
                    y={0}
                    stroke={CHART_COLORS.text}
                    strokeDasharray="3 3"
                    opacity={0.5}
                    strokeWidth={1.5}
                  />

                  <Bar
                    dataKey="pnl"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                    isAnimationActive={true}
                    animationDuration={800}
                    animationBegin={0}
                    animationEasing="ease-out"
                  >
                    {animatedData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.pnl >= 0 ? 'url(#profitGradient)' : 'url(#lossGradient)'}
                        opacity={entry.trades === 0 ? 0.3 : 1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary stats footer */}
        <motion.div
          className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <div className="text-xs text-muted-foreground">Profit Days</div>
            </div>
            <motion.div
              className="text-lg font-bold text-emerald-500"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.9, type: "spring" }}
            >
              {stats.profitDays}
            </motion.div>
          </div>
          <div className="text-center border-x border-border">
            <div className="flex items-center justify-center gap-1 mb-1">
              <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="text-xs text-muted-foreground">Trading Days</div>
            </div>
            <motion.div
              className="text-lg font-bold text-foreground"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.0, type: "spring" }}
            >
              {stats.tradingDays}
            </motion.div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
              <div className="text-xs text-muted-foreground">Loss Days</div>
            </div>
            <motion.div
              className="text-lg font-bold text-rose-500"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.1, type: "spring" }}
            >
              {stats.lossDays}
            </motion.div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
});

AnimatedDailyPnLChart.displayName = 'AnimatedDailyPnLChart';

export default AnimatedDailyPnLChart;
