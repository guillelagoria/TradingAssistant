import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  File,
  AlertCircle,
  CheckCircle,
  X,
  FileText,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useImportStore } from '@/store/importStore';
import { importService } from '@/services/importService';
import { cn } from '@/lib/utils';

interface FileUploadStepProps {
  onNext: () => void;
}

export function FileUploadStep({ onNext }: FileUploadStepProps) {
  const {
    uploadStatus,
    options,
    error,
    isUploading,
    setUploadStatus,
    updateUploadProgress,
    setUploadError,
    setIsUploading,
    setError,
    clearError,
    setCurrentSession,
    nextWizardStep,
  } = useImportStore();

  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    clearError();

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
      });

      // Store session ID for next step
      const sessionId = response.data.sessionId;
      // Create a temporary session object for the next step
      const tempSession = {
        id: sessionId,
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
      // Store this session for the next step
      setCurrentSession(tempSession);

      // Auto advance to next step after a short delay
      setTimeout(() => {
        nextWizardStep();
        onNext();
      }, 1000);

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
  }, [options, setUploadStatus, updateUploadProgress, setUploadError, setIsUploading, setError, clearError, nextWizardStep, onNext]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
  } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    disabled: isUploading,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  const removeFile = () => {
    setUploadStatus(null);
    clearError();
  };

  const getStatusIcon = () => {
    if (!uploadStatus) return <Upload className="h-8 w-8 text-muted-foreground" />;

    switch (uploadStatus.status) {
      case 'uploading':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Upload className="h-8 w-8 text-blue-500" />
          </motion.div>
        );
      case 'completed':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      default:
        return <File className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    if (isDragReject) return 'border-red-500 bg-red-50';
    if (isDragActive || dragActive) return 'border-blue-500 bg-blue-50';
    if (uploadStatus?.status === 'completed') return 'border-green-500 bg-green-50';
    if (uploadStatus?.status === 'error') return 'border-red-500 bg-red-50';
    return 'border-dashed border-gray-300 hover:border-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">Upload NT8 File</h2>
        <p className="text-muted-foreground mt-2">
          Upload your NinjaTrader 8 export file to import your trades
        </p>
      </div>

      {/* File Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={cn(
              'relative border-2 rounded-lg p-8 text-center cursor-pointer transition-colors',
              getStatusColor(),
              isUploading && 'pointer-events-none opacity-75'
            )}
          >
            <input {...getInputProps()} />

            <AnimatePresence mode="wait">
              <motion.div
                key={uploadStatus?.status || 'empty'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center space-y-4"
              >
                {getStatusIcon()}

                <div className="space-y-2">
                  {!uploadStatus ? (
                    <>
                      <h3 className="text-lg font-semibold">
                        {isDragActive ? 'Drop your file here' : 'Drag & drop your NT8 file'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Or click to browse files
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports CSV, TXT, XLS, XLSX files up to 50MB
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">{uploadStatus.file.name}</span>
                        {uploadStatus.status !== 'uploading' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile();
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {importService.formatFileSize(uploadStatus.file.size)}
                      </p>
                    </>
                  )}
                </div>

                {/* Upload Progress */}
                {uploadStatus?.status === 'uploading' && (
                  <div className="w-full max-w-xs space-y-2">
                    <Progress value={uploadStatus.progress} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      Uploading... {uploadStatus.progress}%
                    </p>
                  </div>
                )}

                {/* Status Badge */}
                {uploadStatus && (
                  <Badge
                    variant={
                      uploadStatus.status === 'completed' ? 'default' :
                      uploadStatus.status === 'error' ? 'destructive' :
                      'secondary'
                    }
                  >
                    {uploadStatus.status === 'uploading' && 'Uploading...'}
                    {uploadStatus.status === 'completed' && 'Upload Complete'}
                    {uploadStatus.status === 'error' && 'Upload Failed'}
                    {uploadStatus.status === 'pending' && 'Ready to Upload'}
                  </Badge>
                )}
              </motion.div>
            </AnimatePresence>
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
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Section */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>How to export from NinjaTrader 8</span>
            </h4>
            <div className="text-sm text-muted-foreground space-y-2">
              <ol className="list-decimal list-inside space-y-1">
                <li>Open NinjaTrader 8 Control Center</li>
                <li>Go to Tools → Trade Performance</li>
                <li>Select your account and date range</li>
                <li>Click "Export" and save as CSV or TXT</li>
                <li>Upload the exported file here</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" disabled>
          Previous
        </Button>
        <Button
          onClick={onNext}
          disabled={!uploadStatus || uploadStatus.status !== 'completed'}
        >
          Next: Preview Data
        </Button>
      </div>
    </div>
  );
}