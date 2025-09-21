/**
 * Import Controller
 * Handles NT8 import API endpoints
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import { NT8ImportService } from '../services/nt8Import.service';
import { NT8ImportOptions } from '../types/nt8.types';
import { BatchImportResult } from '../types/import.types';
import { ImportSessionStorageService } from '../services/importSessionStorage.service';

const prisma = new PrismaClient();
const nt8ImportService = new NT8ImportService(prisma);
const sessionStorage = ImportSessionStorageService.getInstance();

/**
 * Upload NT8 file and create import session
 * POST /api/import/nt8/upload
 * Returns a session ID that can be used for preview and final import
 */
export const uploadNT8File = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
      return;
    }

    // Get user ID from auth middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    try {
      // Create session with uploaded file
      const sessionId = await sessionStorage.createSession(
        userId,
        req.file.path,
        req.file.originalname,
        req.file.size
      );

      res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          sessionId,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          expiresIn: 30 * 60 * 1000 // 30 minutes in milliseconds
        }
      });

    } catch (uploadError) {
      // Clean up file if session creation failed
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to clean up uploaded file after error:', cleanupError);
      }
      throw uploadError;
    }

  } catch (error) {
    console.error('NT8 Upload Error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Upload failed',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * Preview NT8 import without saving (dry run)
 * POST /api/import/nt8/preview
 * Uses session ID from upload endpoint
 */
export const previewNT8Import = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    // Get session ID from request body
    const { sessionId, skipDuplicates = true, defaultCommission = 0, fieldMapping = {} } = req.body;

    console.log('=== PREVIEW REQUEST DEBUG ===');
    console.log('sessionId received:', sessionId);
    console.log('sessionId type:', typeof sessionId);
    console.log('Request body:', req.body);
    console.log('=============================');

    if (!sessionId) {
      res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
      return;
    }

    // Get user ID from auth middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Get session data
    const sessionData = sessionStorage.getSession(sessionId, userId);
    if (!sessionData) {
      res.status(404).json({
        success: false,
        message: 'Session not found or expired'
      });
      return;
    }

    const options: NT8ImportOptions = {
      userId,
      skipDuplicates: skipDuplicates === 'true' || skipDuplicates === true,
      defaultCommission: parseFloat(defaultCommission) || 0,
      fieldMapping: typeof fieldMapping === 'string' ? JSON.parse(fieldMapping) : fieldMapping,
      dryRun: true // This is a preview, don't actually import
    };

    // Process the file in dry run mode
    const result: BatchImportResult = await nt8ImportService.importNT8File(
      sessionData.filePath,
      options
    );

    // Store the preview result in session for potential reuse
    sessionStorage.updateSession(sessionId, userId, {
      metadata: {
        ...sessionData.metadata,
        lastPreviewOptions: options,
        lastPreviewResult: {
          summary: result.summary,
          tradesCount: result.trades.length,
          errors: result.errors.slice(0, 10),
          warnings: result.warnings.slice(0, 10)
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Preview completed successfully',
      data: result
    });

  } catch (error) {
    console.error('NT8 Preview Error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Preview failed',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * Execute final NT8 import using session data
 * POST /api/import/nt8/execute
 * Uses session ID from upload endpoint
 */
export const executeNT8Import = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    // Get session ID and options from request body
    const { sessionId, skipDuplicates = true, defaultCommission = 0, fieldMapping = {} } = req.body;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
      return;
    }

    // Get user ID from auth middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Get session data
    const sessionData = sessionStorage.getSession(sessionId, userId);
    if (!sessionData) {
      res.status(404).json({
        success: false,
        message: 'Session not found or expired'
      });
      return;
    }

    const options: NT8ImportOptions = {
      userId,
      skipDuplicates: skipDuplicates === 'true' || skipDuplicates === true,
      defaultCommission: parseFloat(defaultCommission) || 0,
      fieldMapping: typeof fieldMapping === 'string' ? JSON.parse(fieldMapping) : fieldMapping,
      dryRun: false // This is the actual import
    };

    // Process the file and import trades
    const result: BatchImportResult = await nt8ImportService.importNT8File(
      sessionData.filePath,
      options
    );

    // Clean up the session after successful import
    await sessionStorage.deleteSession(sessionId);

    res.status(200).json({
      success: true,
      message: 'Import completed successfully',
      data: result
    });

  } catch (error) {
    console.error('NT8 Execute Import Error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Import failed',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * Get user's import history
 * GET /api/import/sessions
 */
export const getImportSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user ID from auth middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Get pagination parameters
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    // Get import sessions
    const sessions = await prisma.importSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        _count: {
          select: { trades: true }
        }
      }
    });

    // Get total count for pagination
    const total = await prisma.importSession.count({
      where: { userId }
    });

    res.status(200).json({
      success: true,
      data: {
        sessions,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    });

  } catch (error) {
    console.error('Get Import Sessions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch import sessions',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * Get specific import session details
 * GET /api/import/sessions/:id
 */
export const getImportSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Get user ID from auth middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const session = await nt8ImportService.getImportSession(id, userId);

    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Import session not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: session
    });

  } catch (error) {
    console.error('Get Import Session Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch import session',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * Delete an import session and optionally its trades
 * DELETE /api/import/sessions/:id
 */
export const deleteImportSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { deleteTrades = false } = req.query;

    // Get user ID from auth middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    await nt8ImportService.deleteImportSession(
      id,
      userId,
      deleteTrades === 'true'
    );

    res.status(200).json({
      success: true,
      message: 'Import session deleted successfully'
    });

  } catch (error) {
    console.error('Delete Import Session Error:', error);

    if (error instanceof Error && error.message === 'Import session not found') {
      res.status(404).json({
        success: false,
        message: 'Import session not found'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete import session',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * Get import statistics for the user
 * GET /api/import/stats
 */
export const getImportStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user ID from auth middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Get import statistics
    const stats = await prisma.importSession.aggregate({
      where: { userId },
      _count: { id: true },
      _sum: {
        totalRows: true,
        importedRows: true,
        errorRows: true,
        duplicateRows: true
      }
    });

    // Get session status breakdown
    const statusBreakdown = await prisma.importSession.groupBy({
      by: ['status'],
      where: { userId },
      _count: { status: true }
    });

    // Get source breakdown
    const sourceBreakdown = await prisma.importSession.groupBy({
      by: ['source'],
      where: { userId },
      _count: { source: true }
    });

    res.status(200).json({
      success: true,
      data: {
        totalSessions: stats._count.id,
        totalRowsProcessed: stats._sum.totalRows || 0,
        totalRowsImported: stats._sum.importedRows || 0,
        totalErrors: stats._sum.errorRows || 0,
        totalDuplicates: stats._sum.duplicateRows || 0,
        statusBreakdown: statusBreakdown.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as Record<string, number>),
        sourceBreakdown: sourceBreakdown.reduce((acc, item) => {
          acc[item.source] = item._count.source;
          return acc;
        }, {} as Record<string, number>)
      }
    });

  } catch (error) {
    console.error('Get Import Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch import statistics',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};