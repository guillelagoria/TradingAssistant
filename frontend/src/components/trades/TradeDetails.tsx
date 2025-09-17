import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trade, TradeDirection, TradeResult } from '@/types';
import { cn } from '@/lib/utils';
import { 
  Edit, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  DollarSign,
  Target,
  Shield,
  BarChart3,
  Clock,
  Image as ImageIcon
} from 'lucide-react';

interface TradeDetailsProps {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (trade: Trade) => void;
}

function TradeDetails({ trade, open, onOpenChange, onEdit }: TradeDetailsProps) {
  if (!trade) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getResultBadge = () => {
    if (!trade.result) return null;
    
    const variants = {
      [TradeResult.WIN]: 'default',
      [TradeResult.LOSS]: 'destructive',
      [TradeResult.BREAKEVEN]: 'secondary'
    } as const;

    return (
      <Badge variant={variants[trade.result]} className="ml-2">
        {trade.result.toLowerCase()}
      </Badge>
    );
  };

  const getDirectionIcon = () => {
    return trade.direction === TradeDirection.LONG 
      ? <TrendingUp className="h-5 w-5 text-green-500" />
      : <TrendingDown className="h-5 w-5 text-red-500" />;
  };

  const getHoldingPeriod = () => {
    if (!trade.exitDate) return 'Open position';
    
    const entry = new Date(trade.entryDate);
    const exit = new Date(trade.exitDate);
    const diffMs = exit.getTime() - entry.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ${diffHours % 24}h`;
    } else {
      return `${diffHours}h ${Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))}m`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getDirectionIcon()}
              <div>
                <DialogTitle className="text-2xl font-bold">
                  {trade.symbol} {trade.direction}
                  {getResultBadge()}
                </DialogTitle>
                <DialogDescription>
                  Detailed view of your trading activity on {format(new Date(trade.entryDate), 'MMMM dd, yyyy at HH:mm')}
                </DialogDescription>
              </div>
            </div>
            <Button onClick={() => onEdit?.(trade)} size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={cn(
                    "text-2xl font-bold",
                    trade.pnl > 0 ? "text-green-600" : trade.pnl < 0 ? "text-red-600" : "text-gray-600"
                  )}>
                    {formatCurrency(trade.pnl)}
                  </div>
                  <div className="text-sm text-muted-foreground">Gross P&L</div>
                </div>
                <div className="text-center">
                  <div className={cn(
                    "text-2xl font-bold",
                    trade.netPnl > 0 ? "text-green-600" : trade.netPnl < 0 ? "text-red-600" : "text-gray-600"
                  )}>
                    {formatCurrency(trade.netPnl)}
                  </div>
                  <div className="text-sm text-muted-foreground">Net P&L</div>
                </div>
                <div className="text-center">
                  <div className={cn(
                    "text-2xl font-bold",
                    trade.pnlPercentage > 0 ? "text-green-600" : trade.pnlPercentage < 0 ? "text-red-600" : "text-gray-600"
                  )}>
                    {formatPercentage(trade.pnlPercentage)}
                  </div>
                  <div className="text-sm text-muted-foreground">Return %</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {trade.rMultiple.toFixed(2)}R
                  </div>
                  <div className="text-sm text-muted-foreground">R-Multiple</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Entry Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Entry Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Price</span>
                    <div className="font-semibold">{formatCurrency(trade.entryPrice)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Quantity</span>
                    <div className="font-semibold">{trade.quantity}</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Order Type</span>
                    <div className="font-semibold">{trade.orderType}</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Position Size</span>
                    <div className="font-semibold">{formatCurrency(trade.positionSize || 0)}</div>
                  </div>
                </div>
                <Separator />
                <div>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Entry Date
                  </span>
                  <div className="font-semibold">
                    {format(new Date(trade.entryDate), 'PPp')}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Exit Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Exit Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {trade.exitPrice ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Price</span>
                        <div className="font-semibold">{formatCurrency(trade.exitPrice)}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Commission</span>
                        <div className="font-semibold">{formatCurrency(trade.commission)}</div>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Exit Date
                      </span>
                      <div className="font-semibold">
                        {trade.exitDate && format(new Date(trade.exitDate), 'PPp')}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Holding Period
                      </span>
                      <div className="font-semibold">{getHoldingPeriod()}</div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Badge variant="outline" className="text-lg px-4 py-2">
                      Open Position
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      This trade is still open
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Risk Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Risk Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Stop Loss</span>
                    <div className="font-semibold">
                      {trade.stopLoss ? formatCurrency(trade.stopLoss) : 'Not set'}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Take Profit</span>
                    <div className="font-semibold">
                      {trade.takeProfit ? formatCurrency(trade.takeProfit) : 'Not set'}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Risk Amount</span>
                    <div className="font-semibold">
                      {trade.riskAmount ? formatCurrency(trade.riskAmount) : 'Not set'}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Risk %</span>
                    <div className="font-semibold">
                      {trade.riskPercentage ? `${trade.riskPercentage}%` : 'Not set'}
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Max Favorable</span>
                    <div className="font-semibold text-green-600">
                      {trade.maxFavorablePrice ? formatCurrency(trade.maxFavorablePrice) : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Max Adverse</span>
                    <div className="font-semibold text-red-600">
                      {trade.maxAdversePrice ? formatCurrency(trade.maxAdversePrice) : 'N/A'}
                    </div>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Efficiency</span>
                  <div className="font-semibold">{trade.efficiency.toFixed(1)}%</div>
                </div>
              </CardContent>
            </Card>

            {/* Strategy & Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Strategy & Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Strategy</span>
                    <div className="font-semibold">
                      {trade.strategy === 'CUSTOM' ? trade.customStrategy : trade.strategy}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Timeframe</span>
                    <div className="font-semibold">{trade.timeframe}</div>
                  </div>
                </div>
                {trade.notes && (
                  <>
                    <Separator />
                    <div>
                      <span className="text-sm text-muted-foreground">Notes</span>
                      <div className="font-medium mt-1 p-3 bg-muted rounded-md">
                        {trade.notes}
                      </div>
                    </div>
                  </>
                )}
                {trade.imageUrl && (
                  <>
                    <Separator />
                    <div>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <ImageIcon className="h-4 w-4" />
                        Trade Image
                      </span>
                      <div className="mt-2">
                        <img 
                          src={trade.imageUrl} 
                          alt="Trade screenshot"
                          className="max-w-full h-auto rounded-md border"
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TradeDetails;