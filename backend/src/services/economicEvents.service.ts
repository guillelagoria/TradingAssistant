/**
 * Economic Events Service
 * Fetches and filters economic calendar data from Finnhub API
 * Focuses on events relevant to ES (S&P 500) and NQ (NASDAQ) futures trading
 */

import axios from 'axios';
import NodeCache from 'node-cache';
import {
  EconomicEvent,
  FinnhubEconomicEvent,
  EconomicEventFilter,
  ES_NQ_RELEVANT_EVENTS,
  CACHE_CONFIG
} from '../types/economicEvents';

export class EconomicEventsService {
  private cache: NodeCache;
  private baseUrl: string = 'https://finnhub.io/api/v1';

  constructor() {
    // Initialize cache with TTL and check period
    this.cache = new NodeCache({
      stdTTL: CACHE_CONFIG.TTL,
      checkperiod: CACHE_CONFIG.CHECK_PERIOD,
      useClones: false
    });
  }

  /**
   * Get API key from environment (lazy loading to ensure env vars are loaded)
   */
  private getApiKey(): string {
    const apiKey = process.env.FINNHUB_API_KEY || '';
    if (!apiKey) {
      console.warn('WARNING: FINNHUB_API_KEY not set in environment variables');
    }
    return apiKey;
  }

  /**
   * Fetch economic calendar data from Finnhub
   */
  private async fetchEconomicCalendar(from: string, to: string): Promise<FinnhubEconomicEvent[]> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Finnhub API key not configured');
    }

    const cacheKey = `economic_calendar_${from}_${to}`;

    // Check cache first
    const cachedData = this.cache.get<FinnhubEconomicEvent[]>(cacheKey);
    if (cachedData) {
      console.log(`Returning cached economic events for ${from} to ${to}`);
      return cachedData;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/calendar/economic`, {
        params: {
          token: apiKey,
          from,
          to
        },
        timeout: 10000 // 10 second timeout
      });

      const events = response.data?.economicCalendar || [];

      // Cache the results
      this.cache.set(cacheKey, events);

      return events;
    } catch (error) {
      console.error('Error fetching economic calendar from Finnhub:', error);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid Finnhub API key');
        } else if (error.response?.status === 429) {
          throw new Error('Finnhub API rate limit exceeded');
        } else if (error.response?.status === 403) {
          // 403 Forbidden - API key doesn't have access to this endpoint
          console.warn('Finnhub API access denied (403). Will use demo data.');
          throw new Error('Finnhub API 403 - access denied');
        }
      }

      // For any other error, throw so it can be handled by the calling method
      console.warn('Finnhub API unavailable. Will use demo data.');
      throw new Error('Finnhub API unavailable');
    }
  }

  /**
   * Check if an event is relevant to ES/NQ futures
   */
  private isRelevantToESNQ(event: FinnhubEconomicEvent): boolean {
    // Only USA events
    if (event.country !== 'US') {
      return false;
    }

    // Only HIGH or MEDIUM impact
    const impact = event.impact?.toUpperCase();
    if (!impact || (impact !== 'HIGH' && impact !== 'MEDIUM')) {
      return false;
    }

    // Check if event matches our relevant events list
    const eventName = event.event.toLowerCase();
    return ES_NQ_RELEVANT_EVENTS.some(relevantEvent =>
      eventName.includes(relevantEvent.toLowerCase()) ||
      relevantEvent.toLowerCase().includes(eventName)
    );
  }

  /**
   * Transform Finnhub event to our internal format
   */
  private transformEvent(event: FinnhubEconomicEvent): EconomicEvent {
    // Parse the time string to Date object
    const eventDate = new Date(event.time);

    // Determine relevance description
    let relevance = 'Impacts broader market sentiment';

    const eventLower = event.event.toLowerCase();

    if (eventLower.includes('fomc') || eventLower.includes('fed') || eventLower.includes('rate')) {
      relevance = 'Direct impact on interest rates and market liquidity';
    } else if (eventLower.includes('cpi') || eventLower.includes('ppi') || eventLower.includes('pce')) {
      relevance = 'Inflation data affects Fed policy and market valuations';
    } else if (eventLower.includes('nfp') || eventLower.includes('payroll') || eventLower.includes('jobless')) {
      relevance = 'Employment data influences Fed decisions and economic outlook';
    } else if (eventLower.includes('gdp')) {
      relevance = 'Economic growth indicator affects overall market direction';
    } else if (eventLower.includes('pmi') || eventLower.includes('ism')) {
      relevance = 'Leading indicator of economic activity and business confidence';
    } else if (eventLower.includes('retail') || eventLower.includes('consumer')) {
      relevance = 'Consumer spending drives 70% of US economy';
    } else if (eventLower.includes('housing') || eventLower.includes('home')) {
      relevance = 'Housing market health affects broader economic sentiment';
    }

    return {
      id: `${event.country}_${event.time}_${event.event}`.replace(/\s+/g, '_'),
      event: event.event,
      time: event.time,
      date: eventDate,
      impact: event.impact.toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW',
      actual: event.actual ?? null,
      estimate: event.estimate ?? null,
      previous: event.previous ?? null,
      unit: event.unit,
      relevance,
      country: event.country
    };
  }

  /**
   * Get today's ES/NQ relevant economic events
   */
  async getTodayEvents(): Promise<{ events: EconomicEvent[]; apiKeyConfigured: boolean; usingDemoData: boolean }> {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const from = today.toISOString().split('T')[0];
    const to = tomorrow.toISOString().split('T')[0];

    let usingDemoData = false;
    let events: FinnhubEconomicEvent[] = [];
    const hasApiKey = !!this.getApiKey();

    try {
      events = await this.fetchEconomicCalendar(from, to);
    } catch (error: any) {
      // If it's a 403 or rate limit, use demo data (API key is configured but doesn't have access)
      // If it's missing API key, also use demo data
      if (error.message.includes('API key') || error.message.includes('403') || error.message.includes('rate limit')) {
        usingDemoData = true;
        events = this.generateDemoData(from, to);
      } else {
        throw error;
      }
    }

    const processedEvents = events
      .filter(event => this.isRelevantToESNQ(event))
      .map(event => this.transformEvent(event))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      events: processedEvents,
      apiKeyConfigured: hasApiKey,  // Show as configured if API key exists, even if using demo data
      usingDemoData
    };
  }

  /**
   * Get upcoming ES/NQ relevant economic events (next 7 days)
   */
  async getUpcomingEvents(days: number = 7): Promise<{ events: EconomicEvent[]; apiKeyConfigured: boolean; usingDemoData: boolean }> {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    const from = today.toISOString().split('T')[0];
    const to = endDate.toISOString().split('T')[0];

    let usingDemoData = false;
    let events: FinnhubEconomicEvent[] = [];
    const hasApiKey = !!this.getApiKey();

    try {
      events = await this.fetchEconomicCalendar(from, to);
    } catch (error: any) {
      // If it's a 403 or rate limit, use demo data (API key is configured but doesn't have access)
      // If it's missing API key, also use demo data
      if (error.message.includes('API key') || error.message.includes('403') || error.message.includes('rate limit')) {
        usingDemoData = true;
        events = this.generateDemoData(from, to);
      } else {
        throw error;
      }
    }

    const processedEvents = events
      .filter(event => this.isRelevantToESNQ(event))
      .map(event => this.transformEvent(event))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      events: processedEvents,
      apiKeyConfigured: hasApiKey,  // Show as configured if API key exists, even if using demo data
      usingDemoData
    };
  }

  /**
   * Get economic events with custom filters
   */
  async getFilteredEvents(filter: EconomicEventFilter): Promise<{ events: EconomicEvent[]; apiKeyConfigured: boolean; usingDemoData: boolean }> {
    const startDate = filter.startDate || new Date();
    const endDate = filter.endDate || new Date(new Date().setDate(new Date().getDate() + 7));

    const from = startDate.toISOString().split('T')[0];
    const to = endDate.toISOString().split('T')[0];

    let usingDemoData = false;
    let events: FinnhubEconomicEvent[] = [];
    const hasApiKey = !!this.getApiKey();

    try {
      events = await this.fetchEconomicCalendar(from, to);
    } catch (error: any) {
      // If it's a 403 or rate limit, use demo data (API key is configured but doesn't have access)
      // If it's missing API key, also use demo data
      if (error.message.includes('API key') || error.message.includes('403') || error.message.includes('rate limit')) {
        usingDemoData = true;
        events = this.generateDemoData(from, to);
      } else {
        throw error;
      }
    }

    let filteredEvents = events
      .filter(event => {
        // Country filter (always US for ES/NQ)
        if (event.country !== 'US') return false;

        // Impact filter
        if (filter.impact && filter.impact.length > 0) {
          const eventImpact = event.impact?.toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW';
          if (!filter.impact.includes(eventImpact)) return false;
        }

        // Event type filter
        if (filter.events && filter.events.length > 0) {
          const eventName = event.event.toLowerCase();
          const matches = filter.events.some(filterEvent =>
            eventName.includes(filterEvent.toLowerCase())
          );
          if (!matches) return false;
        }

        return true;
      })
      .map(event => this.transformEvent(event));

    const processedEvents = filteredEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      events: processedEvents,
      apiKeyConfigured: hasApiKey,  // Show as configured if API key exists, even if using demo data
      usingDemoData
    };
  }

  /**
   * Clear the cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.cache.flushAll();
    console.log('Economic events cache cleared');
  }

  /**
   * Generate demo economic events for testing purposes - REALISTIC TIME AWARE
   */
  private generateDemoData(from: string, to: string): FinnhubEconomicEvent[] {
    const now = new Date();

    // Parse the requested date range
    const fromDate = new Date(from);
    const toDate = new Date(to);

    console.log(`Generating demo data for ${from} to ${to}, current time: ${now.toISOString()}`);

    // Helper function to create a date with specific time in ET (Eastern Time)
    const createEventTime = (baseDate: Date, hour: number, minute: number): Date => {
      const eventTime = new Date(baseDate);
      // Economic events are typically published in ET (Eastern Time)
      // ET is UTC-5 (EST) or UTC-4 (EDT) depending on daylight saving
      // For September, we're in EDT (UTC-4)
      // So 8:30 AM ET = 12:30 UTC (during EDT)
      eventTime.setUTCHours(hour, minute, 0, 0);
      return eventTime;
    };

    // Helper to check if event should have actual data (if time has passed)
    const shouldHaveActual = (eventTime: Date): boolean => {
      return now > new Date(eventTime.getTime() + 15 * 60 * 1000); // 15 min buffer
    };

    const demoEvents: FinnhubEconomicEvent[] = [];

    // Generate events for each day in the range
    let currentDate = new Date(fromDate);

    while (currentDate <= toDate) {
      const isToday = currentDate.toDateString() === now.toDateString();
      const isTomorrow = currentDate.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Only generate events for weekdays (Monday to Friday)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {

        if (isToday) {
          // TODAY'S EVENTS - Mix of past and future based on current time
          const currentHourUTC = now.getUTCHours();

          // Early morning event (8:30 AM ET = 12:30 UTC) - PAST
          if (currentHourUTC >= 13) {
            const eventTime = createEventTime(currentDate, 12, 30);
            demoEvents.push({
              country: 'US',
              event: 'Initial Jobless Claims',
              time: eventTime.toISOString(),
              unit: 'K',
              estimate: 230,
              previous: 225,
              actual: 228, // Already happened
              impact: 'medium'
            });
          }

          // Mid-morning event (10:00 AM ET = 14:00 UTC) - Maybe past or future
          const midMorningEvent = createEventTime(currentDate, 14, 0);
          demoEvents.push({
            country: 'US',
            event: 'Consumer Price Index (CPI)',
            time: midMorningEvent.toISOString(),
            unit: '%',
            estimate: 3.2,
            previous: 3.1,
            actual: shouldHaveActual(midMorningEvent) ? 3.3 : null,
            impact: 'high'
          });

          // Afternoon event (2:00 PM ET = 18:00 UTC) - Likely future
          const afternoonEvent = createEventTime(currentDate, 18, 0);
          demoEvents.push({
            country: 'US',
            event: 'FOMC Meeting Minutes',
            time: afternoonEvent.toISOString(),
            unit: '',
            estimate: null,
            previous: null,
            actual: shouldHaveActual(afternoonEvent) ? null : null, // This type of event doesn't have numeric actual
            impact: 'high'
          });

        } else if (isTomorrow) {
          // TOMORROW'S EVENTS - All future
          demoEvents.push({
            country: 'US',
            event: 'Non-Farm Payrolls',
            time: createEventTime(currentDate, 12, 30).toISOString(),
            unit: 'K',
            estimate: 180,
            previous: 175,
            actual: null,
            impact: 'high'
          });

          demoEvents.push({
            country: 'US',
            event: 'ISM Manufacturing PMI',
            time: createEventTime(currentDate, 14, 0).toISOString(),
            unit: '',
            estimate: 48.5,
            previous: 47.9,
            actual: null,
            impact: 'medium'
          });

        } else if (currentDate > now) {
          // FUTURE DAYS - All future events
          demoEvents.push({
            country: 'US',
            event: 'Retail Sales',
            time: createEventTime(currentDate, 12, 30).toISOString(),
            unit: '%',
            estimate: 0.3,
            previous: 0.1,
            actual: null,
            impact: 'medium'
          });

          demoEvents.push({
            country: 'US',
            event: 'Producer Price Index (PPI)',
            time: createEventTime(currentDate, 14, 0).toISOString(),
            unit: '%',
            estimate: 0.2,
            previous: 0.1,
            actual: null,
            impact: 'medium'
          });

        } else {
          // PAST DAYS - All events should have actuals
          demoEvents.push({
            country: 'US',
            event: 'Building Permits',
            time: createEventTime(currentDate, 14, 0).toISOString(),
            unit: 'M',
            estimate: 1.42,
            previous: 1.40,
            actual: 1.44, // Past event has actual
            impact: 'medium'
          });
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`Generated ${demoEvents.length} demo economic events for ${from} to ${to}`);

    // Filter events to ensure they fall within the requested date range
    return demoEvents.filter(event => {
      const eventDate = new Date(event.time);
      return eventDate >= fromDate && eventDate <= toDate;
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): any {
    return {
      keys: this.cache.keys(),
      stats: this.cache.getStats()
    };
  }
}

// Export singleton instance
export const economicEventsService = new EconomicEventsService();