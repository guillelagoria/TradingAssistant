import { useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TradeFilters, 
  TradeDirection, 
  TradeResult, 
  Strategy, 
  Timeframe,
  OrderType,
  Trade,
  SearchField,
  FilterPreset
} from '@/types';
import { SearchFilter } from './SearchFilter';
import { DateRangeFilter } from './DateRangeFilter';
import { FilterPresets } from './FilterPresets';
import { FilterButton, FilterStatus } from './FilterButton';
import { getActiveFiltersCount, validateFilters, formatHoldingPeriod } from '@/utils/filterHelpers';
import { cn } from '@/lib/utils';

interface AdvancedFiltersProps {
  filters: TradeFilters;
  trades: Trade[];
  onFiltersChange: (filters: TradeFilters) => void;
  onClearFilters: () => void;
  className?: string;
  resultCount?: number;
  customPresets?: FilterPreset[];
  onSavePreset?: (preset: Omit<FilterPreset, 'id'>) => void;
  onDeletePreset?: (presetId: string) => void;
  showPresets?: boolean;
  defaultOpen?: boolean;
  mobile?: boolean;
}

export function AdvancedFilters({
  filters,
  trades,
  onFiltersChange,
  onClearFilters,
  className,
  resultCount,
  customPresets,
  onSavePreset,
  onDeletePreset,
  showPresets = true,
  defaultOpen = false,
  mobile = false
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState('basic');

  const handleFilterChange = (key: keyof TradeFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    
    // Validate filters before applying
    const validation = validateFilters(newFilters);
    if (validation.isValid) {
      onFiltersChange(newFilters);
    }
  };

  const handleMultiSelectChange = (key: keyof TradeFilters, value: string, checked: boolean) => {
    const currentValues = (filters[key] as string[]) || [];
    const newValues = checked 
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    handleFilterChange(key, newValues.length > 0 ? newValues : undefined);
  };

  const clearRangeFilter = (minKey: keyof TradeFilters, maxKey: keyof TradeFilters) => {
    onFiltersChange({
      ...filters,
      [minKey]: undefined,
      [maxKey]: undefined
    });
  };

  if (mobile) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <FilterButton
            filters={filters}
            isOpen={isOpen}
            onToggle={() => setIsOpen(!isOpen)}
            onClearFilters={onClearFilters}
            size="sm"
          />
          <FilterStatus filters={filters} onClearFilters={onClearFilters} />
        </div>

        {isOpen && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <SearchFilter
                searchTerm={filters.searchTerm}
                searchFields={filters.searchFields || [SearchField.ALL]}
                trades={trades}
                resultCount={resultCount}
                onSearchChange={(term) => handleFilterChange('searchTerm', term || undefined)}
                onSearchFieldsChange={(fields) => handleFilterChange('searchFields', fields)}
              />
              
              <Separator />
              
              <DateRangeFilter
                dateFrom={filters.dateFrom}
                dateTo={filters.dateTo}
                datePreset={filters.datePreset}
                onDateFromChange={(date) => handleFilterChange('dateFrom', date)}
                onDateToChange={(date) => handleFilterChange('dateTo', date)}
                onPresetChange={(preset) => handleFilterChange('datePreset', preset)}
              />
              
              <Separator />
              
              {/* Basic Filters */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">Direction</Label>
                  <Select
                    value={filters.direction || ''}
                    onValueChange={(value) => handleFilterChange('direction', value || undefined)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      <SelectItem value={TradeDirection.LONG}>Long</SelectItem>
                      <SelectItem value={TradeDirection.SHORT}>Short</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm">Result</Label>
                  <Select
                    value={filters.result || ''}
                    onValueChange={(value) => handleFilterChange('result', value || undefined)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      <SelectItem value={TradeResult.WIN}>Win</SelectItem>
                      <SelectItem value={TradeResult.LOSS}>Loss</SelectItem>
                      <SelectItem value={TradeResult.BREAKEVEN}>Breakeven</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <FilterButton
        filters={filters}
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        onClearFilters={onClearFilters}
        variant="outline"
        showClearButton={!mobile}
      />

      {isOpen && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              Advanced Filters
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="ml-auto"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </CardTitle>
            <FilterStatus filters={filters} onClearFilters={onClearFilters} />
          </CardHeader>

          <CardContent className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                <TabsTrigger value="search">Search</TabsTrigger>
                {showPresets && <TabsTrigger value="presets">Presets</TabsTrigger>}
              </TabsList>

              {/* Basic Filters Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Symbol</Label>
                    <Input
                      placeholder="Search symbols..."
                      value={filters.symbol || ''}
                      onChange={(e) => handleFilterChange('symbol', e.target.value || undefined)}
                      className="h-8"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Direction</Label>
                    <Select
                      value={filters.direction || ''}
                      onValueChange={(value) => handleFilterChange('direction', value || undefined)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="All directions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All directions</SelectItem>
                        <SelectItem value={TradeDirection.LONG}>Long</SelectItem>
                        <SelectItem value={TradeDirection.SHORT}>Short</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Result</Label>
                    <Select
                      value={filters.result || ''}
                      onValueChange={(value) => handleFilterChange('result', value || undefined)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="All results" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All results</SelectItem>
                        <SelectItem value={TradeResult.WIN}>Win</SelectItem>
                        <SelectItem value={TradeResult.LOSS}>Loss</SelectItem>
                        <SelectItem value={TradeResult.BREAKEVEN}>Breakeven</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Strategy</Label>
                    <Select
                      value={filters.strategy || ''}
                      onValueChange={(value) => handleFilterChange('strategy', value || undefined)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="All strategies" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All strategies</SelectItem>
                        <SelectItem value={Strategy.SCALPING}>Scalping</SelectItem>
                        <SelectItem value={Strategy.DAY_TRADING}>Day Trading</SelectItem>
                        <SelectItem value={Strategy.SWING}>Swing</SelectItem>
                        <SelectItem value={Strategy.POSITION}>Position</SelectItem>
                        <SelectItem value={Strategy.CUSTOM}>Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Order Type</Label>
                    <Select
                      value={filters.orderType || ''}
                      onValueChange={(value) => handleFilterChange('orderType', value || undefined)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All types</SelectItem>
                        <SelectItem value={OrderType.MARKET}>Market</SelectItem>
                        <SelectItem value={OrderType.LIMIT}>Limit</SelectItem>
                        <SelectItem value={OrderType.STOP}>Stop</SelectItem>
                        <SelectItem value={OrderType.STOP_LIMIT}>Stop Limit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DateRangeFilter
                  dateFrom={filters.dateFrom}
                  dateTo={filters.dateTo}
                  datePreset={filters.datePreset}
                  onDateFromChange={(date) => handleFilterChange('dateFrom', date)}
                  onDateToChange={(date) => handleFilterChange('dateTo', date)}
                  onPresetChange={(preset) => handleFilterChange('datePreset', preset)}
                />
              </TabsContent>

              {/* Advanced Filters Tab */}
              <TabsContent value="advanced" className="space-y-4 mt-4">
                {/* P&L Range */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">P&L Range ($)</Label>
                    {(filters.pnlMin !== undefined || filters.pnlMax !== undefined) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearRangeFilter('pnlMin', 'pnlMax')}
                        className="h-6 px-2 text-xs"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min P&L"
                      value={filters.pnlMin ?? ''}
                      onChange={(e) => handleFilterChange('pnlMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="h-8"
                    />
                    <Input
                      type="number"
                      placeholder="Max P&L"
                      value={filters.pnlMax ?? ''}
                      onChange={(e) => handleFilterChange('pnlMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="h-8"
                    />
                  </div>
                </div>

                {/* R-Multiple Range */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">R-Multiple Range</Label>
                    {(filters.rMultipleMin !== undefined || filters.rMultipleMax !== undefined) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearRangeFilter('rMultipleMin', 'rMultipleMax')}
                        className="h-6 px-2 text-xs"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Min R"
                      value={filters.rMultipleMin ?? ''}
                      onChange={(e) => handleFilterChange('rMultipleMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="h-8"
                    />
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Max R"
                      value={filters.rMultipleMax ?? ''}
                      onChange={(e) => handleFilterChange('rMultipleMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="h-8"
                    />
                  </div>
                </div>

                {/* Position Size Range */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Position Size Range ($)</Label>
                    {(filters.positionSizeMin !== undefined || filters.positionSizeMax !== undefined) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearRangeFilter('positionSizeMin', 'positionSizeMax')}
                        className="h-6 px-2 text-xs"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min Size"
                      value={filters.positionSizeMin ?? ''}
                      onChange={(e) => handleFilterChange('positionSizeMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="h-8"
                    />
                    <Input
                      type="number"
                      placeholder="Max Size"
                      value={filters.positionSizeMax ?? ''}
                      onChange={(e) => handleFilterChange('positionSizeMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="h-8"
                    />
                  </div>
                </div>

                {/* Efficiency Range */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Efficiency Range (%)</Label>
                    {(filters.efficiencyMin !== undefined || filters.efficiencyMax !== undefined) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearRangeFilter('efficiencyMin', 'efficiencyMax')}
                        className="h-6 px-2 text-xs"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Min %"
                      value={filters.efficiencyMin ?? ''}
                      onChange={(e) => handleFilterChange('efficiencyMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="h-8"
                    />
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Max %"
                      value={filters.efficiencyMax ?? ''}
                      onChange={(e) => handleFilterChange('efficiencyMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="h-8"
                    />
                  </div>
                </div>

                {/* Holding Period Range */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Holding Period (minutes)</Label>
                    {(filters.holdingPeriodMin !== undefined || filters.holdingPeriodMax !== undefined) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearRangeFilter('holdingPeriodMin', 'holdingPeriodMax')}
                        className="h-6 px-2 text-xs"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      min="0"
                      placeholder="Min minutes"
                      value={filters.holdingPeriodMin ?? ''}
                      onChange={(e) => handleFilterChange('holdingPeriodMin', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="h-8"
                    />
                    <Input
                      type="number"
                      min="0"
                      placeholder="Max minutes"
                      value={filters.holdingPeriodMax ?? ''}
                      onChange={(e) => handleFilterChange('holdingPeriodMax', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="h-8"
                    />
                  </div>
                  {(filters.holdingPeriodMin !== undefined || filters.holdingPeriodMax !== undefined) && (
                    <div className="text-xs text-muted-foreground">
                      {filters.holdingPeriodMin && `Min: ${formatHoldingPeriod(filters.holdingPeriodMin)}`}
                      {filters.holdingPeriodMin && filters.holdingPeriodMax && ' • '}
                      {filters.holdingPeriodMax && `Max: ${formatHoldingPeriod(filters.holdingPeriodMax)}`}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Search Tab */}
              <TabsContent value="search" className="mt-4">
                <SearchFilter
                  searchTerm={filters.searchTerm}
                  searchFields={filters.searchFields || [SearchField.ALL]}
                  trades={trades}
                  resultCount={resultCount}
                  onSearchChange={(term) => handleFilterChange('searchTerm', term || undefined)}
                  onSearchFieldsChange={(fields) => handleFilterChange('searchFields', fields)}
                />
              </TabsContent>

              {/* Presets Tab */}
              {showPresets && (
                <TabsContent value="presets" className="mt-4">
                  <FilterPresets
                    currentFilters={filters}
                    onApplyPreset={onFiltersChange}
                    onSavePreset={onSavePreset}
                    onDeletePreset={onDeletePreset}
                    customPresets={customPresets}
                  />
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AdvancedFilters;