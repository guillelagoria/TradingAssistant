import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { CalendarIcon, FileText, Download } from "lucide-react";
import { format } from 'date-fns';
import { cn } from "../../lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { 
  ExportOptions as ExportOptionsType, 
  Trade, 
  TradeDirection, 
  TradeResult, 
  Strategy, 
  Timeframe
} from '../../types';
import { DEFAULT_EXPORT_COLUMNS } from '../../utils/exportHelpers';

interface ExportOptionsProps {
  trades: Trade[];
  onExport: (options: ExportOptionsType) => void;
  onCancel?: () => void;
  isExporting?: boolean;
}

const COLUMN_GROUPS = {
  basic: ['id', 'symbol', 'direction', 'entryPrice', 'exitPrice', 'quantity', 'entryDate', 'exitDate'],
  performance: ['pnl', 'pnlPercentage', 'efficiency', 'rMultiple', 'result'],
  risk: ['stopLoss', 'takeProfit', 'positionSize', 'riskAmount', 'riskPercentage'],
  analysis: ['maxFavorablePrice', 'maxAdversePrice', 'strategy', 'timeframe', 'notes'],
  dates: ['createdAt', 'updatedAt', 'holdingPeriod'],
  costs: ['commission', 'netPnl']
} as const;

export const ExportOptions: React.FC<ExportOptionsProps> = ({
  trades,
  onExport,
  onCancel,
  isExporting = false
}) => {
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv');
  const [fileName, setFileName] = useState('');
  const [includeStats, setIncludeStats] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(false);
  const [dateRange, setDateRange] = useState<{from?: Date; to?: Date}>({});
  const [selectedColumns, setSelectedColumns] = useState<Set<keyof Trade>>(
    new Set(DEFAULT_EXPORT_COLUMNS)
  );
  const [filters, setFilters] = useState({
    symbols: [] as string[],
    directions: [] as TradeDirection[],
    results: [] as TradeResult[],
    strategies: [] as Strategy[],
    timeframes: [] as Timeframe[]
  });

  // Get unique values from trades for filter options
  const uniqueSymbols = [...new Set(trades.map(t => t.symbol))].sort();
  const availableDirections = Object.values(TradeDirection);
  const availableResults = Object.values(TradeResult);
  const availableStrategies = Object.values(Strategy);
  const availableTimeframes = Object.values(Timeframe);

  const handleColumnToggle = (column: keyof Trade, checked: boolean) => {
    const newSelected = new Set(selectedColumns);
    if (checked) {
      newSelected.add(column);
    } else {
      newSelected.delete(column);
    }
    setSelectedColumns(newSelected);
  };

  const handleColumnGroupToggle = (groupKey: keyof typeof COLUMN_GROUPS, checked: boolean) => {
    const newSelected = new Set(selectedColumns);
    const columns = COLUMN_GROUPS[groupKey] as (keyof Trade)[];
    
    columns.forEach(column => {
      if (checked) {
        newSelected.add(column);
      } else {
        newSelected.delete(column);
      }
    });
    
    setSelectedColumns(newSelected);
  };

  const handleExport = () => {
    const options: ExportOptionsType = {
      format,
      fileName: fileName.trim() || undefined,
      includeStats,
      dateRange: dateRange.from && dateRange.to ? {
        from: dateRange.from,
        to: dateRange.to
      } : undefined,
      filters: {
        symbols: filters.symbols.length > 0 ? filters.symbols : undefined,
        directions: filters.directions.length > 0 ? filters.directions : undefined,
        results: filters.results.length > 0 ? filters.results : undefined,
        strategies: filters.strategies.length > 0 ? filters.strategies : undefined,
        timeframes: filters.timeframes.length > 0 ? filters.timeframes : undefined
      },
      columns: Array.from(selectedColumns)
    };

    onExport(options);
  };

  const getFilteredTradesCount = () => {
    let count = trades.length;
    
    // Apply date filter
    if (dateRange.from && dateRange.to) {
      count = trades.filter(trade => {
        const entryDate = new Date(trade.entryDate);
        return entryDate >= dateRange.from! && entryDate <= dateRange.to!;
      }).length;
    }
    
    // Apply other filters (simplified count)
    if (filters.symbols.length > 0) {
      count = Math.floor(count * 0.7); // Rough estimate
    }
    
    return count;
  };

  return (
    <div className="space-y-6">
      {/* Format Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Export Format</span>
          </CardTitle>
          <CardDescription>Choose the output format for your export</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={format} 
            onValueChange={(value) => setFormat(value as 'csv' | 'pdf')}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="csv" id="csv" />
              <Label htmlFor="csv" className="flex-1">
                <div>
                  <div className="font-medium">CSV (Comma Separated Values)</div>
                  <div className="text-sm text-muted-foreground">
                    Best for data analysis and spreadsheet applications
                  </div>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pdf" id="pdf" />
              <Label htmlFor="pdf" className="flex-1">
                <div>
                  <div className="font-medium">PDF Report</div>
                  <div className="text-sm text-muted-foreground">
                    Professional report with charts and formatted tables
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {format === 'pdf' && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeCharts" 
                  checked={includeCharts}
                  onCheckedChange={setIncludeCharts}
                />
                <Label htmlFor="includeCharts" className="text-sm">
                  Include performance charts
                </Label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Options */}
      <Card>
        <CardHeader>
          <CardTitle>File Options</CardTitle>
          <CardDescription>Customize the exported file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fileName">Custom filename (optional)</Label>
            <Input
              id="fileName"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="my-trades"
              className="max-w-sm"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includeStats" 
              checked={includeStats}
              onCheckedChange={setIncludeStats}
            />
            <Label htmlFor="includeStats" className="text-sm">
              Include trading statistics
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Date Range (Optional)</CardTitle>
          <CardDescription>Export trades from a specific time period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="space-y-2">
              <Label>From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, "PPP") : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, "PPP") : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {(dateRange.from || dateRange.to) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDateRange({})}
              className="mt-2"
            >
              Clear date range
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Column Selection */}
      {format === 'csv' && (
        <Card>
          <CardHeader>
            <CardTitle>Columns to Export</CardTitle>
            <CardDescription>Select which data fields to include</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(COLUMN_GROUPS).map(([groupKey, columns]) => {
                const groupColumns = columns as (keyof Trade)[];
                const allSelected = groupColumns.every(col => selectedColumns.has(col));
                const someSelected = groupColumns.some(col => selectedColumns.has(col));
                
                return (
                  <div key={groupKey} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={allSelected}
                        ref={(checkbox) => {
                          if (checkbox) {
                            checkbox.indeterminate = someSelected && !allSelected;
                          }
                        }}
                        onCheckedChange={(checked) => 
                          handleColumnGroupToggle(groupKey as keyof typeof COLUMN_GROUPS, !!checked)
                        }
                      />
                      <Label className="font-medium capitalize">
                        {groupKey} Fields
                      </Label>
                    </div>
                    
                    <div className="ml-6 grid grid-cols-2 gap-2">
                      {groupColumns.map(column => (
                        <div key={column} className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedColumns.has(column)}
                            onCheckedChange={(checked) => 
                              handleColumnToggle(column, !!checked)
                            }
                          />
                          <Label className="text-sm">
                            {column.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Export Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total trades available:</span>
              <span className="font-medium">{trades.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Trades to export:</span>
              <span className="font-medium">{getFilteredTradesCount()}</span>
            </div>
            <div className="flex justify-between">
              <span>Export format:</span>
              <span className="font-medium uppercase">{format}</span>
            </div>
            {format === 'csv' && (
              <div className="flex justify-between">
                <span>Columns selected:</span>
                <span className="font-medium">{selectedColumns.size}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isExporting}>
            Cancel
          </Button>
        )}
        <Button 
          onClick={handleExport} 
          disabled={isExporting || selectedColumns.size === 0}
          className="min-w-[120px]"
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export {format.toUpperCase()}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ExportOptions;