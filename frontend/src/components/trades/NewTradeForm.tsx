import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadService } from '@/services/uploadService';
// Fixed form structure
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Upload, X, TrendingUp, TrendingDown, Calculator, Image as ImageIcon, Target, HelpCircle, Info, ChevronDown } from 'lucide-react';
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
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(initialData?.imageUrl || null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
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

  // Image compression utility
  const compressImage = useCallback((file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // Check file size - if larger than 2MB, compress it
        if (file.size > 2 * 1024 * 1024) {
          const compressedBlob = await compressImage(file);
          const compressedFile = new File([compressedBlob!], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          setSelectedImage(compressedFile);

          const reader = new FileReader();
          reader.onload = (e) => {
            setImagePreview(e.target?.result as string);
          };
          reader.readAsDataURL(compressedFile);
        } else {
          // Use original file if small enough
          setSelectedImage(file);
          const reader = new FileReader();
          reader.onload = (e) => {
            setImagePreview(e.target?.result as string);
          };
          reader.readAsDataURL(file);
        }
      } catch (error) {
        // Fallback to original file
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  }, [compressImage]);

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
    setUploadedImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleFormSubmit = async (data: FormValues) => {
    let finalImageUrl: string | undefined = uploadedImageUrl || undefined;

    // Upload image if one is selected and not already uploaded
    if (selectedImage && !uploadedImageUrl) {
      try {
        setIsUploadingImage(true);
        const uploadedUrl = await uploadService.uploadImage(selectedImage);
        finalImageUrl = uploadedUrl;
        setUploadedImageUrl(uploadedUrl);
      } catch (error) {
        form.setError('root', {
          message: 'Failed to upload image. Trade will be saved without image.'
        });
        // Continue without image
      } finally {
        setIsUploadingImage(false);
      }
    }

    const tradeData: TradeFormData = {
      ...data,
      entryDate: new Date(data.entryDate),
      exitDate: data.exitDate ? new Date(data.exitDate) : undefined,
      imageUrl: finalImageUrl, // Use the uploaded image URL
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

  // Helper component for info tooltips
  const InfoTooltip = ({ content, children }: { content: React.ReactNode; children?: React.ReactNode }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        {children || <Info className="w-4 h-4 text-muted-foreground cursor-help" />}
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        {content}
      </TooltipContent>
    </Tooltip>
  );

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
              "w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all duration-200",
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
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold tracking-tight">New Trade Entry</h2>
          <p className="text-sm text-muted-foreground">
            Record your trading activity with detailed analysis
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
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

            {/* Market Selection - Compact */}
            <Card>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
                  <div className="lg:col-span-2">
                    <FormField
                      control={form.control}
                      name="symbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-1">
                            <span>Trading Symbol *</span>
                            <InfoTooltip content="Select the market you want to trade" />
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={marketsLoading}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={
                                  marketsLoading ? "Loading..." : "Select market"
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
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Market Info - Compact Display */}
                  {selectedMarket && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-xs text-muted-foreground space-y-1"
                    >
                      <div>Tick: {selectedMarket.tickSize}</div>
                      <div>Point: ${selectedMarket.pointValue}</div>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Main Form - No Tabs Layout */}
            <AnimatePresence>
              {isMarketSelected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {/* Main Trade Fields - Always Visible */}
                  <div className="space-y-4">
                    <Card>
                      <CardContent className="pt-4 space-y-4">
                        {/* Direction & Order Type Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                          {/* Mood Rating - Inline */}
                          <FormField
                            control={form.control}
                            name="mood"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center space-x-1">
                                  <span>Mood</span>
                                  <InfoTooltip content="Rate your confidence/mood for this trade (1-5)" />
                                </FormLabel>
                                <div className="flex space-x-1 pt-1">
                                  {MOOD_EMOJIS.map((mood) => (
                                    <motion.button
                                      key={mood.value}
                                      type="button"
                                      onClick={() => field.onChange(mood.value)}
                                      className={cn(
                                        "w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all",
                                        "hover:scale-110",
                                        field.value === mood.value ? "bg-primary/20 ring-1 ring-primary" : "hover:bg-muted"
                                      )}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                      title={mood.label}
                                    >
                                      {mood.emoji}
                                    </motion.button>
                                  ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Entry Price & Quantity Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                        {/* Stop Loss & Take Profit Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="stopLossPoints"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center space-x-1">
                                  <span>Stop Loss (points)</span>
                                  <InfoTooltip content="Points from entry where you want to set stop loss" />
                                </FormLabel>
                                <FormControl>
                                  <div className="space-y-1">
                                    <Input
                                      type="number"
                                      step={selectedMarket?.tickSize || "0.01"}
                                      placeholder="0"
                                      {...field}
                                      value={field.value || ''}
                                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                    />
                                    {field.value && field.value > 0 && absolutePrices.stopLoss && (
                                      <p className="text-xs text-muted-foreground">
                                        = {absolutePrices.stopLoss.toFixed(2)}
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
                            name="takeProfitPoints"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center space-x-1">
                                  <span>Take Profit (points)</span>
                                  <InfoTooltip content="Points from entry where you want to take profit" />
                                </FormLabel>
                                <FormControl>
                                  <div className="space-y-1">
                                    <Input
                                      type="number"
                                      step={selectedMarket?.tickSize || "0.01"}
                                      placeholder="0"
                                      {...field}
                                      value={field.value || ''}
                                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                    />
                                    {field.value && field.value > 0 && absolutePrices.takeProfit && (
                                      <p className="text-xs text-muted-foreground">
                                        = {absolutePrices.takeProfit.toFixed(2)}
                                      </p>
                                    )}
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Risk/Reward Summary - Compact */}
                        {(() => {
                          const shouldShowRisk = watchedValues.stopLossPoints && watchedValues.stopLossPoints > 0 &&
                                               watchedValues.takeProfitPoints && watchedValues.takeProfitPoints > 0;
                          return shouldShowRisk ? (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-3 bg-muted/30 rounded-lg border"
                            >
                              <div className="flex items-center justify-between text-sm">
                                <div>
                                  <span className="text-muted-foreground">Risk/Reward: </span>
                                  <span className="font-semibold">
                                    1:{(watchedValues.takeProfitPoints / watchedValues.stopLossPoints).toFixed(2)}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Risk: {watchedValues.stopLossPoints} pts | Reward: {watchedValues.takeProfitPoints} pts
                                </div>
                              </div>
                            </motion.div>
                          ) : null;
                        })()}

                        {/* Exit Price Field - Added to main section */}
                        <div className="pt-2">
                          <FormField
                            control={form.control}
                            name="exitPricePoints"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center space-x-1">
                                  <span>Exit Price (points from entry)</span>
                                  <InfoTooltip content="Points from entry where you exited. Use positive for profit, negative for loss." />
                                </FormLabel>
                                <FormControl>
                                  <div className="space-y-2">
                                    <Input
                                      type="number"
                                      step={selectedMarket?.tickSize || "0.01"}
                                      placeholder="Leave empty for open position (+ for profit, - for loss)"
                                      {...field}
                                      value={field.value || ''}
                                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                    />
                                    {field.value && absolutePrices.exitPrice !== undefined && (
                                      <p className="text-xs text-muted-foreground">
                                        = {absolutePrices.exitPrice.toFixed(2)}
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
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Optional Fields - Collapsible */}
                  <Collapsible open={showOptionalFields} onOpenChange={setShowOptionalFields}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <span>Optional Details</span>
                        <ChevronDown className={cn("h-4 w-4 transition-transform", showOptionalFields && "rotate-180")} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 pt-4">
                      <Card>
                        <CardContent className="pt-4 space-y-4">
                          {/* Max Favorable & Adverse - Compact */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="maxFavorablePricePoints"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center space-x-1">
                                    <span>Max Favorable (points)</span>
                                    <InfoTooltip content="Highest profit points reached during the trade" />
                                  </FormLabel>
                                  <FormControl>
                                    <div className="space-y-1">
                                      <Input
                                        type="number"
                                        step={selectedMarket?.tickSize || "0.01"}
                                        placeholder="0"
                                        {...field}
                                        value={field.value || ''}
                                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                      />
                                      {field.value && field.value > 0 && absolutePrices.maxFavorablePrice !== undefined && (
                                        <p className="text-xs text-muted-foreground">
                                          = {absolutePrices.maxFavorablePrice.toFixed(2)}
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
                                  <FormLabel className="flex items-center space-x-1">
                                    <span>Max Adverse (points)</span>
                                    <InfoTooltip content="Deepest loss points reached during the trade" />
                                  </FormLabel>
                                  <FormControl>
                                    <div className="space-y-1">
                                      <Input
                                        type="number"
                                        step={selectedMarket?.tickSize || "0.01"}
                                        placeholder="0"
                                        {...field}
                                        value={field.value || ''}
                                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                      />
                                      {field.value && field.value > 0 && absolutePrices.maxAdversePrice !== undefined && (
                                        <p className="text-xs text-muted-foreground">
                                          = {absolutePrices.maxAdversePrice.toFixed(2)}
                                        </p>
                                      )}
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Break-Even Analysis Section - Compact */}
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <Target className="w-4 h-4 text-muted-foreground" />
                              <FormLabel className="text-sm font-semibold text-muted-foreground">
                                Break-Even Analysis
                              </FormLabel>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="maxPotentialProfitPoints"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center space-x-1">
                                      <span>Max Profit (points)</span>
                                      <InfoTooltip content="Highest profit points reached before reversal" />
                                    </FormLabel>
                                    <FormControl>
                                      <div className="space-y-1">
                                        <Input
                                          type="number"
                                          step={selectedMarket?.tickSize || "0.01"}
                                          placeholder="0"
                                          {...field}
                                          value={field.value || ''}
                                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                        />
                                        {field.value && field.value > 0 && absolutePrices.maxPotentialProfit !== undefined && (
                                          <p className="text-xs text-muted-foreground">
                                            = {absolutePrices.maxPotentialProfit.toFixed(2)}
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
                                    <FormLabel className="flex items-center space-x-1">
                                      <span>Max Drawdown (points)</span>
                                      <InfoTooltip content="Deepest drawdown before going to profit" />
                                    </FormLabel>
                                    <FormControl>
                                      <div className="space-y-1">
                                        <Input
                                          type="number"
                                          step={selectedMarket?.tickSize || "0.01"}
                                          placeholder="0"
                                          {...field}
                                          value={field.value || ''}
                                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                        />
                                        {field.value && field.value > 0 && absolutePrices.maxDrawdown !== undefined && (
                                          <p className="text-xs text-muted-foreground">
                                            = {absolutePrices.maxDrawdown.toFixed(2)}
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
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value || false}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="cursor-pointer text-sm">
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

                          {/* Strategy & Timeframe */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                          <FormField
                            control={form.control}
                            name="entryDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Entry Date</FormLabel>
                                <FormControl>
                                  <Input
                                    type="date"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Image Upload - Compact */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <FormLabel>Chart Screenshot</FormLabel>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload
                              </Button>
                            </div>

                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />

                            <AnimatePresence mode="wait">
                              {imagePreview ? (
                                <motion.div
                                  key="image-preview"
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  className="relative"
                                >
                                  <img
                                    src={imagePreview}
                                    alt="Trade screenshot"
                                    className="w-full max-h-32 object-cover rounded-lg border"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={removeImage}
                                    className="absolute top-1 right-1"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="image-placeholder"
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center"
                                >
                                  <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                                  <p className="text-xs text-muted-foreground">
                                    Upload a chart screenshot
                                  </p>
                                </motion.div>
                              )}
                            </AnimatePresence>
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
                                    className="min-h-[80px]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Calculation Summary - Compact */}
                          <CalculationSummary />
                        </CardContent>
                      </Card>
                    </CollapsibleContent>
                  </Collapsible>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Actions - Always Visible */}
            <div className="flex items-center space-x-3 pt-2">
              <Button
                type="submit"
                disabled={isLoading || isUploadingImage || !isMarketSelected}
                className="flex-1"
              >
                {(isLoading || isUploadingImage) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isUploadingImage ? 'Uploading Image...' : 'Save Trade'}
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