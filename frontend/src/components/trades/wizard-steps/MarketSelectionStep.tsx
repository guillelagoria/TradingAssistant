import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, DollarSign, Clock, Zap, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ES_FUTURES, NQ_FUTURES, ContractSpecification } from '@/types/market';

interface MarketSelectionStepProps {
  data: {
    selectedMarket?: ContractSpecification;
  };
  updateData: (updates: any) => void;
  errors: Record<string, string>;
  onNext: () => void;
  canProceed: boolean;
}

const POPULAR_MARKETS = [ES_FUTURES, NQ_FUTURES];

interface MarketCardProps {
  market: ContractSpecification;
  isSelected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
}

function MarketCard({ market, isSelected, onSelect, onDoubleClick }: MarketCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Auto-focus on selected card
  useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.focus();
    }
  }, [isSelected]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (isSelected) {
        onDoubleClick(); // Proceed to next step
      } else {
        onSelect();
      }
    }
  };

  return (
    <Card
      ref={cardRef}
      tabIndex={0}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        isSelected && "ring-2 ring-primary shadow-lg",
        "group"
      )}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg",
                  market.symbol === 'ES' ? "bg-blue-600" : "bg-green-600"
                )}>
                  {market.symbol}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{market.name}</h3>
                  <p className="text-sm text-muted-foreground">{market.description}</p>
                </div>
              </div>
            </div>
            {isSelected && (
              <Badge variant="default" className="bg-primary">
                Selected
              </Badge>
            )}
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Point Value:</span>
                <span className="font-medium">${market.pointValue}</span>
              </div>

              <div className="flex items-center space-x-2 text-sm">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Tick Size:</span>
                <span className="font-medium">{market.tickSize}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <Zap className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Day Margin:</span>
                <span className="font-medium">${market.dayTradingMargin?.toLocaleString()}</span>
              </div>

              <div className="flex items-center space-x-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Commission:</span>
                <span className="font-medium">${market.defaultCommission.amount}</span>
              </div>
            </div>
          </div>

          {/* Risk Defaults */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center">
              <Info className="w-3 h-3 mr-1" />
              Smart Defaults
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Risk per Trade:</span>
                <span className="ml-1 font-medium">{market.riskDefaults.riskPerTradePercent}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Max Position:</span>
                <span className="ml-1 font-medium">{market.riskDefaults.maxPositionSize}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Default SL:</span>
                <span className="ml-1 font-medium">{market.riskDefaults.defaultStopLossPercent}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Default TP:</span>
                <span className="ml-1 font-medium">{market.riskDefaults.defaultTakeProfitPercent}%</span>
              </div>
            </div>
          </div>

          {/* Selection Hint */}
          {isSelected && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> or
                double-click to continue
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function MarketSelectionStep({
  data,
  updateData,
  errors,
  onNext,
  canProceed
}: MarketSelectionStepProps) {

  const handleMarketSelect = (market: ContractSpecification) => {
    updateData({ selectedMarket: market });
  };

  const handleMarketDoubleClick = (market: ContractSpecification) => {
    updateData({ selectedMarket: market });
    // Small delay to ensure state update, then proceed
    setTimeout(onNext, 100);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!data.selectedMarket) return;

    const currentIndex = POPULAR_MARKETS.findIndex(m => m.id === data.selectedMarket!.id);

    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        if (currentIndex > 0) {
          handleMarketSelect(POPULAR_MARKETS[currentIndex - 1]);
        }
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        if (currentIndex < POPULAR_MARKETS.length - 1) {
          handleMarketSelect(POPULAR_MARKETS[currentIndex + 1]);
        }
        break;
    }
  };

  return (
    <div className="space-y-6" onKeyDown={handleKeyDown}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Select Your Trading Market</h2>
        <p className="text-muted-foreground">
          Choose the futures contract you want to trade. Smart defaults will be applied based on your selection.
        </p>
      </div>

      {/* Popular Markets */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-yellow-500" />
          Quick Select - Popular Futures
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {POPULAR_MARKETS.map((market) => (
            <MarketCard
              key={market.id}
              market={market}
              isSelected={data.selectedMarket?.id === market.id}
              onSelect={() => handleMarketSelect(market)}
              onDoubleClick={() => handleMarketDoubleClick(market)}
            />
          ))}
        </div>
      </div>

      {/* Navigation Tips */}
      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Navigation Tips
        </h4>
        <div className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
          <p>• Click to select a market, double-click to proceed automatically</p>
          <p>• Use arrow keys to navigate between markets</p>
          <p>• Press <kbd className="px-1 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">Enter</kbd> to select and continue</p>
          <p>• Smart defaults will be applied based on your market selection</p>
        </div>
      </div>

      {/* Error Display */}
      {errors.market && (
        <div className="text-sm text-destructive bg-destructive/10 rounded p-3">
          {errors.market}
        </div>
      )}

      {/* Continue Hint */}
      {canProceed && (
        <div className="text-center">
          <Button
            onClick={onNext}
            size="lg"
            className="font-semibold"
          >
            Continue with {data.selectedMarket?.symbol} →
          </Button>
        </div>
      )}
    </div>
  );
}