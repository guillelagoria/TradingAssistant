import { api } from './api';
import type {
  ImportSession,
  ImportPreviewData,
  ImportOptions,
  ImportStats,
} from '@/types/import';

export interface UploadResponse {
  sessionId: string;
  message: string;
}

export interface PreviewResponse {
  sessionId: string;
  preview: ImportPreviewData;
  message: string;
}

export interface ImportResponse {
  sessionId: string;
  message: string;
  importedCount: number;
  skippedCount: number;
}

class ImportService {
  /**
   * Upload NT8 file for processing
   */
  async uploadFile(
    file: File,
    options: Partial<ImportOptions> = {},
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify(options));

    try {
      const response = await api.post('/api/import/nt8/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            onProgress(Math.round(progress));
          }
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('File upload failed:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to upload file'
      );
    }
  }

  /**
   * Preview import data (dry run)
   */
  async previewImport(
    sessionId: string,
    options: Partial<ImportOptions> = {}
  ): Promise<PreviewResponse> {
    try {
      const response = await api.post('/api/import/nt8/preview', {
        sessionId,
        skipDuplicates: options.skipDuplicates ?? true,
        defaultCommission: 0,
        fieldMapping: {},
      });

      // Map backend response format to frontend expected format
      console.log('🔍 Full response:', response);
      console.log('🔍 Response data:', response.data);

      // The actual data is nested inside response.data.data
      const backendData = response.data.data;
      console.log('🔍 Backend data structure:', backendData);
      console.log('🔍 Summary data:', backendData.summary);

      // Extract trade data from results for preview
      const extractedTrades = (backendData.trades || [])
        .filter((result: any) => result.trade) // Only get results that have trade data
        .map((result: any) => ({
          ...result.trade,
          error: result.duplicate ? 'Duplicate trade' : result.trade.error
        })); // Extract the trade object and include duplicate status

      // Calculate proper statistics
      const totalRecords = backendData.summary?.total || 0;
      const duplicateRecords = backendData.summary?.duplicates || 0;
      const errorRecords = backendData.summary?.errors || 0;
      const validRecords = totalRecords - duplicateRecords - errorRecords;

      const mappedPreview = {
        totalRecords,
        validRecords,
        invalidRecords: errorRecords,
        duplicateRecords,
        trades: extractedTrades,
        errors: backendData.errors || [],
        warnings: backendData.warnings || []
      };

      console.log('🔍 Mapped preview data:', mappedPreview);

      return {
        sessionId: backendData.sessionId,
        preview: mappedPreview,
        message: response.message || 'Preview completed'
      };
    } catch (error: any) {
      console.error('Preview failed:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to preview import'
      );
    }
  }

  /**
   * Execute actual import
   */
  async executeImport(
    sessionId: string,
    options: Partial<ImportOptions> = {}
  ): Promise<ImportResponse> {
    try {
      const response = await api.post('/api/import/nt8/execute', {
        sessionId,
        skipDuplicates: options.skipDuplicates ?? true,
        defaultCommission: 0,
        fieldMapping: {},
      });

      return response.data;
    } catch (error: any) {
      console.error('Import execution failed:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to execute import'
      );
    }
  }

  /**
   * Get import sessions history
   */
  async getImportSessions(): Promise<ImportSession[]> {
    try {
      const response = await api.get('/api/import/sessions');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch import sessions:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to fetch import sessions'
      );
    }
  }

  /**
   * Get specific import session details
   */
  async getImportSession(sessionId: string): Promise<ImportSession> {
    try {
      const response = await api.get(`/api/import/sessions/${sessionId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch import session:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to fetch import session'
      );
    }
  }

  /**
   * Delete import session
   */
  async deleteImportSession(sessionId: string): Promise<void> {
    try {
      await api.delete(`/api/import/sessions/${sessionId}`);
    } catch (error: any) {
      console.error('Failed to delete import session:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to delete import session'
      );
    }
  }

  /**
   * Get import statistics
   */
  async getImportStats(): Promise<ImportStats> {
    try {
      const response = await api.get('/api/import/stats');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch import stats:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to fetch import statistics'
      );
    }
  }

  /**
   * Poll import progress for real-time updates
   */
  async pollImportProgress(
    sessionId: string,
    onProgress: (progress: number, status: string) => void,
    interval: number = 1000
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const session = await this.getImportSession(sessionId);

          onProgress(session.progress, session.status);

          if (session.status === 'completed' || session.status === 'failed') {
            resolve();
          } else {
            setTimeout(poll, interval);
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    const isValidType = allowedTypes.includes(file.type) ||
                       file.name.toLowerCase().endsWith('.csv') ||
                       file.name.toLowerCase().endsWith('.txt');

    if (!isValidType) {
      return {
        isValid: false,
        error: 'Invalid file type. Please upload a CSV or TXT file.',
      };
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size too large. Maximum allowed size is 50MB.',
      };
    }

    // Check filename contains 'Trade' or 'Export' (typical NT8 export names)
    const filename = file.name.toLowerCase();
    if (!filename.includes('trade') && !filename.includes('export')) {
      return {
        isValid: false,
        error: 'File name should contain "Trade" or "Export" for NT8 files.',
      };
    }

    return { isValid: true };
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Download import session as CSV
   */
  async downloadSessionData(sessionId: string): Promise<void> {
    try {
      const response = await api.get(`/api/import/sessions/${sessionId}/download`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `import-session-${sessionId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Failed to download session data:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to download session data'
      );
    }
  }
}

export const importService = new ImportService();