import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Sparkles,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useImportStore } from '@/store/importStore';
import { importService } from '@/services/importService';
import { CompactPreviewTable } from './CompactPreviewTable';
import { ValidationSummary } from './ValidationSummary';
import { cn } from '@/lib/utils';

interface UploadAndPreviewStepProps {
  onNext: () => void;
}

export function UploadAndPreviewStep({ onNext }: UploadAndPreviewStepProps) {
  const navigate = useNavigate();
  const {
    uploadStatus,
    previewData,
    options,
    error,
    isUploading,
    isProcessing,
    setUploadStatus,
    updateUploadProgress,
    setUploadError,
    setIsUploading,
    setPreviewData,
    setIsProcessing,
    setError,
    clearError,
    setCurrentSession,
    nextWizardStep,
  } = useImportStore();

  const [autoPreviewComplete, setAutoPreviewComplete] = useState(false);

  // Auto-load preview after successful upload
  useEffect(() => {
    if (uploadStatus?.status === 'completed' && !previewData && !isProcessing) {
      loadPreview();
    }
  }, [uploadStatus?.status]);

  const loadPreview = async () => {
    if (!uploadStatus?.file) return;

    setIsProcessing(true);

    try {
      // Get session ID from upload response
      const sessionId = (uploadStatus as any).sessionId;

      if (!sessionId) {
        throw new Error('No session ID available');
      }

      const response = await importService.previewImport(sessionId, options);
      setPreviewData(response.preview);
      setAutoPreviewComplete(true);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    clearError();
    setAutoPreviewComplete(false);
    setPreviewData(null);

    // Validate file
    const validation = importService.validateFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    // Set upload status
    setUploadStatus({
      file,
      progress: 0,
      status: 'uploading',
    });

    setIsUploading(true);

    try {
      // Upload file with progress tracking
      const response = await importService.uploadFile(
        file,
        options,
        (progress) => {
          updateUploadProgress(progress);
        }
      );

      // Update status on success
      setUploadStatus({
        file,
        progress: 100,
        status: 'completed',
        sessionId: response.data.sessionId,
      } as any);

      // Create session object for next step
      const tempSession = {
        id: response.data.sessionId,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        status: 'pending' as const,
        progress: 0,
        totalRecords: 0,
        importedRecords: 0,
        skippedRecords: 0,
        errors: [],
        warnings: []
      };
      setCurrentSession(tempSession);

    } catch (error: any) {
      setUploadError(error.message);
      setUploadStatus({
        file,
        progress: 0,
        status: 'error',
        error: error.message,
      });
    } finally {
      setIsUploading(false);
    }
  }, [options, setUploadStatus, updateUploadProgress, setUploadError, setIsUploading, setError, clearError, setCurrentSession, setPreviewData]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
  } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    disabled: isUploading || isProcessing,
  });

  const removeFile = () => {
    setUploadStatus(null);
    setPreviewData(null);
    setAutoPreviewComplete(false);
    clearError();
  };

  const handleImport = () => {
    nextWizardStep();
    onNext();
  };

  const canProceed = previewData && previewData.validRecords > 0 && !error;

  // Show upload area if no file uploaded yet
  if (!uploadStatus || uploadStatus.status === 'error') {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload NT8 Export File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={cn(
                'relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all',
                isDragActive && 'border-blue-500 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/20',
                !isDragActive && 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-900'
              )}
            >
              <input {...getInputProps()} />

              <motion.div
                className="flex flex-col items-center space-y-4"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-4 bg-blue-100 rounded-full dark:bg-blue-900/30">
                  <Upload className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    {isDragActive ? 'Drop your file here' : 'Drag & drop your NT8 file'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Or click to browse files
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Badge variant="outline" className="text-xs">CSV</Badge>
                    <Badge variant="outline" className="text-xs">TXT</Badge>
                    <Badge variant="outline" className="text-xs">XLS</Badge>
                    <Badge variant="outline" className="text-xs">XLSX</Badge>
                  </div>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between gap-4">
                  <span className="flex-1">
                    {error.includes('NO_ACCOUNT_FOUND')
                      ? error.replace('NO_ACCOUNT_FOUND: ', '')
                      : error}
                  </span>
                  {error.includes('NO_ACCOUNT_FOUND') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate('/settings')}
                      className="shrink-0 bg-white hover:bg-gray-50 text-red-600 border-red-200"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Go to Settings
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Show uploading state
  if (isUploading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Upload className="h-12 w-12 text-blue-500 dark:text-blue-400" />
            </motion.div>
            <div className="w-full max-w-sm space-y-2">
              <Progress value={uploadStatus.progress} className="h-2" />
              <p className="text-center text-sm text-muted-foreground">
                Uploading {uploadStatus.file.name}... {uploadStatus.progress}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show processing state
  if (isProcessing && !previewData) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="h-12 w-12 text-blue-500 dark:text-blue-400" />
            </motion.div>
            <div className="text-center space-y-1">
              <p className="font-semibold">Analyzing your data...</p>
              <p className="text-sm text-muted-foreground">
                Validating trades and detecting duplicates
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show preview with validation results
  return (
    <div className="space-y-4">
      {/* File Info Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/30">
                <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">{uploadStatus.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {importService.formatFileSize(uploadStatus.file.size)} • Ready to import
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Summary */}
      {previewData && (
        <ValidationSummary
          validCount={previewData.validRecords}
          duplicateCount={previewData.duplicateRecords}
          errorCount={previewData.invalidRecords}
          errors={previewData.errors}
          warnings={previewData.warnings}
          duplicates={previewData.errors.filter(e => e.message.includes('Duplicate'))}
        />
      )}

      {/* Data Preview */}
      {previewData && previewData.trades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                <span>Preview</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                Showing {Math.min(5, previewData.trades.length)} of {previewData.totalRecords} trades
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CompactPreviewTable trades={previewData.trades} maxRows={5} />
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          variant="outline"
          onClick={removeFile}
        >
          Upload Different File
        </Button>
        <Button
          onClick={handleImport}
          disabled={!canProceed}
          className="min-w-[160px]"
        >
          {!canProceed
            ? 'Cannot Import'
            : `Import ${previewData?.validRecords || 0} Trade${previewData?.validRecords !== 1 ? 's' : ''}`
          }
        </Button>
      </div>
    </div>
  );
}
