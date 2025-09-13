import React from 'react';
import { Progress } from "../ui/progress";
import { Button } from "../ui/button";
import { AlertCircle, CheckCircle, Download, X } from "lucide-react";
import { ExportProgress as ExportProgressType } from '../../types';

interface ExportProgressProps {
  progress: ExportProgressType;
  onCancel?: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export const ExportProgress: React.FC<ExportProgressProps> = ({
  progress,
  onCancel,
  onClose,
  showCloseButton = false
}) => {
  const getStageIcon = () => {
    switch (progress.stage) {
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Download className="h-5 w-5 text-blue-500 animate-pulse" />;
    }
  };

  const getStageColor = () => {
    switch (progress.stage) {
      case 'complete':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const getProgressColor = () => {
    switch (progress.stage) {
      case 'complete':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with icon and stage */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getStageIcon()}
          <div>
            <h3 className={`font-medium ${getStageColor()}`}>
              {progress.stage === 'preparing' && 'Preparing Export'}
              {progress.stage === 'processing' && 'Processing Data'}
              {progress.stage === 'generating' && 'Generating File'}
              {progress.stage === 'complete' && 'Export Complete'}
              {progress.stage === 'error' && 'Export Failed'}
            </h3>
            <p className="text-sm text-muted-foreground">{progress.message}</p>
          </div>
        </div>
        
        {/* Close button for completed/error states */}
        {showCloseButton && (progress.stage === 'complete' || progress.stage === 'error') && onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <Progress 
          value={progress.progress} 
          className="h-2"
          style={{
            '--progress-foreground': progress.stage === 'complete' ? 'hsl(var(--success))' :
                                   progress.stage === 'error' ? 'hsl(var(--destructive))' :
                                   'hsl(var(--primary))'
          } as React.CSSProperties}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{progress.progress}%</span>
          {progress.stage !== 'error' && progress.stage !== 'complete' && (
            <span>
              {progress.stage === 'preparing' && 'Initializing...'}
              {progress.stage === 'processing' && 'Processing data...'}
              {progress.stage === 'generating' && 'Creating file...'}
            </span>
          )}
        </div>
      </div>

      {/* Error message */}
      {progress.stage === 'error' && progress.error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Export Error</h4>
              <p className="text-sm text-red-700 mt-1">{progress.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success message */}
      {progress.stage === 'complete' && (
        <div className="rounded-md bg-green-50 p-4 border border-green-200">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-green-800">Export Successful</h4>
              <p className="text-sm text-green-700 mt-1">
                Your file has been downloaded successfully.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end space-x-2">
        {/* Cancel button for active exports */}
        {progress.stage !== 'complete' && progress.stage !== 'error' && onCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Cancel Export
          </Button>
        )}

        {/* Close button for completed/error states */}
        {(progress.stage === 'complete' || progress.stage === 'error') && onClose && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>
        )}
      </div>
    </div>
  );
};

export default ExportProgress;