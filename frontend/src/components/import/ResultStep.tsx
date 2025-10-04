/**
 * ResultStep Component
 * Success/error results after import execution
 */

import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowRight, Upload, Eye, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { NT8ExecuteResponse } from '@/types/import';

interface ResultStepProps {
  result: NT8ExecuteResponse;
  onViewTrades: () => void;
  onImportMore: () => void;
}

export function ResultStep({ result, onViewTrades, onImportMore }: ResultStepProps) {
  const { data } = result;
  const isSuccess = data.imported > 0;

  return (
    <div className="space-y-6">
      {/* Success State */}
      {isSuccess && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
          }}
          className="text-center space-y-6"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 150,
              damping: 12,
              delay: 0.1,
            }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full animate-pulse" />
              <div className="relative p-6 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/5 border-2 border-green-500/30">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
            </div>
          </motion.div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <h2 className="text-3xl font-bold text-green-600 dark:text-green-400">
              Import Successful!
            </h2>
            <p className="text-muted-foreground">
              Your trades have been imported successfully
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex flex-col gap-2 p-6 rounded-xl bg-muted/30 border"
          >
            <div className="text-4xl font-bold text-green-600 dark:text-green-400 tabular-nums">
              {data.imported}
            </div>
            <div className="text-sm text-muted-foreground">
              trade{data.imported !== 1 ? 's' : ''} imported successfully
            </div>
            {data.skipped > 0 && (
              <div className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                {data.skipped} duplicate{data.skipped !== 1 ? 's' : ''} skipped
              </div>
            )}
            {data.errors > 0 && (
              <div className="text-xs text-red-600 dark:text-red-400">
                {data.errors} error{data.errors !== 1 ? 's' : ''}
              </div>
            )}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-3 pt-4"
          >
            <Button onClick={onViewTrades} size="lg" className="min-w-[150px]">
              <Eye className="h-4 w-4 mr-2" />
              View Trades
            </Button>
            <Button onClick={onImportMore} variant="outline" size="lg">
              <Upload className="h-4 w-4 mr-2" />
              Import More
            </Button>
          </motion.div>
        </motion.div>
      )}

      {/* Error State */}
      {!isSuccess && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
          }}
          className="text-center space-y-6"
        >
          {/* Error Icon */}
          <motion.div
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 150,
              damping: 12,
              delay: 0.1,
            }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full animate-pulse" />
              <div className="relative p-6 rounded-full bg-gradient-to-br from-red-500/20 to-red-500/5 border-2 border-red-500/30">
                <XCircle className="h-16 w-16 text-red-500" />
              </div>
            </div>
          </motion.div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <h2 className="text-3xl font-bold text-red-600 dark:text-red-400">
              Import Failed
            </h2>
            <p className="text-muted-foreground">
              No valid trades found in the file
            </p>
          </motion.div>

          {/* Common Issues */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-md mx-auto p-6 rounded-xl bg-muted/30 border text-left"
          >
            <div className="flex items-start gap-3 mb-4">
              <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-semibold mb-2">Common Issues:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>Wrong file format (ensure it's a valid NT8 export)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>All trades are duplicates (already imported)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>Invalid data in CSV (missing required fields)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>Empty file or incorrect column headers</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center pt-4"
          >
            <Button onClick={onImportMore} size="lg">
              <Upload className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
