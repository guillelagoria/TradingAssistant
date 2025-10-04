/**
 * UploadStep Component
 * File upload with drag & drop for NT8 CSV/Excel files
 */

import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Info, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UploadStepProps {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = {
  'text/csv': ['.csv'],
  'text/plain': ['.txt'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};

export function UploadStep({ onFileSelected, isLoading }: UploadStepProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          setError('File is too large. Maximum size is 10MB.');
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setError('Invalid file type. Please upload CSV, TXT, XLS, or XLSX files.');
        } else {
          setError('Failed to upload file. Please try again.');
        }
        return;
      }

      // Handle accepted file
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        onFileSelected(file);
      }
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
    disabled: isLoading,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Upload className="h-6 w-6 text-primary" />
            Import NT8 Trades
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Upload your NinjaTrader 8 export file
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-2 rounded-full hover:bg-muted transition-colors">
                <Info className="h-5 w-5 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs" side="left">
              <p className="font-semibold mb-2">How to export from NT8:</p>
              <ol className="text-xs space-y-1 list-decimal list-inside">
                <li>Open NinjaTrader 8 Control Center</li>
                <li>Go to Tools → Trade Performance</li>
                <li>Select your account and date range</li>
                <li>Click Export button</li>
                <li>Save as CSV or Excel format</li>
              </ol>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Dropzone */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div
          {...getRootProps()}
          className={cn(
            'relative overflow-hidden rounded-2xl border-2 border-dashed',
            'bg-gradient-to-br from-muted/30 to-muted/10',
            'transition-all duration-300 cursor-pointer',
            'hover:border-primary/50 hover:bg-muted/20',
            isDragActive && !isDragReject && 'border-primary bg-primary/5 scale-[1.02]',
            isDragReject && 'border-destructive bg-destructive/5',
            isLoading && 'opacity-50 cursor-not-allowed',
            !isLoading && 'active:scale-[0.98]'
          )}
        >
          <input {...getInputProps()} />

          <div className="p-12 flex flex-col items-center justify-center space-y-6">
            {/* Icon */}
            <motion.div
              animate={{
                y: isDragActive ? -8 : 0,
                scale: isDragActive ? 1.1 : 1,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={cn(
                'p-6 rounded-full',
                'bg-gradient-to-br from-primary/20 to-primary/5',
                'border-2 border-primary/20',
                isDragActive && 'border-primary/50'
              )}
            >
              <FileText
                className={cn(
                  'h-12 w-12 transition-colors',
                  isDragActive ? 'text-primary' : 'text-muted-foreground'
                )}
              />
            </motion.div>

            {/* Text */}
            <div className="text-center space-y-2">
              <AnimatePresence mode="wait">
                {isDragActive ? (
                  <motion.p
                    key="drag-active"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-lg font-semibold text-primary"
                  >
                    Drop your file here
                  </motion.p>
                ) : (
                  <motion.div
                    key="drag-inactive"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-1"
                  >
                    <p className="text-lg font-semibold">
                      Drop CSV here or{' '}
                      <span className="text-primary">click to browse</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Select your NinjaTrader 8 export file
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* File Type Badges */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Badge variant="secondary" className="text-xs">
                CSV
              </Badge>
              <Badge variant="secondary" className="text-xs">
                TXT
              </Badge>
              <Badge variant="secondary" className="text-xs">
                XLS
              </Badge>
              <Badge variant="secondary" className="text-xs">
                XLSX
              </Badge>
              <Badge variant="outline" className="text-xs">
                Max 10MB
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>

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
    </div>
  );
}
