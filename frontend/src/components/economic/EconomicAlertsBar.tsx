import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Calendar, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useEconomicEvents,
  useEconomicEventsModal,
  useEconomicEventsActions
} from '@/store/economicEventsStore';
import { economicEventsService } from '@/services/economicEvents.service';
import { ImpactBadge } from './ImpactBadge';
import { cn } from '@/lib/utils';

interface EconomicAlertsBarProps {
  className?: string;
}

export function EconomicAlertsBar({ className }: EconomicAlertsBarProps) {
  const {
    nextEvent,
    highImpactCount,
    isLoading,
    error,
    lastUpdated,
    apiKeyConfigured
  } = useEconomicEvents();

  const { openModal } = useEconomicEventsModal();
  const { refreshAllEvents, startAutoRefresh, stopAutoRefresh } = useEconomicEventsActions();

  // Initialize and auto-refresh
  useEffect(() => {
    refreshAllEvents();
    startAutoRefresh();

    return () => {
      stopAutoRefresh();
    };
  }, [refreshAllEvents, startAutoRefresh, stopAutoRefresh]);

  // Handle click to open modal
  const handleClick = () => {
    openModal();
  };

  // Show error state
  if (error && !apiKeyConfigured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg',
          className
        )}
      >
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <span className="text-sm text-amber-700 dark:text-amber-300">
          Economic calendar unavailable - API key not configured
        </span>
      </motion.div>
    );
  }

  // Loading skeleton
  if (isLoading && !lastUpdated) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex items-center gap-2', className)}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className={cn(
          'h-auto p-2 gap-2 hover:bg-background/80 transition-all duration-200',
          'border border-border/50 hover:border-border',
          'focus:ring-2 focus:ring-ring focus:ring-offset-2'
        )}
      >
        {/* Bell icon with notification dot */}
        <div className="relative">
          <motion.div
            animate={isLoading ? { rotate: [0, 10, -10, 0] } : {}}
            transition={{ duration: 0.5, repeat: isLoading ? Infinity : 0 }}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Bell className="h-4 w-4 text-muted-foreground" />
            )}
          </motion.div>

          {highImpactCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1"
            >
              <Badge
                variant="destructive"
                className="h-2 w-2 rounded-full p-0 animate-pulse"
              >
                <span className="sr-only">{highImpactCount} high impact events</span>
              </Badge>
            </motion.div>
          )}
        </div>

        {/* Events count and summary */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Economic Events</span>

          {highImpactCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Badge variant="secondary" className="text-xs">
                {highImpactCount}
              </Badge>
            </motion.div>
          )}
        </div>

        {/* Next event preview */}
        <AnimatePresence mode="wait">
          {nextEvent && (
            <motion.div
              key={nextEvent.event}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2 text-sm border-l border-border/50 pl-2"
            >
              <span className="text-muted-foreground">Next:</span>

              <div className="flex items-center gap-1.5">
                <span className="font-medium text-foreground truncate max-w-32">
                  {nextEvent.event}
                </span>

                <span className="text-muted-foreground text-xs">
                  {economicEventsService.getTimeUntilEvent(nextEvent.time)}
                </span>

                <ImpactBadge
                  impact={nextEvent.impact}
                  showIcon={false}
                  className="scale-90"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expand indicator */}
        <motion.div
          className="ml-1"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Calendar className="h-3 w-3 text-muted-foreground" />
        </motion.div>
      </Button>

      {/* Last updated indicator */}
      {lastUpdated && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xs text-muted-foreground/70"
        >
          Updated {lastUpdated.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </motion.div>
      )}
    </motion.div>
  );
}