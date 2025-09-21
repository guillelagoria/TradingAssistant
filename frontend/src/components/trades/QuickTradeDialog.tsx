import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { Zap, TrendingUp, TrendingDown, Target, Shield, Keyboard, ImagePlus, X, Clipboard, Sparkles, DollarSign, Info } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTradeStore } from '@/store/tradeStore';
import { useActiveAccount } from '@/store/accountStore';
import { TradeDirection } from '@/types/trade';
import { cn } from '@/lib/utils';
import { convertPointsToDollars, formatDollars, formatPoints } from '@/utils/symbolUtils';

interface QuickTradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledDirection?: 'LONG' | 'SHORT';
}

interface QuickTradeForm {
  symbol: string;
  direction: TradeDirection;
  entryPrice: string;
  quantity: string;
  stopLoss: string;
  result: string;
  image: File | null;
}

const QuickTradeDialog: React.FC<QuickTradeDialogProps> = ({
  open,
  onOpenChange,
  prefilledDirection
}) => {
  const { addQuickTrade, loading, trades } = useTradeStore();
  const activeAccount = useActiveAccount();

  const [form, setForm] = useState<QuickTradeForm>({
    symbol: '',
    direction: prefilledDirection || TradeDirection.LONG,
    entryPrice: '',
    quantity: '1',
    stopLoss: '',
    result: '',
    image: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [imagePasted, setImagePasted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Refs for auto-focus
  const entryPriceRef = useRef<HTMLInputElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const stopLossRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  // Auto-focus on first field when dialog opens and setup paste listener
  useEffect(() => {
    if (open) {
      // Auto-focus
      if (entryPriceRef.current) {
        setTimeout(() => {
          entryPriceRef.current?.focus();
        }, 100);
      }

      // Setup paste listener for images
      const handlePaste = (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];

          // Check if it's an image
          if (item.type.startsWith('image/')) {
            e.preventDefault();

            const blob = item.getAsFile();
            if (blob) {
              // Create a new File object with a proper name
              const file = new File([blob], `screenshot-${Date.now()}.png`, {
                type: blob.type
              });

              // Update form with the pasted image
              setForm(prev => ({ ...prev, image: file }));
              setValidationErrors(prev => ({ ...prev, image: undefined }));

              // Show visual feedback
              setImagePasted(true);
              setTimeout(() => setImagePasted(false), 1000);
            }
            break;
          }
        }
      };

      // Add event listener
      document.addEventListener('paste', handlePaste);

      // Cleanup
      return () => {
        document.removeEventListener('paste', handlePaste);
      };
    }
  }, [open]);

  // Pre-fill symbol from last trade (defaults to ES if no trades)
  useEffect(() => {
    if (open && !form.symbol) {
      const lastSymbol = trades.length > 0 ? trades[0]?.symbol : 'ES';
      if (lastSymbol && ['ES', 'NQ'].includes(lastSymbol)) {
        setForm(prev => ({ ...prev, symbol: lastSymbol }));
      } else {
        setForm(prev => ({ ...prev, symbol: 'ES' }));
      }
    }
  }, [open, trades]);

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

    if (!form.result.trim()) {
      errors.result = 'Result is required';
    } else if (isNaN(Number(form.result))) {
      errors.result = 'Result must be a number';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create trade data for quick logger
      const quickTradeData = {
        symbol: form.symbol.toUpperCase(),
        direction: form.direction,
        entryPrice: Number(form.entryPrice),
        quantity: Number(form.quantity),
        stopLoss: form.stopLoss ? Number(form.stopLoss) : undefined,
        result: Number(form.result),
        source: 'QUICK_LOGGER',
        image: form.image // Include the image file
      };

      // Use the quick trade store method
      await addQuickTrade(quickTradeData);

      // Success - close dialog and reset form
      onOpenChange(false);
      resetForm();

    } catch (error) {
      // Keep dialog open on error
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      symbol: '',
      direction: TradeDirection.LONG,
      entryPrice: '',
      quantity: '1',
      stopLoss: '',
      result: '',
      image: null
    });
    setValidationErrors({});
  };

  const handleDirectionToggle = () => {
    setForm(prev => ({
      ...prev,
      direction: prev.direction === TradeDirection.LONG ? TradeDirection.SHORT : TradeDirection.LONG
    }));
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      // Validate file size
      if (imageFile.size > 5 * 1024 * 1024) {
        setValidationErrors(prev => ({ ...prev, image: 'File size must be less than 5MB' }));
        return;
      }

      setForm(prev => ({ ...prev, image: imageFile }));
      setValidationErrors(prev => ({ ...prev, image: undefined }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Tab' && field === 'direction') {
      e.preventDefault();
      handleDirectionToggle();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      switch (field) {
        case 'symbol':
          entryPriceRef.current?.focus();
          break;
        case 'entryPrice':
          quantityRef.current?.focus();
          break;
        case 'quantity':
          stopLossRef.current?.focus();
          break;
        case 'stopLoss':
          resultRef.current?.focus();
          break;
        case 'result':
          handleSubmit(e as any);
          break;
      }
    }
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-hidden border-0 bg-gradient-to-br from-background/95 via-background/98 to-background/95 backdrop-blur-xl shadow-2xl">
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

          {/* Glass morphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent dark:from-white/5 dark:via-white/2 dark:to-transparent" />

          <div className="relative z-10 overflow-hidden">
            {/* Compact Header */}
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
                      className="p-1.5 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg"
                    >
                      <Zap className="h-4 w-4" />
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
                      className="absolute inset-0 rounded-lg bg-yellow-400/30 blur-md"
                    />
                  </div>
                  <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Quick Trade Logger
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Lightning-fast trade entry with keyboard shortcuts</p>
                    </TooltipContent>
                  </Tooltip>
                </DialogTitle>
              </motion.div>
            </DialogHeader>

            <motion.form
              onSubmit={handleSubmit}
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              {/* Main Content Grid - 2 Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Left Column - Main Form Fields */}
                <div className="space-y-3">
                  {/* Symbol and Direction Row */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Symbol Select */}
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
                          "hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20",
                          "shadow-sm hover:shadow-md",
                          validationErrors.symbol && "border-red-500 focus:border-red-500 focus:ring-red-200"
                        )}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="border-2 bg-background/95 backdrop-blur-xl shadow-xl">
                          <SelectItem value="ES" className="text-sm font-mono py-1.5 hover:bg-primary/10 focus:bg-primary/10">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500" />
                              ES - S&P 500
                            </div>
                          </SelectItem>
                          <SelectItem value="NQ" className="text-sm font-mono py-1.5 hover:bg-primary/10 focus:bg-primary/10">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                              NQ - NASDAQ-100
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {validationErrors.symbol && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-500 flex items-center gap-1"
                        >
                          <div className="w-1 h-1 rounded-full bg-red-500" />
                          {validationErrors.symbol}
                        </motion.p>
                      )}
                    </motion.div>

                    {/* Direction Toggle */}
                    <motion.div
                      className="space-y-1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4, duration: 0.3 }}
                    >
                      <Label className="text-xs font-semibold text-foreground/90 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500" />
                        Direction
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="text-[10px] px-1 py-0 border-primary/20 bg-primary/5 cursor-help">
                              Tab
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Press Tab to toggle between LONG/SHORT</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <motion.div className="relative overflow-hidden rounded-lg">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleDirectionToggle}
                          onKeyDown={(e) => handleKeyDown(e, 'direction')}
                          className={cn(
                            "w-full h-9 text-sm font-bold transition-all duration-300 border-2 relative overflow-hidden",
                            "shadow-sm hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]",
                            form.direction === TradeDirection.LONG
                              ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700 hover:from-green-100 hover:to-emerald-100 dark:from-green-950/50 dark:to-emerald-950/50 dark:border-green-800 dark:text-green-400"
                              : "bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-700 hover:from-red-100 hover:to-rose-100 dark:from-red-950/50 dark:to-rose-950/50 dark:border-red-800 dark:text-red-400"
                          )}
                        >
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={form.direction}
                              initial={{ scale: 0.8, opacity: 0, rotateX: -90 }}
                              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                              exit={{ scale: 0.8, opacity: 0, rotateX: 90 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                              className="flex items-center gap-2 relative z-10"
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
                    </motion.div>
                  </div>

                  {/* Price and Quantity Grid */}
                  <motion.div
                    className="grid grid-cols-2 gap-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                  >
                    {/* Entry Price */}
                    <div className="space-y-1">
                      <Label htmlFor="entryPrice" className="text-xs font-semibold text-foreground/90 flex items-center gap-1">
                        <Target className="h-3 w-3 text-blue-500" />
                        Entry Price
                      </Label>
                      <div className="relative group">
                        <Input
                          ref={entryPriceRef}
                          id="entryPrice"
                          type="number"
                          step="0.01"
                          value={form.entryPrice}
                          onChange={(e) => setForm(prev => ({ ...prev, entryPrice: e.target.value }))}
                          onKeyDown={(e) => handleKeyDown(e, 'entryPrice')}
                          placeholder="0.00"
                          className={cn(
                            "h-9 text-sm font-mono border-2 transition-all duration-200 bg-background/50 backdrop-blur-sm pl-3 pr-8",
                            "hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20",
                            "shadow-sm hover:shadow-md group-hover:shadow-lg",
                            validationErrors.entryPrice && "border-red-500 focus:border-red-500 focus:ring-red-200"
                          )}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">
                          USD
                        </div>
                      </div>
                      {validationErrors.entryPrice && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-500 flex items-center gap-1"
                        >
                          <div className="w-1 h-1 rounded-full bg-red-500" />
                          {validationErrors.entryPrice}
                        </motion.p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="space-y-1">
                      <Label htmlFor="quantity" className="text-xs font-semibold text-foreground/90 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                        Quantity
                      </Label>
                      <div className="relative group">
                        <Input
                          ref={quantityRef}
                          id="quantity"
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={form.quantity}
                          onChange={(e) => setForm(prev => ({ ...prev, quantity: e.target.value }))}
                          onKeyDown={(e) => handleKeyDown(e, 'quantity')}
                          placeholder="1"
                          className={cn(
                            "h-9 text-sm font-mono border-2 transition-all duration-200 bg-background/50 backdrop-blur-sm pl-3 pr-12",
                            "hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20",
                            "shadow-sm hover:shadow-md group-hover:shadow-lg",
                            validationErrors.quantity && "border-red-500 focus:border-red-500 focus:ring-red-200"
                          )}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">
                          contracts
                        </div>
                      </div>
                      {validationErrors.quantity && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-500 flex items-center gap-1"
                        >
                          <div className="w-1 h-1 rounded-full bg-red-500" />
                          {validationErrors.quantity}
                        </motion.p>
                      )}
                    </div>
                  </motion.div>

                  {/* Stop Loss and Result Grid */}
                  <motion.div
                    className="grid grid-cols-2 gap-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                  >
                    {/* Stop Loss (Optional) */}
                    <div className="space-y-1">
                      <Label htmlFor="stopLoss" className="text-xs font-semibold text-foreground/90 flex items-center gap-1">
                        <Shield className="h-3 w-3 text-amber-500" />
                        Stop Loss
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-muted/50">
                          opt
                        </Badge>
                      </Label>
                      <div className="relative group">
                        <Input
                          ref={stopLossRef}
                          id="stopLoss"
                          type="number"
                          step="0.01"
                          value={form.stopLoss}
                          onChange={(e) => setForm(prev => ({ ...prev, stopLoss: e.target.value }))}
                          onKeyDown={(e) => handleKeyDown(e, 'stopLoss')}
                          placeholder="0.00"
                          className={cn(
                            "h-9 text-sm font-mono border-2 transition-all duration-200 bg-background/50 backdrop-blur-sm pl-3 pr-8",
                            "hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20",
                            "shadow-sm hover:shadow-md group-hover:shadow-lg",
                            validationErrors.stopLoss && "border-red-500 focus:border-red-500 focus:ring-red-200"
                          )}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">
                          USD
                        </div>
                      </div>
                      {validationErrors.stopLoss && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-500 flex items-center gap-1"
                        >
                          <div className="w-1 h-1 rounded-full bg-red-500" />
                          {validationErrors.stopLoss}
                        </motion.p>
                      )}
                    </div>

                    {/* Result */}
                    <div className="space-y-1">
                      <Label htmlFor="result" className="text-xs font-semibold text-foreground/90 flex items-center gap-1">
                        <DollarSign className={cn(
                          "h-3 w-3 transition-colors duration-200",
                          Number(form.result) > 0 && "text-green-500",
                          Number(form.result) < 0 && "text-red-500",
                          !form.result && "text-muted-foreground"
                        )} />
                        Result (Points)
                      </Label>
                      <div className="relative group">
                        <Input
                          ref={resultRef}
                          id="result"
                          type="number"
                          step="0.25"
                          value={form.result}
                          onChange={(e) => setForm(prev => ({ ...prev, result: e.target.value }))}
                          onKeyDown={(e) => handleKeyDown(e, 'result')}
                          placeholder="+8 or -5.5"
                          className={cn(
                            "h-9 text-sm font-mono border-2 transition-all duration-200 bg-background/50 backdrop-blur-sm pl-3 pr-8",
                            "hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20",
                            "shadow-sm hover:shadow-md group-hover:shadow-lg",
                            validationErrors.result && "border-red-500 focus:border-red-500 focus:ring-red-200",
                            Number(form.result) > 0 && "text-green-600 border-green-200 focus:border-green-400 bg-green-50/50 dark:bg-green-950/20",
                            Number(form.result) < 0 && "text-red-600 border-red-200 focus:border-red-400 bg-red-50/50 dark:bg-red-950/20"
                          )}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">
                          pts
                        </div>
                      </div>

                      {/* Show dollar conversion with enhanced styling */}
                      {form.result && form.symbol && !validationErrors.result && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={cn(
                            "text-[10px] font-mono p-1.5 rounded border backdrop-blur-sm transition-colors duration-200",
                            Number(form.result) > 0 && "text-green-700 bg-green-50/80 border-green-200 dark:text-green-400 dark:bg-green-950/50 dark:border-green-800",
                            Number(form.result) < 0 && "text-red-700 bg-red-50/80 border-red-200 dark:text-red-400 dark:bg-red-950/50 dark:border-red-800"
                          )}
                        >
                          <div className="flex items-center gap-1">
                            <Sparkles className="h-2.5 w-2.5" />
                            <span>
                              {formatPoints(Number(form.result))} = {formatDollars(convertPointsToDollars(form.symbol, Number(form.result), Number(form.quantity)))}
                            </span>
                          </div>
                        </motion.div>
                      )}

                      {validationErrors.result && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-500 flex items-center gap-1"
                        >
                          <div className="w-1 h-1 rounded-full bg-red-500" />
                          {validationErrors.result}
                        </motion.p>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Right Column - Image Upload and Actions */}
                <div className="space-y-3">
                  {/* Image Upload (Compact) */}
                  <motion.div
                    className="space-y-1"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.3 }}
                  >
                    <Label className="text-xs font-semibold text-foreground/90 flex items-center gap-1">
                      <ImagePlus className="h-3 w-3 text-purple-500" />
                      Chart/Screenshot
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-muted/50">
                        optional
                      </Badge>
                    </Label>

                    {!form.image ? (
                      <motion.div
                        className={cn(
                          "border-2 border-dashed rounded-lg p-3 transition-all duration-300 cursor-pointer relative overflow-hidden h-24",
                          "bg-gradient-to-br from-background/50 to-muted/20 backdrop-blur-sm",
                          isDragging
                            ? "border-primary bg-primary/10 scale-[1.02] shadow-lg"
                            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5"
                        )}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
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
                          className="flex flex-col items-center justify-center gap-1 cursor-pointer relative z-10 h-full"
                        >
                          <ImagePlus className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <div className="text-center space-y-0.5">
                            <div className="text-xs font-semibold text-foreground">Upload or drag image</div>
                            <div className="text-[10px] text-muted-foreground">
                              <div>PNG, JPG, GIF (5MB max)</div>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center justify-center gap-1 cursor-help">
                                    <Clipboard className="h-2 w-2" />
                                    <span>Or paste with Ctrl+V</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>You can paste screenshots directly from clipboard</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </label>

                        {/* Drag overlay effect */}
                        {isDragging && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-primary/20 backdrop-blur-sm rounded-lg flex items-center justify-center"
                          >
                            <div className="text-primary font-semibold text-sm">Drop image here!</div>
                          </motion.div>
                        )}
                      </motion.div>
                    ) : (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={form.image?.name}
                          initial={imagePasted ? { scale: 0.8, opacity: 0, rotateX: -90 } : { opacity: 0, y: 20 }}
                          animate={{ scale: 1, opacity: 1, rotateX: 0, y: 0 }}
                          exit={{ scale: 0.8, opacity: 0, rotateX: 90 }}
                          transition={{ type: 'spring', duration: 0.5 }}
                          className="relative border-2 rounded-lg p-2 bg-gradient-to-br from-background/80 to-muted/50 backdrop-blur-sm shadow-sm"
                        >
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50">
                              <ImagePlus className="h-3 w-3 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate text-foreground">{form.image.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {(form.image.size / 1024 / 1024).toFixed(2)} MB • Ready
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleRemoveImage}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    )}

                    {validationErrors.image && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-500 flex items-center gap-1"
                      >
                        <div className="w-1 h-1 rounded-full bg-red-500" />
                        {validationErrors.image}
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Compact Keyboard Hints */}
                  <motion.div
                    className="bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm rounded-lg p-2 border border-border/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.3 }}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <Keyboard className="h-3 w-3 text-primary" />
                      <span className="font-semibold text-[10px] text-foreground">Shortcuts</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1 text-[10px]">
                      <div className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 bg-background/80 border rounded text-[9px] font-mono shadow-sm">Enter</kbd>
                        <span className="text-muted-foreground">Next/Submit</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 bg-background/80 border rounded text-[9px] font-mono shadow-sm">Tab</kbd>
                        <span className="text-muted-foreground">Toggle Direction</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 bg-background/80 border rounded text-[9px] font-mono shadow-sm">Esc</kbd>
                        <span className="text-muted-foreground">Close</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Action Buttons */}
                  <motion.div
                    className="flex gap-2 pt-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.3 }}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      className="flex-1 h-9 border-2 font-semibold hover:bg-muted/50 transition-all duration-200 text-sm"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>

                    <motion.div className="flex-1 relative">
                      <Button
                        type="submit"
                        className={cn(
                          "w-full h-9 font-bold text-sm relative overflow-hidden",
                          "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
                          "shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]",
                          "transition-all duration-200"
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
                              className="flex items-center gap-2 relative z-10"
                            >
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                              />
                              <span>Creating...</span>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="submit"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="flex items-center gap-2 relative z-10"
                            >
                              <Zap className="h-4 w-4" />
                              <span>Create Trade</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Button>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </motion.form>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default QuickTradeDialog;