import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import { Progress } from "./progress";
import { CheckCircle2, Circle, ArrowRight, Clock } from "lucide-react";

export interface FormStep {
  id: string;
  label: string;
  description?: string;
  fields: string[];
  required?: boolean;
}

interface FormProgressProps {
  steps: FormStep[];
  currentStep: string;
  fieldCompletionStatus: Record<string, boolean>;
  onStepClick?: (stepId: string) => void;
  className?: string;
  layout?: 'horizontal' | 'vertical';
  showFieldDetails?: boolean;
}

const FormProgress: React.FC<FormProgressProps> = ({
  steps,
  currentStep,
  fieldCompletionStatus,
  onStepClick,
  className,
  layout = 'horizontal',
  showFieldDetails = false
}) => {
  // Calculate completion for each step
  const stepProgress = React.useMemo(() => {
    return steps.map(step => {
      const completedFields = step.fields.filter(field =>
        fieldCompletionStatus[field] || false
      ).length;
      const totalFields = step.fields.length;
      const progress = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
      const isComplete = progress === 100;
      const isCurrent = step.id === currentStep;

      return {
        ...step,
        completedFields,
        totalFields,
        progress,
        isComplete,
        isCurrent
      };
    });
  }, [steps, fieldCompletionStatus, currentStep]);

  // Overall progress
  const overallProgress = React.useMemo(() => {
    const totalFields = steps.reduce((acc, step) => acc + step.fields.length, 0);
    const completedFields = Object.values(fieldCompletionStatus).filter(Boolean).length;
    return totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
  }, [steps, fieldCompletionStatus]);

  if (layout === 'vertical') {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Overall progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Form Progress</span>
            <span className="text-muted-foreground">
              {Math.round(overallProgress)}%
            </span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Step details */}
        <div className="space-y-3">
          {stepProgress.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                step.isCurrent && "border-primary bg-primary/5",
                step.isComplete && !step.isCurrent && "border-green-200 bg-green-50/50",
                onStepClick && "cursor-pointer hover:bg-muted/50"
              )}
              onClick={() => onStepClick?.(step.id)}
            >
              {/* Step indicator */}
              <div className="flex-shrink-0 mt-0.5">
                {step.isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : step.isCurrent ? (
                  <Circle className="h-5 w-5 text-primary fill-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "font-medium",
                    step.isCurrent && "text-primary",
                    step.isComplete && "text-green-700"
                  )}>
                    {step.label}
                  </span>
                  {step.required && !step.isComplete && (
                    <Badge variant="secondary" className="text-xs">Required</Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      step.isComplete && "border-green-200 text-green-700",
                      step.isCurrent && "border-primary text-primary"
                    )}
                  >
                    {step.completedFields}/{step.totalFields}
                  </Badge>
                </div>

                {step.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {step.description}
                  </p>
                )}

                {/* Field progress */}
                <Progress value={step.progress} className="h-1.5 mb-2" />

                {/* Field details */}
                {showFieldDetails && (
                  <div className="flex flex-wrap gap-1">
                    {step.fields.map(field => (
                      <Badge
                        key={field}
                        variant={fieldCompletionStatus[field] ? "default" : "outline"}
                        className={cn(
                          "text-xs",
                          fieldCompletionStatus[field] && "bg-green-100 text-green-800"
                        )}
                      >
                        {field}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Horizontal layout
  return (
    <div className={cn("space-y-4", className)}>
      {/* Overall progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Trade Entry Progress</span>
          <span className="text-muted-foreground">
            {Math.round(overallProgress)}% complete
          </span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

      {/* Horizontal steps */}
      <div className="flex items-center justify-between">
        {stepProgress.map((step, index) => (
          <React.Fragment key={step.id}>
            <div
              className={cn(
                "flex flex-col items-center gap-2 flex-1 text-center",
                onStepClick && "cursor-pointer group"
              )}
              onClick={() => onStepClick?.(step.id)}
            >
              {/* Step indicator */}
              <div
                className={cn(
                  "relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                  step.isCurrent && "border-primary bg-primary text-primary-foreground",
                  step.isComplete && "border-green-600 bg-green-600 text-white",
                  !step.isCurrent && !step.isComplete && "border-muted-foreground/30",
                  onStepClick && "group-hover:border-primary/60"
                )}
              >
                {step.isComplete ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}

                {/* Progress ring for current step */}
                {step.isCurrent && step.progress > 0 && step.progress < 100 && (
                  <div className="absolute inset-0">
                    <svg className="w-8 h-8 -rotate-90">
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray={`${(step.progress / 100) * 88} 88`}
                        className="text-primary/20"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Step label */}
              <div className="space-y-1">
                <span className={cn(
                  "text-xs font-medium",
                  step.isCurrent && "text-primary",
                  step.isComplete && "text-green-700",
                  !step.isCurrent && !step.isComplete && "text-muted-foreground"
                )}>
                  {step.label}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    step.isComplete && "border-green-200 text-green-700",
                    step.isCurrent && "border-primary text-primary"
                  )}
                >
                  {step.completedFields}/{step.totalFields}
                </Badge>
              </div>
            </div>

            {/* Connector */}
            {index < stepProgress.length - 1 && (
              <div className="flex-shrink-0 px-2">
                <ArrowRight className={cn(
                  "h-4 w-4",
                  stepProgress[index + 1].isComplete || stepProgress[index + 1].isCurrent
                    ? "text-primary"
                    : "text-muted-foreground/30"
                )} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Current step details */}
      {(() => {
        const currentStepData = stepProgress.find(s => s.isCurrent);
        if (!currentStepData) return null;

        return (
          <div className="p-3 border rounded-lg bg-muted/20">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-medium text-primary">
                Current: {currentStepData.label}
              </span>
              <Progress value={currentStepData.progress} className="flex-1 h-2" />
            </div>
            {currentStepData.description && (
              <p className="text-sm text-muted-foreground">
                {currentStepData.description}
              </p>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export { FormProgress, type FormStep };