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
   * Generate demo economic events for testing purposes
   */
  private generateDemoData(from: string, to: string): FinnhubEconomicEvent[] {
    const now = new Date();

    // Create events for today and next few days based on the requested date range
    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Helper function to create a date with specific time in ET (Eastern Time)
    const createEventTime = (baseDate: Date, hour: number, minute: number): Date => {
      const eventTime = new Date(baseDate);
      // Economic events are typically published in ET (Eastern Time)
      // ET is UTC-5 (EST) or UTC-4 (EDT) depending on daylight saving
      // For simplicity, we'll use EDT (UTC-4) since we're in September
      // So 8:30 AM ET = 12:30 UTC (during EDT)
      eventTime.setUTCHours(hour, minute, 0, 0);
      return eventTime;
    };

    // If asking for today's events, create some for today
    const eventsDate = fromDate;

    // Ensure we use the correct date for the events
    // If it's for today and we're past market hours, still show today's events as happened earlier
    const baseDate = new Date(eventsDate);

    // Generate realistic demo events for ES/NQ trading
    const demoEvents: FinnhubEconomicEvent[] = [];

    // Add events based on the date range requested
    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

    // Events for first day (could be today)
    if (daysDiff >= 0) {
      // Morning events (8:30 AM ET)
      demoEvents.push({
        country: 'US',
        event: 'Initial Jobless Claims',
        time: createEventTime(baseDate, 12, 30).toISOString(), // 8:30 AM ET = 12:30 UTC
        unit: 'K',
        estimate: 230,
        previous: 225,
        actual: now > createEventTime(baseDate, 13, 30) ? 228 : null,
        impact: 'medium'
      });

      // Mid-morning event (10:00 AM ET)
      demoEvents.push({
        country: 'US',
        event: 'Consumer Price Index (CPI)',
        time: createEventTime(baseDate, 14, 0).toISOString(), // 10:00 AM ET = 14:00 UTC
        unit: '%',
        estimate: 3.2,
        previous: 3.1,
        actual: now > createEventTime(baseDate, 15, 0) ? 3.3 : null,
        impact: 'high'
      });

      // Afternoon event (2:00 PM ET)
      demoEvents.push({
        country: 'US',
        event: 'FOMC Meeting Minutes',
        time: createEventTime(baseDate, 18, 0).toISOString(), // 2:00 PM ET = 18:00 UTC
        unit: '',
        estimate: null,
        previous: null,
        actual: null,
        impact: 'high'
      });
    }

    // Add events for tomorrow if in range
    if (daysDiff >= 1) {
      const tomorrow = new Date(baseDate);
      tomorrow.setDate(tomorrow.getDate() + 1);

      demoEvents.push({
        country: 'US',
        event: 'Non-Farm Payrolls',
        time: createEventTime(tomorrow, 12, 30).toISOString(), // 8:30 AM ET = 12:30 UTC
        unit: 'K',
        estimate: 180,
        previous: 175,
        actual: null,
        impact: 'high'
      });

      demoEvents.push({
        country: 'US',
        event: 'ISM Manufacturing PMI',
        time: createEventTime(tomorrow, 14, 0).toISOString(), // 10:00 AM ET = 14:00 UTC
        unit: '',
        estimate: 48.5,
        previous: 47.9,
        actual: null,
        impact: 'medium'
      });
    }

    // Add events for day after tomorrow if in range
    if (daysDiff >= 2) {
      const dayAfter = new Date(baseDate);
      dayAfter.setDate(dayAfter.getDate() + 2);

      demoEvents.push({
        country: 'US',
        event: 'Retail Sales',
        time: createEventTime(dayAfter, 12, 30).toISOString(), // 8:30 AM ET = 12:30 UTC
        unit: '%',
        estimate: 0.3,
        previous: 0.1,
        actual: null,
        impact: 'medium'
      });
    }

    console.log(`Generated ${demoEvents.length} demo economic events for ${from} to ${to}`);
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