import React, { useState } from 'react';
import NewTradeForm from './NewTradeForm';
import { TradeFormData, TradeDirection, Strategy, Timeframe } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/utils/tradeCalculations';

/**
 * Demo component showcasing the NewTradeForm with different scenarios
 * This component demonstrates all features including animations, validations, and calculations
 */
export default function NewTradeFormDemo() {
  const [submittedTrade, setSubmittedTrade] = useState<TradeFormData | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [demoMode, setDemoMode] = useState<'empty' | 'prefilled'>('empty');

  const handleSubmit = async (tradeData: TradeFormData) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    setSubmittedTrade(tradeData);
    setShowForm(false);

    console.log('Trade submitted:', tradeData);
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  const resetDemo = () => {
    setSubmittedTrade(null);
    setShowForm(true);
  };

  const sampleTradeData: Partial<TradeFormData> = demoMode === 'prefilled' ? {
    symbol: 'AAPL',
    direction: TradeDirection.LONG,
    entryPrice: 150.25,
    quantity: 100,
    entryDate: new Date(),
    exitPrice: 155.75,
    stopLoss: 147.50,
    takeProfit: 158.00,
    strategy: Strategy.DAY_TRADING,
    timeframe: Timeframe.M15,
    notes: 'Strong breakout above resistance with high volume. Expected continuation to next resistance level.',
    maxFavorablePrice: 158.50,
    maxAdversePrice: 148.75
  } : undefined;

  if (!showForm && submittedTrade) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">Trade Submitted Successfully!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Symbol:</span> {submittedTrade.symbol}
              </div>
              <div>
                <span className="font-medium">Direction:</span>
                <Badge className="ml-2" variant={submittedTrade.direction === TradeDirection.LONG ? 'default' : 'secondary'}>
                  {submittedTrade.direction}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Entry Price:</span> {formatCurrency(submittedTrade.entryPrice)}
              </div>
              <div>
                <span className="font-medium">Quantity:</span> {submittedTrade.quantity}
              </div>
              {submittedTrade.exitPrice && (
                <>
                  <div>
                    <span className="font-medium">Exit Price:</span> {formatCurrency(submittedTrade.exitPrice)}
                  </div>
                  <div>
                    <span className="font-medium">P&L:</span>
                    <span className={`ml-2 font-semibold ${
                      ((submittedTrade.exitPrice - submittedTrade.entryPrice) * submittedTrade.quantity) > 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {formatCurrency(
                        (submittedTrade.exitPrice - submittedTrade.entryPrice) * submittedTrade.quantity
                      )}
                    </span>
                  </div>
                </>
              )}
            </div>

            {submittedTrade.notes && (
              <>
                <Separator />
                <div>
                  <span className="font-medium text-sm">Notes:</span>
                  <p className="mt-1 text-sm text-muted-foreground">{submittedTrade.notes}</p>
                </div>
              </>
            )}

            <Button onClick={resetDemo} className="w-full mt-4">
              Try Another Trade
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!showForm) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h2 className="text-xl font-semibold mb-4">Demo Cancelled</h2>
        <Button onClick={resetDemo}>Start New Demo</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Demo Controls */}
      <div className="max-w-2xl mx-auto p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>NewTradeForm Demo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Experience the new modern single-form trade input with real-time calculations,
              smooth animations, and comprehensive validation.
            </p>

            <div className="flex items-center space-x-2 mb-4">
              <span className="text-sm font-medium">Demo Mode:</span>
              <Button
                variant={demoMode === 'empty' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDemoMode('empty')}
              >
                Empty Form
              </Button>
              <Button
                variant={demoMode === 'prefilled' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDemoMode('prefilled')}
              >
                Pre-filled Sample
              </Button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>✨ <strong>Features to try:</strong></p>
              <ul className="list-disc list-inside space-y-0.5 ml-4">
                <li>Select a market symbol to see form animate in</li>
                <li>Enter prices to see real-time P&L calculations</li>
                <li>Try the mood rating with emoji hover effects</li>
                <li>Upload an image to see preview functionality</li>
                <li>Expand optional details for advanced fields</li>
                <li>Fill exit price to see complete trade summary</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* The Actual Form */}
      <NewTradeForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        initialData={sampleTradeData}
        isLoading={false}
      />
    </div>
  );
}