"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import * as z from 'zod'
import { toast } from 'sonner'

// shadcn/ui components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer'

// Icons
import {
  TrendingUp,
  TrendingDown,
  Info,
  Calculator,
  Save,
  Calendar as CalendarIcon,
  AlertCircle,
  Target,
  DollarSign,
  Zap,
} from 'lucide-react'

// Types and utilities
import {
  TradeDirection,
  OrderType,
  Strategy,
  Timeframe,
  TradeResult,
} from '@/types/trade'
import { useTradeStore } from '@/store/tradeStore'
import { cn } from '@/lib/utils'

// Form validation schema
const tradeFormSchema = z.object({
  // Entry Tab
  symbol: z.string().min(1, 'Symbol is required'),
  direction: z.nativeEnum(TradeDirection),
  entryPrice: z.coerce.number().positive('Entry price must be positive'),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  entryDate: z.string().min(1, 'Entry date is required'),
  orderType: z.nativeEnum(OrderType),

  // Risk Tab
  stopLoss: z.coerce.number().optional(),
  takeProfit: z.coerce.number().optional(),
  riskAmount: z.coerce.number().optional(),
  riskPercentage: z.coerce.number().min(0).max(100).optional(),

  // Exit Tab (optional)
  exitPrice: z.coerce.number().optional(),
  exitDate: z.string().optional(),
  result: z.nativeEnum(TradeResult).optional(),

  // Analysis Tab
  maxFavorablePrice: z.coerce.number().optional(),
  maxAdversePrice: z.coerce.number().optional(),
  strategy: z.nativeEnum(Strategy),
  timeframe: z.nativeEnum(Timeframe),
  notes: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
})

type TradeFormValues = z.infer<typeof tradeFormSchema>

interface ModernTradeFormProps {
  tradeId?: string
  onSuccess?: (trade: any) => void
  onCancel?: () => void
}

// Market options for demo - in real app this would come from a service
const MARKET_OPTIONS = [
  { value: 'ES', label: 'E-mini S&P 500 (ES)', symbol: 'ES' },
  { value: 'NQ', label: 'E-mini NASDAQ (NQ)', symbol: 'NQ' },
  { value: 'YM', label: 'E-mini Dow (YM)', symbol: 'YM' },
  { value: 'RTY', label: 'E-mini Russell (RTY)', symbol: 'RTY' },
  { value: 'GC', label: 'Gold Futures (GC)', symbol: 'GC' },
  { value: 'CL', label: 'Crude Oil (CL)', symbol: 'CL' },
]

export function ModernTradeForm({ tradeId, onSuccess, onCancel }: ModernTradeFormProps) {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!(tradeId || id)
  const editId = tradeId || id

  // State management
  const [activeTab, setActiveTab] = useState('entry')
  const [riskPercentageValue, setRiskPercentageValue] = useState([2])
  const [calculatedMetrics, setCalculatedMetrics] = useState<any>(null)
  const [entryDate, setEntryDate] = useState<Date | undefined>(new Date())
  const [exitDate, setExitDate] = useState<Date | undefined>()

  // Store
  const {
    addTrade,
    updateTrade,
    getTrade,
    loading,
    error
  } = useTradeStore()

  // Form setup
  const form = useForm<TradeFormValues>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: {
      symbol: 'ES',
      direction: TradeDirection.LONG,
      entryPrice: 0,
      quantity: 1,
      entryDate: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
      orderType: OrderType.MARKET,
      stopLoss: 0,
      takeProfit: 0,
      riskAmount: 1000,
      riskPercentage: 2,
      strategy: Strategy.DAY_TRADING,
      timeframe: Timeframe.M15,
      notes: '',
      imageUrl: '',
    },
  })

  // Calculate form completion percentage
  const formProgress = useMemo(() => {
    const values = form.getValues()
    const requiredFields = ['symbol', 'direction', 'entryPrice', 'quantity', 'entryDate', 'strategy', 'timeframe']
    const filledRequired = requiredFields.filter(field => {
      const value = values[field as keyof TradeFormValues]
      return value !== '' && value !== undefined && value !== 0
    }).length

    const optionalFields = ['stopLoss', 'takeProfit', 'riskAmount', 'notes']
    const filledOptional = optionalFields.filter(field => {
      const value = values[field as keyof TradeFormValues]
      return value !== '' && value !== undefined && value !== 0
    }).length

    return Math.round(((filledRequired / requiredFields.length) * 70) + ((filledOptional / optionalFields.length) * 30))
  }, [form.watch()])

  // Calculate position metrics in real-time
  useEffect(() => {
    const values = form.getValues()
    if (values.entryPrice && values.quantity && values.riskAmount) {
      const positionValue = values.entryPrice * values.quantity
      const riskPct = (values.riskAmount / 100000) * 100 // Assuming 100k account

      setCalculatedMetrics({
        positionValue,
        riskPercent: riskPct,
        maxLoss: values.riskAmount,
        rMultiple: values.takeProfit && values.stopLoss
          ? Math.abs(values.takeProfit - values.entryPrice) / Math.abs(values.entryPrice - values.stopLoss)
          : 0
      })
    }
  }, [form.watch(['entryPrice', 'quantity', 'riskAmount', 'takeProfit', 'stopLoss'])])

  // Load existing trade for editing
  useEffect(() => {
    if (isEditing && editId) {
      const existingTrade = getTrade(editId)
      if (existingTrade) {
        form.reset({
          symbol: existingTrade.symbol,
          direction: existingTrade.direction,
          entryPrice: existingTrade.entryPrice,
          quantity: existingTrade.quantity,
          entryDate: format(new Date(existingTrade.entryDate), 'yyyy-MM-dd\'T\'HH:mm'),
          orderType: existingTrade.orderType,
          stopLoss: existingTrade.stopLoss,
          takeProfit: existingTrade.takeProfit,
          riskAmount: existingTrade.riskAmount,
          riskPercentage: existingTrade.riskPercentage,
          exitPrice: existingTrade.exitPrice,
          exitDate: existingTrade.exitDate ? format(new Date(existingTrade.exitDate), 'yyyy-MM-dd\'T\'HH:mm') : '',
          result: existingTrade.result,
          maxFavorablePrice: existingTrade.maxFavorablePrice,
          maxAdversePrice: existingTrade.maxAdversePrice,
          strategy: existingTrade.strategy,
          timeframe: existingTrade.timeframe,
          notes: existingTrade.notes || '',
          imageUrl: existingTrade.imageUrl || '',
        })
      }
    }
  }, [isEditing, editId, getTrade, form])

  const onSubmit = async (data: TradeFormValues) => {
    try {
      const tradeData = {
        ...data,
        entryDate: new Date(data.entryDate),
        exitDate: data.exitDate ? new Date(data.exitDate) : undefined,
        // Remove empty optional fields
        stopLoss: data.stopLoss || undefined,
        takeProfit: data.takeProfit || undefined,
        riskAmount: data.riskAmount || undefined,
        riskPercentage: data.riskPercentage || undefined,
        exitPrice: data.exitPrice || undefined,
        maxFavorablePrice: data.maxFavorablePrice || undefined,
        maxAdversePrice: data.maxAdversePrice || undefined,
        imageUrl: data.imageUrl || undefined,
        notes: data.notes || undefined,
      }

      let result
      if (isEditing && editId) {
        result = await updateTrade(editId, tradeData)
        toast.success('Trade updated successfully')
      } else {
        result = await addTrade(tradeData)
        toast.success('Trade added successfully')
      }

      if (onSuccess) {
        onSuccess(result)
      } else {
        navigate('/trades')
      }
    } catch (error) {
      toast.error('Failed to save trade. Please try again.')
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      navigate('/trades')
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto py-6 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {form.watch('direction') === TradeDirection.LONG ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
                <div>
                  <CardTitle className="text-2xl">
                    {isEditing ? 'Edit Trade' : 'New Trade'}
                    {form.watch('symbol') && ` - ${form.watch('symbol')}`}
                  </CardTitle>
                  <CardDescription>
                    {isEditing
                      ? 'Update your trade details and analysis'
                      : 'Record your trading activity with smart validation'
                    }
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {formProgress}% Complete
                </Badge>
              </div>
            </div>
            <Progress value={formProgress} className="w-full h-2 mt-4" />
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="entry" className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Entry
                    </TabsTrigger>
                    <TabsTrigger value="risk" className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Risk
                    </TabsTrigger>
                    <TabsTrigger value="exit" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Exit
                    </TabsTrigger>
                    <TabsTrigger value="analysis" className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Analysis
                    </TabsTrigger>
                  </TabsList>

                  {/* Entry Tab */}
                  <TabsContent value="entry" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Market & Position</CardTitle>
                        <CardDescription>Select your trading instrument and position details</CardDescription>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="symbol"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Market Symbol</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select market" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {MARKET_OPTIONS.map((market) => (
                                    <SelectItem key={market.value} value={market.value}>
                                      {market.label}
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
                          name="direction"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Direction</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value={TradeDirection.LONG}>
                                    <div className="flex items-center gap-2">
                                      <TrendingUp className="h-4 w-4 text-green-600" />
                                      Long (Buy)
                                    </div>
                                  </SelectItem>
                                  <SelectItem value={TradeDirection.SHORT}>
                                    <div className="flex items-center gap-2">
                                      <TrendingDown className="h-4 w-4 text-red-600" />
                                      Short (Sell)
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
                                  placeholder="4500.00"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Price at which you entered the trade
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
                                <Input
                                  type="number"
                                  min="1"
                                  placeholder="1"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Number of contracts/shares
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="entryDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
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
                                    <SelectValue />
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
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Risk Tab */}
                  <TabsContent value="risk" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Risk Management</CardTitle>
                        <CardDescription>Define your stop loss, take profit, and position sizing</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
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
                                    placeholder="4450.00"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Exit price to limit losses
                                </FormDescription>
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
                                    placeholder="4600.00"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Target exit price for profits
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="riskPercentage"
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center gap-2">
                                  <FormLabel>Risk Percentage</FormLabel>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="h-4 w-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Percentage of account to risk on this trade</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                <FormControl>
                                  <div className="space-y-2">
                                    <Slider
                                      min={0.1}
                                      max={10}
                                      step={0.1}
                                      value={riskPercentageValue}
                                      onValueChange={(value) => {
                                        setRiskPercentageValue(value)
                                        field.onChange(value[0])
                                      }}
                                      className="w-full"
                                    />
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                      <span>0.1%</span>
                                      <Badge variant="outline">{riskPercentageValue[0]}%</Badge>
                                      <span>10%</span>
                                    </div>
                                  </div>
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
                                  <Input
                                    type="number"
                                    step="100"
                                    placeholder="1000.00"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Dollar amount you're willing to lose
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {calculatedMetrics && (
                          <Card className="bg-muted/50">
                            <CardHeader>
                              <CardTitle className="text-base">Position Metrics</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <Label className="text-muted-foreground">Position Value</Label>
                                <p className="font-semibold">${calculatedMetrics.positionValue?.toLocaleString()}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Risk %</Label>
                                <p className="font-semibold">{calculatedMetrics.riskPercent?.toFixed(2)}%</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Max Loss</Label>
                                <p className="font-semibold text-red-600">-${calculatedMetrics.maxLoss?.toLocaleString()}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">R-Multiple</Label>
                                <p className="font-semibold">{calculatedMetrics.rMultiple?.toFixed(2)}R</p>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Exit Tab */}
                  <TabsContent value="exit" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Exit Details</CardTitle>
                        <CardDescription>Record exit information for closed positions</CardDescription>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="exitPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Exit Price (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="4550.00"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Price at which you exited the trade
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
                              <FormLabel>Exit Date & Time (Optional)</FormLabel>
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
                          name="result"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Trade Result (Optional)</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select result" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value={TradeResult.WIN}>
                                    <span className="text-green-600">Win</span>
                                  </SelectItem>
                                  <SelectItem value={TradeResult.LOSS}>
                                    <span className="text-red-600">Loss</span>
                                  </SelectItem>
                                  <SelectItem value={TradeResult.BREAKEVEN}>
                                    <span className="text-yellow-600">Breakeven</span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Analysis Tab */}
                  <TabsContent value="analysis" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Trading Analysis</CardTitle>
                        <CardDescription>Strategy, timeframe, and additional analysis data</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="strategy"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Strategy</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value={Strategy.SCALPING}>Scalping</SelectItem>
                                    <SelectItem value={Strategy.DAY_TRADING}>Day Trading</SelectItem>
                                    <SelectItem value={Strategy.SWING}>Swing Trading</SelectItem>
                                    <SelectItem value={Strategy.POSITION}>Position Trading</SelectItem>
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
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value={Timeframe.M1}>1 minute</SelectItem>
                                    <SelectItem value={Timeframe.M5}>5 minutes</SelectItem>
                                    <SelectItem value={Timeframe.M15}>15 minutes</SelectItem>
                                    <SelectItem value={Timeframe.M30}>30 minutes</SelectItem>
                                    <SelectItem value={Timeframe.H1}>1 hour</SelectItem>
                                    <SelectItem value={Timeframe.H4}>4 hours</SelectItem>
                                    <SelectItem value={Timeframe.D1}>Daily</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

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
                                    placeholder="4580.00"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Highest price reached during trade
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
                                    placeholder="4480.00"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Lowest price reached during trade
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
                                  placeholder="What was your reasoning for this trade? What went well? What could be improved?"
                                  className="min-h-[100px] resize-none"
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

                        <FormField
                          control={form.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Screenshot URL (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  type="url"
                                  placeholder="https://example.com/screenshot.png"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Link to chart screenshot or setup image
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                <Separator />

                {/* Form Actions */}
                <CardFooter className="flex justify-between px-0">
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
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={loading}
                            onClick={() => {
                              // Auto-save functionality would go here
                              toast.success('Draft saved')
                            }}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Draft
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Save current progress as draft</p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      {loading ? (
                        <>
                          <Zap className="h-4 w-4 mr-2 animate-spin" />
                          {isEditing ? 'Updating...' : 'Saving...'}
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          {isEditing ? 'Update Trade' : 'Save Trade'}
                        </>
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}

export default ModernTradeForm