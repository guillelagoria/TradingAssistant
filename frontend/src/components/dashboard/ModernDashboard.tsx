"use client"

import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  Pie,
  PieChart,
  Line,
  LineChart,
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from 'recharts'

// shadcn/ui components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

// Icons
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Target,
  Activity,
  Search,
  Filter,
  Download,
  Plus,
  Calendar,
  Settings,
  Zap,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
} from 'lucide-react'

// Store and types
import { useTradeStore } from '@/store/tradeStore'
import { TradeDirection, TradeResult } from '@/types/trade'

// Time period options
const TIME_PERIODS = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '1y', label: '1 Year' },
  { value: 'all', label: 'All Time' },
]

// Chart colors
const CHART_COLORS = {
  primary: '#22c55e',
  secondary: '#ef4444',
  accent: '#3b82f6',
  muted: '#6b7280',
  warning: '#f59e0b',
}

export function ModernDashboard() {
  const navigate = useNavigate()
  const { trades, stats } = useTradeStore()
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [searchQuery, setSearchQuery] = useState('')

  // Enhanced stats calculations
  const enhancedStats = useMemo(() => {
    if (!stats || !trades.length) return null

    const longTrades = trades.filter(t => t.direction === TradeDirection.LONG)
    const shortTrades = trades.filter(t => t.direction === TradeDirection.SHORT)

    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const recentTrades = trades.filter(t => new Date(t.entryDate) >= lastMonth)

    return {
      ...stats,
      longWinRate: longTrades.length ? (longTrades.filter(t => t.result === TradeResult.WIN).length / longTrades.length) * 100 : 0,
      shortWinRate: shortTrades.length ? (shortTrades.filter(t => t.result === TradeResult.WIN).length / shortTrades.length) * 100 : 0,
      recentTradesCount: recentTrades.length,
      avgHoldingTime: trades.reduce((acc, t) => acc + (t.holdingPeriod || 0), 0) / trades.length || 0,
      bestStrategy: 'Day Trading', // This would be calculated from actual data
      monthlyGoal: 10000,
      monthlyProgress: Math.min((stats.totalPnl / 10000) * 100, 100),
    }
  }, [stats, trades])

  // Chart data preparation
  const chartData = useMemo(() => {
    if (!trades.length) return { pnlData: [], strategyData: [], dailyData: [] }

    // P&L evolution data
    let cumulativePnl = 0
    const pnlData = trades
      .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime())
      .map((trade, index) => {
        cumulativePnl += (trade.pnl || 0)
        return {
          trade: index + 1,
          pnl: (trade.pnl || 0),
          cumulativePnl,
          date: new Date(trade.entryDate).toLocaleDateString(),
        }
      })

    // Strategy distribution
    const strategyGroups = trades.reduce((acc, trade) => {
      const strategy = trade.strategy || 'Unknown'
      acc[strategy] = (acc[strategy] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const strategyData = Object.entries(strategyGroups).map(([strategy, count]) => ({
      strategy,
      count,
      percentage: (count / trades.length) * 100,
    }))

    // Daily P&L data (last 30 days)
    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)

    const dailyTrades = trades.filter(t => new Date(t.entryDate) >= last30Days)
    const dailyGroups = dailyTrades.reduce((acc, trade) => {
      const date = new Date(trade.entryDate).toDateString()
      if (!acc[date]) acc[date] = { date, pnl: 0, trades: 0 }
      acc[date].pnl += (trade.pnl || 0)
      acc[date].trades += 1
      return acc
    }, {} as Record<string, { date: string; pnl: number; trades: number }>)

    const dailyData = Object.values(dailyGroups)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-21) // Last 3 weeks

    return { pnlData, strategyData, dailyData }
  }, [trades])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  if (!enhancedStats) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No Trading Data</h3>
                <p className="text-muted-foreground">
                  Start by adding your first trade to see analytics and insights
                </p>
                <Button onClick={() => navigate('/trades/new')} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Trade
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header with Command Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Trading Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive overview of your trading performance and analytics
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Global Search Command */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Quick Search
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px]">
              <SheetHeader>
                <SheetTitle>Search & Quick Actions</SheetTitle>
                <SheetDescription>
                  Search trades, access quick actions, and navigate efficiently
                </SheetDescription>
              </SheetHeader>
              <div className="py-6">
                <Command className="rounded-lg border shadow-md">
                  <CommandInput placeholder="Search trades, symbols, strategies..." />
                  <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup heading="Quick Actions">
                      <CommandItem onSelect={() => navigate('/trades/new')}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Trade
                      </CommandItem>
                      <CommandItem onSelect={() => navigate('/trades')}>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        View All Trades
                      </CommandItem>
                      <CommandItem onSelect={() => navigate('/settings')}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </CommandItem>
                    </CommandGroup>
                    <CommandGroup heading="Recent Trades">
                      {trades.slice(0, 5).map((trade) => (
                        <CommandItem key={trade.id}>
                          <div className="flex items-center gap-2">
                            {trade.direction === TradeDirection.LONG ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                            <span>{trade.symbol}</span>
                            <Badge variant="outline" className="ml-auto">
                              {formatCurrency(trade.pnl || 0)}
                            </Badge>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            </SheetContent>
          </Sheet>

          {/* Time Period Selector */}
          <ToggleGroup
            type="single"
            value={selectedPeriod}
            onValueChange={setSelectedPeriod}
            className="bg-muted p-1 rounded-md"
          >
            {TIME_PERIODS.map((period) => (
              <ToggleGroupItem
                key={period.value}
                value={period.value}
                className="text-xs"
              >
                {period.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {/* Export Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Export as PDF</DropdownMenuItem>
              <DropdownMenuItem>Export as CSV</DropdownMenuItem>
              <DropdownMenuItem>Export Charts</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Email Report</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <HoverCard>
          <HoverCardTrigger asChild>
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{enhancedStats.totalTrades}</div>
                <p className="text-xs text-muted-foreground">
                  {enhancedStats.recentTradesCount} this month
                </p>
              </CardContent>
            </Card>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Trade Breakdown</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Winning Trades:</span>
                  <span className="text-green-600">{enhancedStats.winTrades}</span>
                </div>
                <div className="flex justify-between">
                  <span>Losing Trades:</span>
                  <span className="text-red-600">{enhancedStats.lossTrades}</span>
                </div>
                <div className="flex justify-between">
                  <span>Breakeven Trades:</span>
                  <span className="text-yellow-600">{enhancedStats.breakevenTrades}</span>
                </div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(enhancedStats.winRate)}</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={enhancedStats.winRate} className="flex-1 h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Target: 65%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${enhancedStats.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(enhancedStats.totalPnl)}
            </div>
            <p className="text-xs text-muted-foreground">
              Net: {formatCurrency(enhancedStats.netPnl)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={enhancedStats.monthlyProgress} className="flex-1 h-2" />
              <Badge variant="outline" className="text-xs">
                {formatPercentage(enhancedStats.monthlyProgress)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${enhancedStats.profitFactor >= 1 ? 'text-green-600' : 'text-red-600'}`}>
              {enhancedStats.profitFactor.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg Win/Loss ratio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Section */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* P&L Evolution */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChartIcon className="h-5 w-5" />
                  P&L Evolution
                </CardTitle>
                <CardDescription>
                  Cumulative profit and loss over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    cumulativePnl: {
                      label: "Cumulative P&L",
                      color: CHART_COLORS.primary,
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.pnlData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="trade"
                        className="text-xs"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        className="text-xs"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="cumulativePnl"
                        stroke={CHART_COLORS.primary}
                        fill={CHART_COLORS.primary}
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Daily P&L */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Daily P&L (Last 3 Weeks)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    pnl: {
                      label: "Daily P&L",
                      color: CHART_COLORS.primary,
                    },
                  }}
                  className="h-[250px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        className="text-xs"
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        className="text-xs"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        formatter={(value: any, name: string) => [
                          `$${value}`,
                          'P&L'
                        ]}
                      />
                      <Bar
                        dataKey="pnl"
                        radius={4}
                        fill={(entry: any) => entry.pnl >= 0 ? CHART_COLORS.primary : CHART_COLORS.secondary}
                      >
                        {chartData.dailyData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.pnl >= 0 ? CHART_COLORS.primary : CHART_COLORS.secondary}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Win/Loss Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Win/Loss Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    wins: {
                      label: "Wins",
                      color: CHART_COLORS.primary,
                    },
                    losses: {
                      label: "Losses",
                      color: CHART_COLORS.secondary,
                    },
                    breakeven: {
                      label: "Breakeven",
                      color: CHART_COLORS.warning,
                    },
                  }}
                  className="h-[250px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Wins', value: enhancedStats.winTrades, fill: CHART_COLORS.primary },
                          { name: 'Losses', value: enhancedStats.lossTrades, fill: CHART_COLORS.secondary },
                          { name: 'Breakeven', value: enhancedStats.breakevenTrades, fill: CHART_COLORS.warning }
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Strategy Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Strategy Distribution</CardTitle>
                <CardDescription>Breakdown by trading strategy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chartData.strategyData.map((item, index) => (
                    <div key={item.strategy} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}
                        />
                        <span className="text-sm font-medium">{item.strategy?.replace('_', ' ') || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={item.percentage} className="w-20 h-2" />
                        <Badge variant="outline" className="text-xs">
                          {item.count}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key trading statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="returns">
                    <AccordionTrigger>Return Metrics</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Best Trade</span>
                        <span className="text-sm font-medium text-green-600">
                          {formatCurrency(enhancedStats.maxWin)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Worst Trade</span>
                        <span className="text-sm font-medium text-red-600">
                          {formatCurrency(enhancedStats.maxLoss)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Average Win</span>
                        <span className="text-sm font-medium text-green-600">
                          {formatCurrency(enhancedStats.avgWin)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Average Loss</span>
                        <span className="text-sm font-medium text-red-600">
                          {formatCurrency(enhancedStats.avgLoss)}
                        </span>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="ratios">
                    <AccordionTrigger>Risk Ratios</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Average R-Multiple</span>
                        <span className="text-sm font-medium">
                          {enhancedStats.avgRMultiple.toFixed(2)}R
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Long Win Rate</span>
                        <span className="text-sm font-medium">
                          {formatPercentage(enhancedStats.longWinRate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Short Win Rate</span>
                        <span className="text-sm font-medium">
                          {formatPercentage(enhancedStats.shortWinRate)}
                        </span>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trade Activity</CardTitle>
              <CardDescription>Recent trading activity and patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {trades.slice(0, 10).map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        {trade.direction === TradeDirection.LONG ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <div className="font-medium">{trade.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(trade.entryDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${(trade.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(trade.pnl || 0)}
                        </div>
                        <Badge variant="outline" className="text-xs mt-1">
                          {trade.strategy?.replace('_', ' ') || 'Unknown'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => navigate('/trades/wizard')}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-200 hover:scale-105"
        >
          <div className="flex flex-col items-center">
            <Zap className="h-5 w-5" />
            <Plus className="h-3 w-3 -mt-1" />
          </div>
        </Button>
      </div>
    </div>
  )
}

export default ModernDashboard