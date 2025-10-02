import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  AlertTriangle,
  Info,
  Activity,
  DollarSign,
  RefreshCw,
  ChevronRight,
  BarChart3,
  Sparkles,
  Zap
} from 'lucide-react';
import { BEAnalysisService, BEStatsData } from '@/services/beAnalysisService';
import { useActiveAccount } from '@/store/accountStore';

interface AnimatedBEStatsCardProps {
  onViewDetails?: () => void;
  refreshTrigger?: number;
}

const getStrategyInfo = (strategy: string) => {
  const strategies = {
    'aggressive-be': {
      name: 'Aggressive BE',
      description: 'Move to break-even quickly',
      color: 'bg-orange-500',
      icon: TrendingUp
    },
    'moderate-be': {
      name: 'Moderate BE',
      description: 'Standard break-even approach',
      color: 'bg-blue-500',
      icon: Target
    },
    'conservative-be': {
      name: 'Conservative BE',
      description: 'Move to break-even later',
      color: 'bg-green-500',
      icon: Shield
    },
    'no-be': {
      name: 'No Break-Even',
      description: 'Hold until target/stop',
      color: 'bg-gray-500',
      icon: AlertTriangle
    }
  };

  return strategies[strategy as keyof typeof strategies] || strategies['no-be'];
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatPercentage = (value: number | undefined) => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0.0%';
  }
  return `${value.toFixed(1)}%`;
};

// Animated Counter Component
function AnimatedCounter({
  value,
  duration = 2,
  prefix = '',
  suffix = '',
  decimals = 0
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => {
    return `${prefix}${latest.toFixed(decimals)}${suffix}`;
  });

  useEffect(() => {
    const controls = motionValue.set(value);
    motionValue.set(0);
    setTimeout(() => motionValue.set(value), 100);
  }, [value, motionValue]);

  return <motion.span>{rounded}</motion.span>;
}

export function AnimatedBEStatsCard({ onViewDetails, refreshTrigger = 0 }: AnimatedBEStatsCardProps) {
  const activeAccount = useActiveAccount();
  const [data, setData] = useState<BEStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const fetchBEData = async () => {
    if (!activeAccount) {
      setData(null);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      setError(null);
      const beData = await BEAnalysisService.getBEMetrics(activeAccount.id);
      setData(beData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load break-even data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBEData();
  }, [activeAccount, refreshTrigger]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBEData();
  };

  if (isLoading) {
    return (
      <Card className="backdrop-blur-sm bg-background/95 border-none shadow-xl shadow-black/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-6 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="backdrop-blur-sm bg-background/95 border-none shadow-xl shadow-red-500/10">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error}
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    'Retry'
                  )}
                </Button>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!data) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="backdrop-blur-sm bg-background/95 border-none shadow-xl shadow-black/5">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mx-auto mb-4 w-12 h-12 text-muted-foreground"
              >
                <Target className="w-full h-full" />
              </motion.div>
              <p className="text-sm text-muted-foreground">
                No break-even data available
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const workingRate = data.bEWorked && data.totalTrades
    ? (data.bEWorked / data.totalTrades) * 100
    : 0;

  const strategyInfo = getStrategyInfo(data.recommendedStrategy);
  const StrategyIcon = strategyInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: -15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{
        type: "spring",
        duration: 0.8,
        stiffness: 100
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{ perspective: 1000 }}
    >
      <Card className={cn(
        "relative overflow-hidden backdrop-blur-sm bg-background/95 border-none shadow-xl shadow-black/5 transition-all duration-300",
        isHovered && "shadow-2xl shadow-primary/10"
      )}>
        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0 opacity-10"
          animate={{
            background: isHovered
              ? [
                  "linear-gradient(135deg, #3b82f6 0%, transparent 50%)",
                  "linear-gradient(135deg, transparent 50%, #10b981 100%)",
                  "linear-gradient(135deg, #3b82f6 0%, transparent 50%)"
                ]
              : "linear-gradient(135deg, #3b82f6 0%, transparent 100%)"
          }}
          transition={{
            duration: isHovered ? 3 : 1,
            repeat: isHovered ? Infinity : 0,
            ease: "linear"
          }}
        />

        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            opacity: isHovered ? 0.3 : 0,
            background: "radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.3), transparent 70%)"
          }}
          transition={{ duration: 0.3 }}
        />

        <CardHeader className="relative">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <motion.div
                    animate={isHovered ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <Target className="h-4 w-4 text-blue-500" />
                  </motion.div>
                  Break-Even Analysis
                  {isHovered && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Sparkles className="h-3 w-3 text-yellow-400" />
                    </motion.div>
                  )}
                </CardTitle>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <CardDescription>
                  How well your break-even strategy is working
                </CardDescription>
              </motion.div>
            </div>

            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="p-1 rounded-full hover:bg-muted transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <RefreshCw className={cn(
                        "h-4 w-4 text-muted-foreground",
                        isRefreshing && "animate-spin"
                      )} />
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh data</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-6">
          {/* Working Rate Progress */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Break-Even Success Rate</span>
              <motion.span
                className="text-2xl font-bold text-blue-500"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring" }}
              >
                <AnimatedCounter value={workingRate} suffix="%" decimals={1} />
              </motion.span>
            </div>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.7, duration: 1 }}
              style={{ transformOrigin: "left" }}
            >
              <Progress
                value={workingRate}
                className="h-3"
                style={{
                  background: `linear-gradient(90deg,
                    ${workingRate >= 70 ? '#10b981' : workingRate >= 50 ? '#f59e0b' : '#ef4444'} 0%,
                    ${workingRate >= 70 ? '#10b981' : workingRate >= 50 ? '#f59e0b' : '#ef4444'} ${workingRate}%,
                    transparent ${workingRate}%)`
                }}
              />
            </motion.div>
          </motion.div>

          <Separator />

          {/* Stats Grid */}
          <motion.div
            className="grid grid-cols-2 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <motion.div
              className="text-center p-3 rounded-lg bg-muted/50"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                className="text-2xl font-bold text-green-600 mb-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.9, type: "spring" }}
              >
                <AnimatedCounter value={data.bEWorked || 0} />
              </motion.div>
              <div className="text-xs text-muted-foreground">Worked</div>
            </motion.div>

            <motion.div
              className="text-center p-3 rounded-lg bg-muted/50"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                className="text-2xl font-bold text-foreground mb-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, type: "spring" }}
              >
                <AnimatedCounter value={data.totalTrades || 0} />
              </motion.div>
              <div className="text-xs text-muted-foreground">Total Trades</div>
            </motion.div>
          </motion.div>

          {/* Recommended Strategy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Recommended Strategy</span>
                <motion.div
                  animate={isHovered ? { rotate: 360 } : {}}
                  transition={{ duration: 0.8 }}
                >
                  <StrategyIcon className="h-4 w-4 text-blue-500" />
                </motion.div>
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border border-blue-200 dark:border-blue-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <Badge
                      variant="secondary"
                      className={cn(strategyInfo.color, "text-white mb-2")}
                    >
                      {strategyInfo.name}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {strategyInfo.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Action Button */}
          {onViewDetails && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <Button
                onClick={onViewDetails}
                variant="outline"
                className="w-full group hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950/20"
                asChild
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    View Detailed Analysis
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </motion.button>
              </Button>
            </motion.div>
          )}
        </CardContent>

        {/* Animated bottom border */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1.3, duration: 0.8 }}
          style={{ transformOrigin: "left" }}
        />
      </Card>
    </motion.div>
  );
}