import { motion } from 'framer-motion';
import { Clock, Calendar } from 'lucide-react';
import { economicEventsService } from '@/services/economicEvents.service';
import { cn } from '@/lib/utils';

interface EventTimeDisplayProps {
  eventTime: string;
  showRelativeTime?: boolean;
  showDate?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: {
    container: 'text-xs',
    icon: 'h-3 w-3',
    gap: 'gap-1'
  },
  md: {
    container: 'text-sm',
    icon: 'h-4 w-4',
    gap: 'gap-1.5'
  },
  lg: {
    container: 'text-base',
    icon: 'h-5 w-5',
    gap: 'gap-2'
  }
};

export function EventTimeDisplay({
  eventTime,
  showRelativeTime = true,
  showDate = false,
  className,
  size = 'md'
}: EventTimeDisplayProps) {
  const config = sizeConfig[size];
  const eventDate = new Date(eventTime);
  const isToday = economicEventsService.isToday(eventTime);
  const timeUntil = economicEventsService.getTimeUntilEvent(eventTime);
  const formattedTime = economicEventsService.formatEventTime(eventTime);
  const isLive = timeUntil === 'Live';
  const isPast = timeUntil.includes('ago');
  const isNow = timeUntil === 'Now';

  return (
    <div className={cn('flex flex-col', config.gap, className)}>
      {/* Main time display */}
      <motion.div
        className={cn(
          'flex items-center',
          config.gap,
          config.container,
          'text-muted-foreground'
        )}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Clock className={cn(config.icon, 'flex-shrink-0')} />
        <span className="font-medium">{formattedTime}</span>

        {showRelativeTime && (
          <motion.span
            className={cn(
              'font-semibold px-2 py-0.5 rounded-full text-xs',
              isLive || isNow
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : isPast
                ? 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            )}
            animate={(isLive || isNow) ? {
              scale: [1, 1.05, 1],
              opacity: [1, 0.8, 1]
            } : {}}
            transition={(isLive || isNow) ? {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            } : {}}
          >
            {timeUntil}
          </motion.span>
        )}
      </motion.div>

      {/* Date display (if not today or showDate is true) */}
      {(showDate || !isToday) && (
        <motion.div
          className={cn(
            'flex items-center',
            config.gap,
            'text-xs text-muted-foreground/70'
          )}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Calendar className={cn(config.icon)} />
          <span>
            {eventDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: eventDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
            })}
          </span>
        </motion.div>
      )}
    </div>
  );
}