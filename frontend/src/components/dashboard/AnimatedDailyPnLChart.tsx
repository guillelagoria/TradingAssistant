import React, { useEffect, useState } from 'react';
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
import { useTradeStore } from '@/store/tradeStore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Calendar, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { formatCurrency, CHART_COLORS } from '@/utils/chartHelpers';

interface AnimatedDailyPnLChartProps {
  height?: number;
  days?: number;
  className?: string;
}

interface DailyPnLData {
  date: string;
  pnl: number;
  trades: number;
  formattedDate: string;
}

const AnimatedDailyPnLChart: React.FC<AnimatedDailyPnLChartProps> = ({
  height = 300,
  days = 30,
  className
}) => {
  const { trades } = useTradeStore();
  const [animatedData, setAnimatedData] = useState<DailyPnLData[]>([]);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [showChart, setShowChart] = useState(false);

  // Generate daily P&L data - one bar per day
  const generateDailyPnLData = (): DailyPnLData[] => {
    const dailyData: { [key: string]: { pnl: number; trades: number } } = {};

    // Get date range for the last N days
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    // Initialize all dates with 0 P&L
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toLocaleDateString('en-US');
      dailyData[dateKey] = { pnl: 0, trades: 0 };
    }

    // Add actual trade data
    trades.forEach(trade => {
      const dateToUse = trade.exitDate || trade.entryDate;

      if (dateToUse && (trade.netPnl !== undefined && trade.netPnl !== null)) {
        const date = new Date(dateToUse).toLocaleDateString('en-US');
        if (dailyData[date]) {
          dailyData[date].pnl += trade.netPnl || 0;
          dailyData[date].trades += 1;
        }
      }
    });

    // Convert to array and sort by date
    const dataArray = Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        pnl: data.pnl,
        trades: data.trades,
        formattedDate: new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return dataArray;
  };


  const chartData = generateDailyPnLData();

  useEffect(() => {
    // Always show the chart if we have data (even if all zeros)
    if (chartData.length > 0) {
      setShowChart(true);
      setAnimatedData([]);

      // Animate bars appearing one by one
      chartData.forEach((item, index) => {
        setTimeout(() => {
          setAnimatedData(prev => [...prev, item]);
        }, index * 30); // Faster animation for more bars
      });
    }
  }, [trades, days]);



  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload as DailyPnLData;
    const isProfit = data.pnl >= 0;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-background/95 backdrop-blur-md border border-border rounded-lg shadow-xl p-3"
      >
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm font-semibold">{data.formattedDate}</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs text-muted-foreground">Daily P&L:</span>
            <span className={cn(
              "text-sm font-bold",
              isProfit ? "text-emerald-500" : "text-rose-500"
            )}>
              {formatCurrency(data.pnl)}
            </span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs text-muted-foreground">Trades:</span>
            <span className="text-xs font-semibold">{data.trades}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs text-muted-foreground">Avg/Trade:</span>
            <span className="text-xs font-semibold">
              {formatCurrency(data.pnl / data.trades)}
            </span>
          </div>
        </div>
      </motion.div>
    );
  };

  // Only show "no data" if we have no trades at all or no date range
  if (chartData.length === 0 || trades.length === 0) {
    return (
      <Card className={cn("backdrop-blur-sm bg-background/95 border-border/50", className)}>
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
              {trades.length === 0
                ? "Add some trades to see daily performance"
                : `Found ${trades.length} trades, but no daily P&L data to display`
              }
            </p>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  const totalPnL = chartData.reduce((sum, d) => sum + d.pnl, 0);

  // Only count days with actual trades (pnl != 0)
  const tradingDays = chartData.filter(d => d.pnl !== 0);
  const avgDailyPnL = tradingDays.length > 0 ? totalPnL / tradingDays.length : 0;

  const profitDays = chartData.filter(d => d.pnl > 0).length;
  const lossDays = chartData.filter(d => d.pnl < 0).length;

  return (
    <Card className={cn(
      "backdrop-blur-sm bg-background/95 border-border/50 shadow-xl overflow-hidden",
      className
    )}>
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 opacity-5"
        style={{
          background: `linear-gradient(135deg, transparent 0%, ${avgDailyPnL >= 0 ? '#10b981' : '#f43f5e'} 100%)`
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

      <CardHeader className="relative">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base font-semibold">
              Daily P&L ({days} days)
            </CardTitle>
            <motion.p
              className="text-xs text-muted-foreground mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {profitDays} profit days, {lossDays} loss days
            </motion.p>
          </div>
          <motion.div
            className="text-right"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
          >
            <div className={cn(
              "text-sm font-bold",
              avgDailyPnL >= 0 ? "text-emerald-500" : "text-rose-500"
            )}>
              {formatCurrency(avgDailyPnL)}
            </div>
            <div className="text-xs text-muted-foreground">
              {tradingDays.length > 0 ? `Avg (${tradingDays.length} trading days)` : 'Avg Daily'}
            </div>
          </motion.div>
        </div>
      </CardHeader>

      <CardContent className="relative">
        <AnimatePresence>
          {showChart && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <ResponsiveContainer width="100%" height={height}>
                <BarChart
                  data={animatedData}
                  margin={{ top: 20, right: 40, left: 40, bottom: 40 }}
                >
                  {/* Gradient definitions */}
                  <defs>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    </linearGradient>
                    {/* Glow filters */}
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="2 4"
                    stroke={CHART_COLORS.grid}
                    opacity={0.2}
                    vertical={false}
                    strokeWidth={1}
                  />

                  <XAxis
                    dataKey="formattedDate"
                    fontSize={11}
                    stroke={CHART_COLORS.text}
                    opacity={0.6}
                    interval={chartData.length > 15 ? 'preserveStartEnd' : 0}
                    tick={{ fontSize: 11 }}
                    axisLine={{ stroke: CHART_COLORS.grid, strokeWidth: 1 }}
                    tickLine={{ stroke: CHART_COLORS.grid, strokeWidth: 1 }}
                  />

                  <YAxis
                    fontSize={11}
                    stroke={CHART_COLORS.text}
                    opacity={0.6}
                    tickFormatter={(value) => formatCurrency(value)}
                    tick={{ fontSize: 11 }}
                    axisLine={{ stroke: CHART_COLORS.grid, strokeWidth: 1 }}
                    tickLine={{ stroke: CHART_COLORS.grid, strokeWidth: 1 }}
                    width={80}
                    domain={['dataMin - 50', 'dataMax + 50']} // Allow space for negative values
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <ReferenceLine
                    y={0}
                    stroke={CHART_COLORS.neutral}
                    strokeDasharray="5 5"
                    opacity={0.5}
                  />

                  <Bar
                    dataKey="pnl"
                    isAnimationActive={true}
                    animationDuration={1000}
                    animationBegin={0}
                  >
                    {animatedData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary stats */}
        <motion.div
          className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <div className="text-center">
            <motion.div
              className={cn(
                "text-lg font-bold",
                totalPnL >= 0 ? "text-emerald-500" : "text-rose-500"
              )}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.1, type: "spring" }}
            >
              {formatCurrency(totalPnL)}
            </motion.div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <motion.div
              className="text-lg font-bold text-emerald-500"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.2, type: "spring" }}
            >
              {profitDays}
            </motion.div>
            <div className="text-xs text-muted-foreground">Win Days</div>
          </div>
          <div className="text-center">
            <motion.div
              className="text-lg font-bold text-rose-500"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.3, type: "spring" }}
            >
              {lossDays}
            </motion.div>
            <div className="text-xs text-muted-foreground">Loss Days</div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default AnimatedDailyPnLChart;