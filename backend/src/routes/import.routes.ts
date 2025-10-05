import { Router } from 'express';
import * as importController from '../controllers/import.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all import sessions for the current user
router.get('/sessions', importController.getImportSessions);

// Get a specific import session by ID
router.get('/sessions/:sessionId', importController.getImportSession);

// Delete an import session
router.delete('/sessions/:sessionId', importController.deleteImportSession);

// Get import statistics for the current user
router.get('/stats', importController.getImportStats);

// Download import session data as CSV
router.get('/sessions/:sessionId/download', importController.downloadSessionData);

export default router;
