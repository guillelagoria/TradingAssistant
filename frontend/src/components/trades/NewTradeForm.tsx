import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Upload, X, TrendingUp, TrendingDown, Calculator, Image as ImageIcon, Target, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

import { TradeFormData, TradeDirection, Strategy, Timeframe, OrderType } from '@/types';
import { calculateTradeMetrics, validateTradeData, formatCurrency, formatPercentage, formatRMultiple, calculateExitPriceFromPoints } from '@/utils/tradeCalculations';
import { useMarketData } from '@/hooks/useMarketData';
import { MarketInfo } from '@/services/marketService';
import TemplateSelector from './TemplateSelector';
import { TradeTemplate } from '@/types/template';
import { useTemplateStore } from '@/store/templateStore';

// Mood emojis for rating (1-5 scale)
const MOOD_EMOJIS = [
  { value: 1, emoji: '😢', label: 'Terrible' },
  { value: 2, emoji: '😕', label: 'Poor' },
  { value: 3, emoji: '😐', label: 'Neutral' },
  { value: 4, emoji: '😊', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Excellent' }
];

interface NewTradeFormProps {
  onSubmit: (trade: TradeFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<TradeFormData>;
  isLoading?: boolean;
}

interface FormValues extends Omit<TradeFormData, 'entryDate' | 'exitDate'> {
  entryDate: string;
  exitDate?: string;
  mood?: number;
  maxPotentialProfit?: number;
  maxDrawdown?: number;
  breakEvenWorked?: boolean;
  // Points-based entry fields
  stopLossPoints?: number;
  takeProfitPoints?: number;
  exitPricePoints?: number;
  maxFavorablePricePoints?: number;
  maxAdversePricePoints?: number;
  maxPotentialProfitPoints?: number;
  maxDrawdownPoints?: number;
}

export default function NewTradeForm({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false
}: NewTradeFormProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const [isMarketSelected, setIsMarketSelected] = useState(!!initialData?.symbol);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  // Market data integration
  const { markets, loading: marketsLoading, error: marketsError, getMarket } = useMarketData();
  const [selectedMarket, setSelectedMarket] = useState<MarketInfo | null>(null);

  // Template store
  const { selectTemplate } = useTemplateStore();

  const form = useForm<FormValues>({
    defaultValues: {
      symbol: initialData?.symbol || '',
      direction: initialData?.direction || TradeDirection.LONG,
      entryPrice: initialData?.entryPrice || 0,
      quantity: initialData?.quantity || 0,
      entryDate: initialData?.entryDate ? initialData.entryDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      orderType: initialData?.orderType || OrderType.MARKET,
      exitPrice: initialData?.exitPrice || undefined,
      exitDate: initialData?.exitDate ? initialData.exitDate.toISOString().split('T')[0] : undefined,
      stopLoss: initialData?.stopLoss || undefined,
      takeProfit: initialData?.takeProfit || undefined,
      strategy: initialData?.strategy || Strategy.DAY_TRADING,
      timeframe: initialData?.timeframe || Timeframe.M15,
      notes: initialData?.notes || '',
      maxFavorablePrice: initialData?.maxFavorablePrice || undefined,
      maxAdversePrice: initialData?.maxAdversePrice || undefined,
      maxPotentialProfit: initialData?.maxPotentialProfit || undefined,
      maxDrawdown: initialData?.maxDrawdown || undefined,
      breakEvenWorked: initialData?.breakEvenWorked || false,
      mood: 3, // Default neutral mood
      // Points-based defaults - convert from prices if available
      stopLossPoints: initialData?.stopLoss && initialData?.entryPrice ?
        Math.abs(initialData.stopLoss - initialData.entryPrice) : undefined,
      takeProfitPoints: initialData?.takeProfit && initialData?.entryPrice ?
        Math.abs(initialData.takeProfit - initialData.entryPrice) : undefined,
      exitPricePoints: initialData?.exitPrice && initialData?.entryPrice ?
        Math.abs(initialData.exitPrice - initialData.entryPrice) : undefined,
      maxFavorablePricePoints: initialData?.maxFavorablePrice && initialData?.entryPrice ?
        Math.abs(initialData.maxFavorablePrice - initialData.entryPrice) : undefined,
      maxAdversePricePoints: initialData?.maxAdversePrice && initialData?.entryPrice ?
        Math.abs(initialData.maxAdversePrice - initialData.entryPrice) : undefined,
      maxPotentialProfitPoints: initialData?.maxPotentialProfit && initialData?.entryPrice ?
        Math.abs(initialData.maxPotentialProfit - initialData.entryPrice) : undefined,
      maxDrawdownPoints: initialData?.maxDrawdown && initialData?.entryPrice ?
        Math.abs(initialData.maxDrawdown - initialData.entryPrice) : undefined,
    }
  });

  const watchedValues = form.watch();

  // Convert points to absolute prices based on direction
  const convertPointsToPrice = useCallback((points: number | undefined, isStop: boolean = false, isReverse: boolean = false): number | undefined => {
    if (!points || points <= 0 || !watchedValues.entryPrice || !selectedMarket) return undefined;

    const entryPrice = watchedValues.entryPrice;
    const direction = watchedValues.direction;

    if (direction === TradeDirection.LONG) {
      if (isStop || isReverse) {
        return entryPrice - points;
      } else {
        return entryPrice + points;
      }
    } else { // SHORT
      if (isStop || isReverse) {
        return entryPrice + points;
      } else {
        return entryPrice - points;
      }
    }
  }, [watchedValues.entryPrice, watchedValues.direction, selectedMarket]);

  // Calculate exit price from points - handles both positive and negative points correctly
  const calculateExitPriceFromPoints = useCallback((entryPrice: number, pointsFromEntry: number, direction: TradeDirection): number => {
    // pointsFromEntry can be positive (profit) or negative (loss)
    // For LONG: exit = entry + points (positive = profit, negative = loss)
    // For SHORT: exit = entry - points (positive = profit, negative = loss)

    if (direction === TradeDirection.LONG) {
      return entryPrice + pointsFromEntry;
    } else { // SHORT
      return entryPrice - pointsFromEntry;
    }
  }, []);

  // Calculate absolute prices from points
  const absolutePrices = useMemo(() => {
    const stopLoss = convertPointsToPrice(watchedValues.stopLossPoints, true);
    const takeProfit = convertPointsToPrice(watchedValues.takeProfitPoints);


    return {
      stopLoss,
      takeProfit,
      exitPrice: watchedValues.exitPricePoints && watchedValues.entryPrice ?
        calculateExitPriceFromPoints(
          watchedValues.entryPrice,
          watchedValues.exitPricePoints,
          watchedValues.direction
        ) : undefined,
      maxFavorablePrice: convertPointsToPrice(watchedValues.maxFavorablePricePoints),
      maxAdversePrice: convertPointsToPrice(watchedValues.maxAdversePricePoints, true),
      maxPotentialProfit: convertPointsToPrice(watchedValues.maxPotentialProfitPoints),
      maxDrawdown: convertPointsToPrice(watchedValues.maxDrawdownPoints, true)
    };
  }, [watchedValues, convertPointsToPrice]);

  // Real-time calculation with debounce
  const calculations = useMemo(() => {
    if (!watchedValues.symbol || !watchedValues.entryPrice || !watchedValues.quantity || !selectedMarket) {
      return null;
    }

    // Only calculate if we have exit price for P&L calculation
    if (!absolutePrices.exitPrice) {
      return null;
    }

    return calculateTradeMetrics(
      watchedValues.entryPrice,
      absolutePrices.exitPrice,
      absolutePrices.stopLoss || 0,
      absolutePrices.takeProfit || 0,
      selectedMarket,
      absolutePrices.maxFavorablePrice,
      watchedValues.direction // Pass the actual trade direction
    );
  }, [watchedValues, selectedMarket, absolutePrices]);

  // Handle market selection and update selected market
  useEffect(() => {
    const isSelected = !!watchedValues.symbol;
    if (isSelected !== isMarketSelected) {
      setIsMarketSelected(isSelected);
    }

    // Update selected market when symbol changes
    if (watchedValues.symbol && markets.length > 0) {
      const market = getMarket(watchedValues.symbol);
      setSelectedMarket(market || null);
    } else {
      setSelectedMarket(null);
    }
  }, [watchedValues.symbol, isMarketSelected, markets, getMarket]);

  // Clear template selection when component mounts (reset form to blank state)
  useEffect(() => {
    selectTemplate(null);
  }, []); // Only run on mount

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Handle template application
  const handleApplyTemplate = useCallback((template: TradeTemplate) => {
    // Apply template values to form
    if (template.symbol) form.setValue('symbol', template.symbol);
    if (template.direction) form.setValue('direction', template.direction);
    if (template.quantity) form.setValue('quantity', template.quantity);
    if (template.orderType) form.setValue('orderType', template.orderType);
    if (template.stopLossPoints) form.setValue('stopLossPoints', template.stopLossPoints);
    if (template.takeProfitPoints) form.setValue('takeProfitPoints', template.takeProfitPoints);
    if (template.strategy) form.setValue('strategy', template.strategy);
    if (template.timeframe) form.setValue('timeframe', template.timeframe);

    // If symbol is set, trigger market selection
    if (template.symbol) {
      const market = getMarket(template.symbol);
      if (market) {
        setSelectedMarket(market);
        setIsMarketSelected(true);
      }
    }
  }, [form, getMarket]);

  const removeImage = useCallback(() => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleFormSubmit = async (data: FormValues) => {
    const tradeData: TradeFormData = {
      ...data,
      entryDate: new Date(data.entryDate),
      exitDate: data.exitDate ? new Date(data.exitDate) : undefined,
      imageUrl: imagePreview || undefined,
      // Convert points back to absolute prices for storage
      stopLoss: absolutePrices.stopLoss,
      takeProfit: absolutePrices.takeProfit,
      exitPrice: absolutePrices.exitPrice,
      maxFavorablePrice: absolutePrices.maxFavorablePrice,
      maxAdversePrice: absolutePrices.maxAdversePrice,
      maxPotentialProfit: absolutePrices.maxPotentialProfit,
      maxDrawdown: absolutePrices.maxDrawdown,
    };

    const validationErrors = validateTradeData(tradeData);
    if (validationErrors.length > 0) {
      // Set form errors
      validationErrors.forEach(error => {
        form.setError('root', { message: error });
      });
      return;
    }

    try {
      await onSubmit(tradeData);
    } catch (error) {
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Failed to save trade'
      });
    }
  };

  const MoodRating = ({ value, onChange }: { value?: number; onChange: (value: number) => void }) => (
    <div className="flex items-center space-x-2">
      <FormLabel className="text-sm font-medium">Mood Rating</FormLabel>
      <div className="flex space-x-1">
        {MOOD_EMOJIS.map((mood) => (
          <motion.button
            key={mood.value}
            type="button"
            onClick={() => onChange(mood.value)}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all duration-200",
              "hover:scale-110 hover:bg-muted",
              value === mood.value ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-muted"
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title={mood.label}
          >
            {mood.emoji}
          </motion.button>
        ))}
      </div>
    </div>
  );

  const CalculationSummary = () => {
    if (!calculations || !isMarketSelected) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Calculator className="w-5 h-5" />
              <span>Trade Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">P&L</p>
                <p className={cn(
                  "text-lg font-semibold",
                  calculations.pnlUsd > 0 ? "text-green-600" :
                  calculations.pnlUsd < 0 ? "text-red-600" : "text-muted-foreground"
                )}>
                  {formatCurrency(calculations.pnlUsd)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">P&L %</p>
                <p className={cn(
                  "text-lg font-semibold",
                  calculations.pnlPercentage > 0 ? "text-green-600" :
                  calculations.pnlPercentage < 0 ? "text-red-600" : "text-muted-foreground"
                )}>
                  {formatPercentage(calculations.pnlPercentage)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">R-Multiple</p>
                <Badge variant={calculations.rMultiple >= 0 ? "default" : "destructive"}>
                  {formatRMultiple(calculations.rMultiple)}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Efficiency</p>
                <Badge variant="outline">
                  {formatPercentage(calculations.efficiency)}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Commission</p>
                <p className="font-medium text-red-600">
                  -{formatCurrency(calculations.commission)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Net P&L</p>
                <p className={cn(
                  "font-medium",
                  calculations.netPnl > 0 ? "text-green-600" :
                  calculations.netPnl < 0 ? "text-red-600" : "text-muted-foreground"
                )}>
                  {formatCurrency(calculations.netPnl)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <TooltipProvider>
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">New Trade Entry</h2>
          <p className="text-muted-foreground">
            Record your trading activity with detailed analysis
          </p>
        </div>

        <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Template Selector */}
          <TemplateSelector
            onApplyTemplate={handleApplyTemplate}
            currentFormValues={{
              symbol: watchedValues.symbol,
              direction: watchedValues.direction,
              quantity: watchedValues.quantity,
              orderType: watchedValues.orderType,
              stopLossPoints: watchedValues.stopLossPoints,
              takeProfitPoints: watchedValues.takeProfitPoints,
              strategy: watchedValues.strategy,
              timeframe: watchedValues.timeframe
            }}
          />

          {/* Market Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Market Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trading Symbol *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={marketsLoading}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={
                            marketsLoading
                              ? "Loading markets..."
                              : marketsError
                                ? "Error loading markets"
                                : "Select a market to trade"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {markets.map((market) => (
                          <SelectItem key={market.id} value={market.symbol}>
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium">{market.symbol}</span>
                              <span className="text-sm text-muted-foreground ml-2">{market.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                        {markets.length === 0 && !marketsLoading && (
                          <SelectItem value="no-markets" disabled>
                            No markets available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    {marketsError && (
                      <p className="text-sm text-red-600 mt-1">{marketsError}</p>
                    )}
                  </FormItem>
                )}
              />

              {/* Market Info Display */}
              {selectedMarket && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-muted/50 rounded-lg border"
                >
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Exchange:</span>
                      <span className="ml-2 font-medium">{selectedMarket.exchange}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Category:</span>
                      <span className="ml-2 font-medium capitalize">{selectedMarket.category}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tick Size:</span>
                      <span className="ml-2 font-medium">{selectedMarket.tickSize}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Point Value:</span>
                      <span className="ml-2 font-medium">${selectedMarket.pointValue}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Main Trade Fields - Animate in when market is selected */}
          <AnimatePresence>
            {isMarketSelected && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Trade Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="direction"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Direction *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={TradeDirection.LONG}>
                                  <div className="flex items-center space-x-2">
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                    <span>Long</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value={TradeDirection.SHORT}>
                                  <div className="flex items-center space-x-2">
                                    <TrendingDown className="w-4 h-4 text-red-600" />
                                    <span>Short</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="orderType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Order Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.values(OrderType).map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type.replace('_', ' ')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="entryPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Entry Price *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="1"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="stopLossPoints"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <span>Stop Loss (points)</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">
                                    Enter the number of points from your entry price where you want to set your stop loss.
                                    For LONG: Stop = Entry - Points | For SHORT: Stop = Entry + Points
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <Input
                                  type="number"
                                  step={selectedMarket?.tickSize || "0.01"}
                                  placeholder="0"
                                  {...field}
                                  value={field.value || ''}
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                />
                                {(() => {
                                  const shouldShow = field.value > 0 &&
                                                    watchedValues.entryPrice > 0 &&
                                                    absolutePrices.stopLoss !== undefined &&
                                                    absolutePrices.stopLoss > 0;
                                  return shouldShow ? (
                                    <p className="text-xs text-muted-foreground">
                                      = {absolutePrices.stopLoss.toFixed(selectedMarket?.tickSize === 0.01 ? 2 : selectedMarket?.tickSize === 1 ? 0 : 4)}
                                    </p>
                                  ) : null;
                                })()}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="takeProfitPoints"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <span>Take Profit (points)</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">
                                    Enter the number of points from your entry price where you want to take profit.
                                    For LONG: Profit = Entry + Points | For SHORT: Profit = Entry - Points
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <Input
                                  type="number"
                                  step={selectedMarket?.tickSize || "0.01"}
                                  placeholder="0"
                                  {...field}
                                  value={field.value || ''}
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                />
                                {(() => {
                                  const shouldShow = field.value > 0 &&
                                                    watchedValues.entryPrice > 0 &&
                                                    absolutePrices.takeProfit !== undefined &&
                                                    absolutePrices.takeProfit > 0;
                                  return shouldShow ? (
                                    <p className="text-xs text-muted-foreground">
                                      = {absolutePrices.takeProfit.toFixed(selectedMarket?.tickSize === 0.01 ? 2 : selectedMarket?.tickSize === 1 ? 0 : 4)}
                                    </p>
                                  ) : null;
                                })()}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Risk/Reward Summary */}
                    {(() => {
                      const shouldShowRisk = watchedValues.stopLossPoints && watchedValues.stopLossPoints > 0 &&
                                           watchedValues.takeProfitPoints && watchedValues.takeProfitPoints > 0 &&
                                           watchedValues.entryPrice && watchedValues.entryPrice > 0;

                      return shouldShowRisk ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 bg-muted/30 rounded-lg border"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <div className="space-y-1">
                            <p className="text-muted-foreground">Risk/Reward Ratio</p>
                            <p className="font-semibold text-lg">
                              1:{(watchedValues.takeProfitPoints / watchedValues.stopLossPoints).toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-muted-foreground">Risk: {watchedValues.stopLossPoints} pts</p>
                            <p className="text-muted-foreground">Reward: {watchedValues.takeProfitPoints} pts</p>
                          </div>
                        </div>
                      </motion.div>
                      ) : null;
                    })()}

                    <FormField
                      control={form.control}
                      name="exitPricePoints"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <span>Exit Price (points from entry)</span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  Enter points from entry where you exited. Use positive for profit, negative for loss.
                                  <br /><br />
                                  <strong>Examples:</strong><br />
                                  • +5 = gained 5 points (profit)<br />
                                  • -5 = lost 5 points (loss)<br />
                                  <br />
                                  The system calculates exit price automatically based on direction.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input
                                type="number"
                                step={selectedMarket?.tickSize || "0.01"}
                                placeholder="Leave empty for open position (use + for profit, - for loss)"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              />
                              {field.value && watchedValues.entryPrice && watchedValues.entryPrice > 0 && absolutePrices.exitPrice !== undefined && (
                                <p className="text-xs text-muted-foreground">
                                  = {absolutePrices.exitPrice.toFixed(selectedMarket?.tickSize === 0.01 ? 2 : selectedMarket?.tickSize === 1 ? 0 : 4)}
                                  <span className={cn(
                                    "ml-2 font-medium",
                                    field.value > 0 ? "text-green-600" : field.value < 0 ? "text-red-600" : "text-muted-foreground"
                                  )}>
                                    ({field.value > 0 ? '+' : ''}{field.value} pts)
                                  </span>
                                </p>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Mood Rating */}
                <Card>
                  <CardContent className="pt-6">
                    <FormField
                      control={form.control}
                      name="mood"
                      render={({ field }) => (
                        <FormItem>
                          <MoodRating
                            value={field.value}
                            onChange={field.onChange}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Image Upload */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <FormLabel>Chart Screenshot</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center space-x-2"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Upload Image</span>
                        </Button>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />

                      <AnimatePresence>
                        {imagePreview && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="relative"
                          >
                            <img
                              src={imagePreview}
                              alt="Trade screenshot"
                              className="w-full max-h-48 object-cover rounded-lg border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={removeImage}
                              className="absolute top-2 right-2"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {!imagePreview && (
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                          <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                          <p className="text-sm text-muted-foreground">
                            Upload a chart screenshot to reference your trade setup
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Optional Details Accordion */}
                <Accordion type="single" collapsible value={showOptionalDetails ? 'details' : ''}>
                  <AccordionItem value="details">
                    <AccordionTrigger
                      onClick={() => setShowOptionalDetails(!showOptionalDetails)}
                      className="text-left"
                    >
                      Optional Details
                    </AccordionTrigger>
                    <AccordionContent>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-4 pt-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="strategy"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Strategy</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {Object.values(Strategy).map((strategy) => (
                                      <SelectItem key={strategy} value={strategy}>
                                        {strategy.replace('_', ' ')}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="timeframe"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Timeframe</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {Object.values(Timeframe).map((timeframe) => (
                                      <SelectItem key={timeframe} value={timeframe}>
                                        {timeframe}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="maxFavorablePricePoints"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Max Favorable (points)</FormLabel>
                                <FormControl>
                                  <div className="space-y-2">
                                    <Input
                                      type="number"
                                      step={selectedMarket?.tickSize || "0.01"}
                                      placeholder="0"
                                      {...field}
                                      value={field.value || ''}
                                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                    />
                                    {field.value && field.value > 0 && watchedValues.entryPrice && watchedValues.entryPrice > 0 && absolutePrices.maxFavorablePrice !== undefined && (
                                      <p className="text-xs text-muted-foreground">
                                        = {absolutePrices.maxFavorablePrice.toFixed(selectedMarket?.tickSize === 0.01 ? 2 : selectedMarket?.tickSize === 1 ? 0 : 4)}
                                      </p>
                                    )}
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="maxAdversePricePoints"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Max Adverse (points)</FormLabel>
                                <FormControl>
                                  <div className="space-y-2">
                                    <Input
                                      type="number"
                                      step={selectedMarket?.tickSize || "0.01"}
                                      placeholder="0"
                                      {...field}
                                      value={field.value || ''}
                                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                    />
                                    {field.value && field.value > 0 && watchedValues.entryPrice && watchedValues.entryPrice > 0 && absolutePrices.maxAdversePrice !== undefined && (
                                      <p className="text-xs text-muted-foreground">
                                        = {absolutePrices.maxAdversePrice.toFixed(selectedMarket?.tickSize === 0.01 ? 2 : selectedMarket?.tickSize === 1 ? 0 : 4)}
                                      </p>
                                    )}
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Break-Even Analysis Section */}
                        <div className="space-y-4">
                          <Separator />
                          <div className="flex items-center space-x-2">
                            <Target className="w-4 h-4 text-muted-foreground" />
                            <FormLabel className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                              Break-Even Analysis
                            </FormLabel>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="maxPotentialProfitPoints"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Max Profit (points)</FormLabel>
                                  <FormControl>
                                    <div className="space-y-2">
                                      <Input
                                        type="number"
                                        step={selectedMarket?.tickSize || "0.01"}
                                        placeholder="Highest profit points reached"
                                        {...field}
                                        value={field.value || ''}
                                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                      />
                                      {field.value && field.value > 0 && watchedValues.entryPrice && watchedValues.entryPrice > 0 && absolutePrices.maxPotentialProfit !== undefined && (
                                        <p className="text-xs text-muted-foreground">
                                          = {absolutePrices.maxPotentialProfit.toFixed(selectedMarket?.tickSize === 0.01 ? 2 : selectedMarket?.tickSize === 1 ? 0 : 4)}
                                        </p>
                                      )}
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="maxDrawdownPoints"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Max Drawdown (points)</FormLabel>
                                  <FormControl>
                                    <div className="space-y-2">
                                      <Input
                                        type="number"
                                        step={selectedMarket?.tickSize || "0.01"}
                                        placeholder="Deepest drawdown points"
                                        {...field}
                                        value={field.value || ''}
                                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                      />
                                      {field.value && field.value > 0 && watchedValues.entryPrice && watchedValues.entryPrice > 0 && absolutePrices.maxDrawdown !== undefined && (
                                        <p className="text-xs text-muted-foreground">
                                          = {absolutePrices.maxDrawdown.toFixed(selectedMarket?.tickSize === 0.01 ? 2 : selectedMarket?.tickSize === 1 ? 0 : 4)}
                                        </p>
                                      )}
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="breakEvenWorked"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value || false}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="cursor-pointer">
                                    Break-Even Protection Worked
                                  </FormLabel>
                                  <p className="text-xs text-muted-foreground">
                                    Check if moving stop-loss to break-even protected this trade
                                  </p>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes & Analysis</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="What was your reasoning? How did the trade play out? What did you learn?"
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Calculation Summary */}
                <CalculationSummary />

                {/* Form Actions */}
                <div className="flex items-center space-x-3 pt-6">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Trade
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Errors */}
          {form.formState.errors.root && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {form.formState.errors.root.message}
            </div>
          )}
        </form>
      </Form>
    </div>
    </TooltipProvider>
  );
}