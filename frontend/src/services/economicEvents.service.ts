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
   * Calculate time until event
   */
  getTimeUntilEvent(eventTime: string): string {
    const now = new Date();
    const eventDate = new Date(eventTime);
    const diffMs = eventDate.getTime() - now.getTime();

    // Event has passed
    if (diffMs <= 0) {
      const pastMs = Math.abs(diffMs);
      const pastMinutes = Math.floor(pastMs / (1000 * 60));

      // Show "Live" for events within the last 15 minutes
      if (pastMinutes <= 15) {
        return 'Live';
      }

      // Show "Past" for events that happened more than 15 minutes ago
      return 'Past';
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24);
      return `in ${diffDays}d`;
    } else if (diffHours > 0) {
      return `in ${diffHours}h ${diffMinutes}m`;
    } else {
      return `in ${diffMinutes}m`;
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