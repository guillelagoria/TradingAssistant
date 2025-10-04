export interface NT8Trade {
  instrument: string;
  account: string;
  masterId?: string;
  orderId: string;
  time: string;
  exchange: string;
  quantity: number;
  price: number;
  exitPrice?: number;
  profit?: number;
  currency: string;
  commission: number;
  rate: number;
  error?: string;
  buy?: number;
  sell?: number;
}

export interface ImportPreviewData {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  duplicateRecords?: number;
  trades: NT8Trade[];
  errors: ImportError[];
  warnings: ImportWarning[];
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  value?: any;
  type: 'error' | 'warning';
}

export interface ImportWarning {
  row: number;
  field?: string;
  message: string;
  value?: any;
}

export interface ImportSession {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  processedAt?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalRecords: number;
  importedRecords: number;
  skippedRecords: number;
  errors: ImportError[];
  warnings: ImportWarning[];
  metadata?: {
    originalTradesCount?: number;
    newTradesCount?: number;
    duplicatesSkipped?: number;
    fileFormat?: string;
    processingTimeMs?: number;
  };
}

export interface ImportProgress {
  sessionId: string;
  status: 'uploading' | 'processing' | 'importing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  message?: string;
  error?: string;
}

export interface ImportStats {
  totalSessions: number;
  successfulImports: number;
  failedImports: number;
  totalTradesImported: number;
  lastImportDate?: string;
}

export interface ImportOptions {
  skipDuplicates: boolean;
  validateData: boolean;
  dryRun: boolean;
  dateFormat?: string;
  timezone?: string;
}

export interface FileUploadStatus {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

// V2 Import Types
export interface NT8TradePreview {
  symbol: string;
  direction: 'LONG' | 'SHORT';
  entryDate: string;
  exitDate: string | null;
  entryPrice: number;
  exitPrice: number | null;
  pnl: number | null;
  commission: number;
  status: 'valid' | 'duplicate' | 'error';
  errorMessage?: string;
}

export interface NT8PreviewResponse {
  success: boolean;
  data: {
    totalTrades: number;
    validTrades: number;
    duplicates: number;
    errors: number;
    trades: NT8TradePreview[];
  };
  message?: string;
}

export interface NT8ExecuteResponse {
  success: boolean;
  data: {
    imported: number;
    skipped: number;
    errors: number;
    message: string;
  };
  message?: string;
}