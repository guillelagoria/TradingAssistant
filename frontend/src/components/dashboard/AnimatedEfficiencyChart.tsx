import React, { useEffect, useState } from 'react';
import {
  ScatterChart,
  Scatter,
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
import { formatCurrency, CHART_COLORS } from '@/utils/chartHelpers';
import { BarChart3, TrendingUp, Target, Zap } from 'lucide-react';

interface AnimatedEfficiencyChartProps {
  height?: number;
  className?: string;
}

interface EfficiencyPoint {
  pnl: number;
  efficiency: number;
  maxFavorable: number;
  symbol: string;
  date: string;
  isProfit: boolean;
  size: number;
}

const AnimatedEfficiencyChart: React.FC<AnimatedEfficiencyChartProps> = ({
  height = 300,
  className
}) => {
  const { trades } = useTradeStore();
  const [animatedData, setAnimatedData] = useState<EfficiencyPoint[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [showChart, setShowChart] = useState(false);

  // Generate efficiency data
  const generateEfficiencyData = (): EfficiencyPoint[] => {
    return trades
      .filter(trade => trade.status === 'closed' && trade.pnl !== undefined)
      .map(trade => {
        const pnl = trade.pnl || 0;
        const maxFavorable = trade.maxFavorablePrice || 0;
        const entryPrice = trade.entryPrice || 0;

        // Calculate theoretical max profit if direction was correct
        const theoreticalMax = trade.direction === 'long'
          ? maxFavorable - entryPrice
          : entryPrice - maxFavorable;

        // Efficiency = (Realized P&L / Theoretical Max) * 100
        const efficiency = theoreticalMax > 0 ? (pnl / (theoreticalMax * trade.quantity)) * 100 : 0;

        return {
          pnl,
          efficiency: Math.max(0, Math.min(100, efficiency)), // Clamp between 0-100
          maxFavorable,
          symbol: trade.symbol,
          date: trade.exitDate || trade.entryDate,
          isProfit: pnl >= 0,
          size: Math.abs(pnl) / 100 + 5 // Size based on P&L magnitude
        };
      })
      .filter(point => !isNaN(point.efficiency) && isFinite(point.efficiency));
  };

  const chartData = generateEfficiencyData();

  useEffect(() => {
    if (chartData.length > 0) {
      setShowChart(true);
      setAnimatedData([]);

      // Animate points appearing one by one
      chartData.forEach((point, index) => {
        setTimeout(() => {
          setAnimatedData(prev => [...prev, point]);
        }, index * 100);
      });
    }
  }, [trades]);

  // Custom animated dot
  const CustomDot = (props: any) => {
    const { cx, cy, payload, index } = props;
    if (!payload) return null;

    const isHovered = hoveredPoint === index;
    const dotColor = payload.isProfit ? '#10b981' : '#f43f5e';
    const size = payload.size;

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
          r={isHovered ? size * 1.5 : size}
          fill={dotColor}
          stroke="#ffffff"
          strokeWidth={2}
          className="cursor-pointer"
          style={{
            filter: isHovered ? `drop-shadow(0 0 12px ${dotColor})` : 'none',
            opacity: 0.8
          }}
        />
        {isHovered && (
          <>
            <motion.circle
              cx={cx}
              cy={cy}
              r={size * 2}
              fill="none"
              stroke={dotColor}
              strokeWidth={2}
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <motion.circle
              cx={cx}
              cy={cy}
              r={2}
              fill="white"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            />
          </>
        )}
      </motion.g>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload as EfficiencyPoint;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-background/95 backdrop-blur-md border border-border rounded-lg shadow-xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-blue-500" />
          <span className="font-semibold text-sm">{data.symbol}</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs text-muted-foreground">P&L:</span>
            <span className={cn(
              "text-sm font-bold",
              data.isProfit ? "text-emerald-500" : "text-rose-500"
            )}>
              {formatCurrency(data.pnl)}
            </span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs text-muted-foreground">Efficiency:</span>
            <span className="text-sm font-bold text-blue-500">
              {data.efficiency.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs text-muted-foreground">Max Favorable:</span>
            <span className="text-xs font-semibold">
              ${data.maxFavorable.toFixed(2)}
            </span>
          </div>
          <div className="pt-2 border-t border-border/50">
            <span className="text-xs text-muted-foreground">
              {new Date(data.date).toLocaleDateString()}
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
          <CardTitle className="text-base font-semibold">Trade Efficiency</CardTitle>
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
                rotate: [0, 180, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Zap className="w-full h-full text-muted-foreground/30" />
            </motion.div>
            <p className="text-sm font-medium">No efficiency data available</p>
            <p className="text-xs mt-1 text-muted-foreground/70">
              Complete trades with max favorable data
            </p>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  const avgEfficiency = chartData.reduce((sum, point) => sum + point.efficiency, 0) / chartData.length;
  const highEfficiencyTrades = chartData.filter(point => point.efficiency > 50).length;
  const totalTrades = chartData.length;

  return (
    <Card className={cn(
      "backdrop-blur-sm bg-background/95 border-border/50 shadow-xl overflow-hidden",
      className
    )}>
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 opacity-5"
        animate={{
          background: [
            `linear-gradient(135deg, #3b82f6 0%, transparent 50%)`,
            `linear-gradient(135deg, transparent 50%, #3b82f6 100%)`,
            `linear-gradient(135deg, #3b82f6 0%, transparent 50%)`,
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      <CardHeader className="relative">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base font-semibold">Trade Efficiency</CardTitle>
            <motion.p
              className="text-xs text-muted-foreground mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Efficiency = (Realized P&L / Max Favorable) × 100
            </motion.p>
          </div>
          <motion.div
            className="text-right"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
          >
            <div className="text-lg font-bold text-blue-500">
              {avgEfficiency.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">
              Avg Efficiency
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
                <ScatterChart
                  data={animatedData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={CHART_COLORS.grid}
                    opacity={0.3}
                  />

                  <XAxis
                    type="number"
                    dataKey="pnl"
                    fontSize={10}
                    stroke={CHART_COLORS.text}
                    opacity={0.5}
                    tickFormatter={(value) => formatCurrency(value)}
                    name="P&L"
                  />

                  <YAxis
                    type="number"
                    dataKey="efficiency"
                    fontSize={10}
                    stroke={CHART_COLORS.text}
                    opacity={0.5}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    name="Efficiency"
                  />

                  <Tooltip content={<CustomTooltip />} />

                  {/* Reference lines */}
                  <ReferenceLine
                    y={50}
                    stroke="#f59e0b"
                    strokeDasharray="5 5"
                    opacity={0.6}
                  />
                  <ReferenceLine
                    x={0}
                    stroke={CHART_COLORS.neutral}
                    strokeDasharray="3 3"
                    opacity={0.5}
                  />

                  <Scatter
                    name="Trades"
                    dataKey="efficiency"
                    shape={<CustomDot />}
                  >
                    {animatedData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isProfit ? '#10b981' : '#f43f5e'}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary stats */}
        <motion.div
          className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-border/50"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <div className="text-center">
            <motion.div
              className="text-lg font-bold text-foreground"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.1, type: "spring" }}
            >
              {totalTrades}
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
              {chartData.filter(p => p.isProfit).length}
            </motion.div>
            <div className="text-xs text-muted-foreground">Wins</div>
          </div>
          <div className="text-center">
            <motion.div
              className="text-lg font-bold text-rose-500"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.3, type: "spring" }}
            >
              {chartData.filter(p => !p.isProfit).length}
            </motion.div>
            <div className="text-xs text-muted-foreground">Losses</div>
          </div>
          <div className="text-center">
            <motion.div
              className="text-lg font-bold text-blue-500"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.4, type: "spring" }}
            >
              {avgEfficiency.toFixed(1)}%
            </motion.div>
            <div className="text-xs text-muted-foreground">Avg</div>
          </div>
        </motion.div>

        {/* Legend */}
        <motion.div
          className="flex justify-center mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Profitable</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-muted-foreground">Loss</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-8 h-0.5 bg-amber-500" />
              <span className="text-muted-foreground">50% Efficiency</span>
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default AnimatedEfficiencyChart;