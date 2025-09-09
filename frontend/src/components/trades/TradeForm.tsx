import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  TradeDirection,
  OrderType,
  Strategy,
  Timeframe,
  TradeFormData,
  TradeResult
} from '../../types/trade';
import { useTradeStore } from '../../store/tradeStore';
import {
  calculateTradeMetrics,
  calculatePositionSize,
  formatCurrency,
  formatPercentage,
  formatRMultiple,
  validateTradeData
} from '../../utils/tradeCalculations';
import { AlertCircle, Calculator, Save, TrendingUp, TrendingDown } from 'lucide-react';

// Form validation schema
const tradeFormSchema = z.object({
  // Entry Tab
  symbol: z.string().min(1, 'Symbol is required').toUpperCase(),
  direction: z.nativeEnum(TradeDirection),
  entryPrice: z.number().positive('Entry price must be positive'),
  quantity: z.number().positive('Quantity must be positive'),
  entryDate: z.string().min(1, 'Entry date is required'),
  orderType: z.nativeEnum(OrderType),
  
  // Exit Tab
  exitPrice: z.number().positive().optional().or(z.literal('')),
  exitDate: z.string().optional().or(z.literal('')),
  result: z.nativeEnum(TradeResult).optional(),
  
  // Risk Management Tab
  stopLoss: z.number().positive().optional().or(z.literal('')),
  takeProfit: z.number().positive().optional().or(z.literal('')),
  positionSize: z.number().positive().optional().or(z.literal('')),
  riskAmount: z.number().positive().optional().or(z.literal('')),
  riskPercentage: z.number().min(0.1).max(100).optional().or(z.literal('')),
  
  // Analysis Tab
  maxFavorablePrice: z.number().positive().optional().or(z.literal('')),
  maxAdversePrice: z.number().positive().optional().or(z.literal('')),
  notes: z.string().optional(),
  strategy: z.nativeEnum(Strategy),
  timeframe: z.nativeEnum(Timeframe),
  imageUrl: z.string().url().optional().or(z.literal('')),
  customStrategy: z.string().optional(),
});

type TradeFormValues = z.infer<typeof tradeFormSchema>;

interface TradeFormProps {
  tradeId?: string;
  onSuccess?: (trade: any) => void;
  onCancel?: () => void;
}

function TradeForm({ tradeId, onSuccess, onCancel }: TradeFormProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!(tradeId || id);
  const editId = tradeId || id;
  
  const [activeTab, setActiveTab] = useState('entry');
  const [calculatedMetrics, setCalculatedMetrics] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const {
    currentTrade,
    addTrade,
    updateTrade,
    getTrade,
    setCurrentTrade,
    saveDraft,
    loadDraft,
    clearDraft,
    loading,
    error
  } = useTradeStore();
  
  const form = useForm<TradeFormValues>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: {
      symbol: '',
      direction: TradeDirection.LONG,
      entryPrice: '',
      quantity: '',
      entryDate: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
      orderType: OrderType.MARKET,
      exitPrice: '',
      exitDate: '',
      stopLoss: '',
      takeProfit: '',
      positionSize: '',
      riskAmount: '',
      riskPercentage: '',
      maxFavorablePrice: '',
      maxAdversePrice: '',
      notes: '',
      strategy: Strategy.DAY_TRADING,
      timeframe: Timeframe.M15,
      imageUrl: '',
      customStrategy: '',
    },
  });

  // Load existing trade data for editing
  useEffect(() => {
    const loadTradeData = async () => {
      if (isEditing && editId) {
        const trade = await getTrade(editId);
        if (trade) {
          setCurrentTrade(trade);
          
          // Populate form with trade data
          form.reset({
            symbol: trade.symbol,
            direction: trade.direction,
            entryPrice: trade.entryPrice,
            quantity: trade.quantity,
            entryDate: format(trade.entryDate, 'yyyy-MM-dd\'T\'HH:mm'),
            orderType: trade.orderType,
            exitPrice: trade.exitPrice || '',
            exitDate: trade.exitDate ? format(trade.exitDate, 'yyyy-MM-dd\'T\'HH:mm') : '',
            result: trade.result,
            stopLoss: trade.stopLoss || '',
            takeProfit: trade.takeProfit || '',
            positionSize: trade.positionSize || '',
            riskAmount: trade.riskAmount || '',
            riskPercentage: trade.riskPercentage || '',
            maxFavorablePrice: trade.maxFavorablePrice || '',
            maxAdversePrice: trade.maxAdversePrice || '',
            notes: trade.notes || '',
            strategy: trade.strategy,
            timeframe: trade.timeframe,
            imageUrl: trade.imageUrl || '',
            customStrategy: trade.customStrategy || '',
          });
        }
      } else {
        // Load draft for new trade
        const draft = loadDraft();
        if (draft) {
          setActiveTab(['entry', 'exit', 'risk', 'analysis'][draft.currentTab] || 'entry');
          if (draft.formData) {
            Object.keys(draft.formData).forEach(key => {
              const value = draft.formData[key as keyof TradeFormData];
              if (value !== undefined) {
                form.setValue(key as any, value);
              }
            });
          }
        }
      }
    };
    
    loadTradeData();
  }, [isEditing, editId, getTrade, setCurrentTrade, form, loadDraft]);

  // Watch form values for real-time calculations and draft saving
  const watchedValues = form.watch();
  
  useEffect(() => {
    // Calculate metrics in real-time
    if (watchedValues.entryPrice && watchedValues.quantity) {
      const formData = {
        ...watchedValues,
        entryPrice: Number(watchedValues.entryPrice) || 0,
        quantity: Number(watchedValues.quantity) || 0,
        exitPrice: watchedValues.exitPrice ? Number(watchedValues.exitPrice) : undefined,
        stopLoss: watchedValues.stopLoss ? Number(watchedValues.stopLoss) : undefined,
        takeProfit: watchedValues.takeProfit ? Number(watchedValues.takeProfit) : undefined,
        maxFavorablePrice: watchedValues.maxFavorablePrice ? Number(watchedValues.maxFavorablePrice) : undefined,
        maxAdversePrice: watchedValues.maxAdversePrice ? Number(watchedValues.maxAdversePrice) : undefined,
        riskAmount: watchedValues.riskAmount ? Number(watchedValues.riskAmount) : undefined,
        entryDate: new Date(watchedValues.entryDate),
        exitDate: watchedValues.exitDate ? new Date(watchedValues.exitDate) : undefined,
      } as TradeFormData;
      
      // Validate form data
      const errors = validateTradeData(formData);
      setValidationErrors(errors);
      
      if (errors.length === 0) {
        const metrics = calculateTradeMetrics(formData);
        setCalculatedMetrics(metrics);
      } else {
        setCalculatedMetrics(null);
      }
    }
    
    // Auto-save draft (debounced)
    if (!isEditing) {
      const timeoutId = setTimeout(() => {
        const tabIndex = ['entry', 'exit', 'risk', 'analysis'].indexOf(activeTab);
        saveDraft(watchedValues, tabIndex);
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [watchedValues, activeTab, saveDraft, isEditing]);

  // Position size calculator
  const calculatePositionSizeHandler = () => {
    const accountBalance = 10000; // This should come from user settings
    const riskPercentage = Number(watchedValues.riskPercentage);
    const entryPrice = Number(watchedValues.entryPrice);
    const stopLoss = Number(watchedValues.stopLoss);
    const direction = watchedValues.direction;
    
    if (accountBalance && riskPercentage && entryPrice && stopLoss && direction) {
      const calculation = calculatePositionSize(
        accountBalance,
        riskPercentage,
        entryPrice,
        stopLoss,
        direction
      );
      
      form.setValue('positionSize', calculation.positionSize);
      form.setValue('quantity', calculation.sharesOrContracts);
      form.setValue('riskAmount', calculation.riskAmount);
    }
  };

  const onSubmit = async (data: TradeFormValues) => {
    try {
      // Convert form data to proper types
      const tradeData: TradeFormData = {
        ...data,
        entryPrice: Number(data.entryPrice),
        quantity: Number(data.quantity),
        exitPrice: data.exitPrice ? Number(data.exitPrice) : undefined,
        stopLoss: data.stopLoss ? Number(data.stopLoss) : undefined,
        takeProfit: data.takeProfit ? Number(data.takeProfit) : undefined,
        positionSize: data.positionSize ? Number(data.positionSize) : undefined,
        riskAmount: data.riskAmount ? Number(data.riskAmount) : undefined,
        riskPercentage: data.riskPercentage ? Number(data.riskPercentage) : undefined,
        maxFavorablePrice: data.maxFavorablePrice ? Number(data.maxFavorablePrice) : undefined,
        maxAdversePrice: data.maxAdversePrice ? Number(data.maxAdversePrice) : undefined,
        entryDate: new Date(data.entryDate),
        exitDate: data.exitDate ? new Date(data.exitDate) : undefined,
      };
      
      let result;
      if (isEditing && editId) {
        result = await updateTrade(editId, tradeData);
      } else {
        result = await addTrade(tradeData);
      }
      
      if (onSuccess) {
        onSuccess(result);
      } else {
        navigate('/trades');
      }
    } catch (error) {
      console.error('Failed to save trade:', error);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/trades');
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {watchedValues.direction === TradeDirection.LONG ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
            {isEditing ? 'Edit Trade' : 'New Trade'}
            {watchedValues.symbol && ` - ${watchedValues.symbol}`}
          </CardTitle>
          <CardDescription>
            {isEditing 
              ? 'Update your trade details and analysis' 
              : 'Record your trade entry, exit, and analysis details'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-md">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Error</span>
              </div>
              <p className="text-sm mt-1 text-destructive">{error}</p>
            </div>
          )}
          
          {validationErrors.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Validation Issues</span>
              </div>
              <ul className="text-sm mt-2 space-y-1 text-yellow-700">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="entry">Entry</TabsTrigger>
                  <TabsTrigger value="exit">Exit</TabsTrigger>
                  <TabsTrigger value="risk">Risk Management</TabsTrigger>
                  <TabsTrigger value="analysis">Analysis</TabsTrigger>
                </TabsList>

                {/* Entry Tab */}
                <TabsContent value="entry" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="symbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Symbol</FormLabel>
                          <FormControl>
                            <Input placeholder="AAPL" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter the trading symbol (e.g., AAPL, EURUSD)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="direction"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Direction</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select direction" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={TradeDirection.LONG}>
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-green-600" />
                                  Long
                                </div>
                              </SelectItem>
                              <SelectItem value={TradeDirection.SHORT}>
                                <div className="flex items-center gap-2">
                                  <TrendingDown className="h-4 w-4 text-red-600" />
                                  Short
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
                      name="entryPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entry Price</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="150.25" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
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
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="1" 
                              placeholder="100" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
                            />
                          </FormControl>
                          <FormDescription>
                            Number of shares or contracts
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="entryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entry Date & Time</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local" 
                              {...field}
                            />
                          </FormControl>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select order type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={OrderType.MARKET}>Market</SelectItem>
                              <SelectItem value={OrderType.LIMIT}>Limit</SelectItem>
                              <SelectItem value={OrderType.STOP}>Stop</SelectItem>
                              <SelectItem value={OrderType.STOP_LIMIT}>Stop Limit</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Exit Tab */}
                <TabsContent value="exit" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="exitPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exit Price</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="155.75" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
                            />
                          </FormControl>
                          <FormDescription>
                            Leave empty for open positions
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="exitDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exit Date & Time</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local" 
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Leave empty for open positions
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="result"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Result</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Auto-calculated or manual" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={TradeResult.WIN}>Win</SelectItem>
                              <SelectItem value={TradeResult.LOSS}>Loss</SelectItem>
                              <SelectItem value={TradeResult.BREAKEVEN}>Breakeven</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Usually auto-calculated based on P&L
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Real-time calculations display */}
                  {calculatedMetrics && (
                    <Card className="bg-muted/50">
                      <CardHeader>
                        <CardTitle className="text-sm">Real-time Calculations</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">P&L</Label>
                          <div className={`font-medium ${calculatedMetrics.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(calculatedMetrics.pnl)}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">P&L %</Label>
                          <div className={`font-medium ${calculatedMetrics.pnlPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(calculatedMetrics.pnlPercentage)}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">R-Multiple</Label>
                          <div className="font-medium">
                            {formatRMultiple(calculatedMetrics.rMultiple)}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Efficiency</Label>
                          <div className="font-medium">
                            {formatPercentage(calculatedMetrics.efficiency)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Risk Management Tab */}
                <TabsContent value="risk" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="stopLoss"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stop Loss</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="145.00" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="takeProfit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Take Profit</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="160.00" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="riskPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Risk Percentage</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input 
                                type="number" 
                                step="0.1" 
                                placeholder="2.0"
                                max="100"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={calculatePositionSizeHandler}
                                className="px-3"
                              >
                                <Calculator className="h-4 w-4" />
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Percentage of account to risk (use calculator button)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="riskAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Risk Amount ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="200.00" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
                            />
                          </FormControl>
                          <FormDescription>
                            Dollar amount you're willing to risk
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="positionSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position Size ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="15025.00" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
                            />
                          </FormControl>
                          <FormDescription>
                            Total dollar value of position
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Analysis Tab */}
                <TabsContent value="analysis" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="maxFavorablePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Favorable Price</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="162.50" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
                            />
                          </FormControl>
                          <FormDescription>
                            Highest price reached in your favor
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxAdversePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Adverse Price</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="148.75" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
                            />
                          </FormControl>
                          <FormDescription>
                            Worst price reached against you
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="strategy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Strategy</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select strategy" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={Strategy.SCALPING}>Scalping</SelectItem>
                              <SelectItem value={Strategy.DAY_TRADING}>Day Trading</SelectItem>
                              <SelectItem value={Strategy.SWING}>Swing Trading</SelectItem>
                              <SelectItem value={Strategy.POSITION}>Position Trading</SelectItem>
                              <SelectItem value={Strategy.CUSTOM}>Custom</SelectItem>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select timeframe" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={Timeframe.M1}>1 Minute</SelectItem>
                              <SelectItem value={Timeframe.M5}>5 Minutes</SelectItem>
                              <SelectItem value={Timeframe.M15}>15 Minutes</SelectItem>
                              <SelectItem value={Timeframe.M30}>30 Minutes</SelectItem>
                              <SelectItem value={Timeframe.H1}>1 Hour</SelectItem>
                              <SelectItem value={Timeframe.H4}>4 Hours</SelectItem>
                              <SelectItem value={Timeframe.D1}>Daily</SelectItem>
                              <SelectItem value={Timeframe.W1}>Weekly</SelectItem>
                              <SelectItem value={Timeframe.MN1}>Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchedValues.strategy === Strategy.CUSTOM && (
                      <FormField
                        control={form.control}
                        name="customStrategy"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Custom Strategy Name</FormLabel>
                            <FormControl>
                              <Input placeholder="My Custom Strategy" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Chart Screenshot URL</FormLabel>
                          <FormControl>
                            <Input 
                              type="url" 
                              placeholder="https://example.com/chart.png" 
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            URL to a chart screenshot or trade setup image
                          </FormDescription>
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
                        <FormLabel>Trade Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Add your trade analysis, what went well, what could be improved..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Document your thoughts, lessons learned, and trade analysis
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <div className="flex justify-between pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                
                <div className="flex gap-2">
                  {!isEditing && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        const tabIndex = ['entry', 'exit', 'risk', 'analysis'].indexOf(activeTab);
                        saveDraft(watchedValues, tabIndex);
                      }}
                      disabled={loading}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Draft
                    </Button>
                  )}
                  
                  <Button type="submit" disabled={loading || validationErrors.length > 0}>
                    {loading ? 'Saving...' : isEditing ? 'Update Trade' : 'Save Trade'}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default TradeForm;
