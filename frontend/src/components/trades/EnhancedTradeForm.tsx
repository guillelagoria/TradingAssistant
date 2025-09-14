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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SmartInput } from '@/components/ui/smart-input';
import { SmartSelect, SmartSelectOption } from '@/components/ui/smart-select';
import { KeyboardShortcutsPanel } from '@/components/ui/keyboard-shortcuts-panel';
import { FormProgress, FormStep } from '@/components/ui/form-progress';
import {
  TradeDirection,
  OrderType,
  Strategy,
  Timeframe,
  TradeFormData,
  TradeResult
} from '@/types';
import { useTradeStore } from '@/store/tradeStore';
import { useKeyboardNavigation, KeyboardNavigationField, KeyboardShortcut } from '@/hooks/useKeyboardNavigation';
import {
  calculateTradeMetrics,
  formatCurrency,
  formatPercentage,
  formatRMultiple,
  validateTradeData
} from '@/utils/tradeCalculations';
import { useMarketDefaults, useQuickAccessMarkets } from '@/hooks/useMarketDefaults';
import {
  AlertCircle,
  Calculator,
  Save,
  TrendingUp,
  TrendingDown,
  Info,
  Zap,
  Keyboard,
  Target,
  DollarSign
} from 'lucide-react';

// Form validation schema
const tradeFormSchema = z.object({
  marketId: z.string().min(1, 'Market selection is required'),
  symbol: z.string().min(1, 'Symbol is required'),
  direction: z.nativeEnum(TradeDirection),
  entryPrice: z.union([
    z.number(),
    z.string().transform((val) => {
      const num = parseFloat(val);
      if (isNaN(num) || num <= 0) throw new Error('Entry price must be positive');
      return num;
    })
  ]),
  quantity: z.union([
    z.number(),
    z.string().transform((val) => {
      const num = parseFloat(val);
      if (isNaN(num) || num <= 0) throw new Error('Quantity must be positive');
      return num;
    })
  ]),
  entryDate: z.string().min(1, 'Entry date is required'),
  orderType: z.nativeEnum(OrderType),
  exitPrice: z.union([
    z.number(),
    z.string().transform((val) => val === '' ? undefined : parseFloat(val)),
    z.literal('')
  ]).optional(),
  exitDate: z.string().optional().or(z.literal('')),
  result: z.nativeEnum(TradeResult).optional(),
  stopLoss: z.union([
    z.number(),
    z.string().transform((val) => val === '' ? undefined : parseFloat(val)),
    z.literal('')
  ]).optional(),
  takeProfit: z.union([
    z.number(),
    z.string().transform((val) => val === '' ? undefined : parseFloat(val)),
    z.literal('')
  ]).optional(),
  positionSize: z.union([
    z.number(),
    z.string().transform((val) => val === '' ? undefined : parseFloat(val)),
    z.literal('')
  ]).optional(),
  riskAmount: z.union([
    z.number(),
    z.string().transform((val) => val === '' ? undefined : parseFloat(val)),
    z.literal('')
  ]).optional(),
  riskPercentage: z.union([
    z.number(),
    z.string().transform((val) => val === '' ? undefined : parseFloat(val)),
    z.literal('')
  ]).optional(),
  maxFavorablePrice: z.union([
    z.number(),
    z.string().transform((val) => val === '' ? undefined : parseFloat(val)),
    z.literal('')
  ]).optional(),
  maxAdversePrice: z.union([
    z.number(),
    z.string().transform((val) => val === '' ? undefined : parseFloat(val)),
    z.literal('')
  ]).optional(),
  notes: z.string().optional(),
  strategy: z.nativeEnum(Strategy),
  timeframe: z.nativeEnum(Timeframe),
  imageUrl: z.string().url().optional().or(z.literal('')),
  customStrategy: z.string().optional(),
});

type TradeFormValues = z.infer<typeof tradeFormSchema> & {
  marketId?: string;
};

interface EnhancedTradeFormProps {
  tradeId?: string;
  onSuccess?: (trade: any) => void;
  onCancel?: () => void;
}

function EnhancedTradeForm({ tradeId, onSuccess, onCancel }: EnhancedTradeFormProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!(tradeId || id);
  const editId = tradeId || id;

  const [activeTab, setActiveTab] = useState('entry');
  const [calculatedMetrics, setCalculatedMetrics] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedMarketId, setSelectedMarketId] = useState<string>('');
  const [entryPriceValue, setEntryPriceValue] = useState<number | undefined>();

  // Get quick access markets for dropdown
  const quickAccessMarkets = useQuickAccessMarkets();

  // Get smart defaults based on selected market and entry price
  const {
    defaults: marketDefaults,
    activeMarket,
    isLoading: marketLoading,
    recalculatePositionSize,
    calculateMarginRequirement,
    validatePrice,
    roundToTick,
  } = useMarketDefaults({
    marketId: selectedMarketId,
    entryPrice: entryPriceValue,
    accountBalance: 100000,
    autoCalculate: true,
  });

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
      marketId: '',
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

  // Define navigation fields with keyboard shortcuts
  const navigationFields: KeyboardNavigationField[] = [
    // Entry tab (0-20)
    {
      name: 'marketId',
      tabOrder: 0,
      quickSelectOptions: quickAccessMarkets.slice(0, 9).map((market, index) => ({
        key: (index + 1).toString(),
        value: market.id,
        label: market.symbol
      })),
      autoAdvanceWhen: (value) => !!value,
      onEnterPress: () => setActiveTab('entry')
    },
    {
      name: 'symbol',
      tabOrder: 1,
      skipWhen: () => !!activeMarket,
      autoAdvanceWhen: (value) => String(value).length >= 2
    },
    {
      name: 'direction',
      tabOrder: 2,
      quickSelectOptions: [
        { key: 'l', value: TradeDirection.LONG, label: 'Long' },
        { key: 's', value: TradeDirection.SHORT, label: 'Short' }
      ],
      autoAdvanceWhen: (value) => !!value
    },
    {
      name: 'entryPrice',
      tabOrder: 3,
      incrementStep: activeMarket?.tickSize || 0.01,
      decrementStep: activeMarket?.tickSize || 0.01,
      autoAdvanceWhen: (value) => Number(value) > 0
    },
    {
      name: 'quantity',
      tabOrder: 4,
      incrementStep: 1,
      autoAdvanceWhen: (value) => Number(value) >= 1
    },
    {
      name: 'orderType',
      tabOrder: 5,
      quickSelectOptions: [
        { key: 'm', value: OrderType.MARKET, label: 'Market' },
        { key: 'l', value: OrderType.LIMIT, label: 'Limit' }
      ],
      autoAdvanceWhen: (value) => !!value,
      onEnterPress: () => setActiveTab('risk')
    },

    // Risk tab (30-50)
    {
      name: 'stopLoss',
      tabOrder: 30,
      incrementStep: activeMarket?.tickSize || 0.01,
      decrementStep: activeMarket?.tickSize || 0.01,
      autoAdvanceWhen: (value) => Number(value) > 0
    },
    {
      name: 'takeProfit',
      tabOrder: 31,
      incrementStep: activeMarket?.tickSize || 0.01,
      decrementStep: activeMarket?.tickSize || 0.01,
      autoAdvanceWhen: (value) => Number(value) > 0
    },
    {
      name: 'riskPercentage',
      tabOrder: 32,
      incrementStep: 0.1,
      autoAdvanceWhen: (value) => Number(value) > 0
    },
    {
      name: 'riskAmount',
      tabOrder: 33,
      incrementStep: 100,
      autoAdvanceWhen: (value) => Number(value) > 0,
      onEnterPress: () => setActiveTab('exit')
    },

    // Exit tab (60-80)
    {
      name: 'exitPrice',
      tabOrder: 60,
      incrementStep: activeMarket?.tickSize || 0.01,
      skipWhen: () => !form.getValues('exitPrice')
    },
    {
      name: 'result',
      tabOrder: 61,
      quickSelectOptions: [
        { key: 'w', value: TradeResult.WIN, label: 'Win' },
        { key: 'l', value: TradeResult.LOSS, label: 'Loss' },
        { key: 'b', value: TradeResult.BREAKEVEN, label: 'Breakeven' }
      ],
      skipWhen: () => !form.getValues('exitPrice'),
      onEnterPress: () => setActiveTab('analysis')
    },

    // Analysis tab (90-100)
    {
      name: 'strategy',
      tabOrder: 90,
      quickSelectOptions: [
        { key: 's', value: Strategy.SCALPING, label: 'Scalping' },
        { key: 'd', value: Strategy.DAY_TRADING, label: 'Day Trading' },
        { key: 'w', value: Strategy.SWING, label: 'Swing' }
      ],
      autoAdvanceWhen: (value) => !!value
    },
    {
      name: 'timeframe',
      tabOrder: 91,
      quickSelectOptions: [
        { key: '1', value: Timeframe.M1, label: '1m' },
        { key: '5', value: Timeframe.M5, label: '5m' },
        { key: '15', value: Timeframe.M15, label: '15m' },
        { key: '30', value: Timeframe.M30, label: '30m' },
        { key: 'h', value: Timeframe.H1, label: '1h' }
      ],
      autoAdvanceWhen: (value) => !!value
    },
    {
      name: 'notes',
      tabOrder: 99
    }
  ];

  // Define form steps for progress tracking
  const formSteps: FormStep[] = [
    {
      id: 'entry',
      label: 'Entry',
      description: 'Market selection and entry details',
      fields: ['marketId', 'symbol', 'direction', 'entryPrice', 'quantity', 'orderType'],
      required: true
    },
    {
      id: 'risk',
      label: 'Risk Management',
      description: 'Stop loss, take profit, and position sizing',
      fields: ['stopLoss', 'takeProfit', 'riskPercentage', 'riskAmount'],
      required: true
    },
    {
      id: 'exit',
      label: 'Exit',
      description: 'Exit details for closed positions',
      fields: ['exitPrice', 'exitDate', 'result']
    },
    {
      id: 'analysis',
      label: 'Analysis',
      description: 'Strategy, notes, and additional analysis',
      fields: ['strategy', 'timeframe', 'maxFavorablePrice', 'maxAdversePrice', 'notes']
    }
  ];

  // Custom keyboard shortcuts
  const customShortcuts: KeyboardShortcut[] = [
    {
      keys: ['alt', '1'],
      action: () => setActiveTab('entry'),
      description: 'Go to Entry tab'
    },
    {
      keys: ['alt', '2'],
      action: () => setActiveTab('risk'),
      description: 'Go to Risk Management tab'
    },
    {
      keys: ['alt', '3'],
      action: () => setActiveTab('exit'),
      description: 'Go to Exit tab'
    },
    {
      keys: ['alt', '4'],
      action: () => setActiveTab('analysis'),
      description: 'Go to Analysis tab'
    },
    {
      keys: ['space'],
      action: () => {
        // Quick toggle between Long/Short when direction field is focused
        const currentDirection = form.getValues('direction');
        const newDirection = currentDirection === TradeDirection.LONG
          ? TradeDirection.SHORT
          : TradeDirection.LONG;
        form.setValue('direction', newDirection);
      },
      description: 'Toggle Long/Short (when direction focused)'
    }
  ];

  // Define handleCancel before using it in useKeyboardNavigation
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/trades');
    }
  };

  // Helper function to determine which tab contains a field
  const getTabForField = (fieldName: string): string => {
    const fieldToTabMap: Record<string, string> = {
      // Entry tab fields
      marketId: 'entry',
      symbol: 'entry',
      direction: 'entry',
      entryPrice: 'entry',
      quantity: 'entry',
      entryDate: 'entry',
      orderType: 'entry',
      // Risk tab fields
      stopLoss: 'risk',
      takeProfit: 'risk',
      riskAmount: 'risk',
      riskPercentage: 'risk',
      positionSize: 'risk',
      // Exit tab fields
      exitPrice: 'exit',
      exitDate: 'exit',
      result: 'exit',
      // Analysis tab fields
      maxFavorablePrice: 'analysis',
      maxAdversePrice: 'analysis',
      strategy: 'analysis',
      timeframe: 'analysis',
      notes: 'analysis',
      imageUrl: 'analysis',
      customStrategy: 'analysis',
    };
    return fieldToTabMap[fieldName] || 'entry';
  };

  // Handle form submission with validation
  const handleSubmitWithValidation = async () => {
    const isValid = await form.trigger();

    if (!isValid) {
      // Get all field errors
      const errors = form.formState.errors;

      // Find the first error field and its tab
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const errorTab = getTabForField(firstErrorField);

        // Switch to the tab containing the error
        setActiveTab(errorTab);

        // Focus on the error field after a short delay
        setTimeout(() => {
          const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
          if (errorElement instanceof HTMLElement) {
            errorElement.focus();
          }
        }, 100);

        // Show toast with error message
        const errorMessage = errors[firstErrorField]?.message || 'Please fix the validation errors';
        console.error(`Validation error in ${firstErrorField}: ${errorMessage}`);
      }
      return;
    }

    // If validation passes, submit the form
    await form.handleSubmit(onSubmit)();
  };

  // Setup keyboard navigation
  const {
    navigateToNext,
    navigateToPrevious,
    navigateToField,
    registerField,
    currentFieldIndex,
    fieldCompletionStatus,
    showShortcutHints,
    adjustNumericValue,
    handleQuickSelect,
    currentField,
    availableShortcuts,
    completionProgress
  } = useKeyboardNavigation({
    form,
    fields: navigationFields,
    shortcuts: customShortcuts,
    onTabChange: setActiveTab,
    tabs: ['entry', 'risk', 'exit', 'analysis'],
    autoSave: () => {
      const currentValues = form.getValues();
      const tabIndex = ['entry', 'risk', 'exit', 'analysis'].indexOf(activeTab);
      saveDraft(currentValues, tabIndex);
    },
    onSubmit: handleSubmitWithValidation,
    onCancel: handleCancel
  });

  // Set default market on component mount
  useEffect(() => {
    if (!isEditing && quickAccessMarkets.length > 0 && !form.getValues('marketId')) {
      // Set ES as default market if available
      const esMarket = quickAccessMarkets.find(m => m.symbol === 'ES');
      if (esMarket) {
        form.setValue('marketId', esMarket.id);
        form.setValue('symbol', esMarket.symbol);
        setSelectedMarketId(esMarket.id);
      }
    }
  }, [quickAccessMarkets, isEditing, form]);

  // Auto-save effect
  useEffect(() => {
    if (!isEditing) {
      const timeoutId = setTimeout(() => {
        const currentValues = form.getValues();
        const tabIndex = ['entry', 'risk', 'exit', 'analysis'].indexOf(activeTab);
        saveDraft(currentValues, tabIndex);
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [activeTab, form.watch(), saveDraft, isEditing]);

  // Market selection options
  const marketOptions: SmartSelectOption[] = quickAccessMarkets.map((market, index) => ({
    value: market.id,
    label: market.name,
    description: `${market.symbol} • ${market.exchange}`,
    quickKey: index < 9 ? (index + 1).toString() : undefined,
    icon: index === 0 ? Target : index === 1 ? DollarSign : undefined
  }));

  // Direction options
  const directionOptions: SmartSelectOption[] = [
    {
      value: TradeDirection.LONG,
      label: 'Long',
      description: 'Buy position',
      quickKey: 'l',
      icon: TrendingUp
    },
    {
      value: TradeDirection.SHORT,
      label: 'Short',
      description: 'Sell position',
      quickKey: 's',
      icon: TrendingDown
    }
  ];

  const onSubmit = async (data: TradeFormValues) => {
    try {
      // Clean up the data to match backend expectations
      const tradeData: any = {
        symbol: data.symbol,
        market: data.symbol || 'ES', // Use symbol as market identifier
        direction: data.direction,
        orderType: data.orderType,
        entryPrice: Number(data.entryPrice),
        quantity: Number(data.quantity),
        entryDate: new Date(data.entryDate),
        exitPrice: data.exitPrice ? Number(data.exitPrice) : undefined,
        exitDate: data.exitDate ? new Date(data.exitDate) : undefined,
        result: data.result,
        stopLoss: data.stopLoss ? Number(data.stopLoss) : undefined,
        takeProfit: data.takeProfit ? Number(data.takeProfit) : undefined,
        positionSize: data.positionSize ? Number(data.positionSize) : undefined,
        riskAmount: data.riskAmount ? Number(data.riskAmount) : undefined,
        riskPercentage: data.riskPercentage ? Number(data.riskPercentage) : undefined,
        maxFavorablePrice: data.maxFavorablePrice ? Number(data.maxFavorablePrice) : undefined,
        maxAdversePrice: data.maxAdversePrice ? Number(data.maxAdversePrice) : undefined,
        notes: data.notes,
        strategy: data.strategy,
        timeframe: data.timeframe,
        imageUrl: data.imageUrl || undefined,
        customStrategy: data.customStrategy,
      };

      // Remove undefined values to avoid sending them to the backend
      Object.keys(tradeData).forEach(key => {
        if (tradeData[key] === undefined || tradeData[key] === '') {
          delete tradeData[key];
        }
      });

      // Log the data being sent for debugging
      console.log('Sending trade data:', tradeData);
      console.log('Form data:', data);

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

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              {form.watch('direction') === TradeDirection.LONG ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
              {isEditing ? 'Edit Trade' : 'New Trade'}
              {form.watch('symbol') && ` - ${form.watch('symbol')}`}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {}}
                title="Show keyboard shortcuts (F1)"
              >
                <Keyboard className="h-4 w-4" />
              </Button>
              <Badge variant="outline" className="text-xs">
                {Math.round(completionProgress * 100)}% Complete
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>
            {isEditing
              ? 'Update your trade details and analysis'
              : 'Record your trade using keyboard shortcuts for rapid entry'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress indicator */}
          <FormProgress
            steps={formSteps}
            currentStep={activeTab}
            fieldCompletionStatus={fieldCompletionStatus}
            onStepClick={setActiveTab}
            layout="horizontal"
          />

          {/* Error display */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Error</span>
              </div>
              <p className="text-sm mt-1 text-destructive">{error}</p>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="entry" className="flex items-center gap-1 relative">
                    Entry
                    {(form.formState.errors.marketId ||
                      form.formState.errors.symbol ||
                      form.formState.errors.direction ||
                      form.formState.errors.entryPrice ||
                      form.formState.errors.quantity ||
                      form.formState.errors.entryDate) && (
                      <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
                    )}
                    <Badge variant="outline" className="text-xs">Alt+1</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="risk" className="flex items-center gap-1 relative">
                    Risk
                    {(form.formState.errors.stopLoss ||
                      form.formState.errors.takeProfit ||
                      form.formState.errors.riskAmount ||
                      form.formState.errors.riskPercentage ||
                      form.formState.errors.positionSize) && (
                      <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
                    )}
                    <Badge variant="outline" className="text-xs">Alt+2</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="exit" className="flex items-center gap-1 relative">
                    Exit
                    {(form.formState.errors.exitPrice ||
                      form.formState.errors.exitDate ||
                      form.formState.errors.result) && (
                      <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
                    )}
                    <Badge variant="outline" className="text-xs">Alt+3</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="analysis" className="flex items-center gap-1 relative">
                    Analysis
                    {(form.formState.errors.strategy ||
                      form.formState.errors.timeframe ||
                      form.formState.errors.notes ||
                      form.formState.errors.imageUrl) && (
                      <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
                    )}
                    <Badge variant="outline" className="text-xs">Alt+4</Badge>
                  </TabsTrigger>
                </TabsList>

                {/* Entry Tab */}
                <TabsContent value="entry" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="marketId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trading Market</FormLabel>
                          <FormControl>
                            <SmartSelect
                              fieldName="marketId"
                              tabOrder={0}
                              options={marketOptions}
                              placeholder="Select market (1-9 for quick select)"
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                // Set the symbol based on the selected market
                                const selectedMarket = quickAccessMarkets.find(m => m.id === value);
                                if (selectedMarket) {
                                  form.setValue('symbol', selectedMarket.symbol);
                                  setSelectedMarketId(value);
                                  setEntryPriceValue(form.getValues('entryPrice'));
                                }
                              }}
                              onFieldFocus={(fieldName) => registerField(fieldName, document.activeElement as HTMLElement)}
                              validationState={fieldCompletionStatus.marketId ? 'valid' : undefined}
                              autoAdvance
                              showQuickKeys
                              ref={(el) => registerField('marketId', el)}
                            />
                          </FormControl>
                          <FormDescription>
                            Press 1-9 for quick selection, Space to open
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Hidden symbol field that gets set automatically from market selection */}
                    <FormField
                      control={form.control}
                      name="symbol"
                      render={({ field }) => (
                        <FormItem className="hidden">
                          <FormControl>
                            <input type="hidden" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="direction"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Direction</FormLabel>
                          <FormControl>
                            <SmartSelect
                              fieldName="direction"
                              tabOrder={2}
                              options={directionOptions}
                              value={field.value}
                              onValueChange={field.onChange}
                              onFieldFocus={(fieldName) => registerField(fieldName, document.activeElement as HTMLElement)}
                              validationState={fieldCompletionStatus.direction ? 'valid' : undefined}
                              autoAdvance
                              showQuickKeys
                              ref={(el) => registerField('direction', el)}
                            />
                          </FormControl>
                          <FormDescription>
                            L for Long, S for Short, Space for toggle
                          </FormDescription>
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
                            <SmartInput
                              fieldName="entryPrice"
                              tabOrder={3}
                              type="number"
                              step={activeMarket?.tickSize || 0.01}
                              placeholder="Enter price"
                              value={field.value}
                              onChange={field.onChange}
                              onFieldFocus={(fieldName) => registerField(fieldName, document.activeElement as HTMLElement)}
                              validationState={fieldCompletionStatus.entryPrice ? 'valid' : undefined}
                              autoAdvance
                              allowArrowKeys
                              tickSize={activeMarket?.tickSize}
                              marketValidation={validatePrice}
                              roundToTick={roundToTick}
                              completionIndicator
                              isRequired
                              ref={(el) => registerField('entryPrice', el)}
                            />
                          </FormControl>
                          <FormDescription>
                            Ctrl+↑↓ to adjust by tick size, Enter for next field
                          </FormDescription>
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
                            <SmartInput
                              fieldName="quantity"
                              tabOrder={4}
                              type="number"
                              step="1"
                              min="1"
                              placeholder="Number of contracts"
                              value={field.value}
                              onChange={field.onChange}
                              onFieldFocus={(fieldName) => registerField(fieldName, document.activeElement as HTMLElement)}
                              validationState={fieldCompletionStatus.quantity ? 'valid' : undefined}
                              autoAdvance
                              allowArrowKeys
                              completionIndicator
                              isRequired
                              ref={(el) => registerField('quantity', el)}
                            />
                          </FormControl>
                          <FormDescription>
                            Ctrl+↑↓ to adjust quantity, Enter to advance
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
                            <SmartInput
                              fieldName="stopLoss"
                              tabOrder={30}
                              type="number"
                              step={activeMarket?.tickSize || 0.01}
                              placeholder="Stop loss price"
                              value={field.value}
                              onChange={field.onChange}
                              onFieldFocus={(fieldName) => registerField(fieldName, document.activeElement as HTMLElement)}
                              validationState={fieldCompletionStatus.stopLoss ? 'valid' : undefined}
                              autoAdvance
                              allowArrowKeys
                              tickSize={activeMarket?.tickSize}
                              roundToTick={roundToTick}
                              completionIndicator
                              ref={(el) => registerField('stopLoss', el)}
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
                            <SmartInput
                              fieldName="takeProfit"
                              tabOrder={31}
                              type="number"
                              step={activeMarket?.tickSize || 0.01}
                              placeholder="Take profit price"
                              value={field.value}
                              onChange={field.onChange}
                              onFieldFocus={(fieldName) => registerField(fieldName, document.activeElement as HTMLElement)}
                              validationState={fieldCompletionStatus.takeProfit ? 'valid' : undefined}
                              autoAdvance
                              allowArrowKeys
                              tickSize={activeMarket?.tickSize}
                              roundToTick={roundToTick}
                              completionIndicator
                              ref={(el) => registerField('takeProfit', el)}
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
                            <SmartInput
                              fieldName="riskPercentage"
                              tabOrder={32}
                              type="number"
                              step="0.1"
                              max="100"
                              placeholder="1.0"
                              value={field.value}
                              onChange={field.onChange}
                              onFieldFocus={(fieldName) => registerField(fieldName, document.activeElement as HTMLElement)}
                              validationState={fieldCompletionStatus.riskPercentage ? 'valid' : undefined}
                              autoAdvance
                              allowArrowKeys
                              completionIndicator
                              showProgress
                              ref={(el) => registerField('riskPercentage', el)}
                            />
                          </FormControl>
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
                            <SmartInput
                              fieldName="riskAmount"
                              tabOrder={33}
                              type="number"
                              step="100"
                              placeholder="1000.00"
                              value={field.value}
                              onChange={field.onChange}
                              onFieldFocus={(fieldName) => registerField(fieldName, document.activeElement as HTMLElement)}
                              validationState={fieldCompletionStatus.riskAmount ? 'valid' : undefined}
                              autoAdvance
                              allowArrowKeys
                              completionIndicator
                              ref={(el) => registerField('riskAmount', el)}
                            />
                          </FormControl>
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
                            <SmartInput
                              fieldName="exitPrice"
                              tabOrder={60}
                              type="number"
                              step={activeMarket?.tickSize || 0.01}
                              placeholder="Exit price (optional)"
                              value={field.value}
                              onChange={field.onChange}
                              onFieldFocus={(fieldName) => registerField(fieldName, document.activeElement as HTMLElement)}
                              validationState={field.value && fieldCompletionStatus.exitPrice ? 'valid' : undefined}
                              autoAdvance
                              allowArrowKeys
                              tickSize={activeMarket?.tickSize}
                              roundToTick={roundToTick}
                              completionIndicator
                              ref={(el) => registerField('exitPrice', el)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Analysis Tab */}
                <TabsContent value="analysis" className="space-y-4">
                  <div className="space-y-4">
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
                              name="notes"
                              data-field="notes"
                              ref={(el) => registerField('notes', el)}
                            />
                          </FormControl>
                          <FormDescription>
                            Document your thoughts and lessons learned
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Form actions */}
              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel (Esc)
                </Button>

                <div className="flex gap-2">
                  {!isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const currentValues = form.getValues();
                        const tabIndex = ['entry', 'risk', 'exit', 'analysis'].indexOf(activeTab);
                        saveDraft(currentValues, tabIndex);
                        // Show success feedback
                        console.log('Draft saved successfully');
                      }}
                      disabled={loading}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Draft (Ctrl+S)
                    </Button>
                  )}

                  <Button
                    type="button"
                    onClick={handleSubmitWithValidation}
                    disabled={loading}
                  >
                    {loading
                      ? 'Saving...'
                      : isEditing
                        ? 'Update Trade (Ctrl+Enter)'
                        : 'Save Trade (Ctrl+Enter)'
                    }
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Keyboard shortcuts panel */}
      <KeyboardShortcutsPanel
        shortcuts={availableShortcuts.map(shortcut => ({
          keys: shortcut.keys,
          description: shortcut.description,
          category: 'Navigation'
        }))}
        visible={showShortcutHints}
        onClose={() => {}}
      />
    </div>
  );
}

export default EnhancedTradeForm;