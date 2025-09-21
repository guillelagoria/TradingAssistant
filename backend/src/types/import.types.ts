/**
 * Import Session Types
 * Types for tracking and managing import sessions
 */

// Import the enum types from Prisma
import { ImportStatus, ImportSource } from '@prisma/client';

/**
 * Import progress update
 */
export interface ImportProgress {
  sessionId: string;
  currentRow: number;
  totalRows: number;
  percentage: number;
  status: ImportStatus;
  message?: string;
}

/**
 * Import result for individual trade
 */
export interface ImportTradeResult {
  rowNumber: number;
  success: boolean;
  tradeId?: string;
  errors?: string[];
  warnings?: string[];
  skipped?: boolean;
  duplicate?: boolean;
}

/**
 * Batch import result
 */
export interface BatchImportResult {
  sessionId: string;
  status: ImportStatus;
  summary: {
    total: number;
    imported: number;
    skipped: number;
    errors: number;
    duplicates: number;
  };
  trades: ImportTradeResult[];
  errors: string[];
  warnings: string[];
  duration: number; // in milliseconds
}

// Re-export the Prisma enums for convenience
export { ImportStatus, ImportSource } from '@prisma/client';

/**
 * Duplicate detection strategy
 */
export enum DuplicateStrategy {
  SKIP = 'SKIP',
  REPLACE = 'REPLACE',
  MERGE = 'MERGE',
  FORCE = 'FORCE'
}

/**
 * Import configuration
 */
export interface ImportConfig {
  batchSize: number;
  maxFileSize: number; // in bytes
  allowedFormats: string[];
  duplicateStrategy: DuplicateStrategy;
  validateData: boolean;
  autoDetectFormat: boolean;
  timezone: string;
}