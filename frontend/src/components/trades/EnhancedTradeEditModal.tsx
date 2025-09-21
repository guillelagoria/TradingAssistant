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
  TrendingDown as MAEIcon,
  TrendingUp as MFEIcon,
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
  Sparkles
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

interface EnhancedTradeEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trade: Trade | null;
}

interface EnhancedTradeForm {
  // Basic Info fields
  symbol: string;
  direction: TradeDirection;
  entryPrice: string;
  quantity: string;
  stopLoss: string;
  exitPrice: string;
  exitDate: string;
  result: string;
  image: File | null;

  // NT8 Details fields
  tradeNumber: string;
  instrumentFull: string;
  nt8Account: string;
  nt8Strategy: string;
  marketPosition: string;
  entryName: string;
  exitName: string;
  cumulativeProfit: string;

  // Analysis fields
  mae: string;
  mfe: string;
  etd: string;
  bars: string;
  durationMinutes: string;
  maeEfficiency: string;
  mfeEfficiency: string;
  riskRealization: string;

  // Additional fields
  notes: string;
}

const EnhancedTradeEditModal: React.FC<EnhancedTradeEditModalProps> = ({
  open,
  onOpenChange,
  trade
}) => {
  const { updateTrade, loading } = useTradeStore();
  const activeAccount = useActiveAccount();

  const [form, setForm] = useState<EnhancedTradeForm>({
    symbol: '',
    direction: TradeDirection.LONG,
    entryPrice: '',
    quantity: '',
    stopLoss: '',
    exitPrice: '',
    exitDate: '',
    result: '',
    image: null,
    tradeNumber: '',
    instrumentFull: '',
    nt8Account: '',
    nt8Strategy: '',
    marketPosition: '',
    entryName: '',
    exitName: '',
    cumulativeProfit: '',
    mae: '',
    mfe: '',
    etd: '',
    bars: '',
    durationMinutes: '',
    maeEfficiency: '',
    mfeEfficiency: '',
    riskRealization: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('basic');
  const imageRef = useRef<HTMLInputElement>(null);

  // Pre-populate form when trade changes
  useEffect(() => {
    if (trade && open) {
      setForm({
        symbol: trade.symbol || '',
        direction: trade.direction,
        entryPrice: trade.entryPrice?.toString() || '',
        quantity: trade.quantity?.toString() || '',
        stopLoss: trade.stopLoss?.toString() || '',
        exitPrice: trade.exitPrice?.toString() || '',
        exitDate: trade.exitDate ? new Date(trade.exitDate).toISOString().slice(0, 16) : '',
        result: trade.pnl?.toString() || '',
        image: null,
        tradeNumber: trade.tradeNumber?.toString() || '',
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
        notes: trade.notes || ''
      });
    }
  }, [trade, open]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setValidationErrors({});
      setActiveTab('basic');
    }
  }, [open]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.symbol.trim()) {
      errors.symbol = 'Symbol is required';
    }

    if (!form.entryPrice.trim()) {
      errors.entryPrice = 'Entry price is required';
    } else if (isNaN(Number(form.entryPrice)) || Number(form.entryPrice) <= 0) {
      errors.entryPrice = 'Entry price must be a positive number';
    }

    if (!form.quantity.trim()) {
      errors.quantity = 'Quantity is required';
    } else if (isNaN(Number(form.quantity)) || Number(form.quantity) <= 0) {
      errors.quantity = 'Quantity must be a positive number';
    }

    if (form.stopLoss.trim() && (isNaN(Number(form.stopLoss)) || Number(form.stopLoss) <= 0)) {
      errors.stopLoss = 'Stop loss must be a positive number';
    }

    if (form.exitPrice.trim() && (isNaN(Number(form.exitPrice)) || Number(form.exitPrice) <= 0)) {
      errors.exitPrice = 'Exit price must be a positive number';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!trade || !validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare update data
      const updateData = {
        symbol: form.symbol.toUpperCase(),
        direction: form.direction,
        entryPrice: Number(form.entryPrice),
        quantity: Number(form.quantity),
        stopLoss: form.stopLoss ? Number(form.stopLoss) : undefined,
        exitPrice: form.exitPrice ? Number(form.exitPrice) : undefined,
        exitDate: form.exitDate ? new Date(form.exitDate) : undefined,
        notes: form.notes || undefined,

        // NT8 specific fields
        tradeNumber: form.tradeNumber ? Number(form.tradeNumber) : undefined,
        instrumentFull: form.instrumentFull || undefined,
        nt8Account: form.nt8Account || undefined,
        nt8Strategy: form.nt8Strategy || undefined,
        marketPosition: form.marketPosition || undefined,
        entryName: form.entryName || undefined,
        exitName: form.exitName || undefined,
        cumulativeProfit: form.cumulativeProfit ? Number(form.cumulativeProfit) : undefined,

        // Analysis fields
        mae: form.mae ? Number(form.mae) : undefined,
        mfe: form.mfe ? Number(form.mfe) : undefined,
        etd: form.etd ? Number(form.etd) : undefined,
        bars: form.bars ? Number(form.bars) : undefined,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
        maeEfficiency: form.maeEfficiency ? Number(form.maeEfficiency) : undefined,
        mfeEfficiency: form.mfeEfficiency ? Number(form.mfeEfficiency) : undefined,
        riskRealization: form.riskRealization ? Number(form.riskRealization) : undefined,
      };

      await updateTrade(trade.id, updateData);

      // Success - close dialog
      onOpenChange(false);

    } catch (error) {
      // Keep dialog open on error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setValidationErrors(prev => ({ ...prev, image: 'Please select a valid image file' }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setValidationErrors(prev => ({ ...prev, image: 'File size must be less than 5MB' }));
        return;
      }

      setForm(prev => ({ ...prev, image: file }));
      setValidationErrors(prev => ({ ...prev, image: undefined }));
    }
  };

  const handleRemoveImage = () => {
    setForm(prev => ({ ...prev, image: null }));
    if (imageRef.current) {
      imageRef.current.value = '';
    }
  };

  const handleDirectionToggle = () => {
    setForm(prev => ({
      ...prev,
      direction: prev.direction === TradeDirection.LONG ? TradeDirection.SHORT : TradeDirection.LONG
    }));
  };

  // Determine if we should show NT8 tabs
  const showNT8Tabs = trade?.source === 'NT8_IMPORT' && trade?.hasAdvancedData === true;

  if (!trade) return null;

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-5xl max-h-[95vh] overflow-hidden border-0 bg-gradient-to-br from-background/95 via-background/98 to-background/95 backdrop-blur-xl shadow-2xl">
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

          {/* Glass morphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent dark:from-white/5 dark:via-white/2 dark:to-transparent" />

          <div className="relative z-10 overflow-hidden">
            {/* Header */}
            <DialogHeader className="space-y-1 pb-3">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                  <div className="relative">
                    <motion.div
                      animate={{
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="p-1.5 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 text-white shadow-lg"
                    >
                      <Settings className="h-4 w-4" />
                    </motion.div>
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.8, 0.3]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute inset-0 rounded-lg bg-blue-400/30 blur-md"
                    />
                  </div>
                  <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    {showNT8Tabs ? 'Edit NT8 Trade' : 'Edit Trade'}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{showNT8Tabs ? 'Advanced NT8 trade editor with full analytics' : 'Standard trade editor'}</p>
                    </TooltipContent>
                  </Tooltip>
                  {trade.source === 'NT8_IMPORT' && (
                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                      NT8 Import
                    </Badge>
                  )}
                </DialogTitle>
              </motion.div>
            </DialogHeader>

            <motion.form
              onSubmit={handleSubmit}
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex bg-muted/50 backdrop-blur-sm">
                  <TabsTrigger value="basic" className="flex items-center gap-2 text-sm">
                    <Info className="h-4 w-4" />
                    Basic Info
                  </TabsTrigger>
                  {showNT8Tabs && (
                    <>
                      <TabsTrigger value="nt8" className="flex items-center gap-2 text-sm">
                        <Activity className="h-4 w-4" />
                        NT8 Details
                      </TabsTrigger>
                      <TabsTrigger value="analysis" className="flex items-center gap-2 text-sm">
                        <BarChart3 className="h-4 w-4" />
                        Analysis
                      </TabsTrigger>
                    </>
                  )}
                  {!showNT8Tabs && (
                    <TabsTrigger value="analysis" className="flex items-center gap-2 text-sm">
                      <BarChart3 className="h-4 w-4" />
                      Analysis
                    </TabsTrigger>
                  )}
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left Column */}
                    <div className="space-y-3">
                      {/* Symbol and Direction */}
                      <div className="grid grid-cols-2 gap-3">
                        <motion.div
                          className="space-y-1"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3, duration: 0.3 }}
                        >
                          <Label htmlFor="symbol" className="text-xs font-semibold text-foreground/90 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                            Symbol
                          </Label>
                          <Select
                            value={form.symbol}
                            onValueChange={(value) => setForm(prev => ({ ...prev, symbol: value }))}
                          >
                            <SelectTrigger className={cn(
                              "h-9 text-sm font-mono border-2 transition-all duration-200 bg-background/50 backdrop-blur-sm",
                              validationErrors.symbol && "border-red-500"
                            )}>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent className="border-2 bg-background/95 backdrop-blur-xl shadow-xl">
                              <SelectItem value="ES">ES - S&P 500</SelectItem>
                              <SelectItem value="NQ">NQ - NASDAQ-100</SelectItem>
                            </SelectContent>
                          </Select>
                          {validationErrors.symbol && (
                            <p className="text-xs text-red-500">{validationErrors.symbol}</p>
                          )}
                        </motion.div>

                        <motion.div
                          className="space-y-1"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4, duration: 0.3 }}
                        >
                          <Label className="text-xs font-semibold text-foreground/90 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500" />
                            Direction
                          </Label>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleDirectionToggle}
                            className={cn(
                              "w-full h-9 text-sm font-bold transition-all duration-300 border-2",
                              form.direction === TradeDirection.LONG
                                ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700 dark:from-green-950/50 dark:to-emerald-950/50 dark:border-green-800 dark:text-green-400"
                                : "bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-700 dark:from-red-950/50 dark:to-rose-950/50 dark:border-red-800 dark:text-red-400"
                            )}
                          >
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={form.direction}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="flex items-center gap-2"
                              >
                                {form.direction === TradeDirection.LONG ? (
                                  <>
                                    <TrendingUp className="h-4 w-4" />
                                    <span>LONG</span>
                                  </>
                                ) : (
                                  <>
                                    <TrendingDown className="h-4 w-4" />
                                    <span>SHORT</span>
                                  </>
                                )}
                              </motion.div>
                            </AnimatePresence>
                          </Button>
                        </motion.div>
                      </div>

                      {/* Prices */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="entryPrice" className="text-xs font-semibold text-foreground/90 flex items-center gap-1">
                            <Target className="h-3 w-3 text-blue-500" />
                            Entry Price
                          </Label>
                          <Input
                            id="entryPrice"
                            type="number"
                            step="0.01"
                            value={form.entryPrice}
                            onChange={(e) => setForm(prev => ({ ...prev, entryPrice: e.target.value }))}
                            className={cn(
                              "h-9 text-sm font-mono",
                              validationErrors.entryPrice && "border-red-500"
                            )}
                          />
                          {validationErrors.entryPrice && (
                            <p className="text-xs text-red-500">{validationErrors.entryPrice}</p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="exitPrice" className="text-xs font-semibold text-foreground/90 flex items-center gap-1">
                            <LogOut className="h-3 w-3 text-green-500" />
                            Exit Price
                          </Label>
                          <Input
                            id="exitPrice"
                            type="number"
                            step="0.01"
                            value={form.exitPrice}
                            onChange={(e) => setForm(prev => ({ ...prev, exitPrice: e.target.value }))}
                            className="h-9 text-sm font-mono"
                          />
                        </div>
                      </div>

                      {/* Quantity and Stop Loss */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="quantity" className="text-xs font-semibold text-foreground/90 flex items-center gap-1">
                            <Hash className="h-3 w-3 text-emerald-500" />
                            Quantity
                          </Label>
                          <Input
                            id="quantity"
                            type="number"
                            step="0.1"
                            value={form.quantity}
                            onChange={(e) => setForm(prev => ({ ...prev, quantity: e.target.value }))}
                            className={cn(
                              "h-9 text-sm font-mono",
                              validationErrors.quantity && "border-red-500"
                            )}
                          />
                          {validationErrors.quantity && (
                            <p className="text-xs text-red-500">{validationErrors.quantity}</p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="stopLoss" className="text-xs font-semibold text-foreground/90 flex items-center gap-1">
                            <Shield className="h-3 w-3 text-amber-500" />
                            Stop Loss
                          </Label>
                          <Input
                            id="stopLoss"
                            type="number"
                            step="0.01"
                            value={form.stopLoss}
                            onChange={(e) => setForm(prev => ({ ...prev, stopLoss: e.target.value }))}
                            className="h-9 text-sm font-mono"
                          />
                        </div>
                      </div>

                      {/* Exit Date */}
                      <div className="space-y-1">
                        <Label htmlFor="exitDate" className="text-xs font-semibold text-foreground/90 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-purple-500" />
                          Exit Date
                        </Label>
                        <Input
                          id="exitDate"
                          type="datetime-local"
                          value={form.exitDate}
                          onChange={(e) => setForm(prev => ({ ...prev, exitDate: e.target.value }))}
                          className="h-9 text-sm font-mono"
                        />
                      </div>
                    </div>

                    {/* Right Column - Image Upload */}
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-foreground/90 flex items-center gap-1">
                          <ImagePlus className="h-3 w-3 text-purple-500" />
                          Chart/Screenshot
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-muted/50">
                            optional
                          </Badge>
                        </Label>

                        {!form.image && !trade.imageUrl ? (
                          <div className="border-2 border-dashed rounded-lg p-6 bg-muted/20 hover:bg-muted/30 transition-colors">
                            <input
                              ref={imageRef}
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                              id="image-upload"
                            />
                            <label
                              htmlFor="image-upload"
                              className="flex flex-col items-center gap-2 cursor-pointer"
                            >
                              <ImagePlus className="h-8 w-8 text-muted-foreground" />
                              <div className="text-center">
                                <div className="text-sm font-medium">Upload Image</div>
                                <div className="text-xs text-muted-foreground">PNG, JPG, GIF (5MB max)</div>
                              </div>
                            </label>
                          </div>
                        ) : (
                          <div className="border rounded-lg p-3 bg-muted/20">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <ImagePlus className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium">
                                  {form.image ? form.image.name : 'Current image'}
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleRemoveImage}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* P&L Display */}
                      {form.exitPrice && form.entryPrice && form.symbol && (
                        <div className="p-3 rounded-lg bg-muted/20 border">
                          <div className="text-xs font-semibold text-foreground/90 mb-2 flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            P&L Calculation
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm font-mono">
                              Points: {formatPoints(
                                form.direction === TradeDirection.LONG
                                  ? Number(form.exitPrice) - Number(form.entryPrice)
                                  : Number(form.entryPrice) - Number(form.exitPrice)
                              )}
                            </div>
                            <div className="text-sm font-mono">
                              USD: {formatDollars(convertPointsToDollars(
                                form.symbol,
                                form.direction === TradeDirection.LONG
                                  ? Number(form.exitPrice) - Number(form.entryPrice)
                                  : Number(form.entryPrice) - Number(form.exitPrice),
                                Number(form.quantity)
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* NT8 Details Tab */}
                {showNT8Tabs && (
                  <TabsContent value="nt8" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Trade Information
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              Trade Number
                            </Label>
                            <Input
                              type="number"
                              value={form.tradeNumber}
                              onChange={(e) => setForm(prev => ({ ...prev, tradeNumber: e.target.value }))}
                              className="h-9 text-sm font-mono"
                              placeholder="1234"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs font-semibold flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              Market Position
                            </Label>
                            <Input
                              value={form.marketPosition}
                              onChange={(e) => setForm(prev => ({ ...prev, marketPosition: e.target.value }))}
                              className="h-9 text-sm"
                              placeholder="Long"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-semibold flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Instrument Full
                          </Label>
                          <Input
                            value={form.instrumentFull}
                            onChange={(e) => setForm(prev => ({ ...prev, instrumentFull: e.target.value }))}
                            className="h-9 text-sm font-mono"
                            placeholder="ES 12-24"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              NT8 Account
                            </Label>
                            <Input
                              value={form.nt8Account}
                              onChange={(e) => setForm(prev => ({ ...prev, nt8Account: e.target.value }))}
                              className="h-9 text-sm"
                              placeholder="Sim101"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs font-semibold flex items-center gap-1">
                              <Layers className="h-3 w-3" />
                              NT8 Strategy
                            </Label>
                            <Input
                              value={form.nt8Strategy}
                              onChange={(e) => setForm(prev => ({ ...prev, nt8Strategy: e.target.value }))}
                              className="h-9 text-sm"
                              placeholder="MyStrategy"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Entry & Exit Points
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold flex items-center gap-1">
                              <LogIn className="h-3 w-3 text-green-500" />
                              Entry Name
                            </Label>
                            <Input
                              value={form.entryName}
                              onChange={(e) => setForm(prev => ({ ...prev, entryName: e.target.value }))}
                              className="h-9 text-sm"
                              placeholder="Long Entry"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs font-semibold flex items-center gap-1">
                              <LogOut className="h-3 w-3 text-red-500" />
                              Exit Name
                            </Label>
                            <Input
                              value={form.exitName}
                              onChange={(e) => setForm(prev => ({ ...prev, exitName: e.target.value }))}
                              className="h-9 text-sm"
                              placeholder="Profit Target"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-semibold flex items-center gap-1">
                            <PiggyBank className="h-3 w-3 text-yellow-500" />
                            Cumulative Profit
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={form.cumulativeProfit}
                            onChange={(e) => setForm(prev => ({ ...prev, cumulativeProfit: e.target.value }))}
                            className="h-9 text-sm font-mono"
                            placeholder="1250.00"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                )}

                {/* Analysis Tab */}
                <TabsContent value="analysis" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        MAE/MFE Analysis
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold flex items-center gap-1">
                            <MAEIcon className="h-3 w-3 text-red-500" />
                            MAE (Max Adverse)
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={form.mae}
                            onChange={(e) => setForm(prev => ({ ...prev, mae: e.target.value }))}
                            className="h-9 text-sm font-mono"
                            placeholder="-5.50"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-semibold flex items-center gap-1">
                            <MFEIcon className="h-3 w-3 text-green-500" />
                            MFE (Max Favorable)
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={form.mfe}
                            onChange={(e) => setForm(prev => ({ ...prev, mfe: e.target.value }))}
                            className="h-9 text-sm font-mono"
                            placeholder="12.25"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold flex items-center gap-1">
                            <Gauge className="h-3 w-3 text-blue-500" />
                            MAE Efficiency %
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={form.maeEfficiency}
                            onChange={(e) => setForm(prev => ({ ...prev, maeEfficiency: e.target.value }))}
                            className="h-9 text-sm font-mono"
                            placeholder="85.5"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-semibold flex items-center gap-1">
                            <Gauge className="h-3 w-3 text-green-500" />
                            MFE Efficiency %
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={form.mfeEfficiency}
                            onChange={(e) => setForm(prev => ({ ...prev, mfeEfficiency: e.target.value }))}
                            className="h-9 text-sm font-mono"
                            placeholder="72.3"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold flex items-center gap-1">
                          <Target className="h-3 w-3 text-purple-500" />
                          Risk Realization %
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={form.riskRealization}
                          onChange={(e) => setForm(prev => ({ ...prev, riskRealization: e.target.value }))}
                          className="h-9 text-sm font-mono"
                          placeholder="45.2"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                        <Timer className="h-4 w-4" />
                        Time Analysis
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            ETD (minutes)
                          </Label>
                          <Input
                            type="number"
                            value={form.etd}
                            onChange={(e) => setForm(prev => ({ ...prev, etd: e.target.value }))}
                            className="h-9 text-sm font-mono"
                            placeholder="15"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-semibold flex items-center gap-1">
                            <BarChart className="h-3 w-3" />
                            Bars
                          </Label>
                          <Input
                            type="number"
                            value={form.bars}
                            onChange={(e) => setForm(prev => ({ ...prev, bars: e.target.value }))}
                            className="h-9 text-sm font-mono"
                            placeholder="45"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          Duration (minutes)
                        </Label>
                        <Input
                          type="number"
                          value={form.durationMinutes}
                          onChange={(e) => setForm(prev => ({ ...prev, durationMinutes: e.target.value }))}
                          className="h-9 text-sm font-mono"
                          placeholder="120"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Notes
                        </Label>
                        <Textarea
                          value={form.notes}
                          onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                          className="h-20 text-sm resize-none"
                          placeholder="Trade notes and observations..."
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <motion.div
                className="flex gap-3 pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.3 }}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 h-10 border-2 font-semibold text-sm"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  className={cn(
                    "flex-1 h-10 font-bold text-sm relative overflow-hidden",
                    "bg-gradient-to-r from-primary to-primary/80",
                    "shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                  )}
                  disabled={isSubmitting || loading}
                >
                  <AnimatePresence mode="wait">
                    {isSubmitting ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>Updating...</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="submit"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Update Trade</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </motion.form>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default EnhancedTradeEditModal;