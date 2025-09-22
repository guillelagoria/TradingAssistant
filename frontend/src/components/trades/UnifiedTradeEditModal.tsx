import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  ImagePlus,
  X,
  DollarSign,
  Info,
  Calculator,
  BarChart3,
  Settings,
  Activity,
  Clock,
  Gauge,
  FileText,
  Hash,
  Building,
  Layers,
  MapPin,
  LogIn,
  LogOut,
  PiggyBank,
  Timer,
  BarChart,
  Sparkles,
  Calendar,
  Upload,
  Clipboard
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTradeStore } from '@/store/tradeStore';
import { useActiveAccount } from '@/store/accountStore';
import { Trade, TradeDirection } from '@/types/trade';
import { cn } from '@/lib/utils';
import { convertPointsToDollars, formatDollars, formatPoints } from '@/utils/symbolUtils';
import { uploadTradeImage } from '@/services/tradesService';

interface UnifiedTradeEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trade: Trade | null;
}

interface UnifiedTradeForm {
  // Basic Info fields (always shown)
  symbol: string;
  direction: TradeDirection;
  entryPrice: string;
  quantity: string;
  stopLoss: string;
  takeProfit: string;
  exitPrice: string;
  entryDate: string;
  exitDate: string;
  notes: string;

  // Quick result for basic trades
  result: string;

  // NT8 Details fields (shown for NT8 trades or when expanded)
  tradeNumber: string;
  instrumentFull: string;
  nt8Account: string;
  nt8Strategy: string;
  marketPosition: string;
  entryName: string;
  exitName: string;
  cumulativeProfit: string;

  // Analysis fields (shown for NT8 trades or when expanded)
  mae: string;
  mfe: string;
  etd: string;
  bars: string;
  durationMinutes: string;
  maeEfficiency: string;
  mfeEfficiency: string;
  riskRealization: string;

  // Image upload (always available)
  image: File | null;
  currentImageUrl: string;
}

const UnifiedTradeEditModal: React.FC<UnifiedTradeEditModalProps> = ({
  open,
  onOpenChange,
  trade
}) => {
  const { updateTrade, loading, fetchTrades } = useTradeStore();
  const activeAccount = useActiveAccount();

  // Determine if this is an NT8 trade or has advanced data
  const isNT8Trade = trade?.source === 'NT8_IMPORT' || trade?.hasAdvancedData;
  const [showAdvancedFields, setShowAdvancedFields] = useState(isNT8Trade);
  const [activeTab, setActiveTab] = useState('basic');

  const [form, setForm] = useState<UnifiedTradeForm>({
    symbol: '',
    direction: TradeDirection.LONG,
    entryPrice: '',
    quantity: '1',
    stopLoss: '',
    takeProfit: '',
    exitPrice: '',
    entryDate: '',
    exitDate: '',
    notes: '',
    result: '',

    // NT8 fields
    tradeNumber: '',
    instrumentFull: '',
    nt8Account: '',
    nt8Strategy: '',
    marketPosition: '',
    entryName: '',
    exitName: '',
    cumulativeProfit: '',

    // Analysis fields
    mae: '',
    mfe: '',
    etd: '',
    bars: '',
    durationMinutes: '',
    maeEfficiency: '',
    mfeEfficiency: '',
    riskRealization: '',

    // Image
    image: null,
    currentImageUrl: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [imagePasted, setImagePasted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Refs for auto-focus
  const entryPriceRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  // Initialize form when trade changes
  useEffect(() => {
    if (trade && open) {
      // Convert trade data to form format
      const formatDate = (date: string | Date | null) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().slice(0, 16); // Format for datetime-local input
      };

      setForm({
        // Basic fields
        symbol: trade.symbol || '',
        direction: trade.direction || TradeDirection.LONG,
        entryPrice: trade.entryPrice?.toString() || '',
        quantity: trade.quantity?.toString() || '1',
        stopLoss: trade.stopLoss?.toString() || '',
        takeProfit: trade.takeProfit?.toString() || '',
        exitPrice: trade.exitPrice?.toString() || '',
        entryDate: formatDate(trade.entryDate),
        exitDate: formatDate(trade.exitDate),
        notes: trade.notes || '',

        // Calculate result from PnL if available
        result: trade.pnl ? formatPoints(trade.pnl, trade.symbol) : '',

        // NT8 fields
        tradeNumber: trade.tradeNumber || '',
        instrumentFull: trade.instrumentFull || '',
        nt8Account: trade.nt8Account || '',
        nt8Strategy: trade.nt8Strategy || '',
        marketPosition: trade.marketPosition || '',
        entryName: trade.entryName || '',
        exitName: trade.exitName || '',
        cumulativeProfit: trade.cumulativeProfit?.toString() || '',

        // Analysis fields
        mae: trade.mae?.toString() || '',
        mfe: trade.mfe?.toString() || '',
        etd: trade.etd?.toString() || '',
        bars: trade.bars?.toString() || '',
        durationMinutes: trade.durationMinutes?.toString() || '',
        maeEfficiency: trade.maeEfficiency?.toString() || '',
        mfeEfficiency: trade.mfeEfficiency?.toString() || '',
        riskRealization: trade.riskRealization?.toString() || '',

        // Image
        image: null,
        currentImageUrl: trade.imageUrl || ''
      });

      // Set advanced fields visibility
      setShowAdvancedFields(isNT8Trade);
    }
  }, [trade, open, isNT8Trade]);

  // Auto-focus and paste listener setup
  useEffect(() => {
    if (open) {
      // Auto-focus on entry price
      setTimeout(() => {
        entryPriceRef.current?.focus();
      }, 100);

      // Setup paste listener for images
      const handlePaste = (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith('image/')) {
            e.preventDefault();
            const blob = item.getAsFile();
            if (blob) {
              const file = new File([blob], `screenshot-${Date.now()}.png`, {
                type: blob.type
              });
              setForm(prev => ({ ...prev, image: file }));
              setImagePasted(true);
              setTimeout(() => setImagePasted(false), 2000);
            }
            break;
          }
        }
      };

      document.addEventListener('paste', handlePaste);
      return () => document.removeEventListener('paste', handlePaste);
    }
  }, [open]);

  // Helper function to check if form data has changed
  const hasFormDataChanged = () => {
    if (!trade) return false;

    const formatDate = (date: string | Date | null) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toISOString().slice(0, 16);
    };

    // Compare all relevant form fields with original trade data
    return (
      form.symbol !== trade.symbol ||
      form.direction !== trade.direction ||
      form.entryPrice !== trade.entryPrice.toString() ||
      form.quantity !== trade.quantity.toString() ||
      form.stopLoss !== (trade.stopLoss?.toString() || '') ||
      form.takeProfit !== (trade.takeProfit?.toString() || '') ||
      form.exitPrice !== (trade.exitPrice?.toString() || '') ||
      form.entryDate !== formatDate(trade.entryDate) ||
      form.exitDate !== formatDate(trade.exitDate) ||
      form.notes !== (trade.notes || '') ||
      form.tradeNumber !== (trade.tradeNumber || '') ||
      form.instrumentFull !== (trade.instrumentFull || '') ||
      form.nt8Account !== (trade.nt8Account || '') ||
      form.nt8Strategy !== (trade.nt8Strategy || '') ||
      form.marketPosition !== (trade.marketPosition || '') ||
      form.entryName !== (trade.entryName || '') ||
      form.exitName !== (trade.exitName || '') ||
      form.cumulativeProfit !== (trade.cumulativeProfit?.toString() || '') ||
      form.mae !== (trade.mae?.toString() || '') ||
      form.mfe !== (trade.mfe?.toString() || '') ||
      form.etd !== (trade.etd?.toString() || '') ||
      form.bars !== (trade.bars?.toString() || '') ||
      form.durationMinutes !== (trade.durationMinutes?.toString() || '') ||
      form.maeEfficiency !== (trade.maeEfficiency?.toString() || '') ||
      form.mfeEfficiency !== (trade.mfeEfficiency?.toString() || '') ||
      form.riskRealization !== (trade.riskRealization?.toString() || '')
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trade || !activeAccount) return;

    setIsSubmitting(true);
    setValidationErrors({});

    try {
      // Check if this is an image-only update
      const isImageOnlyUpdate = form.image && !hasFormDataChanged();

      if (isImageOnlyUpdate) {
        // Only upload image without updating trade data to preserve dates
        try {
          const imageResult = await uploadTradeImage(trade.id, form.image, activeAccount?.id);
          // Update form state with the new image URL
          setForm(prev => ({
            ...prev,
            currentImageUrl: imageResult,
            image: null // Clear the pending image
          }));

          // Refresh the trades to update the store with the new image URL
          if (activeAccount?.id) {
            await fetchTrades(activeAccount.id);
          }

          // Don't close modal immediately to show the uploaded image
          setTimeout(() => {
            onOpenChange(false);
          }, 1000); // Give user 1 second to see the uploaded image

          return; // Exit early
        } catch (imageError) {
          console.warn('Image upload failed (endpoint may not be available):', imageError);
          setValidationErrors({ submit: 'Failed to upload image. Please try again.' });
          return;
        }
      }

      // If we reach here, we need to update trade data
      // Validate required fields
      const errors: Record<string, string> = {};
      if (!form.symbol.trim()) errors.symbol = 'Symbol is required';
      if (!form.entryPrice.trim()) errors.entryPrice = 'Entry price is required';
      if (!form.quantity.trim()) errors.quantity = 'Quantity is required';

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setIsSubmitting(false);
        return;
      }

      // Prepare update data
      const updateData: Partial<Trade> = {
        symbol: form.symbol.toUpperCase(),
        direction: form.direction,
        entryPrice: parseFloat(form.entryPrice),
        quantity: parseInt(form.quantity),
        stopLoss: form.stopLoss ? parseFloat(form.stopLoss) : null,
        takeProfit: form.takeProfit ? parseFloat(form.takeProfit) : null,
        exitPrice: form.exitPrice ? parseFloat(form.exitPrice) : null,
        entryDate: form.entryDate ? new Date(form.entryDate) : null,
        exitDate: form.exitDate ? new Date(form.exitDate) : null,
        notes: form.notes || null,
      };

      // Add NT8 fields if they exist
      if (showAdvancedFields) {
        Object.assign(updateData, {
          tradeNumber: form.tradeNumber || null,
          instrumentFull: form.instrumentFull || null,
          nt8Account: form.nt8Account || null,
          nt8Strategy: form.nt8Strategy || null,
          marketPosition: form.marketPosition || null,
          entryName: form.entryName || null,
          exitName: form.exitName || null,
          cumulativeProfit: form.cumulativeProfit ? parseFloat(form.cumulativeProfit) : null,
          mae: form.mae ? parseFloat(form.mae) : null,
          mfe: form.mfe ? parseFloat(form.mfe) : null,
          etd: form.etd ? parseFloat(form.etd) : null,
          bars: form.bars ? parseInt(form.bars) : null,
          durationMinutes: form.durationMinutes ? parseInt(form.durationMinutes) : null,
          maeEfficiency: form.maeEfficiency ? parseFloat(form.maeEfficiency) : null,
          mfeEfficiency: form.mfeEfficiency ? parseFloat(form.mfeEfficiency) : null,
          riskRealization: form.riskRealization ? parseFloat(form.riskRealization) : null,
        });
      }

      // Handle result field for basic trades (convert points to dollars if needed)
      if (!form.exitPrice && form.result) {
        const resultValue = parseFloat(form.result);
        if (!isNaN(resultValue)) {
          const dollarValue = convertPointsToDollars(form.symbol, resultValue, parseInt(form.quantity));
          // Calculate exit price from result
          if (form.direction === TradeDirection.LONG) {
            updateData.exitPrice = parseFloat(form.entryPrice) + (resultValue / parseInt(form.quantity));
          } else {
            updateData.exitPrice = parseFloat(form.entryPrice) - (resultValue / parseInt(form.quantity));
          }
        }
      }

      // Update the trade data
      await updateTrade(trade.id, updateData);

      // Then upload image if provided
      if (form.image) {
        try {
          const imageResult = await uploadTradeImage(trade.id, form.image, activeAccount?.id);
          // Update form state with the new image URL
          setForm(prev => ({
            ...prev,
            currentImageUrl: imageResult,
            image: null // Clear the pending image
          }));

          // Refresh the trades to update the store with the new image URL
          if (activeAccount?.id) {
            await fetchTrades(activeAccount.id);
          }

          // Don't close modal immediately to show the uploaded image
          setTimeout(() => {
            onOpenChange(false);
          }, 1000); // Give user 1 second to see the uploaded image

          return; // Exit early to avoid closing modal immediately
        } catch (imageError) {
          console.warn('Image upload failed (endpoint may not be available):', imageError);
          // Continue without failing the entire trade update
        }
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update trade:', error);
      setValidationErrors({ submit: 'Failed to update trade. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (trade) {
      // Reset form to original trade values
      const formatDate = (date: string | Date | null) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().slice(0, 16);
      };

      setForm({
        symbol: trade.symbol || '',
        direction: trade.direction || TradeDirection.LONG,
        entryPrice: trade.entryPrice?.toString() || '',
        quantity: trade.quantity?.toString() || '1',
        stopLoss: trade.stopLoss?.toString() || '',
        takeProfit: trade.takeProfit?.toString() || '',
        exitPrice: trade.exitPrice?.toString() || '',
        entryDate: formatDate(trade.entryDate),
        exitDate: formatDate(trade.exitDate),
        notes: trade.notes || '',
        result: trade.pnl ? formatPoints(trade.pnl, trade.symbol) : '',
        tradeNumber: trade.tradeNumber || '',
        instrumentFull: trade.instrumentFull || '',
        nt8Account: trade.nt8Account || '',
        nt8Strategy: trade.nt8Strategy || '',
        marketPosition: trade.marketPosition || '',
        entryName: trade.entryName || '',
        exitName: trade.exitName || '',
        cumulativeProfit: trade.cumulativeProfit?.toString() || '',
        mae: trade.mae?.toString() || '',
        mfe: trade.mfe?.toString() || '',
        etd: trade.etd?.toString() || '',
        bars: trade.bars?.toString() || '',
        durationMinutes: trade.durationMinutes?.toString() || '',
        maeEfficiency: trade.maeEfficiency?.toString() || '',
        mfeEfficiency: trade.mfeEfficiency?.toString() || '',
        riskRealization: trade.riskRealization?.toString() || '',
        image: null,
        currentImageUrl: trade.imageUrl || ''
      });
    }
  };

  const handleImageUpload = (file: File) => {
    setForm(prev => ({ ...prev, image: file }));
  };

  if (!trade) return null;

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20"
                  >
                    <Settings className="h-5 w-5 text-blue-600" />
                  </motion.div>
                  Edit Trade
                  <Badge variant={isNT8Trade ? "default" : "secondary"}>
                    {isNT8Trade ? "NT8 Import" : "Manual"}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Modify trade details and analysis data
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {!isNT8Trade && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                  >
                    {showAdvancedFields ? "Basic" : "Advanced"}
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="advanced" disabled={!showAdvancedFields}>
                  {isNT8Trade ? "NT8 Details" : "Advanced"}
                </TabsTrigger>
                <TabsTrigger value="analysis" disabled={!showAdvancedFields}>
                  Analysis
                </TabsTrigger>
              </TabsList>

              <div className="mt-6 max-h-[50vh] overflow-y-auto">
                <TabsContent value="basic" className="space-y-4">
                  {/* Basic Info Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Symbol */}
                    <div className="space-y-2">
                      <Label htmlFor="symbol" className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Symbol
                      </Label>
                      <Input
                        id="symbol"
                        value={form.symbol}
                        onChange={(e) => setForm(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                        placeholder="ES, NQ, etc."
                        className={cn(validationErrors.symbol && "border-red-500")}
                      />
                      {validationErrors.symbol && (
                        <p className="text-sm text-red-500">{validationErrors.symbol}</p>
                      )}
                    </div>

                    {/* Direction */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Direction
                      </Label>
                      <Select
                        value={form.direction}
                        onValueChange={(value) => setForm(prev => ({ ...prev, direction: value as TradeDirection }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TradeDirection.LONG}>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              Long
                            </div>
                          </SelectItem>
                          <SelectItem value={TradeDirection.SHORT}>
                            <div className="flex items-center gap-2">
                              <TrendingDown className="h-4 w-4 text-red-500" />
                              Short
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Entry Price */}
                    <div className="space-y-2">
                      <Label htmlFor="entryPrice" className="flex items-center gap-2">
                        <LogIn className="h-4 w-4" />
                        Entry Price
                      </Label>
                      <Input
                        id="entryPrice"
                        ref={entryPriceRef}
                        type="number"
                        step="0.01"
                        value={form.entryPrice}
                        onChange={(e) => setForm(prev => ({ ...prev, entryPrice: e.target.value }))}
                        placeholder="5800.00"
                        className={cn(validationErrors.entryPrice && "border-red-500")}
                      />
                      {validationErrors.entryPrice && (
                        <p className="text-sm text-red-500">{validationErrors.entryPrice}</p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2">
                      <Label htmlFor="quantity" className="flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        Quantity
                      </Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={form.quantity}
                        onChange={(e) => setForm(prev => ({ ...prev, quantity: e.target.value }))}
                        placeholder="1"
                        className={cn(validationErrors.quantity && "border-red-500")}
                      />
                      {validationErrors.quantity && (
                        <p className="text-sm text-red-500">{validationErrors.quantity}</p>
                      )}
                    </div>

                    {/* Stop Loss */}
                    <div className="space-y-2">
                      <Label htmlFor="stopLoss" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Stop Loss
                      </Label>
                      <Input
                        id="stopLoss"
                        type="number"
                        step="0.01"
                        value={form.stopLoss}
                        onChange={(e) => setForm(prev => ({ ...prev, stopLoss: e.target.value }))}
                        placeholder="5790.00"
                      />
                    </div>

                    {/* Take Profit */}
                    <div className="space-y-2">
                      <Label htmlFor="takeProfit" className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Take Profit
                      </Label>
                      <Input
                        id="takeProfit"
                        type="number"
                        step="0.01"
                        value={form.takeProfit}
                        onChange={(e) => setForm(prev => ({ ...prev, takeProfit: e.target.value }))}
                        placeholder="5820.00"
                      />
                    </div>

                    {/* Exit Price */}
                    <div className="space-y-2">
                      <Label htmlFor="exitPrice" className="flex items-center gap-2">
                        <LogOut className="h-4 w-4" />
                        Exit Price
                      </Label>
                      <Input
                        id="exitPrice"
                        type="number"
                        step="0.01"
                        value={form.exitPrice}
                        onChange={(e) => setForm(prev => ({ ...prev, exitPrice: e.target.value }))}
                        placeholder="5810.00"
                      />
                    </div>

                    {/* Quick Result (for basic trades without exit price) */}
                    {!showAdvancedFields && !form.exitPrice && (
                      <div className="space-y-2">
                        <Label htmlFor="result" className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Result (Points)
                        </Label>
                        <Input
                          id="result"
                          type="number"
                          step="0.01"
                          value={form.result}
                          onChange={(e) => setForm(prev => ({ ...prev, result: e.target.value }))}
                          placeholder="10.00"
                        />
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="entryDate" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Entry Date
                      </Label>
                      <Input
                        id="entryDate"
                        type="datetime-local"
                        value={form.entryDate}
                        onChange={(e) => setForm(prev => ({ ...prev, entryDate: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="exitDate" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Exit Date
                      </Label>
                      <Input
                        id="exitDate"
                        type="datetime-local"
                        value={form.exitDate}
                        onChange={(e) => setForm(prev => ({ ...prev, exitDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Notes
                    </Label>
                    <Textarea
                      id="notes"
                      value={form.notes}
                      onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Trade notes and observations..."
                      rows={3}
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <ImagePlus className="h-4 w-4" />
                      Screenshot
                      <Badge variant="secondary" className="ml-2">
                        Ctrl+V to paste
                      </Badge>
                    </Label>

                    <div className="space-y-2">
                      {form.currentImageUrl && !form.image && (
                        <div className="relative">
                          <img
                            src={form.currentImageUrl}
                            alt="Current trade screenshot"
                            className="max-w-full h-32 object-cover rounded-lg border"
                          />
                          <p className="text-sm text-muted-foreground mt-1">Current screenshot</p>
                        </div>
                      )}

                      {form.image && (
                        <div className="relative">
                          <img
                            src={URL.createObjectURL(form.image)}
                            alt="New screenshot"
                            className="max-w-full h-32 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => setForm(prev => ({ ...prev, image: null }))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <p className="text-sm text-green-600 mt-1">New screenshot ready to upload</p>
                        </div>
                      )}

                      <input
                        ref={imageRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                        className="hidden"
                      />

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => imageRef.current?.click()}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {form.image ? 'Change Screenshot' : 'Upload Screenshot'}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* NT8 Details Tab */}
                <TabsContent value="advanced" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tradeNumber" className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Trade Number
                      </Label>
                      <Input
                        id="tradeNumber"
                        value={form.tradeNumber}
                        onChange={(e) => setForm(prev => ({ ...prev, tradeNumber: e.target.value }))}
                        placeholder="Trade #123"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instrumentFull" className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Instrument Full
                      </Label>
                      <Input
                        id="instrumentFull"
                        value={form.instrumentFull}
                        onChange={(e) => setForm(prev => ({ ...prev, instrumentFull: e.target.value }))}
                        placeholder="ES 03-25"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nt8Account" className="flex items-center gap-2">
                        <PiggyBank className="h-4 w-4" />
                        NT8 Account
                      </Label>
                      <Input
                        id="nt8Account"
                        value={form.nt8Account}
                        onChange={(e) => setForm(prev => ({ ...prev, nt8Account: e.target.value }))}
                        placeholder="Account name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nt8Strategy" className="flex items-center gap-2">
                        <BarChart className="h-4 w-4" />
                        Strategy
                      </Label>
                      <Input
                        id="nt8Strategy"
                        value={form.nt8Strategy}
                        onChange={(e) => setForm(prev => ({ ...prev, nt8Strategy: e.target.value }))}
                        placeholder="Strategy name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="entryName" className="flex items-center gap-2">
                        <LogIn className="h-4 w-4" />
                        Entry Name
                      </Label>
                      <Input
                        id="entryName"
                        value={form.entryName}
                        onChange={(e) => setForm(prev => ({ ...prev, entryName: e.target.value }))}
                        placeholder="Entry signal name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="exitName" className="flex items-center gap-2">
                        <LogOut className="h-4 w-4" />
                        Exit Name
                      </Label>
                      <Input
                        id="exitName"
                        value={form.exitName}
                        onChange={(e) => setForm(prev => ({ ...prev, exitName: e.target.value }))}
                        placeholder="Exit signal name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="marketPosition" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Market Position
                      </Label>
                      <Input
                        id="marketPosition"
                        value={form.marketPosition}
                        onChange={(e) => setForm(prev => ({ ...prev, marketPosition: e.target.value }))}
                        placeholder="Position info"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cumulativeProfit" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Cumulative Profit
                      </Label>
                      <Input
                        id="cumulativeProfit"
                        type="number"
                        step="0.01"
                        value={form.cumulativeProfit}
                        onChange={(e) => setForm(prev => ({ ...prev, cumulativeProfit: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Analysis Tab */}
                <TabsContent value="analysis" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mae" className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        MAE (Max Adverse Excursion)
                      </Label>
                      <Input
                        id="mae"
                        type="number"
                        step="0.01"
                        value={form.mae}
                        onChange={(e) => setForm(prev => ({ ...prev, mae: e.target.value }))}
                        placeholder="5795.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mfe" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        MFE (Max Favorable Excursion)
                      </Label>
                      <Input
                        id="mfe"
                        type="number"
                        step="0.01"
                        value={form.mfe}
                        onChange={(e) => setForm(prev => ({ ...prev, mfe: e.target.value }))}
                        placeholder="5815.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="etd" className="flex items-center gap-2">
                        <Timer className="h-4 w-4" />
                        ETD (Entry to Draw)
                      </Label>
                      <Input
                        id="etd"
                        type="number"
                        step="0.01"
                        value={form.etd}
                        onChange={(e) => setForm(prev => ({ ...prev, etd: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bars" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Bars in Trade
                      </Label>
                      <Input
                        id="bars"
                        type="number"
                        value={form.bars}
                        onChange={(e) => setForm(prev => ({ ...prev, bars: e.target.value }))}
                        placeholder="10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="durationMinutes" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Duration (Minutes)
                      </Label>
                      <Input
                        id="durationMinutes"
                        type="number"
                        value={form.durationMinutes}
                        onChange={(e) => setForm(prev => ({ ...prev, durationMinutes: e.target.value }))}
                        placeholder="30"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maeEfficiency" className="flex items-center gap-2">
                        <Gauge className="h-4 w-4" />
                        MAE Efficiency (%)
                      </Label>
                      <Input
                        id="maeEfficiency"
                        type="number"
                        step="0.01"
                        value={form.maeEfficiency}
                        onChange={(e) => setForm(prev => ({ ...prev, maeEfficiency: e.target.value }))}
                        placeholder="85.5"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mfeEfficiency" className="flex items-center gap-2">
                        <Gauge className="h-4 w-4" />
                        MFE Efficiency (%)
                      </Label>
                      <Input
                        id="mfeEfficiency"
                        type="number"
                        step="0.01"
                        value={form.mfeEfficiency}
                        onChange={(e) => setForm(prev => ({ ...prev, mfeEfficiency: e.target.value }))}
                        placeholder="72.3"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="riskRealization" className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Risk Realization (%)
                      </Label>
                      <Input
                        id="riskRealization"
                        type="number"
                        step="0.01"
                        value={form.riskRealization}
                        onChange={(e) => setForm(prev => ({ ...prev, riskRealization: e.target.value }))}
                        placeholder="15.2"
                      />
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={isSubmitting}
                >
                  Reset
                </Button>
                {imagePasted && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2 text-sm text-green-600"
                  >
                    <Clipboard className="h-4 w-4" />
                    Image pasted!
                  </motion.div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                    </motion.div>
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  {isSubmitting ? 'Updating...' : 'Update Trade'}
                </Button>
              </div>
            </div>

            {validationErrors.submit && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-sm text-red-600">{validationErrors.submit}</p>
              </motion.div>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default UnifiedTradeEditModal;