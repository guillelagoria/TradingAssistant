import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Eye, Zap, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useImportStore } from '@/store/importStore';
import { FileUploadStep } from './FileUploadStep';
import { PreviewStep } from './PreviewStep';
import { ImportProgress } from './ImportProgress';
import { cn } from '@/lib/utils';

interface ImportWizardProps {
  onComplete?: () => void;
}

export function ImportWizard({ onComplete }: ImportWizardProps) {
  const {
    currentWizardStep,
    setCurrentWizardStep,
    resetImport,
  } = useImportStore();

  const steps = [
    {
      id: 0,
      title: 'Upload File',
      description: 'Select your NT8 export file',
      icon: Upload,
    },
    {
      id: 1,
      title: 'Preview Data',
      description: 'Review and validate your trades',
      icon: Eye,
    },
    {
      id: 2,
      title: 'Import Progress',
      description: 'Import your trading data',
      icon: Zap,
    },
    {
      id: 3,
      title: 'Complete',
      description: 'Import finished successfully',
      icon: CheckCircle,
    },
  ];

  const handleStepChange = (step: number) => {
    setCurrentWizardStep(step);
  };

  const handleComplete = () => {
    resetImport();
    if (onComplete) {
      onComplete();
    }
  };

  const handleRetry = () => {
    setCurrentWizardStep(1); // Go back to preview step
  };

  const getStepContent = () => {
    switch (currentWizardStep) {
      case 0:
        return (
          <FileUploadStep
            onNext={() => handleStepChange(1)}
          />
        );
      case 1:
        return (
          <PreviewStep
            onNext={() => handleStepChange(2)}
            onPrevious={() => handleStepChange(0)}
          />
        );
      case 2:
        return (
          <ImportProgress
            onComplete={handleComplete}
            onRetry={handleRetry}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-center">NT8 Import Wizard</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="mb-6">
            <Progress value={(currentWizardStep / (steps.length - 1)) * 100} className="h-2" />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>Step {currentWizardStep + 1} of {steps.length}</span>
              <span>{Math.round((currentWizardStep / (steps.length - 1)) * 100)}% Complete</span>
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between items-center">
            {steps.map((step, index) => {
              const isCompleted = currentWizardStep > step.id;
              const isCurrent = currentWizardStep === step.id;
              const isAccessible = currentWizardStep >= step.id;

              return (
                <motion.div
                  key={step.id}
                  className="flex flex-col items-center space-y-2 flex-1"
                  initial={{ opacity: 0.5 }}
                  animate={{
                    opacity: isAccessible ? 1 : 0.5,
                    scale: isCurrent ? 1.05 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Step Circle */}
                  <div
                    className={cn(
                      'flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200',
                      isCompleted && 'bg-green-500 border-green-500 text-white',
                      isCurrent && !isCompleted && 'bg-blue-500 border-blue-500 text-white',
                      !isCurrent && !isCompleted && isAccessible && 'border-gray-300 text-gray-500',
                      !isAccessible && 'border-gray-200 text-gray-300'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <step.icon className="h-6 w-6" />
                    )}
                  </div>

                  {/* Step Info */}
                  <div className="text-center">
                    <p className={cn(
                      'text-sm font-medium',
                      (isCurrent || isCompleted) ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {step.title}
                    </p>
                    <p className={cn(
                      'text-xs',
                      (isCurrent || isCompleted) ? 'text-muted-foreground' : 'text-muted-foreground/70'
                    )}>
                      {step.description}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="h-6">
                    {isCompleted && (
                      <Badge variant="default" className="text-xs">
                        Complete
                      </Badge>
                    )}
                    {isCurrent && !isCompleted && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentWizardStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {getStepContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}