import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Badge } from "./badge";

export interface SmartSelectOption {
  value: string;
  label: string;
  description?: string;
  quickKey?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface SmartSelectProps {
  // Basic props
  fieldName: string;
  value?: string;
  placeholder?: string;
  options: SmartSelectOption[];
  onValueChange?: (value: string) => void;

  // Navigation props
  tabOrder?: number;
  autoAdvance?: boolean;
  onComplete?: (value: string) => void;
  onFieldFocus?: (fieldName: string) => void;

  // Validation props
  validationState?: 'valid' | 'invalid' | 'pending';
  errorMessage?: string;

  // Visual props
  className?: string;
  disabled?: boolean;
  isRequired?: boolean;
  completionIndicator?: boolean;
  showQuickKeys?: boolean;

  // Keyboard navigation
  allowQuickSelect?: boolean;
}

const SmartSelect = React.forwardRef<HTMLButtonElement, SmartSelectProps>(
  ({
    fieldName,
    value,
    placeholder = "Select option...",
    options,
    onValueChange,
    tabOrder,
    autoAdvance = false,
    onComplete,
    onFieldFocus,
    validationState,
    errorMessage,
    className,
    disabled = false,
    isRequired = false,
    completionIndicator = true,
    showQuickKeys = true,
    allowQuickSelect = true,
    ...props
  }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [focused, setFocused] = React.useState(false);
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    // Combine refs
    React.useImperativeHandle(ref, () => buttonRef.current!);

    // Find selected option
    const selectedOption = React.useMemo(() =>
      options.find(option => option.value === value), [options, value]);

    // Check if field is complete
    const isComplete = React.useMemo(() => {
      return !!selectedOption && validationState !== 'invalid';
    }, [selectedOption, validationState]);

    // Handle value selection
    const handleSelect = React.useCallback((selectedValue: string) => {
      onValueChange?.(selectedValue);
      setOpen(false);

      if (autoAdvance) {
        setTimeout(() => onComplete?.(selectedValue), 100);
      }
    }, [onValueChange, autoAdvance, onComplete]);

    // Handle keyboard events
    const handleKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
      // Handle quick select keys
      if (allowQuickSelect && /^[1-9a-z]$/.test(event.key.toLowerCase()) && !open) {
        const option = options.find(opt => opt.quickKey === event.key.toLowerCase());
        if (option) {
          event.preventDefault();
          handleSelect(option.value);
          return;
        }
      }

      // Handle space to open/close
      if (event.key === ' ') {
        event.preventDefault();
        setOpen(prev => !prev);
        return;
      }

      // Handle enter
      if (event.key === 'Enter') {
        if (open) {
          setOpen(false);
        } else if (autoAdvance && isComplete) {
          event.preventDefault();
          onComplete?.(value!);
        }
        return;
      }

      // Handle escape
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }
    }, [allowQuickSelect, options, open, handleSelect, autoAdvance, isComplete, onComplete, value]);

    // Handle focus events
    const handleFocus = React.useCallback((event: React.FocusEvent<HTMLButtonElement>) => {
      setFocused(true);
      onFieldFocus?.(fieldName);
    }, [fieldName, onFieldFocus]);

    // Handle blur events
    const handleBlur = React.useCallback((event: React.FocusEvent<HTMLButtonElement>) => {
      // Delay to allow for click events on options
      setTimeout(() => {
        if (!buttonRef.current?.contains(document.activeElement)) {
          setFocused(false);
        }
      }, 100);
    }, []);

    return (
      <div className="relative">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={buttonRef}
              name={fieldName}
              data-field={fieldName}
              data-tab-order={tabOrder}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className={cn(
                "w-full justify-between transition-all duration-200",
                // Focus states
                focused && "ring-2 ring-primary ring-offset-2",
                // Validation states
                validationState === 'valid' && "border-green-500",
                validationState === 'invalid' && "border-red-500",
                validationState === 'pending' && "border-yellow-500",
                // Completion state
                isComplete && validationState !== 'invalid' && "border-green-400",
                // Required field indicator
                isRequired && !isComplete && "border-orange-300",
                className
              )}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              {...props}
            >
              <div className="flex items-center gap-2 text-left overflow-hidden">
                {selectedOption?.icon && (
                  <selectedOption.icon className="h-4 w-4 shrink-0" />
                )}
                <span className="truncate">
                  {selectedOption ? selectedOption.label : placeholder}
                </span>
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Search options..." />
              <CommandEmpty>No option found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={handleSelect}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {option.icon && <option.icon className="h-4 w-4" />}
                      <div>
                        <div className="font-medium">{option.label}</div>
                        {option.description && (
                          <div className="text-xs text-muted-foreground">
                            {option.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {showQuickKeys && option.quickKey && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {option.quickKey}
                        </Badge>
                      )}
                      <Check
                        className={cn(
                          "h-4 w-4",
                          value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Quick select hints when focused */}
        {focused && showQuickKeys && allowQuickSelect && !open && (
          <div className="absolute top-full left-0 z-10 mt-1 p-2 bg-popover border rounded-md shadow-md min-w-full">
            <div className="text-xs text-muted-foreground mb-1">Quick keys:</div>
            <div className="flex flex-wrap gap-1">
              {options
                .filter(option => option.quickKey)
                .map((option) => (
                  <Badge
                    key={option.value}
                    variant="outline"
                    className="text-xs px-1 py-0"
                  >
                    {option.quickKey}: {option.label}
                  </Badge>
                ))}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Space: Open • Enter: Next field
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && validationState === 'invalid' && (
          <div className="absolute top-full left-0 mt-1 text-xs text-red-500">
            {errorMessage}
          </div>
        )}
      </div>
    );
  }
);

SmartSelect.displayName = "SmartSelect";

export { SmartSelect, type SmartSelectOption };