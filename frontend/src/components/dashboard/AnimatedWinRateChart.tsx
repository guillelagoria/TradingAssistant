import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTradeStore } from '@/store/tradeStore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Target, Award } from 'lucide-react';

interface AnimatedWinRateChartProps {
  height?: number;
  className?: string;
}

const AnimatedWinRateChart: React.FC<AnimatedWinRateChartProps> = ({
  height = 300,
  className
}) => {
  const { stats } = useTradeStore();
  const [animatedValue, setAnimatedValue] = useState(0);
  const [showChart, setShowChart] = useState(false);

  const winRate = stats?.winRate || 0;
  const winTrades = stats?.winTrades || 0;
  const lossTrades = stats?.lossTrades || 0;
  const totalTrades = stats?.totalTrades || 0;

  const data = [
    { name: 'Wins', value: winTrades, percentage: winRate },
    { name: 'Losses', value: lossTrades, percentage: 100 - winRate },
  ];

  const COLORS = {
    win: '#10b981',
    loss: '#f43f5e',
  };

  useEffect(() => {
    if (stats) {
      setShowChart(true);
      // Animate the percentage counter
      const duration = 2000;
      const steps = 60;
      const increment = winRate / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= winRate) {
          setAnimatedValue(winRate);
          clearInterval(timer);
        } else {
          setAnimatedValue(current);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [winRate, stats]);

  // Custom animated label
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <motion.text
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 + index * 0.2, duration: 0.3 }}
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </motion.text>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0];
    const isWin = data.name === 'Wins';

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-background/95 backdrop-blur-md border border-border rounded-lg shadow-xl p-3"
      >
        <div className="flex items-center gap-2 mb-2">
          {isWin ? (
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-rose-500" />
          )}
          <span className="font-semibold text-sm">{data.name}</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-xs text-muted-foreground">Trades:</span>
            <span className="text-xs font-bold">{data.value}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-xs text-muted-foreground">Rate:</span>
            <span className={cn(
              "text-xs font-bold",
              isWin ? "text-emerald-500" : "text-rose-500"
            )}>
              {data.payload.percentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </motion.div>
    );
  };

  if (!stats || totalTrades === 0) {
    return (
      <Card className={cn("backdrop-blur-sm bg-background/95 border-border/50", className)}>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Win Rate Analysis</CardTitle>
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
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Target className="w-full h-full text-muted-foreground/30" />
            </motion.div>
            <p className="text-sm font-medium">No trades to analyze</p>
            <p className="text-xs mt-1 text-muted-foreground/70">
              Start trading to see your win rate
            </p>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  const isGoodWinRate = winRate >= 50;

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
            `radial-gradient(circle at 30% 30%, ${isGoodWinRate ? COLORS.win : COLORS.loss} 0%, transparent 50%)`,
            `radial-gradient(circle at 70% 70%, ${isGoodWinRate ? COLORS.win : COLORS.loss} 0%, transparent 50%)`,
            `radial-gradient(circle at 30% 30%, ${isGoodWinRate ? COLORS.win : COLORS.loss} 0%, transparent 50%)`,
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <CardHeader className="relative">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-semibold">Win Rate Analysis</CardTitle>
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.8 }}
          >
            {isGoodWinRate ? (
              <Award className="h-5 w-5 text-emerald-500" />
            ) : (
              <Target className="h-5 w-5 text-amber-500" />
            )}
          </motion.div>
        </div>
      </CardHeader>

      <CardContent className="relative">
        <AnimatePresence>
          {showChart && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <ResponsiveContainer width="100%" height={height}>
                <PieChart>
                  <defs>
                    <linearGradient id="winGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.9}/>
                      <stop offset="50%" stopColor="#10b981" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.8}/>
                    </linearGradient>
                    <linearGradient id="lossGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#fb7185" stopOpacity={0.9}/>
                      <stop offset="50%" stopColor="#f43f5e" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#dc2626" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={height / 3}
                    fill="#8884d8"
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  >
                    <Cell fill="url(#winGradient)" stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
                    <Cell fill="url(#lossGradient)" stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Center is now clean - no text overlay */}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats below chart */}
        <motion.div
          className="grid grid-cols-2 gap-4 mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
        >
          <div className="text-center">
            <motion.div
              className="text-2xl font-bold text-emerald-500"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.6, type: "spring" }}
            >
              {winTrades}
            </motion.div>
            <div className="text-xs text-muted-foreground">Wins</div>
          </div>
          <div className="text-center">
            <motion.div
              className="text-2xl font-bold text-rose-500"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.7, type: "spring" }}
            >
              {lossTrades}
            </motion.div>
            <div className="text-xs text-muted-foreground">Losses</div>
          </div>
        </motion.div>

        {/* Performance indicator */}
        <motion.div
          className="mt-4 pt-4 border-t border-border/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Performance</span>
            <span className={cn(
              "text-xs font-semibold px-2 py-1 rounded-full",
              isGoodWinRate
                ? "bg-emerald-500/20 text-emerald-500"
                : "bg-amber-500/20 text-amber-500"
            )}>
              {isGoodWinRate ? "Good" : "Needs Improvement"}
            </span>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default AnimatedWinRateChart;