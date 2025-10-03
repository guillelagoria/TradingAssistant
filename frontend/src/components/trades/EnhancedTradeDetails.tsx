import { useState } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trade, TradeDirection, TradeResult } from '@/types';
import { cn } from '@/lib/utils';
import ImageViewer from '@/components/shared/ImageViewer';
import { useImageViewer } from '@/hooks/useImageViewer';
import {
  Edit,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Maximize2,
  Target,
  Shield,
  Activity,
  FileText,
  ChevronRight,
  Info,
  Image as ImageIcon,
  X
} from 'lucide-react';

interface EnhancedTradeDetailsProps {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (trade: Trade) => void;
}

function EnhancedTradeDetails({ trade, open, onOpenChange, onEdit }: EnhancedTradeDetailsProps) {
  const {
    isOpen: imageViewerOpen,
    currentIndex: currentImageIndex,
    openViewer: handleImageClick,
    closeViewer: handleImageViewerClose,
    setCurrentIndex: handleImageIndexChange,
  } = useImageViewer();

  const [imageLoaded, setImageLoaded] = useState(false);

  if (!trade) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getHoldingPeriod = () => {
    if (!trade.exitDate) return 'Open position';

    const entry = new Date(trade.entryDate);
    const exit = new Date(trade.exitDate);
    const diffMs = exit.getTime() - entry.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ${diffHours % 24}h`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  const getResultColor = () => {
    if (!trade.result) return 'text-gray-500';
    switch (trade.result) {
      case TradeResult.WIN:
        return 'text-green-600 dark:text-green-400';
      case TradeResult.LOSS:
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getPnlColor = (value: number) => {
    if (value > 0) return 'text-green-600 dark:text-green-400';
    if (value < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getResultBadgeVariant = () => {
    if (!trade.result) return 'secondary';
    switch (trade.result) {
      case TradeResult.WIN:
        return 'default' as const;
      case TradeResult.LOSS:
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
  };

  const tradeImages = trade.imageUrl ? [trade.imageUrl] : [];

  // Check if we have risk management data
  const hasRiskData = trade.stopLoss || trade.takeProfit || trade.riskAmount || trade.riskPercentage;

  // Check if we have performance metrics
  const hasPerformanceMetrics = trade.maxFavorablePrice || trade.maxAdversePrice || trade.efficiency > 0;

  // Check if we have notes or strategy info
  const hasStrategyInfo = trade.notes || trade.strategy || trade.timeframe;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden p-0">
        {/* Header Section */}
        <DialogHeader className="px-6 pt-6 pb-4 space-y-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {/* Direction Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', duration: 0.6 }}
                className={cn(
                  'p-3 rounded-xl',
                  trade.direction === TradeDirection.LONG
                    ? 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                    : 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                )}
              >
                {trade.direction === TradeDirection.LONG ? (
                  <TrendingUp className="h-6 w-6" />
                ) : (
                  <TrendingDown className="h-6 w-6" />
                )}
              </motion.div>

              {/* Title and Result */}
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-2xl font-bold">
                    {trade.symbol}
                  </DialogTitle>
                  <Badge
                    variant="outline"
                    className={cn(
                      'font-semibold',
                      trade.direction === TradeDirection.LONG
                        ? 'border-green-500 text-green-600 dark:text-green-400'
                        : 'border-red-500 text-red-600 dark:text-red-400'
                    )}
                  >
                    {trade.direction}
                  </Badge>
                  {trade.result && (
                    <Badge variant={getResultBadgeVariant()} className="font-semibold text-sm px-3 py-1">
                      {trade.result}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(new Date(trade.entryDate), 'MMMM dd, yyyy')}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button onClick={() => onEdit?.(trade)} size="sm" variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-6 pb-6" style={{ maxHeight: 'calc(95vh - 120px)' }}>
          <div className="space-y-6 pt-4">
            {/* P&L Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center py-6 space-y-3"
            >
              <div className={cn('text-5xl font-bold tracking-tight', getPnlColor(trade.netPnl))}>
                {formatCurrency(trade.netPnl)}
              </div>
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Gross:</span>
                  <span className={cn('font-semibold', getPnlColor(trade.pnl))}>
                    {formatCurrency(trade.pnl)}
                  </span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Commission:</span>
                  <span className="font-semibold">{formatCurrency(trade.commission)}</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Return:</span>
                  <span className={cn('font-semibold', getPnlColor(trade.pnlPercentage))}>
                    {formatPercentage(trade.pnlPercentage)}
                  </span>
                </div>
              </div>
            </motion.div>

            <Separator />

            {/* Entry/Exit Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {/* Entry Card */}
              <Card className="p-4 border-l-4 border-l-green-500 bg-green-500/5 dark:bg-green-500/10">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <h3 className="font-semibold text-green-600 dark:text-green-400">Entry</h3>
                  </div>
                  <Badge variant="outline" className="text-xs">{trade.quantity} contracts</Badge>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold">{formatCurrency(trade.entryPrice)}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {format(new Date(trade.entryDate), 'MMM dd, HH:mm')}
                  </div>
                </div>
              </Card>

              {/* Exit Card */}
              <Card className="p-4 border-l-4 border-l-red-500 bg-red-500/5 dark:bg-red-500/10">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ArrowDownLeft className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <h3 className="font-semibold text-red-600 dark:text-red-400">Exit</h3>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {getHoldingPeriod()}
                  </Badge>
                </div>
                {trade.exitPrice ? (
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">{formatCurrency(trade.exitPrice)}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {trade.exitDate && format(new Date(trade.exitDate), 'MMM dd, HH:mm')}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Badge variant="secondary" className="text-base px-4 py-2">
                      Open Position
                    </Badge>
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Trade Image Section - Prominent if available */}
            {trade.imageUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">Trade Screenshot</h3>
                </div>
                <div
                  onClick={() => handleImageClick(0)}
                  className="relative cursor-pointer group overflow-hidden rounded-xl border border-border hover:border-primary/50 transition-all duration-300"
                >
                  <div className="aspect-video w-full relative bg-muted">
                    <img
                      src={trade.imageUrl}
                      alt="Trade screenshot"
                      className={cn(
                        'w-full h-full object-contain transition-all duration-500',
                        imageLoaded ? 'opacity-100' : 'opacity-0',
                        'group-hover:scale-105'
                      )}
                      onLoad={() => setImageLoaded(true)}
                    />
                    {!imageLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    )}
                  </div>

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ opacity: 1, scale: 1 }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    >
                      <div className="bg-black/70 backdrop-blur-sm rounded-full p-4">
                        <Maximize2 className="h-6 w-6 text-white" />
                      </div>
                    </motion.div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Click to view full-screen
                </p>
              </motion.div>
            )}

            {/* Collapsible Sections - Only shown if data exists */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Accordion type="multiple" className="space-y-2">
                {/* Risk Management - Only if data exists */}
                {hasRiskData && (
                  <AccordionItem value="risk" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold">Risk Management</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4 pt-2 pb-4">
                        {trade.stopLoss && (
                          <div>
                            <span className="text-sm text-muted-foreground">Stop Loss</span>
                            <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                              {formatCurrency(trade.stopLoss)}
                            </div>
                          </div>
                        )}
                        {trade.takeProfit && (
                          <div>
                            <span className="text-sm text-muted-foreground">Take Profit</span>
                            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                              {formatCurrency(trade.takeProfit)}
                            </div>
                          </div>
                        )}
                        {trade.riskAmount && (
                          <div>
                            <span className="text-sm text-muted-foreground">Risk Amount</span>
                            <div className="text-lg font-semibold">{formatCurrency(trade.riskAmount)}</div>
                          </div>
                        )}
                        {trade.riskPercentage && (
                          <div>
                            <span className="text-sm text-muted-foreground">Risk %</span>
                            <div className="text-lg font-semibold">{trade.riskPercentage}%</div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Performance Metrics - Only if data exists */}
                {hasPerformanceMetrics && (
                  <AccordionItem value="performance" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold">Performance Metrics</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2 pb-4">
                        {trade.rMultiple > 0 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm text-muted-foreground">R-Multiple</span>
                                    <Info className="h-3 w-3 text-muted-foreground" />
                                  </div>
                                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                    {trade.rMultiple.toFixed(2)}R
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Profit/Loss relative to initial risk</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {trade.maxFavorablePrice && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm text-muted-foreground">MFE</span>
                                    <Info className="h-3 w-3 text-muted-foreground" />
                                  </div>
                                  <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                                    {formatCurrency(trade.maxFavorablePrice)}
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Max Favorable Excursion - Best price reached</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {trade.maxAdversePrice && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm text-muted-foreground">MAE</span>
                                    <Info className="h-3 w-3 text-muted-foreground" />
                                  </div>
                                  <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                                    {formatCurrency(trade.maxAdversePrice)}
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Max Adverse Excursion - Worst price reached</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {trade.efficiency > 0 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm text-muted-foreground">Efficiency</span>
                                    <Info className="h-3 w-3 text-muted-foreground" />
                                  </div>
                                  <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                                    {trade.efficiency.toFixed(1)}%
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>How well you captured the available move</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Strategy & Notes - Only if data exists */}
                {hasStrategyInfo && (
                  <AccordionItem value="strategy" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold">Strategy & Analysis</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2 pb-4">
                        <div className="grid grid-cols-2 gap-4">
                          {trade.strategy && (
                            <div>
                              <span className="text-sm text-muted-foreground">Strategy</span>
                              <div className="font-semibold">
                                {trade.strategy === 'CUSTOM' ? trade.customStrategy : trade.strategy}
                              </div>
                            </div>
                          )}
                          {trade.timeframe && (
                            <div>
                              <span className="text-sm text-muted-foreground">Timeframe</span>
                              <div className="font-semibold">{trade.timeframe}</div>
                            </div>
                          )}
                        </div>
                        {trade.notes && (
                          <>
                            <Separator />
                            <div>
                              <span className="text-sm text-muted-foreground">Notes</span>
                              <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm leading-relaxed">
                                {trade.notes}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </motion.div>

            {/* Empty State - If no additional data */}
            {!hasRiskData && !hasPerformanceMetrics && !hasStrategyInfo && !trade.imageUrl && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No additional information available for this trade.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Image Viewer */}
      <ImageViewer
        images={tradeImages}
        currentIndex={currentImageIndex}
        isOpen={imageViewerOpen}
        onClose={handleImageViewerClose}
        onIndexChange={handleImageIndexChange}
        altText={`Trade image for ${trade.symbol}`}
        showNavigation={tradeImages.length > 1}
        showCounter={tradeImages.length > 1}
        showZoomControls={true}
      />
    </Dialog>
  );
}

export default EnhancedTradeDetails;
