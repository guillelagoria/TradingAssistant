/**
 * Economic Events Controller
 * Handles HTTP requests for economic calendar data
 */

import { Request, Response } from 'express';
import { economicEventsService } from '../services/economicEvents.service';
import { EconomicEventFilter } from '../types/economicEvents';

export class EconomicEventsController {
  /**
   * Get today's ES/NQ relevant economic events
   * GET /api/economic-events/today
   */
  async getTodayEvents(_req: Request, res: Response): Promise<void> {
    try {
      const result = await economicEventsService.getTodayEvents();

      res.json({
        success: true,
        events: result.events,
        apiKeyConfigured: result.apiKeyConfigured,
        usingDemoData: result.usingDemoData,
        data: {
          date: new Date().toISOString().split('T')[0],
          count: result.events.length,
          events: result.events
        }
      });
    } catch (error: any) {
      console.error('Error fetching today\'s economic events:', error);

      res.status(error.message.includes('API key') ? 503 : 500).json({
        success: false,
        error: error.message || 'Failed to fetch today\'s economic events',
        apiKeyConfigured: false
      });
    }
  }

  /**
   * Get upcoming ES/NQ relevant economic events (next 7 days by default)
   * GET /api/economic-events/upcoming
   */
  async getUpcomingEvents(req: Request, res: Response): Promise<void> {
    try {
      // Allow customization of the days parameter (default 7, max 30)
      const days = Math.min(parseInt(req.query.days as string) || 7, 30);

      const result = await economicEventsService.getUpcomingEvents(days);

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      res.json({
        success: true,
        events: result.events,
        apiKeyConfigured: result.apiKeyConfigured,
        usingDemoData: result.usingDemoData,
        data: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          days,
          count: result.events.length,
          events: result.events
        }
      });
    } catch (error: any) {
      console.error('Error fetching upcoming economic events:', error);

      res.status(error.message.includes('API key') ? 503 : 500).json({
        success: false,
        error: error.message || 'Failed to fetch upcoming economic events',
        apiKeyConfigured: false
      });
    }
  }

  /**
   * Get filtered economic events
   * POST /api/economic-events/filter
   */
  async getFilteredEvents(req: Request, res: Response): Promise<void> {
    try {
      const filter: EconomicEventFilter = {
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        impact: req.body.impact,
        events: req.body.events
      };

      const events = await economicEventsService.getFilteredEvents(filter);

      res.json({
        success: true,
        data: {
          filter: {
            startDate: filter.startDate?.toISOString().split('T')[0],
            endDate: filter.endDate?.toISOString().split('T')[0],
            impact: filter.impact,
            events: filter.events
          },
          count: events.length,
          events
        }
      });
    } catch (error: any) {
      console.error('Error fetching filtered economic events:', error);

      res.status(error.message.includes('API key') ? 503 : 500).json({
        success: false,
        error: error.message || 'Failed to fetch filtered economic events'
      });
    }
  }

  /**
   * Get high impact events for the week
   * GET /api/economic-events/high-impact
   */
  async getHighImpactEvents(_req: Request, res: Response): Promise<void> {
    try {
      const filter: EconomicEventFilter = {
        impact: ['HIGH']
      };

      const result = await economicEventsService.getFilteredEvents(filter);

      res.json({
        success: true,
        events: result.events,
        apiKeyConfigured: result.apiKeyConfigured,
        usingDemoData: result.usingDemoData,
        data: {
          description: 'High impact economic events for ES/NQ futures (next 7 days)',
          count: result.events.length,
          events: result.events
        }
      });
    } catch (error: any) {
      console.error('Error fetching high impact economic events:', error);

      res.status(error.message.includes('API key') ? 503 : 500).json({
        success: false,
        error: error.message || 'Failed to fetch high impact economic events',
        apiKeyConfigured: false
      });
    }
  }

  /**
   * Clear cache (admin endpoint)
   * POST /api/economic-events/cache/clear
   */
  async clearCache(_req: Request, res: Response): Promise<void> {
    try {
      economicEventsService.clearCache();

      res.json({
        success: true,
        message: 'Economic events cache cleared successfully'
      });
    } catch (error: any) {
      console.error('Error clearing cache:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to clear cache'
      });
    }
  }

  /**
   * Get cache statistics (admin endpoint)
   * GET /api/economic-events/cache/stats
   */
  async getCacheStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = economicEventsService.getCacheStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('Error getting cache stats:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to get cache statistics'
      });
    }
  }
}

export const economicEventsController = new EconomicEventsController();