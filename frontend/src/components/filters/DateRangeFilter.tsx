import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { DatePreset } from '@/types';
import { getDateRangeFromPreset } from '@/utils/filterHelpers';
import { cn } from '@/lib/utils';

interface DateRangeFilterProps {
  dateFrom?: Date;
  dateTo?: Date;
  datePreset?: DatePreset;
  onDateFromChange: (date?: Date) => void;
  onDateToChange: (date?: Date) => void;
  onPresetChange: (preset?: DatePreset) => void;
  className?: string;
}

const DATE_PRESETS = [
  { value: DatePreset.TODAY, label: 'Today' },
  { value: DatePreset.YESTERDAY, label: 'Yesterday' },
  { value: DatePreset.THIS_WEEK, label: 'This Week' },
  { value: DatePreset.LAST_WEEK, label: 'Last Week' },
  { value: DatePreset.THIS_MONTH, label: 'This Month' },
  { value: DatePreset.LAST_MONTH, label: 'Last Month' },
  { value: DatePreset.LAST_30_DAYS, label: 'Last 30 Days' },
  { value: DatePreset.LAST_90_DAYS, label: 'Last 90 Days' },
  { value: DatePreset.THIS_YEAR, label: 'This Year' },
  { value: DatePreset.CUSTOM, label: 'Custom Range' }
];

export function DateRangeFilter({
  dateFrom,
  dateTo,
  datePreset,
  onDateFromChange,
  onDateToChange,
  onPresetChange,
  className
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDateFrom, setTempDateFrom] = useState<string>('');
  const [tempDateTo, setTempDateTo] = useState<string>('');

  useEffect(() => {
    setTempDateFrom(dateFrom ? format(dateFrom, 'yyyy-MM-dd') : '');
    setTempDateTo(dateTo ? format(dateTo, 'yyyy-MM-dd') : '');
  }, [dateFrom, dateTo]);

  const handlePresetChange = (preset: string) => {
    const presetValue = preset as DatePreset;
    onPresetChange(presetValue);

    if (presetValue !== DatePreset.CUSTOM) {
      const range = getDateRangeFromPreset(presetValue);
      if (range) {
        onDateFromChange(range.from);
        onDateToChange(range.to);
      }
    }
  };

  const handleDateFromChange = (value: string) => {
    setTempDateFrom(value);
    if (value) {
      onDateFromChange(new Date(value));
      onPresetChange(DatePreset.CUSTOM);
    } else {
      onDateFromChange(undefined);
    }
  };

  const handleDateToChange = (value: string) => {
    setTempDateTo(value);
    if (value) {
      onDateToChange(new Date(value));
      onPresetChange(DatePreset.CUSTOM);
    } else {
      onDateToChange(undefined);
    }
  };

  const clearDateRange = () => {
    onDateFromChange(undefined);
    onDateToChange(undefined);
    onPresetChange(undefined);
    setTempDateFrom('');
    setTempDateTo('');
  };

  const hasActiveRange = dateFrom || dateTo || datePreset;

  const getDisplayText = () => {
    if (datePreset && datePreset !== DatePreset.CUSTOM) {
      const preset = DATE_PRESETS.find(p => p.value === datePreset);
      return preset?.label || 'Date Range';
    }

    if (dateFrom || dateTo) {
      const fromText = dateFrom ? format(dateFrom, 'MMM dd, yyyy') : 'Start';
      const toText = dateTo ? format(dateTo, 'MMM dd, yyyy') : 'End';
      return `${fromText} - ${toText}`;
    }

    return 'Select Date Range';
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium">Date Range</Label>
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between text-left font-normal",
              !hasActiveRange && "text-muted-foreground",
              hasActiveRange && "ring-2 ring-primary/20"
            )}
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="truncate">{getDisplayText()}</span>
            </div>
            <div className="flex items-center gap-1">
              {hasActiveRange && (
                <X 
                  className="h-4 w-4 hover:bg-muted rounded p-0.5" 
                  onClick={(e) => {
                    e.stopPropagation();
                    clearDateRange();
                  }}
                />
              )}
              <ChevronDown className="h-4 w-4" />
            </div>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-0" align="start">
          <Card>
            <CardContent className="p-4 space-y-4">
              {/* Preset Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Quick Presets</Label>
                <Select
                  value={datePreset || ''}
                  onValueChange={handlePresetChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a preset" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_PRESETS.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Date Range */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Custom Range</Label>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <Input
                      type="date"
                      value={tempDateFrom}
                      onChange={(e) => handleDateFromChange(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Input
                      type="date"
                      value={tempDateTo}
                      onChange={(e) => handleDateToChange(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Quick Actions</Label>
                <div className="grid grid-cols-2 gap-2">
                  {DATE_PRESETS.slice(0, 6).map((preset) => (
                    <Button
                      key={preset.value}
                      variant={datePreset === preset.value ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => handlePresetChange(preset.value)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={clearDateRange}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => setIsOpen(false)}
                >
                  Apply
                </Button>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>

      {/* Active Range Display */}
      {hasActiveRange && (
        <div className="text-xs text-muted-foreground">
          {datePreset && datePreset !== DatePreset.CUSTOM && (
            <span>Preset: {DATE_PRESETS.find(p => p.value === datePreset)?.label}</span>
          )}
          {(dateFrom || dateTo) && (
            <span>
              {dateFrom && format(dateFrom, 'MMM dd, yyyy')} 
              {dateFrom && dateTo && ' to '}
              {dateTo && format(dateTo, 'MMM dd, yyyy')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default DateRangeFilter;