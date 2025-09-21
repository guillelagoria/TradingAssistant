import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Download,
  RefreshCw,
  FileText,
  Clock,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useImportStore } from '@/store/importStore';
import { importService } from '@/services/importService';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ImportProgressProps {
  onComplete: () => void;
  onRetry: () => void;
}

export function ImportProgress({ onComplete, onRetry }: ImportProgressProps) {
  const {
    currentSession,
    importProgress,
    options,
    error,
    isImporting,
    setIsImporting,
    updateImportProgress,
    setCurrentSession,
    setError,
  } = useImportStore();

  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (currentSession && !importProgress) {
      startImport();
    }
  }, [currentSession]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (startTime && isImporting) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime.getTime());
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [startTime, isImporting]);

  const startImport = async () => {
    if (!currentSession) return;

    setStartTime(new Date());
    setIsImporting(true);

    try {
      // Execute import
      const response = await importService.executeImport(currentSession.id, options);

      // Update progress to show completion
      updateImportProgress({
        sessionId: currentSession.id,
        status: 'completed',
        progress: 100,
        currentStep: 'Import completed successfully',
        totalSteps: 3,
        completedSteps: 3,
        message: `Successfully imported ${response.importedCount} trades`,
      });

      // Update session with final status
      setCurrentSession({
        ...currentSession,
        status: 'completed',
        progress: 100,
        importedRecords: response.importedCount,
        skippedRecords: response.skippedCount,
        processedAt: new Date().toISOString(),
      });

      // Auto complete after showing success
      setTimeout(() => {
        onComplete();
      }, 2000);

    } catch (error: any) {
      updateImportProgress({
        sessionId: currentSession.id,
        status: 'failed',
        progress: 0,
        currentStep: 'Import failed',
        totalSteps: 3,
        completedSteps: 0,
        error: error.message,
      });

      setError(error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const formatElapsedTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = () => {
    if (!importProgress) return <BarChart3 className="h-8 w-8 text-blue-500" />;

    switch (importProgress.status) {
      case 'importing':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw className="h-8 w-8 text-blue-500" />
          </motion.div>
        );
      case 'completed':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      default:
        return <BarChart3 className="h-8 w-8 text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    if (!importProgress) return 'text-blue-500';
    switch (importProgress.status) {
      case 'completed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      default: return 'text-blue-500';
    }
  };

  const progressSteps = [
    { id: 1, name: 'Validating Data', description: 'Checking data integrity' },
    { id: 2, name: 'Processing Trades', description: 'Converting and validating trades' },
    { id: 3, name: 'Saving to Database', description: 'Storing your trading data' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">
          {importProgress?.status === 'completed' ? 'Import Complete!' : 'Importing Trades'}
        </h2>
        <p className="text-muted-foreground mt-2">
          {importProgress?.status === 'completed'
            ? 'Your trades have been successfully imported'
            : 'Please wait while we import your trading data'}
        </p>
      </div>

      {/* Main Progress Card */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center space-y-6">
            {/* Status Icon */}
            <div className="flex items-center justify-center">
              {getStatusIcon()}
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md space-y-2">
              <Progress
                value={importProgress?.progress || 0}
                className="h-3"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{importProgress?.progress || 0}% Complete</span>
                <span>
                  {startTime && (
                    <span className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatElapsedTime(elapsedTime)}</span>
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Current Step */}
            <div className="text-center space-y-2">
              <Badge
                variant={
                  importProgress?.status === 'completed' ? 'default' :
                  importProgress?.status === 'failed' ? 'destructive' :
                  'secondary'
                }
                className="text-sm"
              >
                {importProgress?.currentStep || 'Preparing import...'}
              </Badge>

              {importProgress?.message && (
                <p className="text-sm text-muted-foreground">
                  {importProgress.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Import Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {progressSteps.map((step) => {
              const isCompleted = (importProgress?.completedSteps || 0) >= step.id;
              const isCurrent = (importProgress?.completedSteps || 0) + 1 === step.id;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0.5 }}
                  animate={{
                    opacity: isCompleted || isCurrent ? 1 : 0.5,
                    scale: isCurrent ? 1.02 : 1,
                  }}
                  className={cn(
                    'flex items-center space-x-3 p-3 rounded-lg border',
                    isCompleted && 'bg-green-50 border-green-200',
                    isCurrent && 'bg-blue-50 border-blue-200',
                    !isCompleted && !isCurrent && 'bg-gray-50 border-gray-200'
                  )}
                >
                  <div className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full',
                    isCompleted && 'bg-green-500 text-white',
                    isCurrent && 'bg-blue-500 text-white',
                    !isCompleted && !isCurrent && 'bg-gray-300 text-gray-600'
                  )}>
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <span className="text-sm font-semibold">{step.id}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{step.name}</p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  {isCurrent && isImporting && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw className="h-4 w-4 text-blue-500" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {importProgress?.status === 'completed' && currentSession && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span>Import Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {currentSession.importedRecords}
                  </p>
                  <p className="text-sm text-muted-foreground">Trades Imported</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {currentSession.skippedRecords}
                  </p>
                  <p className="text-sm text-muted-foreground">Skipped/Duplicates</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {currentSession.totalRecords}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Records</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {formatElapsedTime(elapsedTime)}
                  </p>
                  <p className="text-sm text-muted-foreground">Processing Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

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

      {/* Action Buttons */}
      <div className="flex justify-between">
        <div>
          {importProgress?.status === 'failed' && (
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Import
            </Button>
          )}
        </div>
        <div className="space-x-2">
          {importProgress?.status === 'completed' && (
            <>
              <Button variant="outline" onClick={() => {/* Navigate to trades */}}>
                <FileText className="h-4 w-4 mr-2" />
                View Trades
              </Button>
              <Button onClick={onComplete}>
                <BarChart3 className="h-4 w-4 mr-2" />
                View Dashboard
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}