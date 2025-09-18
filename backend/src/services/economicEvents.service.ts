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
  private apiKey: string;
  private baseUrl: string = 'https://finnhub.io/api/v1';

  constructor() {
    // Initialize cache with TTL and check period
    this.cache = new NodeCache({
      stdTTL: CACHE_CONFIG.TTL,
      checkperiod: CACHE_CONFIG.CHECK_PERIOD,
      useClones: false
    });

    // Get API key from environment
    this.apiKey = process.env.FINNHUB_API_KEY || '';

    if (!this.apiKey) {
      console.warn('WARNING: FINNHUB_API_KEY not set in environment variables');
    }
  }

  /**
   * Fetch economic calendar data from Finnhub
   */
  private async fetchEconomicCalendar(from: string, to: string): Promise<FinnhubEconomicEvent[]> {
    if (!this.apiKey) {
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
          token: this.apiKey,
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

    try {
      events = await this.fetchEconomicCalendar(from, to);
    } catch (error: any) {
      // If it's an API key issue, mark as using demo data
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
      apiKeyConfigured: !!this.apiKey && !usingDemoData,
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

    try {
      events = await this.fetchEconomicCalendar(from, to);
    } catch (error: any) {
      // If it's an API key issue, mark as using demo data
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
      apiKeyConfigured: !!this.apiKey && !usingDemoData,
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

    try {
      events = await this.fetchEconomicCalendar(from, to);
    } catch (error: any) {
      // If it's an API key issue, mark as using demo data
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
      apiKeyConfigured: !!this.apiKey && !usingDemoData,
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

    // Crear horarios que tengan sentido para eventos económicos reales
    // Los eventos económicos importantes suelen ocurrir durante horario comercial en EST/EDT

    // Calcular el próximo día laborable a las 8:30 AM EST (14:30 UTC)
    const nextBusinessDay = new Date(now);
    nextBusinessDay.setUTCHours(14, 30, 0, 0); // 8:30 AM EST = 14:30 UTC

    // Si ya pasó la hora de hoy, mover al siguiente día laborable
    if (nextBusinessDay <= now) {
      nextBusinessDay.setDate(nextBusinessDay.getDate() + 1);
    }

    // Asegurar que sea día laborable (lunes a viernes)
    while (nextBusinessDay.getDay() === 0 || nextBusinessDay.getDay() === 6) {
      nextBusinessDay.setDate(nextBusinessDay.getDate() + 1);
    }

    // Generate realistic demo events for ES/NQ trading
    const demoEvents: FinnhubEconomicEvent[] = [
      {
        country: 'US',
        event: 'Initial Jobless Claims',
        time: new Date(nextBusinessDay.getTime()).toISOString(), // 8:30 AM EST próximo día laborable
        unit: '',
        estimate: '230K',
        previous: '225K',
        actual: null,
        impact: 'medium'
      },
      {
        country: 'US',
        event: 'Consumer Price Index (CPI)',
        time: new Date(nextBusinessDay.getTime() + 30 * 60 * 1000).toISOString(), // 9:00 AM EST
        unit: '%',
        estimate: '3.2',
        previous: '3.1',
        actual: null,
        impact: 'high'
      },
      {
        country: 'US',
        event: 'FOMC Meeting Minutes',
        time: new Date(nextBusinessDay.getTime() + 5.5 * 60 * 60 * 1000).toISOString(), // 2:00 PM EST
        unit: '',
        estimate: null,
        previous: null,
        actual: null,
        impact: 'high'
      },
      {
        country: 'US',
        event: 'Non-Farm Payrolls',
        time: new Date(nextBusinessDay.getTime() + 24 * 60 * 60 * 1000).toISOString(), // Siguiente día 8:30 AM EST
        unit: '',
        estimate: '180K',
        previous: '175K',
        actual: null,
        impact: 'high'
      },
      {
        country: 'US',
        event: 'ISM Manufacturing PMI',
        time: new Date(nextBusinessDay.getTime() + 25.5 * 60 * 60 * 1000).toISOString(), // Siguiente día 10:00 AM EST
        unit: '',
        estimate: '48.5',
        previous: '47.9',
        actual: null,
        impact: 'medium'
      },
      {
        country: 'US',
        event: 'Retail Sales',
        time: new Date(nextBusinessDay.getTime() + 26.5 * 60 * 60 * 1000).toISOString(), // Siguiente día 11:00 AM EST
        unit: '%',
        estimate: '0.3',
        previous: '0.1',
        actual: null,
        impact: 'medium'
      }
    ];

    console.log(`Generated ${demoEvents.length} demo economic events for testing (next business day schedule)`);
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