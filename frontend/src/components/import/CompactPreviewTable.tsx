import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { NT8Trade } from '@/types/import';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CompactPreviewTableProps {
  trades: NT8Trade[];
  maxRows?: number;
}

export function CompactPreviewTable({ trades, maxRows = 5 }: CompactPreviewTableProps) {
  const displayTrades = trades.slice(0, maxRows);
  const remainingCount = trades.length - maxRows;

  const getStatusBadge = (trade: NT8Trade) => {
    if (trade.error === 'Duplicate trade') {
      return <Badge variant="outline" className="text-yellow-600 border-yellow-400 dark:text-yellow-500 dark:border-yellow-600">Duplicate</Badge>;
    }
    if (trade.error) {
      return <Badge variant="destructive">Error</Badge>;
    }
    return <Badge variant="default" className="bg-green-500 dark:bg-green-600">Valid</Badge>;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'Invalid Date' : format(date, 'MM/dd/yy HH:mm');
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <div className="space-y-2">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[100px]">Symbol</TableHead>
              <TableHead className="w-[80px]">Direction</TableHead>
              <TableHead className="text-right">Entry</TableHead>
              <TableHead className="text-right">Exit</TableHead>
              <TableHead className="text-right">P&L</TableHead>
              <TableHead className="w-[140px]">Date/Time</TableHead>
              <TableHead className="w-[90px] text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayTrades.map((trade, index) => {
              const isLong = trade.quantity > 0;
              const pnl = trade.profit || 0;
              const isProfitable = pnl > 0;

              return (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'border-b transition-colors',
                    trade.error && trade.error !== 'Duplicate trade' && 'bg-red-50/30 dark:bg-red-950/20',
                    trade.error === 'Duplicate trade' && 'bg-yellow-50/30 dark:bg-yellow-950/20'
                  )}
                >
                  <TableCell className="font-medium">{trade.instrument || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {isLong ? (
                        <>
                          <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-500" />
                          <span className="text-green-600 font-semibold dark:text-green-500">LONG</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-500" />
                          <span className="text-red-600 font-semibold dark:text-red-500">SHORT</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    ${trade.price?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    ${trade.exitPrice?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        'font-semibold font-mono text-sm',
                        isProfitable ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
                      )}
                    >
                      {isProfitable ? '+' : ''}${pnl.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(trade.time)}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(trade)}
                  </TableCell>
                </motion.tr>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {remainingCount > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          + {remainingCount} more trade{remainingCount !== 1 ? 's' : ''} not shown
        </p>
      )}
    </div>
  );
}
