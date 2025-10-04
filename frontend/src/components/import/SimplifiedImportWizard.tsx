import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useImportStore } from '@/store/importStore';
import { UploadAndPreviewStep } from './UploadAndPreviewStep';
import { ImportProgress } from './ImportProgress';
import { cn } from '@/lib/utils';

interface SimplifiedImportWizardProps {
  onComplete?: () => void;
}

export function SimplifiedImportWizard({ onComplete }: SimplifiedImportWizardProps) {
  const {
    currentWizardStep,
    setCurrentWizardStep,
    resetImport,
  } = useImportStore();

  const steps = [
    {
      id: 0,
      title: 'Upload & Preview',
      description: 'Upload file and review data',
      icon: Upload,
    },
    {
      id: 1,
      title: 'Import',
      description: 'Import your trades',
      icon: CheckCircle2,
    },
  ];

  const handleComplete = () => {
    resetImport();
    if (onComplete) {
      onComplete();
    }
  };

  const handleRetry = () => {
    setCurrentWizardStep(0);
  };

  const getStepContent = () => {
    switch (currentWizardStep) {
      case 0:
        return <UploadAndPreviewStep onNext={() => setCurrentWizardStep(1)} />;
      case 1:
        return <ImportProgress onComplete={handleComplete} onRetry={handleRetry} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Compact Progress Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-4">
            {steps.map((step, index) => {
              const isCompleted = currentWizardStep > step.id;
              const isCurrent = currentWizardStep === step.id;

              return (
                <React.Fragment key={step.id}>
                  <motion.div
                    className="flex items-center gap-3"
                    initial={{ opacity: 0.5 }}
                    animate={{
                      opacity: isCurrent || isCompleted ? 1 : 0.5,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Step Circle */}
                    <div
                      className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
                        isCompleted && 'bg-green-500 border-green-500 text-white dark:bg-green-600 dark:border-green-600',
                        isCurrent && !isCompleted && 'bg-blue-500 border-blue-500 text-white dark:bg-blue-600 dark:border-blue-600',
                        !isCurrent && !isCompleted && 'border-gray-300 text-gray-400 dark:border-gray-600 dark:text-gray-500'
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <step.icon className="h-5 w-5" />
                      )}
                    </div>

                    {/* Step Info */}
                    <div>
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          (isCurrent || isCompleted) ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {step.title}
                      </p>
                      <p
                        className={cn(
                          'text-xs',
                          (isCurrent || isCompleted) ? 'text-muted-foreground' : 'text-muted-foreground/60'
                        )}
                      >
                        {step.description}
                      </p>
                    </div>
                  </motion.div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'h-[2px] w-16 transition-all',
                        isCompleted ? 'bg-green-500 dark:bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                      )}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentWizardStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {getStepContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
