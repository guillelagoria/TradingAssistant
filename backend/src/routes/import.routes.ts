/**
 * Import Routes
 * NT8 import API endpoints with file upload support
 */

import { Router } from 'express';
import multer from 'multer';
import { body, param, query } from 'express-validator';
import * as path from 'path';
import * as fs from 'fs';
import { authenticate } from '../middleware/auth';
import {
  uploadNT8File,
  previewNT8Import,
  executeNT8Import,
  getImportSessions,
  getImportSession,
  deleteImportSession,
  getImportStats
} from '../controllers/import.controller';

const router = Router();

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads', 'imports');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${timestamp}${ext}`);
  }
});

// File filter to allow only CSV and Excel files
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'text/csv',
    'application/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  const allowedExts = ['.csv', '.xls', '.xlsx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only CSV, XLS, and XLSX files are allowed.'));
  }
};

// Multer instance with configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only one file at a time
  }
});

// Validation middleware for session-based requests
const sessionValidation = [
  body('sessionId')
    .isString()
    .notEmpty()
    .withMessage('Session ID is required'),
  body('skipDuplicates')
    .optional()
    .isBoolean()
    .withMessage('skipDuplicates must be a boolean'),
  body('defaultCommission')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('defaultCommission must be a positive number'),
  body('fieldMapping')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
          return true;
        } catch {
          throw new Error('fieldMapping must be valid JSON');
        }
      }
      return typeof value === 'object';
    }),
  body('createMissingStrategies')
    .optional()
    .isBoolean()
    .withMessage('createMissingStrategies must be a boolean')
];

// Validation middleware for pagination
const paginationValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('offset must be a non-negative integer')
];

// Validation middleware for session ID
const sessionIdValidation = [
  param('id')
    .isString()
    .notEmpty()
    .withMessage('Session ID is required')
];

// Routes

/**
 * Upload NT8 file and create import session
 * POST /api/import/nt8/upload
 * Returns a session ID for use in preview and execute endpoints
 */
router.post(
  '/nt8/upload',
  authenticate,
  upload.single('file'),
  uploadNT8File
);

/**
 * Preview NT8 import without saving (dry run)
 * POST /api/import/nt8/preview
 * Requires session ID from upload endpoint
 */
router.post(
  '/nt8/preview',
  authenticate,
  sessionValidation,
  previewNT8Import
);

/**
 * Execute NT8 import and save trades
 * POST /api/import/nt8/execute
 * Requires session ID from upload endpoint
 */
router.post(
  '/nt8/execute',
  authenticate,
  sessionValidation,
  executeNT8Import
);

/**
 * Get user's import history
 * GET /api/import/sessions
 */
router.get(
  '/sessions',
  authenticate,
  paginationValidation,
  getImportSessions
);

/**
 * Get specific import session details
 * GET /api/import/sessions/:id
 */
router.get(
  '/sessions/:id',
  authenticate,
  sessionIdValidation,
  getImportSession
);

/**
 * Delete an import session and optionally its trades
 * DELETE /api/import/sessions/:id
 */
router.delete(
  '/sessions/:id',
  authenticate,
  sessionIdValidation,
  query('deleteTrades')
    .optional()
    .isBoolean()
    .withMessage('deleteTrades must be a boolean'),
  deleteImportSession
);

/**
 * Get import statistics for the user
 * GET /api/import/stats
 */
router.get(
  '/stats',
  authenticate,
  getImportStats
);

// Error handling middleware for multer
router.use((error: any, _req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one file is allowed.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field name.'
      });
    }
  }

  if (error.message && error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
});

export default router;