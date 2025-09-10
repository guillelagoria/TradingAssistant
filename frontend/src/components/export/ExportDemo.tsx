import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Download, FileBarChart, Table, Users } from 'lucide-react';
import { ExportDialog } from './ExportDialog';
import { Trade, TradeDirection, TradeResult, Strategy, Timeframe, TradeStatus } from '../../types';

// Sample trade data for demonstration
const sampleTrades: Trade[] = [
  {
    id: '1',
    symbol: 'AAPL',
    direction: TradeDirection.LONG,
    entryPrice: 150.00,
    exitPrice: 155.50,
    quantity: 100,
    entryDate: new Date('2024-01-15T09:30:00'),
    exitDate: new Date('2024-01-16T15:30:00'),
    orderType: 'MARKET' as any,
    result: TradeResult.WIN,
    stopLoss: 145.00,
    takeProfit: 160.00,
    positionSize: 15000,
    riskAmount: 500,
    riskPercentage: 3.33,
    strategy: Strategy.DAY_TRADING,
    timeframe: Timeframe.H1,
    notes: 'Strong earnings momentum',
    status: TradeStatus.CLOSED,
    createdAt: new Date('2024-01-15T09:00:00'),
    updatedAt: new Date('2024-01-16T15:30:00'),
    pnl: 550.00,
    pnlPercentage: 3.67,
    efficiency: 85.5,
    rMultiple: 1.1,
    commission: 2.50,
    netPnl: 547.50,
    holdingPeriod: 1560
  },
  {
    id: '2',
    symbol: 'TSLA',
    direction: TradeDirection.SHORT,
    entryPrice: 250.00,
    exitPrice: 245.75,
    quantity: 50,
    entryDate: new Date('2024-01-18T10:15:00'),
    exitDate: new Date('2024-01-18T14:45:00'),
    orderType: 'LIMIT' as any,
    result: TradeResult.WIN,
    stopLoss: 255.00,
    takeProfit: 240.00,
    positionSize: 12500,
    riskAmount: 250,
    riskPercentage: 2.00,
    strategy: Strategy.SCALPING,
    timeframe: Timeframe.M15,
    notes: 'Resistance level rejection',
    status: TradeStatus.CLOSED,
    createdAt: new Date('2024-01-18T10:00:00'),
    updatedAt: new Date('2024-01-18T14:45:00'),
    pnl: 212.50,
    pnlPercentage: 1.70,
    efficiency: 92.3,
    rMultiple: 0.85,
    commission: 2.00,
    netPnl: 210.50,
    holdingPeriod: 270
  },
  {
    id: '3',
    symbol: 'SPY',
    direction: TradeDirection.LONG,
    entryPrice: 420.50,
    exitPrice: 418.25,
    quantity: 25,
    entryDate: new Date('2024-01-22T09:45:00'),
    exitDate: new Date('2024-01-22T15:00:00'),
    orderType: 'MARKET' as any,
    result: TradeResult.LOSS,
    stopLoss: 417.00,
    takeProfit: 425.00,
    positionSize: 10512.50,
    riskAmount: 87.50,
    riskPercentage: 0.83,
    strategy: Strategy.SWING,
    timeframe: Timeframe.H4,
    notes: 'Market reversal, stopped out',
    status: TradeStatus.CLOSED,
    createdAt: new Date('2024-01-22T09:30:00'),
    updatedAt: new Date('2024-01-22T15:00:00'),
    pnl: -56.25,
    pnlPercentage: -0.54,
    efficiency: -78.5,
    rMultiple: -0.64,
    commission: 1.50,
    netPnl: -57.75,
    holdingPeriod: 315
  }
];

export const ExportDemo: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Export System Demo</span>
          </CardTitle>
          <CardDescription>
            Comprehensive export functionality for trading data with CSV and PDF formats
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Features Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Table className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="font-medium">CSV Export</div>
              <div className="text-sm text-muted-foreground">
                Data analysis ready
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <FileBarChart className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="font-medium">PDF Reports</div>
              <div className="text-sm text-muted-foreground">
                Professional formatting
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <div className="font-medium">Filtering</div>
              <div className="text-sm text-muted-foreground">
                Date ranges & criteria
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Download className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <div className="font-medium">Progress Tracking</div>
              <div className="text-sm text-muted-foreground">
                Real-time feedback
              </div>
            </div>
          </div>

          {/* Sample Data Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Sample Data for Testing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{sampleTrades.length}</div>
                <div className="text-sm text-muted-foreground">Total Trades</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {sampleTrades.filter(t => t.result === TradeResult.WIN).length}
                </div>
                <div className="text-sm text-muted-foreground">Winning Trades</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {sampleTrades.filter(t => t.result === TradeResult.LOSS).length}
                </div>
                <div className="text-sm text-muted-foreground">Losing Trades</div>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Try Export Functions</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* CSV Export */}
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Table className="h-4 w-4" />
                    <span className="font-medium">CSV Export</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Export sample trades as CSV with all columns and statistics
                  </p>
                  <ExportDialog
                    trades={sampleTrades}
                    defaultOptions={{
                      format: 'csv',
                      includeStats: true,
                      fileName: 'sample-trades'
                    }}
                    trigger={
                      <Button className="w-full" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                    }
                  />
                </div>
              </Card>

              {/* PDF Report */}
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <FileBarChart className="h-4 w-4" />
                    <span className="font-medium">PDF Report</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Generate professional PDF report with statistics
                  </p>
                  <ExportDialog
                    trades={sampleTrades}
                    defaultOptions={{
                      format: 'pdf',
                      includeStats: true,
                      fileName: 'sample-trading-report'
                    }}
                    trigger={
                      <Button className="w-full" variant="outline">
                        <FileBarChart className="h-4 w-4 mr-2" />
                        Export PDF
                      </Button>
                    }
                  />
                </div>
              </Card>

              {/* Custom Export */}
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">Custom Export</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Configure filters, columns, and options
                  </p>
                  <ExportDialog
                    trades={sampleTrades}
                    trigger={
                      <Button className="w-full" variant="default">
                        <Download className="h-4 w-4 mr-2" />
                        Configure Export
                      </Button>
                    }
                  />
                </div>
              </Card>
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Export Features</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium flex items-center space-x-2">
                  <Table className="h-4 w-4" />
                  <span>CSV Export Features</span>
                </h4>
                <ul className="space-y-2 text-sm">
                  {[
                    'All trade columns with proper formatting',
                    'Trading statistics summary',
                    'Date range filtering',
                    'Symbol and strategy filtering',
                    'Custom column selection',
                    'Progress tracking with cancellation'
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Badge variant="secondary" className="text-xs mt-0.5">✓</Badge>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium flex items-center space-x-2">
                  <FileBarChart className="h-4 w-4" />
                  <span>PDF Report Features</span>
                </h4>
                <ul className="space-y-2 text-sm">
                  {[
                    'Professional report layout',
                    'Performance statistics summary',
                    'Chart capture and embedding',
                    'Trade history tables',
                    'Custom headers and footers',
                    'Multi-page support'
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Badge variant="secondary" className="text-xs mt-0.5">✓</Badge>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};