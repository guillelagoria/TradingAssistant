import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Filter, RefreshCw, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useEconomicEvents,
  useEconomicEventsModal,
  useEconomicEventsActions
} from '@/store/economicEventsStore';
import { EconomicEvent } from '@/services/economicEvents.service';
import { ImpactBadge } from './ImpactBadge';
import { EventTimeDisplay } from './EventTimeDisplay';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: EconomicEvent;
  index: number;
}

function EventCard({ event, index }: EventCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="hover:shadow-md transition-all duration-200 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Event info */}
            <div className="flex-1 space-y-2">
              <div className="flex items-start gap-2">
                <h4 className="font-semibold text-foreground leading-tight">
                  {event.event}
                </h4>
                <ImpactBadge impact={event.impact} />
              </div>

              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="font-medium">{event.country}</span>
                  <span>({event.currency})</span>
                </span>
              </div>

              {/* Relevance explanation */}
              {event.relevance && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-xs text-muted-foreground bg-muted/50 rounded p-2"
                >
                  <div className="flex items-start gap-1">
                    <TrendingUp className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>{event.relevance}</span>
                  </div>
                </motion.div>
              )}

              {/* Economic data */}
              {(event.previous || event.estimate || event.actual) && (
                <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-border/50">
                  <div className="text-center">
                    <div className="text-muted-foreground">Previous</div>
                    <div className="font-medium">
                      {event.previous !== undefined ? event.previous : '-'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground">Estimate</div>
                    <div className="font-medium">
                      {event.estimate !== undefined ? event.estimate : '-'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground">Actual</div>
                    <div className={cn(
                      'font-medium',
                      event.actual !== undefined
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-muted-foreground'
                    )}>
                      {event.actual !== undefined ? event.actual : '-'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Time display */}
            <div className="flex-shrink-0">
              <EventTimeDisplay
                eventTime={event.time}
                showRelativeTime
                size="sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EventsLoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
              <div className="flex-shrink-0">
                <Skeleton className="h-12 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function EconomicCalendarModal() {
  const { events, isLoading, error, lastUpdated, apiKeyConfigured } = useEconomicEvents();
  const {
    isOpen,
    activeTab,
    showHighImpactOnly,
    closeModal,
    setActiveTab,
    toggleHighImpactFilter
  } = useEconomicEventsModal();
  const { refreshAllEvents } = useEconomicEventsActions();

  const handleRefresh = () => {
    refreshAllEvents();
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Economic Calendar
          </DialogTitle>
          <DialogDescription>
            Track high-impact economic events that may affect ES/NQ trading
          </DialogDescription>
        </DialogHeader>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4 py-4 border-b">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'today' | 'week')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            {/* High Impact Filter */}
            <Button
              variant={showHighImpactOnly ? "default" : "outline"}
              size="sm"
              onClick={toggleHighImpactFilter}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              High Impact Only
            </Button>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* API Key Warning */}
          {!apiKeyConfigured && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-800 dark:text-amber-200">
                    Economic Calendar Unavailable
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    The Finnhub API key is not configured. Please contact your administrator to enable economic events tracking.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Error State */}
          {error && apiKeyConfigured && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">Failed to Load Events</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </motion.div>
          )}

          {/* Loading State */}
          {isLoading && !lastUpdated && (
            <EventsLoadingSkeleton />
          )}

          {/* Events List */}
          {!error && !isLoading && events.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <AnimatePresence>
                {events.map((event, index) => (
                  <EventCard
                    key={`${event.event}-${event.time}-${index}`}
                    event={event}
                    index={index}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Empty State */}
          {!error && !isLoading && events.length === 0 && apiKeyConfigured && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">No Events Found</h3>
              <p className="text-sm text-muted-foreground">
                {showHighImpactOnly
                  ? 'No high-impact economic events found for the selected period.'
                  : 'No economic events found for the selected period.'
                }
              </p>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        {lastUpdated && (
          <div className="flex items-center justify-between pt-4 border-t text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last updated: {lastUpdated.toLocaleString()}
            </span>
            <span>Powered by Finnhub</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}