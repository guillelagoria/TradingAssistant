/**
 * ImportStatsCard Component
 * Animated stat card for import validation results
 */

import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, XCircle, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface ImportStatsCardProps {
  count: number;
  label: string;
  status: 'success' | 'warning' | 'error';
  className?: string;
}

const statusConfig: Record<
  'success' | 'warning' | 'error',
  {
    icon: LucideIcon;
    bgGradient: string;
    textColor: string;
    borderColor: string;
    glowColor: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    bgGradient: 'from-green-500/10 via-green-500/5 to-transparent',
    textColor: 'text-green-600 dark:text-green-400',
    borderColor: 'border-green-500/20 dark:border-green-400/20',
    glowColor: 'shadow-green-500/20',
  },
  warning: {
    icon: AlertCircle,
    bgGradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
    textColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-500/20 dark:border-amber-400/20',
    glowColor: 'shadow-amber-500/20',
  },
  error: {
    icon: XCircle,
    bgGradient: 'from-red-500/10 via-red-500/5 to-transparent',
    textColor: 'text-red-600 dark:text-red-400',
    borderColor: 'border-red-500/20 dark:border-red-400/20',
    glowColor: 'shadow-red-500/20',
  },
};

export function ImportStatsCard({ count, label, status, className }: ImportStatsCardProps) {
  const [displayCount, setDisplayCount] = useState(0);
  const config = statusConfig[status];
  const Icon = config.icon;

  // Animated counter effect
  useEffect(() => {
    const duration = 800;
    const steps = 30;
    const stepValue = count / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayCount(count);
        clearInterval(interval);
      } else {
        setDisplayCount(Math.floor(stepValue * currentStep));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [count]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
      }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        'relative overflow-hidden rounded-xl border bg-card/50 backdrop-blur-sm',
        'transition-all duration-300',
        config.borderColor,
        config.glowColor,
        'hover:shadow-lg',
        className
      )}
    >
      {/* Gradient Background */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-50',
          config.bgGradient
        )}
      />

      {/* Content */}
      <div className="relative p-6 flex flex-col items-center justify-center space-y-3">
        {/* Icon */}
        <div
          className={cn(
            'p-3 rounded-full',
            status === 'success' && 'bg-green-500/10',
            status === 'warning' && 'bg-amber-500/10',
            status === 'error' && 'bg-red-500/10'
          )}
        >
          <Icon className={cn('h-6 w-6', config.textColor)} />
        </div>

        {/* Count */}
        <motion.div
          key={displayCount}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className={cn('text-4xl font-bold tabular-nums', config.textColor)}
        >
          {displayCount}
        </motion.div>

        {/* Label */}
        <div className="text-sm font-medium text-muted-foreground text-center">
          {label}
        </div>
      </div>
    </motion.div>
  );
}
