import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";
import { Badge } from "./badge";
import { CheckCircle2, AlertCircle, Loader2, ArrowUp, ArrowDown } from "lucide-react";

export interface SmartInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Navigation props
  fieldName: string;
  tabOrder?: number;
  autoAdvance?: boolean;
  onComplete?: (value: string) => void;
  onFieldFocus?: (fieldName: string) => void;

  // Validation props
  validationState?: 'valid' | 'invalid' | 'pending';
  errorMessage?: string;

  // Quick selection props
  quickSelectOptions?: Array<{ key: string; value: any; label: string }>;
  showQuickSelectHints?: boolean;

  // Numeric controls
  step?: number;
  allowArrowKeys?: boolean;
  tickSize?: number;

  // Visual feedback
  showProgress?: boolean;
  isRequired?: boolean;
  completionIndicator?: boolean;

  // Market-specific
  marketValidation?: (value: number) => boolean;
  roundToTick?: (value: number) => number;
}

const SmartInput = React.forwardRef<HTMLInputElement, SmartInputProps>(
  ({
    className,
    type = "text",
    fieldName,
    tabOrder,
    autoAdvance = false,
    onComplete,
    onFieldFocus,
    validationState,
    errorMessage,
    quickSelectOptions,
    showQuickSelectHints = false,
    step,
    allowArrowKeys = true,
    tickSize,
    showProgress = false,
    isRequired = false,
    completionIndicator = true,
    marketValidation,
    roundToTick,
    value,
    onChange,
    onKeyDown,
    onFocus,
    onBlur,
    ...props
  }, ref) => {
    const [focused, setFocused] = React.useState(false);
    const [showHints, setShowHints] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current!);

    // Check if field is complete
    const isComplete = React.useMemo(() => {
      if (!value) return false;
      if (validationState === 'valid') return true;
      if (validationState === 'invalid') return false;
      // Basic completion check for text/numeric inputs
      return type === 'number' ? !isNaN(Number(value)) : String(value).length > 0;
    }, [value, validationState, type]);

    // Handle numeric adjustments
    const adjustValue = React.useCallback((increment: boolean) => {
      if (type !== 'number' || !inputRef.current) return;

      const currentValue = Number(value) || 0;
      const adjustStep = step || tickSize || 0.01;
      const adjustment = increment ? adjustStep : -adjustStep;
      let newValue = currentValue + adjustment;

      // Apply market tick rounding
      if (roundToTick) {
        newValue = roundToTick(newValue);
      }

      // Validate with market rules
      if (marketValidation && !marketValidation(newValue)) {
        return; // Don't update if invalid
      }

      // Create synthetic event
      const syntheticEvent = {
        target: { ...inputRef.current, value: newValue.toString() }
      } as React.ChangeEvent<HTMLInputElement>;

      onChange?.(syntheticEvent);
    }, [value, type, step, tickSize, roundToTick, marketValidation, onChange]);

    // Enhanced keyboard handling
    const handleKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
      const target = event.target as HTMLInputElement;

      // Handle quick select
      if (quickSelectOptions && /^[1-9a-z]$/.test(event.key.toLowerCase())) {
        const option = quickSelectOptions.find(opt => opt.key === event.key.toLowerCase());
        if (option) {
          event.preventDefault();
          const syntheticEvent = {
            target: { ...target, value: option.value }
          } as React.ChangeEvent<HTMLInputElement>;
          onChange?.(syntheticEvent);

          if (autoAdvance) {
            onComplete?.(option.value);
          }
          return;
        }
      }

      // Handle arrow key adjustments
      if (allowArrowKeys && type === 'number') {
        if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && event.ctrlKey) {
          event.preventDefault();
          adjustValue(event.key === 'ArrowUp');
          return;
        }
      }

      // Handle Enter for auto-advance
      if (event.key === 'Enter' && autoAdvance && isComplete) {
        event.preventDefault();
        onComplete?.(String(value));
        return;
      }

      // Handle Space for quick actions (customize per field type)
      if (event.key === ' ' && type !== 'text' && quickSelectOptions) {
        event.preventDefault();
        // Could cycle through options or trigger specific action
      }

      // Pass through other key events
      onKeyDown?.(event);
    }, [
      quickSelectOptions,
      onChange,
      autoAdvance,
      onComplete,
      allowArrowKeys,
      type,
      adjustValue,
      isComplete,
      value,
      onKeyDown
    ]);

    // Handle focus events
    const handleFocus = React.useCallback((event: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      setShowHints(true);
      onFieldFocus?.(fieldName);
      onFocus?.(event);
    }, [fieldName, onFieldFocus, onFocus]);

    // Handle blur events
    const handleBlur = React.useCallback((event: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      setShowHints(false);
      onBlur?.(event);
    }, [onBlur]);

    // Progress calculation for visual feedback
    const progressValue = React.useMemo(() => {
      if (!showProgress) return 0;
      if (type === 'number') {
        const numValue = Number(value) || 0;
        const max = Number(props.max) || 100;
        return Math.min((numValue / max) * 100, 100);
      }
      const stringValue = String(value || '');
      const minLength = Number(props.minLength) || 1;
      const maxLength = Number(props.maxLength) || 50;
      return Math.min((stringValue.length / maxLength) * 100, 100);
    }, [showProgress, type, value, props.max, props.minLength, props.maxLength]);

    return (
      <div className="relative">
        {/* Main input with enhanced styling */}
        <Input
          ref={inputRef}
          type={type}
          name={fieldName}
          data-field={fieldName}
          data-tab-order={tabOrder}
          className={cn(
            "transition-all duration-200",
            // Focus ring enhancement
            "focus-visible:ring-2 focus-visible:ring-offset-2",
            focused && "ring-2 ring-primary ring-offset-2",
            // Validation states
            validationState === 'valid' && "border-green-500 focus-visible:ring-green-500",
            validationState === 'invalid' && "border-red-500 focus-visible:ring-red-500",
            validationState === 'pending' && "border-yellow-500",
            // Completion state
            isComplete && validationState !== 'invalid' && "border-green-400",
            // Required field indicator
            isRequired && !isComplete && "border-orange-300",
            className
          )}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          step={step || tickSize}
          {...props}
        />

        {/* Progress bar (optional) */}
        {showProgress && progressValue > 0 && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200 rounded-b-md overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressValue}%` }}
            />
          </div>
        )}

        {/* Completion indicator */}
        {completionIndicator && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {validationState === 'pending' ? (
              <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
            ) : isComplete && validationState !== 'invalid' ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : validationState === 'invalid' ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : null}
          </div>
        )}

        {/* Arrow key indicators for numeric fields */}
        {focused && allowArrowKeys && type === 'number' && (
          <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex flex-col gap-1">
            <div className="text-xs text-muted-foreground opacity-60">
              <ArrowUp className="h-3 w-3" />
            </div>
            <div className="text-xs text-muted-foreground opacity-60">
              <ArrowDown className="h-3 w-3" />
            </div>
          </div>
        )}

        {/* Quick select hints */}
        {showHints && quickSelectOptions && quickSelectOptions.length > 0 && (
          <div className="absolute top-full left-0 z-10 mt-1 p-2 bg-popover border rounded-md shadow-md min-w-full">
            <div className="text-xs text-muted-foreground mb-1">Quick select:</div>
            <div className="flex flex-wrap gap-1">
              {quickSelectOptions.map((option) => (
                <Badge
                  key={option.key}
                  variant="outline"
                  className="text-xs px-1 py-0 cursor-pointer hover:bg-accent"
                  onClick={() => {
                    const syntheticEvent = {
                      target: { ...inputRef.current!, value: option.value }
                    } as React.ChangeEvent<HTMLInputElement>;
                    onChange?.(syntheticEvent);
                  }}
                >
                  {option.key}: {option.label}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && validationState === 'invalid' && (
          <div className="absolute top-full left-0 mt-1 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errorMessage}
          </div>
        )}

        {/* Keyboard hints for focused numeric fields */}
        {focused && type === 'number' && allowArrowKeys && (
          <div className="absolute top-full right-0 mt-1 text-xs text-muted-foreground bg-popover border rounded px-2 py-1 shadow-sm">
            <div>Ctrl+↑↓: Adjust by {step || tickSize || 0.01}</div>
            {quickSelectOptions && (
              <div>1-9, a-z: Quick select</div>
            )}
            <div>Enter: Next field</div>
          </div>
        )}
      </div>
    );
  }
);

SmartInput.displayName = "SmartInput";

export { SmartInput };