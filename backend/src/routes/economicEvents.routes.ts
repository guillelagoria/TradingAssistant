/**
 * Economic Events Routes
 * Endpoints for fetching economic calendar data relevant to ES/NQ futures
 */

import { Router } from 'express';
import { economicEventsController } from '../controllers/economicEvents.controller';
import { body, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const router = Router();

// Validation middleware
const handleValidation = (req: Request, res: Response, next: NextFunction): void | Response => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
  return;
};

/**
 * Get today's ES/NQ relevant economic events
 * @route GET /api/economic-events/today
 * @returns {Object} Today's economic events
 */
router.get('/today', economicEventsController.getTodayEvents);

/**
 * Get upcoming ES/NQ relevant economic events
 * @route GET /api/economic-events/upcoming
 * @query {number} days - Number of days to look ahead (default: 7, max: 30)
 * @returns {Object} Upcoming economic events
 */
router.get(
  '/upcoming',
  [
    query('days')
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage('Days must be between 1 and 30')
  ],
  handleValidation,
  economicEventsController.getUpcomingEvents
);

/**
 * Get high impact events for the week
 * @route GET /api/economic-events/high-impact
 * @returns {Object} High impact economic events
 */
router.get('/high-impact', economicEventsController.getHighImpactEvents);

/**
 * Get filtered economic events
 * @route POST /api/economic-events/filter
 * @body {Object} filter - Filter criteria
 * @returns {Object} Filtered economic events
 */
router.post(
  '/filter',
  [
    body('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO date'),
    body('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO date'),
    body('impact')
      .optional()
      .isArray()
      .withMessage('Impact must be an array')
      .custom((value: string[]) => {
        const validImpacts = ['HIGH', 'MEDIUM', 'LOW'];
        return value.every(impact => validImpacts.includes(impact));
      })
      .withMessage('Impact values must be HIGH, MEDIUM, or LOW'),
    body('events')
      .optional()
      .isArray()
      .withMessage('Events must be an array')
  ],
  handleValidation,
  economicEventsController.getFilteredEvents
);

/**
 * Clear cache (admin endpoint)
 * @route POST /api/economic-events/cache/clear
 * @returns {Object} Success message
 */
router.post('/cache/clear', economicEventsController.clearCache);

/**
 * Get cache statistics (admin endpoint)
 * @route GET /api/economic-events/cache/stats
 * @returns {Object} Cache statistics
 */
router.get('/cache/stats', economicEventsController.getCacheStats);

export default router;