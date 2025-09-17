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
import { TrendingUp, TrendingDown, DollarSign, Scale } from 'lucide-react';
import { formatCurrency, CHART_COLORS } from '@/utils/chartHelpers';

interface AnimatedProfitFactorChartProps {
  height?: number;
  className?: string;
}

interface ProfitFactorData {
  name: string;
  value: number;
  color: string;
  type: 'profit' | 'loss';
}

const AnimatedProfitFactorChart: React.FC<AnimatedProfitFactorChartProps> = ({
  height = 300,
  className
}) => {
  const { stats } = useTradeStore();
  const [animatedData, setAnimatedData] = useState<ProfitFactorData[]>([]);
  const [showChart, setShowChart] = useState(false);

  const totalProfit = Math.abs(stats?.avgWin || 0) * (stats?.winTrades || 0);
  const totalLoss = Math.abs(stats?.avgLoss || 0) * (stats?.lossTrades || 0);
  const profitFactor = stats?.profitFactor || 0;

  const data: ProfitFactorData[] = [
    {
      name: 'Total Profit',
      value: totalProfit,
      color: '#10b981',
      type: 'profit'
    },
    {
      name: 'Total Loss',
      value: totalLoss,
      color: '#f43f5e',
      type: 'loss'
    }
  ];

  useEffect(() => {
    if (stats && (totalProfit > 0 || totalLoss > 0)) {
      setShowChart(true);
      setAnimatedData([]);

      // Animate bars appearing
      data.forEach((item, index) => {
        setTimeout(() => {
          setAnimatedData(prev => [...prev, item]);
        }, index * 200);
      });
    }
  }, [stats, totalProfit, totalLoss]);

  // Custom animated bar
  const CustomBar = (props: any) => {
    const { fill, x, y, width, height, index, payload } = props;
    const absoluteHeight = Math.abs(height);

    return (
      <motion.g>
        <motion.rect
          x={x}
          y={y}
          width={width}
          height={0}
          fill={fill}
          rx={4}
          ry={4}
          initial={{ height: 0, y: y + absoluteHeight }}
          animate={{
            height: absoluteHeight,
            y: y
          }}
          transition={{
            duration: 0.8,
            delay: index * 0.2,
            type: "spring",
            stiffness: 100,
            damping: 15
          }}
        />
        {/* Gradient overlay */}
        <motion.rect
          x={x}
          y={y}
          width={width}
          height={0}
          fill={`url(#${payload.type}BarGradient)`}
          rx={4}
          ry={4}
          initial={{ height: 0, y: y + absoluteHeight }}
          animate={{
            height: absoluteHeight,
            y: y
          }}
          transition={{
            duration: 0.8,
            delay: index * 0.2 + 0.1,
            type: "spring",
            stiffness: 100,
            damping: 15
          }}
        />
      </motion.g>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload as ProfitFactorData;
    const isProfit = data.type === 'profit';

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-background/95 backdrop-blur-md border border-border rounded-lg shadow-xl p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          {isProfit ? (
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-rose-500" />
          )}
          <span className="font-semibold text-sm">{data.name}</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-xs text-muted-foreground">Amount:</span>
            <span className={cn(
              "text-sm font-bold",
              isProfit ? "text-emerald-500" : "text-rose-500"
            )}>
              {formatCurrency(data.value)}
            </span>
          </div>
        </div>
      </motion.div>
    );
  };

  if (!stats || (totalProfit === 0 && totalLoss === 0)) {
    return (
      <Card className={cn("backdrop-blur-sm bg-background/95 border-border/50", className)}>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Profit Factor</CardTitle>
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
              animate={{ scale: [1, 1.1, 1] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Scale className="w-full h-full text-muted-foreground/30" />
            </motion.div>
            <p className="text-sm font-medium">No profit/loss data available</p>
            <p className="text-xs mt-1 text-muted-foreground/70">
              Complete some trades to see profit factor
            </p>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  const getProfitFactorStatus = (pf: number) => {
    if (pf >= 2) return { text: "Excellent", color: "text-emerald-500" };
    if (pf >= 1.5) return { text: "Good", color: "text-emerald-400" };
    if (pf >= 1.2) return { text: "Fair", color: "text-amber-500" };
    if (pf >= 1) return { text: "Break Even", color: "text-amber-400" };
    return { text: "Needs Work", color: "text-rose-500" };
  };

  const status = getProfitFactorStatus(profitFactor);

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
            `linear-gradient(135deg, ${profitFactor > 1 ? '#10b981' : '#f43f5e'} 0%, transparent 50%)`,
            `linear-gradient(135deg, transparent 50%, ${profitFactor > 1 ? '#10b981' : '#f43f5e'} 100%)`,
            `linear-gradient(135deg, ${profitFactor > 1 ? '#10b981' : '#f43f5e'} 0%, transparent 50%)`,
          ],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <CardHeader className="relative">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base font-semibold">Profit Factor</CardTitle>
            <motion.p
              className="text-xs text-muted-foreground mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Total Profits vs Total Losses
            </motion.p>
          </div>
          <motion.div
            className="text-right"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
          >
            <div className={cn("text-2xl font-bold", status.color)}>
              {profitFactor.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              Ratio
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
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  barCategoryGap="20%"
                >
                  <defs>
                    <linearGradient id="profitBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3}/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="lossBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fb7185" stopOpacity={0.3}/>
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="2 4"
                    stroke={CHART_COLORS.grid}
                    opacity={0.2}
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    fontSize={11}
                    stroke={CHART_COLORS.text}
                    opacity={0.6}
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
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Bar
                    dataKey="value"
                    shape={<CustomBar />}
                    isAnimationActive={false}
                  >
                    {animatedData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
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
              className="text-lg font-bold text-emerald-500"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.1, type: "spring" }}
            >
              {formatCurrency(totalProfit)}
            </motion.div>
            <div className="text-xs text-muted-foreground">Profits</div>
          </div>
          <div className="text-center">
            <motion.div
              className="text-lg font-bold text-rose-500"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.2, type: "spring" }}
            >
              {formatCurrency(totalLoss)}
            </motion.div>
            <div className="text-xs text-muted-foreground">Losses</div>
          </div>
          <div className="text-center">
            <motion.div
              className={cn("text-lg font-bold", status.color)}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.3, type: "spring" }}
            >
              {status.text}
            </motion.div>
            <div className="text-xs text-muted-foreground">Rating</div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default AnimatedProfitFactorChart;