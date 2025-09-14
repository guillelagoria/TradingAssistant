import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTradeStore } from '@/store/tradeStore';
import { TradeDirection, Strategy, OrderType, Timeframe, TradeFormData } from '@/types';
import { ES_FUTURES, NQ_FUTURES, ContractSpecification } from '@/types/market';
import { generateTradeDefaults } from '@/utils/marketCalculations';
import { MarketSelectionStep } from './wizard-steps/MarketSelectionStep';
import { BasicTradeInfoStep } from './wizard-steps/BasicTradeInfoStep';
import { PositionSizingStep } from './wizard-steps/PositionSizingStep';
import { RiskManagementStep } from './wizard-steps/RiskManagementStep';
import { ReviewSubmitStep } from './wizard-steps/ReviewSubmitStep';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  isValid: (data: any) => boolean;
  canSkip?: boolean;
}

interface TradeEntryData {
  // Market selection
  selectedMarket?: ContractSpecification;

  // Basic trade info
  symbol?: string;
  direction?: TradeDirection;
  entryPrice?: number;
  quantity?: number;
  entryDate?: Date;
  orderType?: OrderType;

  // Position sizing
  riskAmount?: number;
  riskPercentage?: number;
  suggestedQuantity?: number;
  accountBalance?: number;

  // Risk management
  stopLoss?: number;
  takeProfit?: number;
  stopLossPercent?: number;
  takeProfitPercent?: number;

  // Additional
  strategy?: Strategy;
  timeframe?: Timeframe;
  notes?: string;
}

const STEPS: WizardStep[] = [
  {
    id: 'market',
    title: 'Select Market',
    description: 'Choose your trading instrument',
    component: MarketSelectionStep,
    isValid: (data: TradeEntryData) => !!data.selectedMarket,
  },
  {
    id: 'basic',
    title: 'Trade Details',
    description: 'Direction, price, and basic info',
    component: BasicTradeInfoStep,
    isValid: (data: TradeEntryData) => !!(
      data.direction &&
      data.entryPrice &&
      data.entryPrice > 0 &&
      data.entryDate
    ),
  },
  {
    id: 'sizing',
    title: 'Position Size',
    description: 'Risk amount and position sizing',
    component: PositionSizingStep,
    isValid: (data: TradeEntryData) => !!(
      data.riskAmount &&
      data.riskAmount > 0 &&
      data.quantity &&
      data.quantity > 0
    ),
  },
  {
    id: 'risk',
    title: 'Risk Management',
    description: 'Stop loss and take profit',
    component: RiskManagementStep,
    isValid: (data: TradeEntryData) => !!(
      data.stopLoss &&
      data.stopLoss > 0
    ),
    canSkip: true,
  },
  {
    id: 'review',
    title: 'Review & Submit',
    description: 'Confirm all details',
    component: ReviewSubmitStep,
    isValid: () => true,
  },
];

export function EnhancedTradeEntryWizard() {
  const navigate = useNavigate();
  const { addTrade } = useTradeStore();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tradeData, setTradeData] = useState<TradeEntryData>({
    entryDate: new Date(),
    orderType: OrderType.MARKET,
    strategy: Strategy.DAY_TRADING,
    timeframe: Timeframe.M15,
    accountBalance: 100000, // Default account balance
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Refs for focus management
  const stepRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const currentStep = STEPS[currentStepIndex];
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  // Update trade data with smart defaults when market is selected
  useEffect(() => {
    if (tradeData.selectedMarket && !tradeData.symbol) {
      const defaults = generateTradeDefaults(
        tradeData.selectedMarket,
        tradeData.accountBalance || 100000,
        tradeData.entryPrice
      );

      setTradeData(prev => ({
        ...prev,
        symbol: tradeData.selectedMarket!.symbol,
        riskPercentage: defaults.riskPercentage,
        riskAmount: defaults.riskAmount,
        stopLossPercent: defaults.stopLossPercent,
        takeProfitPercent: defaults.takeProfitPercent,
        ...( tradeData.entryPrice && {
          suggestedQuantity: defaults.suggestedQuantity,
          stopLoss: defaults.suggestedStopLoss,
          takeProfit: defaults.suggestedTakeProfit,
        })
      }));
    }
  }, [tradeData.selectedMarket, tradeData.entryPrice, tradeData.accountBalance]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      const activeElement = document.activeElement;
      const isInputFocused = activeElement?.tagName === 'INPUT' ||
                            activeElement?.tagName === 'TEXTAREA' ||
                            activeElement?.tagName === 'SELECT';

      if (isInputFocused) {
        if (event.key === 'Enter' && !event.shiftKey) {
          // Allow Enter to advance step even when in input
          event.preventDefault();
          handleNext();
        }
        return;
      }

      switch (event.key) {
        case 'Enter':
          event.preventDefault();
          if (currentStepIndex < STEPS.length - 1) {
            handleNext();
          } else {
            handleSubmit();
          }
          break;
        case 'ArrowLeft':
          if (event.ctrlKey && currentStepIndex > 0) {
            event.preventDefault();
            handlePrevious();
          }
          break;
        case 'ArrowRight':
          if (event.ctrlKey && currentStepIndex < STEPS.length - 1) {
            event.preventDefault();
            handleNext();
          }
          break;
        case 'Escape':
          event.preventDefault();
          navigate('/');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentStepIndex, navigate]);

  // Focus management
  const focusCurrentStep = useCallback(() => {
    const currentStepElement = stepRefs.current[currentStep.id];
    if (currentStepElement) {
      currentStepElement.focus();
    }
  }, [currentStep.id]);

  useEffect(() => {
    focusCurrentStep();
  }, [currentStepIndex, focusCurrentStep]);

  const updateTradeData = useCallback((updates: Partial<TradeEntryData>) => {
    setTradeData(prev => ({ ...prev, ...updates }));
    setErrors({}); // Clear errors when data changes
  }, []);

  const validateCurrentStep = (): boolean => {
    const isValid = currentStep.isValid(tradeData);

    if (!isValid) {
      const stepErrors: Record<string, string> = {};

      switch (currentStep.id) {
        case 'market':
          if (!tradeData.selectedMarket) {
            stepErrors.market = 'Please select a market to continue';
          }
          break;
        case 'basic':
          if (!tradeData.direction) stepErrors.direction = 'Direction is required';
          if (!tradeData.entryPrice || tradeData.entryPrice <= 0) {
            stepErrors.entryPrice = 'Valid entry price is required';
          }
          if (!tradeData.entryDate) stepErrors.entryDate = 'Entry date is required';
          break;
        case 'sizing':
          if (!tradeData.riskAmount || tradeData.riskAmount <= 0) {
            stepErrors.riskAmount = 'Risk amount must be greater than 0';
          }
          if (!tradeData.quantity || tradeData.quantity <= 0) {
            stepErrors.quantity = 'Position size must be greater than 0';
          }
          break;
        case 'risk':
          if (!tradeData.stopLoss || tradeData.stopLoss <= 0) {
            stepErrors.stopLoss = 'Stop loss is required';
          }
          break;
      }

      setErrors(stepErrors);
    }

    return isValid;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      return;
    }

    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setErrors({});
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setErrors({});
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Only allow clicking on previous steps or next step if current is valid
    if (stepIndex <= currentStepIndex ||
        (stepIndex === currentStepIndex + 1 && validateCurrentStep())) {
      setCurrentStepIndex(stepIndex);
      setErrors({});
    }
  };

  const canSkipStep = (): boolean => {
    return currentStep.canSkip || false;
  };

  const handleSkip = () => {
    if (canSkipStep() && currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert wizard data to TradeFormData format
      const tradeFormData: TradeFormData = {
        symbol: tradeData.symbol!,
        direction: tradeData.direction!,
        entryPrice: tradeData.entryPrice!,
        quantity: tradeData.quantity!,
        entryDate: tradeData.entryDate!,
        orderType: tradeData.orderType || OrderType.MARKET,
        stopLoss: tradeData.stopLoss,
        takeProfit: tradeData.takeProfit,
        riskAmount: tradeData.riskAmount,
        riskPercentage: tradeData.riskPercentage,
        strategy: tradeData.strategy || Strategy.DAY_TRADING,
        timeframe: tradeData.timeframe || Timeframe.M15,
        notes: tradeData.notes,
      };

      await addTrade(tradeFormData);
      navigate('/', {
        state: {
          message: 'Trade added successfully!',
          type: 'success'
        }
      });

    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to create trade'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const StepComponent = currentStep.component;

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl" ref={containerRef}>
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">New Trade Entry</CardTitle>
              <p className="text-muted-foreground mt-1">
                Step {currentStepIndex + 1} of {STEPS.length}: {currentStep.description}
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3 mt-6">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Navigation */}
          <div className="flex items-center justify-between mt-4 overflow-x-auto">
            <div className="flex items-center space-x-2">
              {STEPS.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(index)}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors",
                    "min-w-0 whitespace-nowrap",
                    index === currentStepIndex && "bg-primary text-primary-foreground",
                    index < currentStepIndex && "bg-green-100 text-green-700 hover:bg-green-200",
                    index > currentStepIndex && "bg-muted text-muted-foreground hover:bg-muted-foreground/10",
                    (index <= currentStepIndex ||
                     (index === currentStepIndex + 1 && currentStep.isValid(tradeData))) &&
                    "cursor-pointer"
                  )}
                  disabled={index > currentStepIndex + 1 ||
                           (index === currentStepIndex + 1 && !currentStep.isValid(tradeData))}
                >
                  {index < currentStepIndex ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs">
                      {index + 1}
                    </span>
                  )}
                  <span className="hidden sm:inline">{step.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Keyboard shortcuts info */}
          <div className="mt-4 text-xs text-muted-foreground bg-muted/50 rounded p-2">
            <div className="flex flex-wrap gap-4">
              <span><kbd className="px-1 py-0.5 bg-background rounded text-xs">Enter</kbd> Next step</span>
              <span><kbd className="px-1 py-0.5 bg-background rounded text-xs">Ctrl+←</kbd> Previous</span>
              <span><kbd className="px-1 py-0.5 bg-background rounded text-xs">Ctrl+→</kbd> Next</span>
              <span><kbd className="px-1 py-0.5 bg-background rounded text-xs">Esc</kbd> Cancel</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Step Content */}
          <div
            ref={el => stepRefs.current[currentStep.id] = el}
            tabIndex={-1}
            className="outline-none"
          >
            <StepComponent
              data={tradeData}
              updateData={updateTradeData}
              errors={errors}
              onNext={handleNext}
              onPrevious={handlePrevious}
              canProceed={currentStep.isValid(tradeData)}
              isLastStep={currentStepIndex === STEPS.length - 1}
            />
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>

            <div className="flex items-center space-x-2">
              {canSkipStep() && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-muted-foreground"
                >
                  Skip Step
                </Button>
              )}

              {currentStepIndex < STEPS.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!currentStep.isValid(tradeData)}
                  className="flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!currentStep.isValid(tradeData) || isSubmitting}
                  className={cn(
                    "flex items-center space-x-2",
                    tradeData.direction === TradeDirection.LONG
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  )}
                >
                  {tradeData.direction === TradeDirection.LONG ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>
                    {isSubmitting ? 'Creating Trade...' :
                     `Create ${tradeData.direction} Trade`}
                  </span>
                </Button>
              )}
            </div>
          </div>

          {/* Error Display */}
          {Object.keys(errors).length > 0 && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="text-sm text-destructive font-medium mb-2">
                Please fix the following errors:
              </div>
              <ul className="text-sm text-destructive space-y-1">
                {Object.entries(errors).map(([field, message]) => (
                  <li key={field}>• {message}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}