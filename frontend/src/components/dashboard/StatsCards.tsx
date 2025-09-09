import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTradeStore } from '@/store/tradeStore';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Target,
  Activity
} from 'lucide-react';

interface StatsCardsProps {
  className?: string;
}

function StatsCards({ className }: StatsCardsProps) {
  const { stats } = useTradeStore();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (!stats) {
    return (
      <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-muted rounded animate-pulse w-24" />
              </CardTitle>
              <div className="h-4 w-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded animate-pulse w-20 mb-1" />
              <div className="h-3 bg-muted rounded animate-pulse w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Trades",
      value: stats.totalTrades.toString(),
      description: `${stats.winTrades} wins, ${stats.lossTrades} losses`,
      icon: Activity,
      trend: null,
      color: "default"
    },
    {
      title: "Win Rate",
      value: formatPercentage(stats.winRate),
      description: `${stats.winTrades}/${stats.totalTrades} winning trades`,
      icon: Target,
      trend: stats.winRate >= 50 ? "up" : "down",
      color: stats.winRate >= 50 ? "green" : "red"
    },
    {
      title: "Total P&L",
      value: formatCurrency(stats.totalPnl),
      description: `Net: ${formatCurrency(stats.netPnl)}`,
      icon: DollarSign,
      trend: stats.totalPnl >= 0 ? "up" : "down",
      color: stats.totalPnl >= 0 ? "green" : "red"
    },
    {
      title: "Profit Factor",
      value: stats.profitFactor.toFixed(2),
      description: `Avg Win/Loss ratio`,
      icon: BarChart3,
      trend: stats.profitFactor >= 1 ? "up" : "down",
      color: stats.profitFactor >= 1 ? "green" : "red"
    },
    {
      title: "Best Trade",
      value: formatCurrency(stats.maxWin),
      description: "Largest winning trade",
      icon: TrendingUp,
      trend: "up",
      color: "green"
    },
    {
      title: "Worst Trade",
      value: formatCurrency(Math.abs(stats.maxLoss)),
      description: "Largest losing trade",
      icon: TrendingDown,
      trend: "down",
      color: "red"
    }
  ];

  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6", className)}>
      {cards.map((card, index) => {
        const Icon = card.icon;
        
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className={cn(
                "h-4 w-4",
                card.color === "green" && "text-green-600",
                card.color === "red" && "text-red-600",
                card.color === "default" && "text-muted-foreground"
              )} />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "text-2xl font-bold",
                  card.color === "green" && "text-green-600",
                  card.color === "red" && "text-red-600",
                  card.color === "default" && "text-foreground"
                )}>
                  {card.value}
                </div>
                {card.trend && (
                  <Badge 
                    variant={card.trend === "up" ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {card.trend === "up" ? "↗" : "↘"}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
              
              {/* Visual indicator line at bottom */}
              <div className={cn(
                "absolute bottom-0 left-0 right-0 h-1",
                card.color === "green" && "bg-gradient-to-r from-green-500 to-green-600",
                card.color === "red" && "bg-gradient-to-r from-red-500 to-red-600",
                card.color === "default" && "bg-gradient-to-r from-blue-500 to-blue-600"
              )} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default StatsCards;