import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAccountStats } from '@/store/accountStore';
import { cn } from '@/lib/utils';
import { motion, useInView, useSpring, useTransform, useMotionValue } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Target,
  Activity,
  Flame,
  Zap
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
  color: 'green' | 'red' | 'slate' | 'amber' | 'default';
  gradient: string;
  delay: number;
  // For streak cards
  currentValue?: number;
  maxValue?: number;
}

// Animated Counter Component - Professional, subtle animation
function AnimatedCounter({
  value,
  duration = 1.5,
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
    bounce: 0.1 // Minimal bounce for professional feel
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

  return <span ref={ref} className="tabular-nums">{prefix}0{suffix}</span>;
}

// Individual Professional Stat Card with subtle hover
function ProfessionalStatCard({ card, index }: { card: StatCardData; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false); // false = show max, true = show current
  const Icon = card.icon;

  // Handle card click for streak cards
  const handleClick = () => {
    if (card.title === "Win Streak" || card.title === "Loss Streak") {
      setShowCurrent(!showCurrent);
    }
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        duration: 0.6,
        delay: card.delay,
        stiffness: 120,
        damping: 15
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleClick}
      style={{
        cursor: (card.title === "Win Streak" || card.title === "Loss Streak") ? "pointer" : "default"
      }}
    >
      <Card className={cn(
        "relative overflow-hidden border-none",
        "bg-gradient-to-br from-card to-card/95",
        "shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-primary/10",
        "transition-all duration-300",
        "min-h-[140px] flex flex-col"
      )}>
        {/* Subtle top accent border */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-[2px]",
          card.gradient,
          "opacity-60"
        )} />

        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-5">
          <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground letter-spacing-wide">
            {card.title}
          </CardTitle>

          {/* Badge for streak cards showing current mode */}
          <div className="flex items-center gap-2">
            {(card.title === "Win Streak" || card.title === "Loss Streak") && (
              <motion.span
                className={cn(
                  "px-1.5 py-0.5 text-[9px] font-semibold rounded uppercase tracking-wider",
                  showCurrent
                    ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                )}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {showCurrent ? "NOW" : "MAX"}
              </motion.span>
            )}
            <Icon className={cn(
              "h-4 w-4",
              card.color === "green" && "text-profit",
              card.color === "red" && "text-loss",
              card.color === "slate" && "text-slate-600 dark:text-slate-400",
              card.color === "amber" && "text-amber-600 dark:text-amber-400",
              card.color === "default" && "text-muted-foreground"
            )} />
          </div>
        </CardHeader>

        <CardContent className="relative flex-1 flex flex-col justify-between px-6 pb-5 pt-2">
          <div className="flex items-baseline gap-3">
            {/* LARGE PROFESSIONAL NUMBER */}
            <motion.div
              className={cn(
                "text-3xl font-bold tracking-tight font-mono tabular-nums",
                card.color === "green" && "text-profit",
                card.color === "red" && "text-loss",
                card.color === "slate" && "text-foreground",
                card.color === "amber" && "text-amber-700 dark:text-amber-400",
                card.color === "default" && "text-foreground"
              )}
              initial={{ scale: 1 }}
              animate={isHovered ? { scale: 1.02 } : { scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {/* For streak cards, show dynamic value based on toggle state */}
              {card.title === "Win Streak" || card.title === "Loss Streak"
                ? (showCurrent
                    ? (card.currentValue || 0).toString()
                    : (card.maxValue || 0).toString())
                : (card.formattedValue || card.value)
              }
            </motion.div>

            {/* Subtle trend indicator */}
            {card.trend && (
              <motion.div
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: card.delay + 0.2 }}
              >
                <div className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border",
                  card.trend === "up"
                    ? "profit-bg text-profit border-profit/20"
                    : "loss-bg text-loss border-loss/20"
                )}>
                  {card.trend === "up" ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                </div>
              </motion.div>
            )}
          </div>

          <motion.p
            className="text-xs text-muted-foreground mt-2 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: card.delay + 0.3 }}
          >
            {/* For streak cards, show dynamic description */}
            {card.title === "Win Streak" || card.title === "Loss Streak"
              ? (showCurrent
                  ? `Current streak • Max: ${card.maxValue || 0}`
                  : `Historical max • Current: ${card.currentValue || 0}`)
              : card.description
            }
          </motion.p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AnimatedStatsCards({ className }: AnimatedStatsCardsProps) {
  const stats = useAccountStats();

  // Use default values if stats are not available
  const defaultStats = {
    totalTrades: 0,
    winRate: 0,
    totalNetPnL: 0,
    profitFactor: 0,
    avgWin: 0,
    avgLoss: 0,
    maxWinStreak: 0,
    maxLossStreak: 0,
    currentWinStreak: 0,
    currentLossStreak: 0
  };

  const displayStats = stats || defaultStats;

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

  const cards: StatCardData[] = [
    {
      title: "Total Trades",
      value: displayStats.totalTrades || 0,
      formattedValue: (displayStats.totalTrades || 0).toString(),
      description: `${Math.round((displayStats.totalTrades || 0) * (displayStats.winRate || 0) / 100)} wins, ${Math.round((displayStats.totalTrades || 0) * (100 - (displayStats.winRate || 0)) / 100)} losses`,
      icon: Activity,
      trend: null,
      color: "slate",
      gradient: "bg-slate-600/60",
      delay: 0
    },
    {
      title: "Win Rate",
      value: displayStats.winRate || 0,
      formattedValue: formatPercentage(displayStats.winRate || 0),
      description: `${Math.round((displayStats.totalTrades || 0) * (displayStats.winRate || 0) / 100)} of ${displayStats.totalTrades || 0} trades`,
      icon: Target,
      trend: (displayStats.winRate || 0) >= 50 ? "up" : "down",
      color: (displayStats.winRate || 0) >= 50 ? "green" : "red",
      gradient: (displayStats.winRate || 0) >= 50
        ? "bg-profit/60"
        : "bg-loss/60",
      delay: 0.05
    },
    {
      title: "Total Net P&L",
      value: displayStats.totalNetPnL || 0,
      formattedValue: formatCurrency(displayStats.totalNetPnL || 0),
      description: `Net profit/loss total`,
      icon: DollarSign,
      trend: (displayStats.totalNetPnL || 0) >= 0 ? "up" : "down",
      color: (displayStats.totalNetPnL || 0) >= 0 ? "green" : "red",
      gradient: (displayStats.totalNetPnL || 0) >= 0
        ? "bg-profit/60"
        : "bg-loss/60",
      delay: 0.1
    },
    {
      title: "Profit Factor",
      value: displayStats.profitFactor || 0,
      formattedValue: (displayStats.profitFactor || 0).toFixed(2),
      description: `Win/Loss ratio factor`,
      icon: BarChart3,
      trend: (displayStats.profitFactor || 0) >= 1 ? "up" : "down",
      color: (displayStats.profitFactor || 0) >= 1.5 ? "amber" : "slate",
      gradient: (displayStats.profitFactor || 0) >= 1.5
        ? "bg-amber-600/60"
        : "bg-slate-600/60",
      delay: 0.15
    },
    {
      title: "Avg Win",
      value: displayStats.avgWin || 0,
      formattedValue: formatCurrency(displayStats.avgWin || 0),
      description: "Average winning trade",
      icon: TrendingUp,
      trend: "up",
      color: "green",
      gradient: "bg-profit/60",
      delay: 0.2
    },
    {
      title: "Avg Loss",
      value: Math.abs(displayStats.avgLoss || 0),
      formattedValue: formatCurrency(Math.abs(displayStats.avgLoss || 0)),
      description: "Average losing trade",
      icon: TrendingDown,
      trend: "down",
      color: "red",
      gradient: "bg-loss/60",
      delay: 0.25
    },
    {
      title: "Win Streak",
      value: displayStats.maxWinStreak || 0,
      formattedValue: (displayStats.maxWinStreak || 0).toString(),
      description: "Historical max",
      icon: Flame,
      trend: null,
      color: (displayStats.maxWinStreak || 0) > 0 ? "green" : "default",
      gradient: (displayStats.maxWinStreak || 0) > 0
        ? "bg-profit/60"
        : "bg-slate-600/60",
      delay: 0.3,
      currentValue: displayStats.currentWinStreak || 0,
      maxValue: displayStats.maxWinStreak || 0
    },
    {
      title: "Loss Streak",
      value: displayStats.maxLossStreak || 0,
      formattedValue: (displayStats.maxLossStreak || 0).toString(),
      description: "Historical max",
      icon: Zap,
      trend: null,
      color: (displayStats.maxLossStreak || 0) > 0 ? "red" : "default",
      gradient: (displayStats.maxLossStreak || 0) > 0
        ? "bg-loss/60"
        : "bg-slate-600/60",
      delay: 0.35,
      currentValue: displayStats.currentLossStreak || 0,
      maxValue: displayStats.maxLossStreak || 0
    }
  ];

  return (
    <motion.div
      className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {cards.map((card, index) => (
        <ProfessionalStatCard key={index} card={card} index={index} />
      ))}
    </motion.div>
  );
}

export default AnimatedStatsCards;
