import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Award, Zap, BarChart3, Flame } from 'lucide-react';
import { useAccountStats } from '@/store/accountStore';
import { formatCurrency } from '@/utils/chartHelpers';
import { cn } from '@/lib/utils';

interface StatRowProps {
  icon: any;
  label: string;
  value: string;
  color?: 'profit' | 'loss' | 'amber' | 'default';
  delay: number;
}

function StatRow({ icon: Icon, label, value, color = 'default', delay }: StatRowProps) {
  return (
    <motion.div
      className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          color === 'profit' && "bg-profit/10 text-profit",
          color === 'loss' && "bg-loss/10 text-loss",
          color === 'amber' && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
          color === 'default' && "bg-muted/50 text-muted-foreground"
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <span className={cn(
        "text-lg font-bold tabular-nums",
        color === 'profit' && "text-profit",
        color === 'loss' && "text-loss",
        color === 'amber' && "text-amber-600 dark:text-amber-400",
        color === 'default' && "text-foreground"
      )}>
        {value}
      </span>
    </motion.div>
  );
}

export function PerformanceStats() {
  const stats = useAccountStats();

  // Use default values if stats are not available
  const avgWin = stats?.avgWin || 0;
  const avgLoss = stats?.avgLoss || 0;
  const profitFactor = stats?.profitFactor || 0;
  const maxWinStreak = stats?.maxWinStreak || 0;

  return (
    <motion.div
      className="divide-y divide-border/30 rounded-xl bg-card/50 shadow-lg shadow-black/5 p-6 h-full flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      {/* Header */}
      <div className="pb-4 mb-4">
        <h3 className="text-base font-semibold tracking-tight">
          Key Metrics
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Performance indicators
        </p>
      </div>

      {/* Stats */}
      <StatRow
        icon={TrendingUp}
        label="Avg Win"
        value={formatCurrency(avgWin)}
        color="profit"
        delay={0.4}
      />

      <StatRow
        icon={TrendingDown}
        label="Avg Loss"
        value={formatCurrency(Math.abs(avgLoss))}
        color="loss"
        delay={0.45}
      />

      <StatRow
        icon={BarChart3}
        label="Profit Factor"
        value={profitFactor.toFixed(2)}
        color={profitFactor >= 1.5 ? 'amber' : 'default'}
        delay={0.5}
      />

      <StatRow
        icon={Flame}
        label="Best Win Streak"
        value={maxWinStreak.toString()}
        color={maxWinStreak > 0 ? 'profit' : 'default'}
        delay={0.55}
      />
    </motion.div>
  );
}
