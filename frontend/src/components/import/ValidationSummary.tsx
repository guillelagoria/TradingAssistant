import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { ImportError } from '@/types/import';
import { cn } from '@/lib/utils';

interface ValidationSummaryProps {
  validCount: number;
  duplicateCount: number;
  errorCount: number;
  errors?: ImportError[];
  warnings?: ImportError[];
  duplicates?: ImportError[];
}

export function ValidationSummary({
  validCount,
  duplicateCount,
  errorCount,
  errors = [],
  warnings = [],
  duplicates = [],
}: ValidationSummaryProps) {
  const [errorsOpen, setErrorsOpen] = useState(errorCount > 0);
  const [warningsOpen, setWarningsOpen] = useState(false);
  const [duplicatesOpen, setDuplicatesOpen] = useState(false);

  const hasIssues = errorCount > 0 || warnings.length > 0 || duplicateCount > 0;

  return (
    <div className="space-y-3">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Valid Trades */}
        <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg dark:bg-green-600">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{validCount}</p>
                <p className="text-xs text-green-600 font-medium dark:text-green-500">Valid Trades</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Duplicates */}
        <Card className={cn(
          'border-yellow-200 dark:border-yellow-800',
          duplicateCount > 0 ? 'bg-yellow-50/50 dark:bg-yellow-950/20' : 'bg-gray-50 dark:bg-gray-900'
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                duplicateCount > 0 ? 'bg-yellow-500 dark:bg-yellow-600' : 'bg-gray-300 dark:bg-gray-700'
              )}>
                <AlertTriangle className={cn(
                  'h-5 w-5',
                  duplicateCount > 0 ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                )} />
              </div>
              <div>
                <p className={cn(
                  'text-2xl font-bold',
                  duplicateCount > 0 ? 'text-yellow-700 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'
                )}>
                  {duplicateCount}
                </p>
                <p className={cn(
                  'text-xs font-medium',
                  duplicateCount > 0 ? 'text-yellow-600 dark:text-yellow-500' : 'text-gray-500 dark:text-gray-400'
                )}>
                  Duplicates
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Errors */}
        <Card className={cn(
          'border-red-200 dark:border-red-800',
          errorCount > 0 ? 'bg-red-50/50 dark:bg-red-950/20' : 'bg-gray-50 dark:bg-gray-900'
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                errorCount > 0 ? 'bg-red-500 dark:bg-red-600' : 'bg-gray-300 dark:bg-gray-700'
              )}>
                <AlertCircle className={cn(
                  'h-5 w-5',
                  errorCount > 0 ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                )} />
              </div>
              <div>
                <p className={cn(
                  'text-2xl font-bold',
                  errorCount > 0 ? 'text-red-700 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                )}>
                  {errorCount}
                </p>
                <p className={cn(
                  'text-xs font-medium',
                  errorCount > 0 ? 'text-red-600 dark:text-red-500' : 'text-gray-500 dark:text-gray-400'
                )}>
                  Errors
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expandable Error Details */}
      {hasIssues && (
        <div className="space-y-2">
          {/* Errors Section */}
          {errorCount > 0 && (
            <Collapsible open={errorsOpen} onOpenChange={setErrorsOpen}>
              <Card className="border-red-200 dark:border-red-800">
                <CollapsibleTrigger className="w-full">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                        <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                          {errorCount} Error{errorCount !== 1 ? 's' : ''} Found
                        </span>
                        <Badge variant="destructive" className="text-xs">
                          Must Fix
                        </Badge>
                      </div>
                      {errorsOpen ? (
                        <ChevronDown className="h-4 w-4 text-red-500 dark:text-red-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-red-500 dark:text-red-400" />
                      )}
                    </div>
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="px-3 pb-3 pt-0 space-y-2 max-h-48 overflow-y-auto">
                    {errors.slice(0, 10).map((error, index) => (
                      <Alert key={index} variant="destructive" className="py-2">
                        <AlertDescription className="text-xs">
                          <strong>Row {error.row}:</strong> {error.message}
                          {error.field && (
                            <span className="text-red-600/80"> (Field: {error.field})</span>
                          )}
                        </AlertDescription>
                      </Alert>
                    ))}
                    {errors.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        + {errors.length - 10} more errors
                      </p>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Duplicates Section */}
          {duplicateCount > 0 && (
            <Collapsible open={duplicatesOpen} onOpenChange={setDuplicatesOpen}>
              <Card className="border-yellow-200 dark:border-yellow-800">
                <CollapsibleTrigger className="w-full">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                        <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
                          {duplicateCount} Duplicate{duplicateCount !== 1 ? 's' : ''} Detected
                        </span>
                        <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-700 dark:border-yellow-600 dark:text-yellow-500">
                          Will Skip
                        </Badge>
                      </div>
                      {duplicatesOpen ? (
                        <ChevronDown className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                      )}
                    </div>
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="px-3 pb-3 pt-0 space-y-2 max-h-48 overflow-y-auto">
                    {duplicates.slice(0, 10).map((duplicate, index) => (
                      <Alert key={index} className="bg-yellow-50 border-yellow-200 py-2 dark:bg-yellow-950/20 dark:border-yellow-800">
                        <AlertDescription className="text-xs dark:text-yellow-200">
                          <strong>Row {duplicate.row}:</strong> {duplicate.message}
                        </AlertDescription>
                      </Alert>
                    ))}
                    {duplicates.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        + {duplicates.length - 10} more duplicates
                      </p>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Warnings Section */}
          {warnings.length > 0 && (
            <Collapsible open={warningsOpen} onOpenChange={setWarningsOpen}>
              <Card className="border-orange-200 dark:border-orange-800">
                <CollapsibleTrigger className="w-full">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                        <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                          {warnings.length} Warning{warnings.length !== 1 ? 's' : ''}
                        </span>
                        <Badge variant="outline" className="text-xs border-orange-400 text-orange-700 dark:border-orange-600 dark:text-orange-500">
                          Review
                        </Badge>
                      </div>
                      {warningsOpen ? (
                        <ChevronDown className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                      )}
                    </div>
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="px-3 pb-3 pt-0 space-y-2 max-h-48 overflow-y-auto">
                    {warnings.slice(0, 10).map((warning, index) => (
                      <Alert key={index} className="bg-orange-50 border-orange-200 py-2 dark:bg-orange-950/20 dark:border-orange-800">
                        <AlertDescription className="text-xs dark:text-orange-200">
                          <strong>Row {warning.row}:</strong> {warning.message}
                          {warning.field && (
                            <span className="text-orange-600/80 dark:text-orange-400/80"> (Field: {warning.field})</span>
                          )}
                        </AlertDescription>
                      </Alert>
                    ))}
                    {warnings.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        + {warnings.length - 10} more warnings
                      </p>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}
        </div>
      )}

      {/* Success Message if no issues */}
      {!hasIssues && validCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
            <AlertDescription className="text-green-700 dark:text-green-400">
              All trades validated successfully! Ready to import.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </div>
  );
}
