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

    // Determine currency based on country
    const currency = event.country === 'US' ? 'USD' : 'USD';

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
      country: event.country,
      currency
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
      console.log(`[API] Successfully fetched ${events.length} events from Finnhub`);
    } catch (error: any) {
      console.warn(`[API] Failed to fetch from Finnhub, using demo data. Reason: ${error.message}`);
      // Always fallback to demo data on any error
      usingDemoData = true;
      events = this.generateDemoData(from, to);
    }

    const processedEvents = events
      .filter(event => this.isRelevantToESNQ(event))
      .map(event => this.transformEvent(event))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    console.log(`[PROCESSED] ${processedEvents.length} relevant ES/NQ events after filtering`);

    return {
      events: processedEvents,
      apiKeyConfigured: hasApiKey,
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
      console.log(`[API] Successfully fetched ${events.length} upcoming events from Finnhub`);
    } catch (error: any) {
      console.warn(`[API] Failed to fetch upcoming events, using demo data. Reason: ${error.message}`);
      // Always fallback to demo data on any error
      usingDemoData = true;
      events = this.generateDemoData(from, to);
    }

    const processedEvents = events
      .filter(event => this.isRelevantToESNQ(event))
      .map(event => this.transformEvent(event))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    console.log(`[PROCESSED] ${processedEvents.length} relevant upcoming events after filtering`);

    return {
      events: processedEvents,
      apiKeyConfigured: hasApiKey,
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
      console.log(`[API] Successfully fetched ${events.length} filtered events from Finnhub`);
    } catch (error: any) {
      console.warn(`[API] Failed to fetch filtered events, using demo data. Reason: ${error.message}`);
      // Always fallback to demo data on any error
      usingDemoData = true;
      events = this.generateDemoData(from, to);
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

    console.log(`[PROCESSED] ${processedEvents.length} events after custom filtering`);

    return {
      events: processedEvents,
      apiKeyConfigured: hasApiKey,
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
   * Generate demo economic events - CONSISTENT REALISTIC WEEKLY SCHEDULE
   * Events follow a realistic US economic calendar pattern
   */
  private generateDemoData(from: string, to: string): FinnhubEconomicEvent[] {
    const now = new Date();
    const fromDate = new Date(from);
    const toDate = new Date(to);

    console.log(`[DEMO DATA] Generating consistent events for ${from} to ${to}`);

    // Helper to create event time in UTC
    const createEventTime = (baseDate: Date, hour: number, minute: number): Date => {
      const eventDate = new Date(baseDate);
      eventDate.setUTCHours(hour, minute, 0, 0);
      return eventDate;
    };

    // Check if event should have actual data (15min buffer)
    const shouldHaveActual = (eventTime: Date): boolean => {
      return now.getTime() > eventTime.getTime() + (15 * 60 * 1000);
    };

    // Fixed weekly schedule - predictable and realistic
    // Day of week: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday
    const weeklySchedule: { [key: number]: Array<{ event: string; time: [number, number]; impact: string; unit: string; estimate: number | null; previous: number | null }> } = {
      1: [ // Monday
        { event: 'ISM Manufacturing PMI', time: [14, 0], impact: 'medium', unit: '', estimate: 48.5, previous: 47.9 }
      ],
      2: [ // Tuesday
        { event: 'JOLTS Job Openings', time: [14, 0], impact: 'medium', unit: 'M', estimate: 8.1, previous: 8.0 }
      ],
      3: [ // Wednesday
        { event: 'ADP Employment Change', time: [12, 15], impact: 'medium', unit: 'K', estimate: 145, previous: 140 },
        { event: 'FOMC Meeting Minutes', time: [18, 0], impact: 'high', unit: '', estimate: null, previous: null }
      ],
      4: [ // Thursday
        { event: 'Initial Jobless Claims', time: [12, 30], impact: 'medium', unit: 'K', estimate: 230, previous: 225 },
        { event: 'Producer Price Index (PPI)', time: [12, 30], impact: 'medium', unit: '%', estimate: 0.4, previous: 0.3 }
      ],
      5: [ // Friday
        { event: 'Non-Farm Payrolls', time: [12, 30], impact: 'high', unit: 'K', estimate: 180, previous: 175 },
        { event: 'Unemployment Rate', time: [12, 30], impact: 'high', unit: '%', estimate: 3.7, previous: 3.8 }
      ]
    };

    // Monthly events (show on specific days of month)
    const monthlyEvents = [
      { day: 12, event: 'Consumer Price Index (CPI)', time: [12, 30], impact: 'high', unit: '%', estimate: 3.2, previous: 3.1 },
      { day: 13, event: 'Core CPI', time: [12, 30], impact: 'high', unit: '%', estimate: 3.0, previous: 2.9 },
      { day: 15, event: 'Retail Sales', time: [12, 30], impact: 'medium', unit: '%', estimate: 0.5, previous: 0.2 },
      { day: 16, event: 'Building Permits', time: [12, 30], impact: 'medium', unit: 'M', estimate: 1.42, previous: 1.40 },
      { day: 27, event: 'Core PCE Price Index', time: [12, 30], impact: 'high', unit: '%', estimate: 0.3, previous: 0.2 }
    ];

    const demoEvents: FinnhubEconomicEvent[] = [];

    // Generate events for each day in range
    let currentDate = new Date(fromDate);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= toDate) {
      const dayOfWeek = currentDate.getDay();
      const dayOfMonth = currentDate.getDate();

      // Add weekly recurring events (Mon-Fri only)
      if (dayOfWeek >= 1 && dayOfWeek <= 5 && weeklySchedule[dayOfWeek]) {
        weeklySchedule[dayOfWeek].forEach(template => {
          const eventTime = createEventTime(currentDate, template.time[0], template.time[1]);
          const isPast = shouldHaveActual(eventTime);

          // Generate consistent actual values (use date as seed for deterministic randomness)
          let actual = null;
          if (isPast && template.estimate !== null) {
            const seed = currentDate.getTime();
            const variance = ((seed % 10) - 5) / 100; // -5% to +5% based on date
            actual = Number((template.estimate * (1 + variance)).toFixed(2));
          }

          demoEvents.push({
            country: 'US',
            event: template.event,
            time: eventTime.toISOString(),
            unit: template.unit,
            estimate: template.estimate,
            previous: template.previous,
            actual: actual,
            impact: template.impact as 'high' | 'medium' | 'low'
          });
        });
      }

      // Add monthly events (specific days of month)
      monthlyEvents.forEach(monthlyEvent => {
        if (dayOfMonth === monthlyEvent.day) {
          const eventTime = createEventTime(currentDate, monthlyEvent.time[0], monthlyEvent.time[1]);
          const isPast = shouldHaveActual(eventTime);

          let actual = null;
          if (isPast && monthlyEvent.estimate !== null) {
            const seed = currentDate.getTime();
            const variance = ((seed % 10) - 5) / 100;
            actual = Number((monthlyEvent.estimate * (1 + variance)).toFixed(2));
          }

          demoEvents.push({
            country: 'US',
            event: monthlyEvent.event,
            time: eventTime.toISOString(),
            unit: monthlyEvent.unit,
            estimate: monthlyEvent.estimate,
            previous: monthlyEvent.previous,
            actual: actual,
            impact: monthlyEvent.impact as 'high' | 'medium' | 'low'
          });
        }
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Sort by time
    demoEvents.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    console.log(`[DEMO DATA] Generated ${demoEvents.length} consistent events`);

    return demoEvents;
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