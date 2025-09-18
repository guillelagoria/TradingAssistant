import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ImpactBadgeProps {
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  className?: string;
  showIcon?: boolean;
}

const impactConfig = {
  HIGH: {
    label: 'High',
    icon: '🔴',
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    pulse: true
  },
  MEDIUM: {
    label: 'Medium',
    icon: '🟡',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
    pulse: false
  },
  LOW: {
    label: 'Low',
    icon: '🟢',
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    pulse: false
  }
};

export function ImpactBadge({ impact, className, showIcon = true }: ImpactBadgeProps) {
  const config = impactConfig[impact];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Badge
        variant="outline"
        className={cn(
          'text-xs font-medium px-2 py-1 relative',
          config.className,
          className
        )}
      >
        {config.pulse && (
          <motion.div
            className="absolute inset-0 rounded-full bg-red-400 opacity-75"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.75, 0.3, 0.75]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
        <span className="relative z-10 flex items-center gap-1">
          {showIcon && (
            <span className="text-xs">{config.icon}</span>
          )}
          {config.label}
        </span>
      </Badge>
    </motion.div>
  );
}