import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTradeStore } from '@/store/tradeStore';
import { cn } from '@/lib/utils';
import { motion, useInView, useSpring, useTransform, useMotionValue } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Target,
  Activity,
  Sparkles
} from 'lucide-react';

interface AnimatedStatsCardsProps {
  className?: string;
}

interface StatCardData {
  title: string;
  value: string | number;
  formattedValue?: string;
  description: string;
  icon: any;
  trend: 'up' | 'down' | null;
  color: 'green' | 'red' | 'blue' | 'purple' | 'amber' | 'default';
  gradient: string;
  glowColor: string;
  delay: number;
}

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
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0.2
  });
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [motionValue, value, isInView]);

  useEffect(() => {
    springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${latest.toFixed(decimals)}${suffix}`;
      }
    });
  }, [springValue, prefix, suffix, decimals]);

  return <span ref={ref}>{prefix}0{suffix}</span>;
}

// Individual Animated Card Component
function AnimatedStatCard({ card, index }: { card: StatCardData; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = card.icon;

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      rotateX: -15
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: "spring",
        duration: 0.8,
        delay: card.delay,
        stiffness: 100
      }
    }
  };

  const iconVariants = {
    initial: { rotate: 0, scale: 1 },
    hover: {
      rotate: [0, -10, 10, -10, 10, 0],
      scale: 1.2,
      transition: {
        rotate: {
          duration: 0.5,
          ease: "easeInOut"
        },
        scale: {
          duration: 0.3
        }
      }
    }
  };

  const glowVariants = {
    initial: { opacity: 0 },
    hover: {
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02, rotateY: 5 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{ perspective: 1000 }}
    >
      <Card className="relative overflow-hidden backdrop-blur-sm bg-background/95 border-border/50 shadow-xl">
        {/* Animated gradient background */}
        <motion.div
          className={cn("absolute inset-0 opacity-10", card.gradient)}
          animate={{
            backgroundPosition: isHovered ? ["0% 0%", "100% 100%"] : "0% 0%",
          }}
          transition={{
            duration: 3,
            ease: "linear",
            repeat: isHovered ? Infinity : 0,
          }}
          style={{
            backgroundSize: "200% 200%",
          }}
        />

        {/* Glow effect */}
        <motion.div
          variants={glowVariants}
          initial="initial"
          animate={isHovered ? "hover" : "initial"}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${card.glowColor}, transparent 70%)`,
          }}
        />

        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {card.title}
          </CardTitle>
          <motion.div
            variants={iconVariants}
            initial="initial"
            animate={isHovered ? "hover" : "initial"}
            className="relative"
          >
            <Icon className={cn(
              "h-4 w-4",
              card.color === "green" && "text-emerald-500",
              card.color === "red" && "text-rose-500",
              card.color === "blue" && "text-blue-500",
              card.color === "purple" && "text-purple-500",
              card.color === "amber" && "text-amber-500",
              card.color === "default" && "text-muted-foreground"
            )} />
            {isHovered && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Sparkles className="h-3 w-3 text-yellow-400" />
              </motion.div>
            )}
          </motion.div>
        </CardHeader>

        <CardContent className="relative">
          <div className="flex items-baseline gap-2">
            <motion.div
              className={cn(
                "text-2xl font-bold tracking-tight",
                card.color === "green" && "text-emerald-500",
                card.color === "red" && "text-rose-500",
                card.color === "blue" && "text-blue-500",
                card.color === "purple" && "text-purple-500",
                card.color === "amber" && "text-amber-500",
                card.color === "default" && "text-foreground"
              )}
              initial={{ scale: 1 }}
              animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
            >
              {card.formattedValue || card.value}
            </motion.div>

            {card.trend && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: card.delay + 0.3 }}
              >
                <div className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                  card.trend === "up"
                    ? "bg-emerald-500/20 text-emerald-500"
                    : "bg-rose-500/20 text-rose-500"
                )}>
                  {card.trend === "up" ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {card.trend === "up" ? "↗" : "↘"}
                </div>
              </motion.div>
            )}
          </div>

          <motion.p
            className="text-xs text-muted-foreground mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: card.delay + 0.4 }}
          >
            {card.description}
          </motion.p>

          {/* Animated bottom border */}
          <motion.div
            className={cn(
              "absolute bottom-0 left-0 right-0 h-0.5",
              card.gradient
            )}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{
              delay: card.delay + 0.2,
              duration: 0.6,
              ease: "easeOut"
            }}
            style={{ transformOrigin: "left" }}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AnimatedStatsCards({ className }: AnimatedStatsCardsProps) {
  const { stats } = useTradeStore();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (!stats) {
    return (
      <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6", className)}>
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="backdrop-blur-sm bg-background/95">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded animate-pulse w-24" />
              <div className="h-4 w-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded animate-pulse w-20 mb-1" />
              <div className="h-3 bg-muted rounded animate-pulse w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards: StatCardData[] = [
    {
      title: "Total Trades",
      value: stats.totalTrades,
      formattedValue: stats.totalTrades.toString(),
      description: `${stats.winTrades} wins, ${stats.lossTrades} losses`,
      icon: Activity,
      trend: null,
      color: "blue",
      gradient: "bg-gradient-to-br from-blue-500 to-indigo-600",
      glowColor: "rgba(59, 130, 246, 0.3)",
      delay: 0
    },
    {
      title: "Win Rate",
      value: stats.winRate,
      formattedValue: formatPercentage(stats.winRate),
      description: `${stats.winTrades}/${stats.totalTrades} winning trades`,
      icon: Target,
      trend: stats.winRate >= 50 ? "up" : "down",
      color: stats.winRate >= 50 ? "green" : "red",
      gradient: stats.winRate >= 50
        ? "bg-gradient-to-br from-emerald-500 to-green-600"
        : "bg-gradient-to-br from-rose-500 to-red-600",
      glowColor: stats.winRate >= 50
        ? "rgba(16, 185, 129, 0.3)"
        : "rgba(244, 63, 94, 0.3)",
      delay: 0.1
    },
    {
      title: "Total P&L",
      value: stats.totalPnl,
      formattedValue: formatCurrency(stats.totalPnl),
      description: `Net: ${formatCurrency(stats.netPnl)}`,
      icon: DollarSign,
      trend: stats.totalPnl >= 0 ? "up" : "down",
      color: stats.totalPnl >= 0 ? "green" : "red",
      gradient: stats.totalPnl >= 0
        ? "bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500"
        : "bg-gradient-to-br from-rose-500 via-red-500 to-pink-500",
      glowColor: stats.totalPnl >= 0
        ? "rgba(16, 185, 129, 0.3)"
        : "rgba(244, 63, 94, 0.3)",
      delay: 0.2
    },
    {
      title: "Profit Factor",
      value: stats.profitFactor,
      formattedValue: stats.profitFactor.toFixed(2),
      description: `Avg Win/Loss ratio`,
      icon: BarChart3,
      trend: stats.profitFactor >= 1 ? "up" : "down",
      color: stats.profitFactor >= 1 ? "purple" : "amber",
      gradient: stats.profitFactor >= 1
        ? "bg-gradient-to-br from-purple-500 to-indigo-600"
        : "bg-gradient-to-br from-amber-500 to-orange-600",
      glowColor: stats.profitFactor >= 1
        ? "rgba(147, 51, 234, 0.3)"
        : "rgba(245, 158, 11, 0.3)",
      delay: 0.3
    },
    {
      title: "Best Trade",
      value: stats.maxWin,
      formattedValue: formatCurrency(stats.maxWin),
      description: "Largest winning trade",
      icon: TrendingUp,
      trend: "up",
      color: "green",
      gradient: "bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600",
      glowColor: "rgba(52, 211, 153, 0.4)",
      delay: 0.4
    },
    {
      title: "Worst Trade",
      value: Math.abs(stats.maxLoss),
      formattedValue: formatCurrency(Math.abs(stats.maxLoss)),
      description: "Largest losing trade",
      icon: TrendingDown,
      trend: "down",
      color: "red",
      gradient: "bg-gradient-to-br from-rose-400 via-red-500 to-pink-600",
      glowColor: "rgba(251, 113, 133, 0.4)",
      delay: 0.5
    }
  ];

  return (
    <motion.div
      className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {cards.map((card, index) => (
        <AnimatedStatCard key={index} card={card} index={index} />
      ))}
    </motion.div>
  );
}

export default AnimatedStatsCards;