/**
 * Import Session Storage Service
 * Manages temporary storage of uploaded files for import sessions
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { randomBytes } from 'crypto';
import { NT8RawTrade, NT8FileFormat } from '../types/nt8.types';

export interface ImportSessionData {
  sessionId: string;
  userId: string;
  filePath: string;
  fileName: string;
  fileFormat: NT8FileFormat;
  fileSize: number;
  uploadedAt: Date;
  expiresAt: Date;
  rawData?: NT8RawTrade[];
  metadata?: Record<string, any>;
}

export class ImportSessionStorageService {
  private static instance: ImportSessionStorageService;
  private sessions: Map<string, ImportSessionData> = new Map();
  private readonly SESSION_TTL = 30 * 60 * 1000; // 30 minutes
  private cleanupInterval: NodeJS.Timeout;

  private constructor() {
    // Start cleanup interval to remove expired sessions
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  public static getInstance(): ImportSessionStorageService {
    if (!ImportSessionStorageService.instance) {
      ImportSessionStorageService.instance = new ImportSessionStorageService();
    }
    return ImportSessionStorageService.instance;
  }

  /**
   * Create a new import session with uploaded file
   */
  async createSession(
    userId: string,
    filePath: string,
    fileName: string,
    fileSize: number
  ): Promise<string> {
    const sessionId = this.generateSessionId();
    const fileFormat = this.detectFileFormat(fileName);

    const sessionData: ImportSessionData = {
      sessionId,
      userId,
      filePath,
      fileName,
      fileFormat,
      fileSize,
      uploadedAt: new Date(),
      expiresAt: new Date(Date.now() + this.SESSION_TTL),
      metadata: {}
    };

    this.sessions.set(sessionId, sessionData);
    return sessionId;
  }

  /**
   * Get session data by ID
   */
  getSession(sessionId: string, userId: string): ImportSessionData | null {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    // Verify ownership
    if (session.userId !== userId) {
      return null;
    }

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      this.deleteSession(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Update session data
   */
  updateSession(
    sessionId: string,
    userId: string,
    updates: Partial<ImportSessionData>
  ): boolean {
    const session = this.getSession(sessionId, userId);

    if (!session) {
      return false;
    }

    // Don't allow updating core properties
    const { sessionId: _, userId: __, filePath: ___, ...safeUpdates } = updates;

    this.sessions.set(sessionId, {
      ...session,
      ...safeUpdates
    });

    return true;
  }

  /**
   * Delete a session and its associated file
   */
  async deleteSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return;
    }

    // Delete the uploaded file
    try {
      await fs.unlink(session.filePath);
    } catch (error) {
      console.warn(`Failed to delete file for session ${sessionId}:`, error);
    }

    this.sessions.delete(sessionId);
  }

  /**
   * Clean up expired sessions
   */
  private async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    const expiredSessions: string[] = [];

    this.sessions.forEach((session, sessionId) => {
      if (now > session.expiresAt) {
        expiredSessions.push(sessionId);
      }
    });

    for (const sessionId of expiredSessions) {
      await this.deleteSession(sessionId);
    }

    if (expiredSessions.length > 0) {
      console.log(`Cleaned up ${expiredSessions.length} expired import sessions`);
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Detect file format from filename
   */
  private detectFileFormat(fileName: string): NT8FileFormat {
    const ext = path.extname(fileName).toLowerCase();

    switch (ext) {
      case '.csv':
        return NT8FileFormat.CSV;
      case '.xlsx':
        return NT8FileFormat.EXCEL;
      case '.xls':
        return NT8FileFormat.XLS;
      default:
        throw new Error(`Unsupported file format: ${ext}`);
    }
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Clean up all remaining files
    this.sessions.forEach((session) => {
      fs.unlink(session.filePath).catch(() => {
        // Ignore errors during shutdown
      });
    });

    this.sessions.clear();
  }
}