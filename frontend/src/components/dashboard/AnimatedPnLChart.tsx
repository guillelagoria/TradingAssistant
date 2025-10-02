import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTradeStore } from '@/store/tradeStore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  generateCumulativePnLData,
  formatCurrency,
  CHART_COLORS,
  CumulativePnLPoint,
} from '@/utils/chartHelpers';
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';

interface AnimatedPnLChartProps {
  height?: number;
  className?: string;
}

const AnimatedPnLChart: React.FC<AnimatedPnLChartProps> = ({ height = 350, className }) => {
  const { trades } = useTradeStore();
  const [animatedData, setAnimatedData] = useState<CumulativePnLPoint[]>([]);
  const [showChart, setShowChart] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const chartData = generateCumulativePnLData(trades);
  const isEmpty = chartData.length === 0;

  useEffect(() => {
    if (chartData.length > 0) {
      // Animate data points appearing one by one
      setAnimatedData([]);
      setShowChart(true);

      chartData.forEach((point, index) => {
        setTimeout(() => {
          setAnimatedData(prev => [...prev, point]);
        }, index * 50); // Stagger animation
      });
    }
  }, [trades]);

  const finalPnL = chartData[chartData.length - 1]?.cumulativePnl || 0;
  const isProfit = finalPnL >= 0;
  const maxPnL = Math.max(...chartData.map(d => d.cumulativePnl), 0);
  const minPnL = Math.min(...chartData.map(d => d.cumulativePnl), 0);
  const range = maxPnL - minPnL;

  // Enhanced custom tooltip with animations
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload as CumulativePnLPoint;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -10 }}
        transition={{ duration: 0.2 }}
        className="bg-background/95 backdrop-blur-md border border-border rounded-lg shadow-2xl p-4"
      >
        <p className="text-sm font-semibold text-foreground mb-3">
          {data.formattedDate}
        </p>
        <div className="space-y-2">
          <motion.div
            className="flex justify-between items-center gap-6"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Trade P&L:
            </span>
            <span className={cn(
              "text-sm font-bold",
              data.tradePnl >= 0 ? 'text-emerald-500' : 'text-rose-500'
            )}>
              {formatCurrency(data.tradePnl)}
            </span>
          </motion.div>
          <motion.div
            className="flex justify-between items-center gap-6"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Cumulative:
            </span>
            <span className={cn(
              "text-sm font-bold",
              data.cumulativePnl >= 0 ? 'text-emerald-500' : 'text-rose-500'
            )}>
              {formatCurrency(data.cumulativePnl)}
            </span>
          </motion.div>
          <motion.div
            className="flex justify-between items-center gap-6 pt-2 border-t border-border/50"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-xs text-muted-foreground">Total Trades:</span>
            <span className="text-xs font-semibold text-foreground">
              {data.tradeCount}
            </span>
          </motion.div>
        </div>
      </motion.div>
    );
  };

  // Custom animated dot
  const CustomDot = (props: any) => {
    const { cx, cy, payload, index } = props;
    if (!payload) return null;

    const isWin = payload.tradePnl >= 0;
    const dotColor = isWin ? CHART_COLORS.profit : CHART_COLORS.loss;
    const isHovered = hoveredPoint === index;

    return (
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: isHovered ? 1.5 : 1,
          opacity: 1
        }}
        transition={{
          duration: 0.3,
          delay: index * 0.05,
          type: "spring",
          stiffness: 300
        }}
        onMouseEnter={() => setHoveredPoint(index)}
        onMouseLeave={() => setHoveredPoint(null)}
      >
        <circle
          cx={cx}
          cy={cy}
          r={isHovered ? 8 : 5}
          fill={dotColor}
          stroke="#ffffff"
          strokeWidth={2}
          className="cursor-pointer"
          style={{
            filter: isHovered ? `drop-shadow(0 0 8px ${dotColor})` : 'none'
          }}
        />
        {isHovered && (
          <motion.circle
            cx={cx}
            cy={cy}
            r={12}
            fill="none"
            stroke={dotColor}
            strokeWidth={2}
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </motion.g>
    );
  };

  if (isEmpty) {
    return (
      <Card className={cn("backdrop-blur-sm bg-background/95 border-none shadow-xl shadow-black/5", className)}>
        <CardHeader>
          <CardTitle className="text-base font-semibold">P&L Evolution</CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div
            className="flex flex-col items-center justify-center text-muted-foreground"
            style={{ height }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="w-20 h-20 mx-auto mb-4"
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <TrendingUp className="w-full h-full text-muted-foreground/30" />
            </motion.div>
            <p className="text-sm font-medium">No closed trades yet</p>
            <p className="text-xs mt-1 text-muted-foreground/70">
              Complete some trades to see your P&L evolution
            </p>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "backdrop-blur-sm bg-background/95 border-none shadow-2xl shadow-primary/5 overflow-hidden",
      className
    )}>
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 opacity-5"
        animate={{
          background: [
            `linear-gradient(135deg, ${isProfit ? CHART_COLORS.profit : CHART_COLORS.loss} 0%, transparent 50%)`,
            `linear-gradient(135deg, transparent 50%, ${isProfit ? CHART_COLORS.profit : CHART_COLORS.loss} 100%)`,
            `linear-gradient(135deg, ${isProfit ? CHART_COLORS.profit : CHART_COLORS.loss} 0%, transparent 50%)`,
          ],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      <CardHeader className="relative">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              P&L Evolution
            </CardTitle>
            <motion.p
              className="text-xs text-muted-foreground mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Track your profit & loss over time
            </motion.p>
          </div>
          <motion.div
            className="text-right"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              delay: 0.2
            }}
          >
            <div className="flex items-center gap-2">
              {isProfit ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-rose-500" />
              )}
              <div className={cn(
                "text-2xl font-bold",
                isProfit ? 'text-emerald-500' : 'text-rose-500'
              )}>
                {formatCurrency(finalPnL)}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Total P&L
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
                <AreaChart
                  data={animatedData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.profit} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={CHART_COLORS.profit} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.loss} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={CHART_COLORS.loss} stopOpacity={0}/>
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
                    fontSize={11}
                    stroke={CHART_COLORS.text}
                    opacity={0.5}
                    interval="preserveStartEnd"
                  />

                  <YAxis
                    fontSize={11}
                    stroke={CHART_COLORS.text}
                    opacity={0.5}
                    tickFormatter={(value) => formatCurrency(value)}
                    domain={[minPnL - range * 0.1, maxPnL + range * 0.1]}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <ReferenceLine
                    y={0}
                    stroke={CHART_COLORS.neutral}
                    strokeDasharray="5 5"
                    opacity={0.5}
                  >
                    <motion.line
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </ReferenceLine>

                  <Area
                    type="monotone"
                    dataKey="cumulativePnl"
                    stroke="transparent"
                    fillOpacity={1}
                    fill={isProfit ? "url(#colorProfit)" : "url(#colorLoss)"}
                  />

                  <Line
                    type="monotone"
                    dataKey="cumulativePnl"
                    stroke={isProfit ? CHART_COLORS.profit : CHART_COLORS.loss}
                    strokeWidth={3}
                    dot={<CustomDot />}
                    activeDot={false}
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <motion.div
          className="flex justify-center mt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <motion.div
                className="w-3 h-3 rounded-full bg-emerald-500"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-muted-foreground">Profitable Trade</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.div
                className="w-3 h-3 rounded-full bg-rose-500"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              />
              <span className="text-muted-foreground">Loss Trade</span>
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default AnimatedPnLChart;