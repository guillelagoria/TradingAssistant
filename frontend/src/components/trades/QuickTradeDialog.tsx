import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, TrendingDown, Target, Shield, Keyboard, ImagePlus, X, Clipboard } from 'lucide-react';
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
      console.error('Failed to create quick trade:', error);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Trade Logger
          </DialogTitle>
          <DialogDescription>
            Lightning-fast trade entry with keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Symbol Select */}
          <div className="space-y-2">
            <Label htmlFor="symbol" className="text-sm font-medium">
              Symbol
            </Label>
            <Select
              value={form.symbol}
              onValueChange={(value) => setForm(prev => ({ ...prev, symbol: value }))}
            >
              <SelectTrigger className={cn(
                "text-lg font-mono",
                validationErrors.symbol && "border-red-500"
              )}>
                <SelectValue placeholder="Select symbol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ES" className="text-lg font-mono">
                  ES - E-mini S&P 500
                </SelectItem>
                <SelectItem value="NQ" className="text-lg font-mono">
                  NQ - E-mini NASDAQ-100
                </SelectItem>
              </SelectContent>
            </Select>
            {validationErrors.symbol && (
              <p className="text-sm text-red-500">{validationErrors.symbol}</p>
            )}
          </div>

          {/* Direction Toggle */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Direction <Badge variant="outline" className="ml-2">Press Tab to toggle</Badge>
            </Label>
            <Button
              type="button"
              variant="outline"
              onClick={handleDirectionToggle}
              onKeyDown={(e) => handleKeyDown(e, 'direction')}
              className={cn(
                "w-full h-12 text-lg font-semibold transition-all duration-200",
                form.direction === TradeDirection.LONG
                  ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
              )}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={form.direction}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-2"
                >
                  {form.direction === TradeDirection.LONG ? (
                    <>
                      <TrendingUp className="h-5 w-5" />
                      LONG
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-5 w-5" />
                      SHORT
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Entry Price */}
            <div className="space-y-2">
              <Label htmlFor="entryPrice" className="text-sm font-medium flex items-center gap-1">
                <Target className="h-4 w-4" />
                Entry Price
              </Label>
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
                  "text-lg font-mono",
                  validationErrors.entryPrice && "border-red-500"
                )}
              />
              {validationErrors.entryPrice && (
                <p className="text-sm text-red-500">{validationErrors.entryPrice}</p>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-medium">
                Quantity
              </Label>
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
                  "text-lg font-mono",
                  validationErrors.quantity && "border-red-500"
                )}
              />
              {validationErrors.quantity && (
                <p className="text-sm text-red-500">{validationErrors.quantity}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Stop Loss (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="stopLoss" className="text-sm font-medium flex items-center gap-1">
                <Shield className="h-4 w-4" />
                Stop Loss <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
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
                  "text-lg font-mono",
                  validationErrors.stopLoss && "border-red-500"
                )}
              />
              {validationErrors.stopLoss && (
                <p className="text-sm text-red-500">{validationErrors.stopLoss}</p>
              )}
            </div>

            {/* Result */}
            <div className="space-y-2">
              <Label htmlFor="result" className="text-sm font-medium flex items-center gap-1">
                Result (Points)
              </Label>
              <div className="relative">
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
                    "text-lg font-mono pr-12",
                    validationErrors.result && "border-red-500",
                    Number(form.result) > 0 && "text-green-600",
                    Number(form.result) < 0 && "text-red-600"
                  )}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                  pts
                </div>
              </div>
              {/* Show dollar conversion */}
              {form.result && form.symbol && !validationErrors.result && (
                <div className="text-xs text-muted-foreground">
                  {formatPoints(Number(form.result))} = {formatDollars(convertPointsToDollars(form.symbol, Number(form.result), Number(form.quantity)))}
                </div>
              )}
              {validationErrors.result && (
                <p className="text-sm text-red-500">{validationErrors.result}</p>
              )}
            </div>
          </div>

          {/* Image Upload (Optional) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <ImagePlus className="h-4 w-4" />
              Chart/Screenshot <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>

            {!form.image ? (
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-3 transition-all duration-200",
                  isDragging
                    ? "border-primary bg-primary/10 scale-105"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
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
                  className="flex flex-row items-center gap-3 cursor-pointer"
                >
                  <ImagePlus className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                  <div className="text-xs text-muted-foreground">
                    <div className="font-medium">Click to upload or drag and drop</div>
                    <div className="text-xs opacity-75">PNG, JPG, GIF up to 5MB</div>
                    <div className="flex items-center gap-1 mt-1">
                      <Clipboard className="h-3 w-3" />
                      <span>Or paste with Ctrl+V / Cmd+V</span>
                    </div>
                  </div>
                </label>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={form.image?.name}
                  initial={imagePasted ? { scale: 0.8, opacity: 0 } : false}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', duration: 0.3 }}
                  className="relative border rounded-lg p-2 bg-muted/50"
                >
                <div className="flex items-center gap-2">
                  <ImagePlus className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{form.image.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(form.image.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                </motion.div>
              </AnimatePresence>
            )}

            {validationErrors.image && (
              <p className="text-sm text-red-500">{validationErrors.image}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || loading}
            >
              <AnimatePresence mode="wait">
                {isSubmitting ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </motion.div>
                ) : (
                  <motion.div
                    key="submit"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Zap className="h-4 w-4" />
                    Create Trade
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>

          {/* Keyboard Hints */}
          <div className="bg-muted/30 rounded-md p-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 mb-2">
              <Keyboard className="h-3 w-3" />
              <span className="font-medium">Keyboard Shortcuts</span>
            </div>
            <div className="space-y-1">
              <div>• <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> - Next field / Submit</div>
              <div>• <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Tab</kbd> - Toggle LONG/SHORT</div>
              <div>• <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> - Close dialog</div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuickTradeDialog;