import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Activity, DollarSign } from 'lucide-react';
import { useAccountStats } from '@/store/accountStore';
import { formatCurrency } from '@/utils/chartHelpers';
import { cn } from '@/lib/utils';

interface HeroMetricProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: any;
  trend?: 'up' | 'down';
  trendText?: string;
  gradient: string;
  textGradient?: string;
  delay: number;
}

function HeroMetric({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendText,
  gradient,
  textGradient,
  delay
}: HeroMetricProps) {
  return (
    <motion.div
      className={cn(
        "relative p-6 rounded-xl overflow-hidden",
        "bg-gradient-to-br from-background via-background to-muted/20",
        "border border-border/50 shadow-lg shadow-black/5"
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, type: "spring", stiffness: 100 }}
      whileHover={{ scale: 1.01, y: -2 }}
    >
      {/* Subtle gradient overlay on hover */}
      <div className={cn(
        "absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500",
        gradient
      )} />

      {/* Content */}
      <div className="relative z-10">
        {/* Header with icon */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            {title}
          </div>
          <Icon className="h-5 w-5 text-muted-foreground/70" />
        </div>

        {/* Large value - adjusted from 6xl to 5xl for better balance */}
        <div className={cn(
          "text-5xl font-bold mb-2 tabular-nums",
          textGradient || "text-foreground"
        )}>
          {value}
        </div>

        {/* Subtitle and trend */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {subtitle}
          </div>

          {trend && trendText && (
            <div className={cn(
              "flex items-center gap-1.5 text-sm font-medium",
              trend === 'up' ? "text-profit" : "text-loss"
            )}>
              {trend === 'up' ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{trendText}</span>
            </div>
          )}
        </div>
      </div>

      {/* Subtle border glow effect */}
      <div className={cn(
        "absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-500",
        "ring-1 ring-inset",
        trend === 'up' ? "ring-profit/20" : trend === 'down' ? "ring-loss/20" : "ring-border/30"
      )} />
    </motion.div>
  );
}

export function HeroMetrics() {
  const stats = useAccountStats();

  // Use default values if stats are not available
  const totalNetPnL = stats?.totalNetPnL || 0;
  const winRate = stats?.winRate || 0;
  const totalTrades = stats?.totalTrades || 0;

  // Calculate metrics
  const isProfit = totalNetPnL >= 0;
  const winCount = Math.round(totalTrades * (winRate / 100));
  const lossCount = totalTrades - winCount;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Total Net P&L */}
      <HeroMetric
        title="Total Net P&L"
        value={formatCurrency(totalNetPnL)}
        subtitle="All-time performance"
        icon={DollarSign}
        trend={isProfit ? 'up' : 'down'}
        trendText={isProfit ? "Profitable" : "In drawdown"}
        gradient={isProfit
          ? "bg-gradient-to-br from-emerald-500/10 via-green-400/5 to-transparent"
          : "bg-gradient-to-br from-rose-500/10 via-red-400/5 to-transparent"
        }
        textGradient={isProfit
          ? "bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 bg-clip-text text-transparent"
          : "bg-gradient-to-r from-rose-500 via-red-400 to-rose-500 bg-clip-text text-transparent"
        }
        delay={0}
      />

      {/* Win Rate */}
      <HeroMetric
        title="Win Rate"
        value={`${winRate.toFixed(1)}%`}
        subtitle={`${winCount} wins, ${lossCount} losses`}
        icon={Target}
        trend={winRate >= 50 ? 'up' : 'down'}
        trendText={winRate >= 50 ? "Above 50%" : "Below 50%"}
        gradient={winRate >= 50
          ? "bg-gradient-to-br from-blue-500/10 via-cyan-400/5 to-transparent"
          : "bg-gradient-to-br from-amber-500/10 via-yellow-400/5 to-transparent"
        }
        textGradient={winRate >= 50
          ? "bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 bg-clip-text text-transparent"
          : "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 bg-clip-text text-transparent"
        }
        delay={0.1}
      />

      {/* Total Trades */}
      <HeroMetric
        title="Total Trades"
        value={totalTrades}
        subtitle={`${winCount} wins, ${lossCount} losses`}
        icon={Activity}
        gradient="bg-gradient-to-br from-violet-500/10 via-purple-400/5 to-transparent"
        textGradient="bg-gradient-to-r from-violet-500 via-purple-400 to-violet-500 bg-clip-text text-transparent"
        delay={0.2}
      />
    </div>
  );
}
