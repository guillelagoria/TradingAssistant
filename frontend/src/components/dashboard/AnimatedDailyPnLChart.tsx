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

  // Generate daily P&L data
  const generateDailyPnLData = (): DailyPnLData[] => {
    const dailyData: { [key: string]: { pnl: number; trades: number } } = {};

    trades.forEach(trade => {
      if (trade.status === 'closed' && trade.exitDate) {
        const date = new Date(trade.exitDate).toLocaleDateString('en-US');
        if (!dailyData[date]) {
          dailyData[date] = { pnl: 0, trades: 0 };
        }
        dailyData[date].pnl += trade.pnl || 0;
        dailyData[date].trades += 1;
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
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-days); // Take only the last N days

    return dataArray;
  };

  const chartData = generateDailyPnLData();

  useEffect(() => {
    if (chartData.length > 0) {
      setShowChart(true);
      setAnimatedData([]);

      // Animate bars appearing one by one
      chartData.forEach((item, index) => {
        setTimeout(() => {
          setAnimatedData(prev => [...prev, item]);
        }, index * 50);
      });
    }
  }, [trades, days]);

  // Custom animated bar
  const CustomBar = (props: any) => {
    const { fill, x, y, width, height, index } = props;
    const isHovered = hoveredBar === index;

    return (
      <motion.rect
        x={x}
        y={y}
        width={width}
        height={0}
        fill={fill}
        initial={{ height: 0, y: y + height }}
        animate={{
          height: height,
          y: y,
          filter: isHovered ? `drop-shadow(0 0 8px ${fill})` : 'none'
        }}
        transition={{
          duration: 0.5,
          delay: index * 0.05,
          type: "spring",
          stiffness: 100
        }}
        onMouseEnter={() => setHoveredBar(index)}
        onMouseLeave={() => setHoveredBar(null)}
        style={{ cursor: 'pointer' }}
      />
    );
  };

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

  if (chartData.length === 0) {
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
            <p className="text-sm font-medium">No daily data available</p>
            <p className="text-xs mt-1 text-muted-foreground/70">
              Close some trades to see daily performance
            </p>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  const totalPnL = chartData.reduce((sum, d) => sum + d.pnl, 0);
  const avgDailyPnL = totalPnL / chartData.length;
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
              Avg Daily
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
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
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
                    opacity={0.5}
                    interval="preserveStartEnd"
                  />

                  <YAxis
                    fontSize={10}
                    stroke={CHART_COLORS.text}
                    opacity={0.5}
                    tickFormatter={(value) => formatCurrency(value)}
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
                    shape={<CustomBar />}
                    isAnimationActive={false}
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