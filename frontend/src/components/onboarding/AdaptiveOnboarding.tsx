import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { useDataCapabilities } from '../../hooks/useDataCapabilities';
import { useAccountStore } from '../../store/accountStore';
import {
  Upload,
  Zap,
  Target,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  X,
  BarChart3,
  Clock,
  DollarSign
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  type: 'import' | 'upgrade' | 'complete';
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'advanced';
  benefits: string[];
  action: () => void;
  completed?: boolean;
}

interface AdaptiveOnboardingProps {
  onClose: () => void;
  onStepComplete: (stepId: string) => void;
}

const AdaptiveOnboarding: React.FC<AdaptiveOnboardingProps> = ({
  onClose,
  onStepComplete
}) => {
  const { activeAccount } = useAccountStore();
  const { capabilities, loading } = useDataCapabilities(activeAccount?.id || null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const getDifficultyColor = (difficulty: 'easy' | 'medium' | 'advanced') => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
    }
  };

  const getDifficultyIcon = (difficulty: 'easy' | 'medium' | 'advanced') => {
    switch (difficulty) {
      case 'easy': return '🟢';
      case 'medium': return '🟡';
      case 'advanced': return '🔴';
    }
  };

  const generateSteps = (): OnboardingStep[] => {
    if (!capabilities) return [];

    const steps: OnboardingStep[] = [];

    // Step 1: Always show basic setup if very low trades
    if (capabilities.totalTrades < 5) {
      steps.push({
        id: 'add-trades',
        title: 'Add Your First Trades',
        description: 'Start by adding some trades to see your analytics in action',
        icon: <BarChart3 className="w-6 h-6" />,
        type: 'upgrade',
        estimatedTime: '5 min',
        difficulty: 'easy',
        benefits: [
          'See basic P&L and win rate',
          'Track your trading progress',
          'Get performance insights'
        ],
        action: () => {
          // Navigate to add trade
          window.location.href = '/trades/new';
        }
      });
    }

    // Step 2: Import NT8 data if mostly basic trades
    if (capabilities.dataQualityBreakdown.basic > capabilities.totalTrades * 0.7 && capabilities.totalTrades >= 3) {
      steps.push({
        id: 'import-nt8',
        title: 'Import NinjaTrader 8 Data',
        description: 'Upload your NT8 CSV export to unlock advanced analytics',
        icon: <Upload className="w-6 h-6" />,
        type: 'import',
        estimatedTime: '3 min',
        difficulty: 'easy',
        benefits: [
          'MAE/MFE analysis for better entries/exits',
          'Trade duration and timing insights',
          'Strategy performance breakdown',
          'Advanced efficiency metrics'
        ],
        action: () => {
          // Navigate to import page
          console.log('Navigate to import');
        }
      });
    }

    // Step 3: Enable advanced tracking if no MAE/MFE
    if (!capabilities.availableMetrics.advanced.some(m => m.includes('MAE')) && capabilities.totalTrades >= 2) {
      steps.push({
        id: 'enable-mae-mfe',
        title: 'Track MAE/MFE Data',
        description: 'Start recording maximum favorable and adverse excursions',
        icon: <Zap className="w-6 h-6" />,
        type: 'upgrade',
        estimatedTime: '2 min',
        difficulty: 'medium',
        benefits: [
          'Understand your exit timing',
          'Identify profit left on table',
          'Improve risk management',
          'See trade efficiency scores'
        ],
        action: () => {
          // Show MAE/MFE tutorial
          console.log('Show MAE/MFE tutorial');
        }
      });
    }

    // Step 4: Strategy setup if no strategy data
    if (!capabilities.availableMetrics.advanced.some(m => m.includes('Strategy')) && capabilities.totalTrades >= 5) {
      steps.push({
        id: 'setup-strategies',
        title: 'Organize by Strategy',
        description: 'Tag your trades with strategies for performance analysis',
        icon: <Target className="w-6 h-6" />,
        type: 'complete',
        estimatedTime: '5 min',
        difficulty: 'medium',
        benefits: [
          'Compare strategy performance',
          'Identify your best setups',
          'Optimize your trading approach',
          'Track strategy evolution'
        ],
        action: () => {
          // Navigate to strategies
          console.log('Navigate to strategies');
        }
      });
    }

    return steps;
  };

  const steps = generateSteps();
  const progress = (completedSteps.size / Math.max(steps.length, 1)) * 100;

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
    onStepComplete(stepId);

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkipStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  if (loading || !capabilities || steps.length === 0) {
    return null;
  }

  const currentStepData = steps[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <Card>
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Unlock Your Trading Potential</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Personalized setup based on your current data quality: {capabilities.capabilityScore}%
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="absolute top-4 right-4"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Progress */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>Progress</span>
                  <span>{completedSteps.size} of {steps.length} completed</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardHeader>

            <CardContent>
              {/* Current Step */}
              <motion.div
                key={currentStep}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Step Header */}
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
                    {currentStepData.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
                      <Badge className={getDifficultyColor(currentStepData.difficulty)}>
                        {getDifficultyIcon(currentStepData.difficulty)} {currentStepData.difficulty}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{currentStepData.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{currentStepData.estimatedTime}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span>Free</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div>
                  <h4 className="font-medium mb-3">What you'll get:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {currentStepData.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={handleSkipStep}
                      size="sm"
                    >
                      Skip for now
                    </Button>
                    {currentStep > 0 && (
                      <Button
                        variant="ghost"
                        onClick={() => setCurrentStep(currentStep - 1)}
                        size="sm"
                      >
                        Back
                      </Button>
                    )}
                  </div>

                  <Button
                    onClick={() => {
                      currentStepData.action();
                      handleStepComplete(currentStepData.id);
                    }}
                    className="flex items-center space-x-2"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Step Counter */}
                <div className="flex justify-center space-x-2 pt-4">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentStep
                          ? 'bg-blue-500'
                          : index < currentStep || completedSteps.has(steps[index].id)
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Quick Stats Preview */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium mb-3">Your Current Analytics Level</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {capabilities.capabilityScore}%
                    </div>
                    <div className="text-xs text-muted-foreground">Data Quality</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {capabilities.availableMetrics.advanced.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Advanced Metrics</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {capabilities.availableMetrics.missing.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Potential Unlocks</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdaptiveOnboarding;