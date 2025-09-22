import { api } from './api';

export interface EconomicEvent {
  country: string;
  currency: string;
  event: string;
  time: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  actual?: string | number;
  estimate?: string | number;
  previous?: string | number;
  relevance?: string;
}

export interface EconomicEventsResponse {
  events: EconomicEvent[];
  message?: string;
  apiKeyConfigured: boolean;
}

class EconomicEventsService {
  /**
   * Get today's economic events
   */
  async getTodayEvents(): Promise<EconomicEventsResponse> {
    try {
      const response = await api.get('/api/economic-events/today');
      // Backend now returns { events, apiKeyConfigured, usingDemoData, data }
      return {
        events: response.data.events || [],
        apiKeyConfigured: response.data.apiKeyConfigured ?? true,
        message: response.data.usingDemoData ? 'Using demo data for testing purposes' : undefined
      };
    } catch (error) {
      console.error('Error fetching today events:', error);
      throw new Error('Failed to fetch today\'s economic events');
    }
  }

  /**
   * Get upcoming economic events (next 7 days)
   */
  async getUpcomingEvents(): Promise<EconomicEventsResponse> {
    try {
      const response = await api.get('/api/economic-events/upcoming');
      // Backend now returns { events, apiKeyConfigured, usingDemoData, data }
      return {
        events: response.data.events || [],
        apiKeyConfigured: response.data.apiKeyConfigured ?? true,
        message: response.data.usingDemoData ? 'Using demo data for testing purposes' : undefined
      };
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      throw new Error('Failed to fetch upcoming economic events');
    }
  }

  /**
   * Get high impact events only
   */
  async getHighImpactEvents(): Promise<EconomicEventsResponse> {
    try {
      const response = await api.get('/api/economic-events/high-impact');
      // Backend now returns { events, apiKeyConfigured, usingDemoData, data }
      return {
        events: response.data.events || [],
        apiKeyConfigured: response.data.apiKeyConfigured ?? true,
        message: response.data.usingDemoData ? 'Using demo data for testing purposes' : undefined
      };
    } catch (error) {
      console.error('Error fetching high impact events:', error);
      throw new Error('Failed to fetch high impact events');
    }
  }

  /**
   * Filter events by impact level
   */
  filterEventsByImpact(events: EconomicEvent[], impact: 'HIGH' | 'MEDIUM' | 'LOW'): EconomicEvent[] {
    return events.filter(event => event.impact === impact);
  }

  /**
   * Get high impact events from a list
   */
  getHighImpactOnly(events: EconomicEvent[]): EconomicEvent[] {
    return this.filterEventsByImpact(events, 'HIGH');
  }

  /**
   * Sort events by time (earliest first)
   */
  sortEventsByTime(events: EconomicEvent[]): EconomicEvent[] {
    return [...events].sort((a, b) => {
      const timeA = new Date(a.time).getTime();
      const timeB = new Date(b.time).getTime();
      return timeA - timeB;
    });
  }

  /**
   * Get the next upcoming event
   */
  getNextEvent(events: EconomicEvent[]): EconomicEvent | null {
    const now = new Date();
    const upcomingEvents = events
      .filter(event => new Date(event.time) > now)
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    return upcomingEvents.length > 0 ? upcomingEvents[0] : null;
  }

  /**
   * Calculate time until event - IMPROVED ACCURACY
   */
  getTimeUntilEvent(eventTime: string): string {
    const now = new Date();
    const eventDate = new Date(eventTime);
    const diffMs = eventDate.getTime() - now.getTime();

    // Event has passed
    if (diffMs <= 0) {
      const pastMs = Math.abs(diffMs);
      const pastMinutes = Math.floor(pastMs / (1000 * 60));
      const pastHours = Math.floor(pastMs / (1000 * 60 * 60));

      // Show "Live" for events within the last 15 minutes
      if (pastMinutes <= 15) {
        return 'Live';
      }

      // Show specific time passed for recent events
      if (pastHours < 1) {
        return `${pastMinutes}m ago`;
      } else if (pastHours < 24) {
        return `${pastHours}h ago`;
      } else {
        const pastDays = Math.floor(pastHours / 24);
        return `${pastDays}d ago`;
      }
    }

    // Event is in the future
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return `in ${diffDays}d`;
    } else if (diffHours > 0) {
      const remainingMinutes = diffMinutes % 60;
      if (remainingMinutes > 0) {
        return `in ${diffHours}h ${remainingMinutes}m`;
      } else {
        return `in ${diffHours}h`;
      }
    } else if (diffMinutes > 0) {
      return `in ${diffMinutes}m`;
    } else if (diffSeconds > 0) {
      return `in ${diffSeconds}s`;
    } else {
      return 'Now';
    }
  }

  /**
   * Format event time for display
   */
  formatEventTime(eventTime: string): string {
    const date = new Date(eventTime);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  /**
   * Check if event is happening today
   */
  isToday(eventTime: string): boolean {
    const today = new Date();
    const eventDate = new Date(eventTime);
    return today.toDateString() === eventDate.toDateString();
  }
}

export const economicEventsService = new EconomicEventsService();