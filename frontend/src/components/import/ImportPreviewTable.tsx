/**
 * ImportPreviewTable Component
 * Compact preview table showing first 5 trades with validation status
 */

import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { NT8TradePreview } from '@/types/import';

interface ImportPreviewTableProps {
  trades: NT8TradePreview[];
  maxDisplay?: number;
}

export function ImportPreviewTable({ trades, maxDisplay = 5 }: ImportPreviewTableProps) {
  const displayTrades = trades.slice(0, maxDisplay);
  const remainingCount = Math.max(0, trades.length - maxDisplay);

  const formatCurrency = (value: number | null) => {
    if (value === null) return 'N/A';
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
    return formatted;
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MM/dd');
    } catch {
      return dateStr;
    }
  };

  const getStatusIcon = (status: NT8TradePreview['status']) => {
    switch (status) {
      case 'valid':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'duplicate':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: NT8TradePreview['status']) => {
    const config = {
      valid: {
        icon: CheckCircle2,
        label: 'Valid',
        className: 'bg-green-500/10 text-green-600 dark:text-green-400',
      },
      duplicate: {
        icon: AlertCircle,
        label: 'Duplicate',
        className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      },
      error: {
        icon: XCircle,
        label: 'Error',
        className: 'bg-red-500/10 text-red-600 dark:text-red-400',
      },
    };

    const statusConfig = config[status] || config.valid; // Default to valid if status not found
    const { icon: Icon, label, className } = statusConfig;

    return (
      <div className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium', className)}>
        <Icon className="h-3 w-3" />
        <span className="hidden sm:inline">{label}</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Preview (first {maxDisplay} trades)
        </h3>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Symbol</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Side</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">P&L</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {displayTrades.map((trade, index) => (
                <TooltipProvider key={index}>
                  <motion.tr
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* Row Number */}
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {index + 1}
                    </td>

                    {/* Symbol */}
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium">{trade.symbol}</span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(trade.entryDate)}
                      </span>
                    </td>

                    {/* Direction */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          trade.direction === 'LONG' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        )}
                      >
                        {trade.direction}
                      </span>
                    </td>

                    {/* P&L */}
                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          'text-sm font-medium tabular-nums',
                          trade.pnl !== null && trade.pnl > 0 && 'text-green-600 dark:text-green-400',
                          trade.pnl !== null && trade.pnl < 0 && 'text-red-600 dark:text-red-400',
                          trade.pnl === null && 'text-muted-foreground'
                        )}
                      >
                        {formatCurrency(trade.pnl)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      {trade.errorMessage ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="inline-block cursor-help">
                              {getStatusBadge(trade.status)}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs">
                            <p className="text-xs">{trade.errorMessage}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        getStatusBadge(trade.status)
                      )}
                    </td>
                  </motion.tr>
                </TooltipProvider>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Remaining Count */}
      {remainingCount > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-muted-foreground text-center"
        >
          ... and {remainingCount} more trade{remainingCount !== 1 ? 's' : ''}
        </motion.p>
      )}
    </div>
  );
}
