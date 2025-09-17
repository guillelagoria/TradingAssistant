import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subMonths } from 'date-fns';
import { Calendar as CalendarIcon, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { DatePreset } from '@/types';

interface DateRange {
  from?: Date;
  to?: Date;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range?: DateRange) => void;
  placeholder?: string;
  className?: string;
}

const DATE_PRESETS = [
  {
    id: DatePreset.TODAY,
    label: 'Today',
    getValue: () => {
      const today = new Date();
      return { from: today, to: today };
    }
  },
  {
    id: DatePreset.YESTERDAY,
    label: 'Yesterday',
    getValue: () => {
      const yesterday = subDays(new Date(), 1);
      return { from: yesterday, to: yesterday };
    }
  },
  {
    id: DatePreset.THIS_WEEK,
    label: 'This Week',
    getValue: () => {
      const today = new Date();
      return {
        from: startOfWeek(today, { weekStartsOn: 1 }),
        to: endOfWeek(today, { weekStartsOn: 1 })
      };
    }
  },
  {
    id: DatePreset.LAST_WEEK,
    label: 'Last Week',
    getValue: () => {
      const lastWeek = subDays(new Date(), 7);
      return {
        from: startOfWeek(lastWeek, { weekStartsOn: 1 }),
        to: endOfWeek(lastWeek, { weekStartsOn: 1 })
      };
    }
  },
  {
    id: DatePreset.LAST_30_DAYS,
    label: 'Last 30 Days',
    getValue: () => ({
      from: subDays(new Date(), 30),
      to: new Date()
    })
  },
  {
    id: DatePreset.THIS_MONTH,
    label: 'This Month',
    getValue: () => {
      const today = new Date();
      return {
        from: startOfMonth(today),
        to: endOfMonth(today)
      };
    }
  },
  {
    id: DatePreset.LAST_MONTH,
    label: 'Last Month',
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth)
      };
    }
  }
];

function DateRangePicker({
  value,
  onChange,
  placeholder = 'Select date range',
  className
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatDateRange = (range?: DateRange) => {
    if (!range?.from) return placeholder;

    if (range.from && range.to) {
      // Check if it's the same date
      if (format(range.from, 'yyyy-MM-dd') === format(range.to, 'yyyy-MM-dd')) {
        return format(range.from, 'MMM dd, yyyy');
      }
      return `${format(range.from, 'MMM dd')} - ${format(range.to, 'MMM dd, yyyy')}`;
    }

    return format(range.from, 'MMM dd, yyyy');
  };

  const handlePresetClick = (preset: typeof DATE_PRESETS[0]) => {
    const range = preset.getValue();
    onChange(range);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange(undefined);
      return;
    }

    if (!value?.from || (value.from && value.to)) {
      // Start new selection
      onChange({ from: date, to: undefined });
    } else if (value.from && !value.to) {
      // Complete the range
      if (date < value.from) {
        onChange({ from: date, to: value.from });
      } else {
        onChange({ from: value.from, to: date });
      }
      setIsOpen(false);
    }
  };

  const clearDateRange = () => {
    onChange(undefined);
  };

  const hasDateRange = value?.from || value?.to;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal h-9 min-w-[200px]",
            !hasDateRange && "text-muted-foreground",
            "hover:bg-accent/50 transition-colors",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span className="flex-1 truncate">
            {formatDateRange(value)}
          </span>
          {hasDateRange && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                clearDateRange();
              }}
              className="h-5 w-5 p-0 ml-2 hover:bg-destructive/20"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 shadow-lg border-border/50"
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15 }}
          className="flex"
        >
          {/* Quick Presets */}
          <div className="p-3 space-y-1 border-r border-border/30 min-w-[140px]">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Quick Select
            </div>
            {DATE_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                variant="ghost"
                size="sm"
                onClick={() => handlePresetClick(preset)}
                className="w-full justify-start text-xs h-7 font-normal hover:bg-accent/80"
              >
                {preset.label}
              </Button>
            ))}

            <Separator className="my-2" />

            {hasDateRange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDateRange}
                className="w-full justify-start text-xs h-7 font-normal text-destructive hover:bg-destructive/10"
              >
                Clear Selection
              </Button>
            )}
          </div>

          {/* Calendar */}
          <div className="p-3">
            <Calendar
              mode="single"
              selected={value?.from}
              onSelect={handleDateSelect}
              numberOfMonths={1}
              className="rounded-md"
              modifiers={{
                range_start: value?.from,
                range_end: value?.to,
                range_middle: value?.from && value?.to ? (date: Date) => {
                  if (!value.from || !value.to) return false;
                  return date > value.from && date < value.to;
                } : undefined,
              }}
              modifiersClassNames={{
                range_start: "bg-primary text-primary-foreground rounded-l-md rounded-r-none",
                range_end: "bg-primary text-primary-foreground rounded-r-md rounded-l-none",
                range_middle: "bg-primary/20 text-primary rounded-none",
              }}
            />

            {/* Selection Info */}
            {(value?.from || value?.to) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 pt-3 border-t border-border/30"
              >
                <div className="text-xs text-muted-foreground space-y-1">
                  {value?.from && (
                    <div className="flex items-center gap-2">
                      <span>From:</span>
                      <Badge variant="outline" className="text-xs">
                        {format(value.from, 'MMM dd, yyyy')}
                      </Badge>
                    </div>
                  )}
                  {value?.to && (
                    <div className="flex items-center gap-2">
                      <span>To:</span>
                      <Badge variant="outline" className="text-xs">
                        {format(value.to, 'MMM dd, yyyy')}
                      </Badge>
                    </div>
                  )}
                  {!value?.to && value?.from && (
                    <div className="text-xs text-muted-foreground/70 italic">
                      Click another date to complete range
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </PopoverContent>
    </Popover>
  );
}

export default DateRangePicker;