/**
 * PreviewStep Component
 * Shows validation results with stats cards and preview table
 */

import { motion } from 'framer-motion';
import { FileText, Info, ArrowRight, X } from 'lucide-react';
import { ImportStatsCard } from './ImportStatsCard';
import { ImportPreviewTable } from './ImportPreviewTable';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { NT8PreviewResponse } from '@/types/import';

interface PreviewStepProps {
  fileName: string;
  previewData: NT8PreviewResponse['data'];
  onImport: () => void;
  onCancel: () => void;
  isImporting?: boolean;
}

export function PreviewStep({
  fileName,
  previewData,
  onImport,
  onCancel,
  isImporting,
}: PreviewStepProps) {
  const { totalTrades, validTrades, duplicates, errors, trades } = previewData;
  const canImport = validTrades > 0;

  // Transform trades to add status field
  const tradesWithStatus = trades.map(t => ({
    ...t.trade,
    status: t.isDuplicate ? 'duplicate' as const : t.isValid ? 'valid' as const : 'error' as const,
    errorMessage: t.errors.join(', ') || undefined
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Preview: {fileName}
          </h2>
          <p className="text-sm text-muted-foreground">
            Review validation results before importing
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
              <div className="space-y-2 text-xs">
                <p className="font-semibold">Validation Status:</p>
                <ul className="space-y-1">
                  <li>✅ <strong>Valid:</strong> Will be imported</li>
                  <li>⚠️ <strong>Duplicate:</strong> Will be skipped</li>
                  <li>❌ <strong>Error:</strong> Invalid data, will be skipped</li>
                </ul>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <ImportStatsCard count={validTrades} label="Valid Trades" status="success" />
        <ImportStatsCard count={duplicates} label="Duplicates" status="warning" />
        <ImportStatsCard count={errors} label="Errors" status="error" />
      </motion.div>

      {/* Preview Table */}
      {trades.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ImportPreviewTable trades={tradesWithStatus} maxDisplay={5} />
        </motion.div>
      )}

      {/* No Valid Trades Warning */}
      {!canImport && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-6"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-amber-500/10">
              <Info className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                No valid trades to import
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                All trades in this file are either duplicates or contain errors. Please check your
                file and try again with different data.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-between pt-4 border-t"
      >
        <Button variant="outline" onClick={onCancel} disabled={isImporting}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>

        <div className="flex items-center gap-3">
          {canImport && (
            <div className="text-sm text-muted-foreground hidden sm:block">
              {validTrades} trade{validTrades !== 1 ? 's' : ''} will be imported
              {duplicates > 0 && `, ${duplicates} skipped`}
            </div>
          )}
          <Button
            onClick={onImport}
            disabled={!canImport || isImporting}
            className="min-w-[140px]"
          >
            {isImporting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="mr-2"
                >
                  <FileText className="h-4 w-4" />
                </motion.div>
                Importing...
              </>
            ) : (
              <>
                Import {validTrades} Trade{validTrades !== 1 ? 's' : ''}
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
