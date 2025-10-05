import { Request, Response } from 'express';
import { prisma } from '../server';

/**
 * Get all import sessions for a user
 */
export const getImportSessions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const sessions = await prisma.importSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        source: true,
        status: true,
        fileName: true,
        fileSize: true,
        totalRows: true,
        processedRows: true,
        importedRows: true,
        skippedRows: true,
        errorRows: true,
        duplicateRows: true,
        errors: true,
        warnings: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
      },
    });

    // Map to frontend-expected format
    const mappedSessions = sessions.map(session => ({
      id: session.id,
      fileName: session.fileName || 'Unknown',
      fileSize: session.fileSize || 0,
      uploadedAt: session.createdAt.toISOString(),
      processedAt: session.completedAt?.toISOString(),
      status: session.status.toLowerCase() as 'pending' | 'processing' | 'completed' | 'failed',
      progress: session.totalRows > 0
        ? Math.round((session.processedRows / session.totalRows) * 100)
        : 0,
      totalRecords: session.totalRows,
      importedRecords: session.importedRows,
      skippedRecords: session.skippedRows,
      errors: Array.isArray(session.errors) ? session.errors : [],
      warnings: Array.isArray(session.warnings) ? session.warnings : [],
      metadata: {
        originalTradesCount: session.totalRows,
        newTradesCount: session.importedRows,
        duplicatesSkipped: session.duplicateRows,
        fileFormat: 'NT8',
      },
    }));

    res.json(mappedSessions);
  } catch (error) {
    console.error('Error fetching import sessions:', error);
    res.status(500).json({ message: 'Failed to fetch import sessions' });
  }
};

/**
 * Get a specific import session by ID
 */
export const getImportSession = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const session = await prisma.importSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      return res.status(404).json({ message: 'Import session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Error fetching import session:', error);
    res.status(500).json({ message: 'Failed to fetch import session' });
  }
};

/**
 * Delete an import session
 */
export const deleteImportSession = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Verify session belongs to user
    const session = await prisma.importSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      return res.status(404).json({ message: 'Import session not found' });
    }

    // Delete the session
    await prisma.importSession.delete({
      where: { id: sessionId },
    });

    res.json({ message: 'Import session deleted successfully' });
  } catch (error) {
    console.error('Error deleting import session:', error);
    res.status(500).json({ message: 'Failed to delete import session' });
  }
};

/**
 * Get import statistics for a user
 */
export const getImportStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const sessions = await prisma.importSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        status: true,
        totalRows: true,
        importedRows: true,
        skippedRows: true,
        errorRows: true,
        duplicateRows: true,
        source: true,
        createdAt: true,
      },
    });

    // Calculate aggregated statistics
    const stats = sessions.reduce(
      (acc, session) => {
        acc.totalSessions++;
        acc.totalTradesImported += session.importedRows;

        if (session.status === 'COMPLETED') {
          acc.successfulImports++;
        } else if (session.status === 'FAILED') {
          acc.failedImports++;
        }

        return acc;
      },
      {
        totalSessions: 0,
        successfulImports: 0,
        failedImports: 0,
        totalTradesImported: 0,
        lastImportDate: sessions.length > 0 ? sessions[0].createdAt.toISOString() : undefined,
      }
    );

    res.json(stats);
  } catch (error) {
    console.error('Error fetching import stats:', error);
    res.status(500).json({ message: 'Failed to fetch import statistics' });
  }
};

/**
 * Download import session data as CSV
 */
export const downloadSessionData = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Verify session belongs to user
    const session = await prisma.importSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      return res.status(404).json({ message: 'Import session not found' });
    }

    // Create CSV content
    const csvHeader = 'Session ID,Source,Status,File Name,Total Rows,Imported,Skipped,Errors,Duplicates,Started At,Completed At\n';
    const csvRow = [
      session.id,
      session.source,
      session.status,
      session.fileName || 'N/A',
      session.totalRows,
      session.importedRows,
      session.skippedRows,
      session.errorRows,
      session.duplicateRows,
      session.startedAt.toISOString(),
      session.completedAt?.toISOString() || 'N/A',
    ].join(',');

    const csvContent = csvHeader + csvRow;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=import-session-${sessionId}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error downloading session data:', error);
    res.status(500).json({ message: 'Failed to download session data' });
  }
};
