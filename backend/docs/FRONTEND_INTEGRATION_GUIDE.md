# Frontend Integration Guide - Economic Events

## Quick Start

### 1. Add Finnhub API Key
First, get your free API key from [Finnhub.io](https://finnhub.io/register) and add it to your backend `.env` file:

```env
FINNHUB_API_KEY=your_api_key_here
```

### 2. Frontend Service

Create a service to interact with the economic events API:

```typescript
// services/economicEvents.service.ts
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface EconomicEvent {
  id: string;
  event: string;
  time: string;
  date: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  actual: number | null;
  estimate: number | null;
  previous: number | null;
  unit?: string;
  relevance: string;
  country: string;
}

export const economicEventsService = {
  // Get today's events
  getTodayEvents: async (): Promise<EconomicEvent[]> => {
    const response = await axios.get(`${API_BASE}/economic-events/today`);
    return response.data.data.events;
  },

  // Get upcoming events (default 7 days)
  getUpcomingEvents: async (days = 7): Promise<EconomicEvent[]> => {
    const response = await axios.get(`${API_BASE}/economic-events/upcoming`, {
      params: { days }
    });
    return response.data.data.events;
  },

  // Get high impact events only
  getHighImpactEvents: async (): Promise<EconomicEvent[]> => {
    const response = await axios.get(`${API_BASE}/economic-events/high-impact`);
    return response.data.data.events;
  },

  // Filter events
  filterEvents: async (filters: {
    startDate?: string;
    endDate?: string;
    impact?: ('HIGH' | 'MEDIUM' | 'LOW')[];
    events?: string[];
  }): Promise<EconomicEvent[]> => {
    const response = await axios.post(`${API_BASE}/economic-events/filter`, filters);
    return response.data.data.events;
  }
};
```

### 3. React Component Example

```tsx
// components/EconomicCalendar.tsx
import React, { useEffect, useState } from 'react';
import { economicEventsService, EconomicEvent } from '@/services/economicEvents.service';
import { format } from 'date-fns';

export const EconomicCalendar: React.FC = () => {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const todayEvents = await economicEventsService.getTodayEvents();
        setEvents(todayEvents);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'HIGH':
        return 'text-red-600 bg-red-50';
      case 'MEDIUM':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) return <div>Loading economic events...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (events.length === 0) return <div>No economic events today</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Today's Economic Events (ES/NQ Relevant)</h3>

      <div className="space-y-2">
        {events.map(event => (
          <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium">{event.event}</h4>
                <p className="text-sm text-gray-600 mt-1">{event.relevance}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(event.impact)}`}>
                  {event.impact}
                </span>
                <span className="text-sm text-gray-500">
                  {format(new Date(event.time), 'HH:mm')}
                </span>
              </div>
            </div>

            <div className="mt-3 flex gap-4 text-sm">
              {event.previous !== null && (
                <div>
                  <span className="text-gray-500">Previous:</span> {event.previous}{event.unit}
                </div>
              )}
              {event.estimate !== null && (
                <div>
                  <span className="text-gray-500">Estimate:</span> {event.estimate}{event.unit}
                </div>
              )}
              {event.actual !== null && (
                <div>
                  <span className="text-gray-500">Actual:</span>{' '}
                  <span className="font-medium">{event.actual}{event.unit}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 4. Dashboard Integration

Add the economic calendar to your trading dashboard:

```tsx
// pages/Dashboard.tsx
import { EconomicCalendar } from '@/components/EconomicCalendar';

export const Dashboard = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Your existing dashboard components */}

      {/* Economic Events Section */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Market Events</CardTitle>
            <CardDescription>
              Economic events that impact ES & NQ futures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EconomicCalendar />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
```

### 5. Advanced: Event Alerts

Create a component to alert traders about upcoming high-impact events:

```tsx
// components/EventAlert.tsx
import React, { useEffect, useState } from 'react';
import { economicEventsService, EconomicEvent } from '@/services/economicEvents.service';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { differenceInMinutes } from 'date-fns';

export const EventAlert: React.FC = () => {
  const [upcomingHighImpact, setUpcomingHighImpact] = useState<EconomicEvent | null>(null);

  useEffect(() => {
    const checkUpcomingEvents = async () => {
      try {
        const events = await economicEventsService.getTodayEvents();
        const highImpactEvents = events.filter(e => e.impact === 'HIGH');

        // Find next high impact event within 30 minutes
        const now = new Date();
        const upcoming = highImpactEvents.find(event => {
          const eventTime = new Date(event.time);
          const minutesUntil = differenceInMinutes(eventTime, now);
          return minutesUntil > 0 && minutesUntil <= 30;
        });

        setUpcomingHighImpact(upcoming || null);
      } catch (error) {
        console.error('Failed to check upcoming events', error);
      }
    };

    // Check immediately and then every 5 minutes
    checkUpcomingEvents();
    const interval = setInterval(checkUpcomingEvents, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (!upcomingHighImpact) return null;

  const minutesUntil = differenceInMinutes(
    new Date(upcomingHighImpact.time),
    new Date()
  );

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-900">
        <strong>High Impact Event in {minutesUntil} minutes:</strong> {upcomingHighImpact.event}
        <br />
        <span className="text-sm">
          Consider reducing position size or closing trades before this event
        </span>
      </AlertDescription>
    </Alert>
  );
};
```

### 6. Weekly Calendar View

```tsx
// components/WeeklyEconomicCalendar.tsx
import React, { useEffect, useState } from 'react';
import { economicEventsService, EconomicEvent } from '@/services/economicEvents.service';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

export const WeeklyEconomicCalendar: React.FC = () => {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeeklyEvents = async () => {
      try {
        const upcomingEvents = await economicEventsService.getUpcomingEvents(7);
        setEvents(upcomingEvents);
      } catch (error) {
        console.error('Failed to load weekly events', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyEvents();
  }, []);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)); // Mon-Fri

  const getEventsForDay = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), date));
  };

  if (loading) return <div>Loading weekly calendar...</div>;

  return (
    <div className="grid grid-cols-5 gap-2">
      {weekDays.map(day => {
        const dayEvents = getEventsForDay(day);

        return (
          <div key={day.toString()} className="border rounded-lg p-2">
            <div className="font-medium text-sm mb-2">
              {format(day, 'EEE, MMM d')}
            </div>

            <div className="space-y-1">
              {dayEvents.length === 0 ? (
                <div className="text-xs text-gray-400">No events</div>
              ) : (
                dayEvents.map(event => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded ${
                      event.impact === 'HIGH'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    <div className="font-medium">{format(new Date(event.time), 'HH:mm')}</div>
                    <div className="truncate">{event.event}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
```

## Trading Integration Tips

### 1. Pre-Trade Check
Before entering a trade, check for upcoming economic events:

```typescript
const checkForUpcomingEvents = async (minutesAhead = 60): Promise<boolean> => {
  const events = await economicEventsService.getTodayEvents();
  const now = new Date();

  return events.some(event => {
    const eventTime = new Date(event.time);
    const minutesUntil = (eventTime.getTime() - now.getTime()) / 60000;
    return minutesUntil > 0 && minutesUntil <= minutesAhead && event.impact === 'HIGH';
  });
};
```

### 2. Position Size Adjustment
Reduce position size when high-impact events are approaching:

```typescript
const getPositionSizeMultiplier = async (): Promise<number> => {
  const hasUpcomingEvent = await checkForUpcomingEvents(30);

  if (hasUpcomingEvent) {
    return 0.5; // Reduce position size by 50%
  }

  return 1.0; // Normal position size
};
```

### 3. Event Impact Colors
Use consistent colors for impact levels:

```typescript
export const impactConfig = {
  HIGH: {
    color: 'red',
    bgColor: 'bg-red-50',
    textColor: 'text-red-600',
    borderColor: 'border-red-200',
    description: 'Major market-moving event'
  },
  MEDIUM: {
    color: 'orange',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-200',
    description: 'Moderate market impact'
  },
  LOW: {
    color: 'gray',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-200',
    description: 'Minor market impact'
  }
};
```

## Error Handling

Always handle API errors gracefully:

```typescript
const [apiError, setApiError] = useState<string | null>(null);

const handleApiError = (error: any) => {
  if (error.response?.data?.error?.includes('API key')) {
    setApiError('Economic events service not configured. Contact administrator.');
  } else if (error.response?.status === 429) {
    setApiError('Rate limit exceeded. Please try again later.');
  } else {
    setApiError('Failed to load economic events.');
  }
};
```

## Caching Strategy

The backend implements a 30-minute cache. Consider implementing frontend caching as well:

```typescript
import { create } from 'zustand';

interface EconomicEventsStore {
  events: EconomicEvent[];
  lastFetch: Date | null;
  fetchEvents: () => Promise<void>;
}

export const useEconomicEvents = create<EconomicEventsStore>((set, get) => ({
  events: [],
  lastFetch: null,

  fetchEvents: async () => {
    const { lastFetch } = get();
    const now = new Date();

    // Use cached data if less than 5 minutes old
    if (lastFetch && (now.getTime() - lastFetch.getTime()) < 5 * 60 * 1000) {
      return;
    }

    const events = await economicEventsService.getTodayEvents();
    set({ events, lastFetch: now });
  }
}));
```