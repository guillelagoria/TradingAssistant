import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Palette, 
  Monitor, 
  Sun, 
  Moon, 
  Laptop, 
  Globe, 
  BarChart3, 
  Table2, 
  Layout,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';

import type { DisplayPreferences as DisplayPrefs } from '@/types/user';
import { cn } from '@/lib/utils';

interface DisplayPreferencesProps {
  preferences: DisplayPrefs;
  onUpdate: (preferences: Partial<DisplayPrefs>) => void;
  validationErrors?: Record<string, string>;
}

export function DisplayPreferences({ 
  preferences, 
  onUpdate, 
  validationErrors = {} 
}: DisplayPreferencesProps) {
  
  const handleInputChange = (field: keyof DisplayPrefs, value: any) => {
    onUpdate({ [field]: value });
  };

  const handleCurrencyChange = (field: keyof DisplayPrefs['currency'], value: any) => {
    onUpdate({
      currency: {
        ...preferences.currency,
        [field]: value
      }
    });
  };

  const handleNumberFormatChange = (field: keyof DisplayPrefs['numberFormat'], value: any) => {
    onUpdate({
      numberFormat: {
        ...preferences.numberFormat,
        [field]: value
      }
    });
  };

  const handleChartsChange = (field: keyof DisplayPrefs['charts'], value: any) => {
    onUpdate({
      charts: {
        ...preferences.charts,
        [field]: value
      }
    });
  };

  const handleDashboardChange = (field: keyof DisplayPrefs['dashboard'], value: any) => {
    onUpdate({
      dashboard: {
        ...preferences.dashboard,
        [field]: value
      }
    });
  };

  const handleTablesChange = (field: keyof DisplayPrefs['tables'], value: any) => {
    onUpdate({
      tables: {
        ...preferences.tables,
        [field]: value
      }
    });
  };

  const toggleColumnVisibility = (columnId: string) => {
    const visibleColumns = preferences.tables.visibleColumns;
    const isVisible = visibleColumns.includes(columnId);
    
    if (isVisible) {
      handleTablesChange('visibleColumns', visibleColumns.filter(c => c !== columnId));
    } else {
      handleTablesChange('visibleColumns', [...visibleColumns, columnId]);
    }
  };

  const currencies = [
    { symbol: '$', name: 'US Dollar', code: 'USD' },
    { symbol: '€', name: 'Euro', code: 'EUR' },
    { symbol: '£', name: 'British Pound', code: 'GBP' },
    { symbol: '¥', name: 'Japanese Yen', code: 'JPY' },
    { symbol: 'C$', name: 'Canadian Dollar', code: 'CAD' },
    { symbol: 'A$', name: 'Australian Dollar', code: 'AUD' },
    { symbol: '₹', name: 'Indian Rupee', code: 'INR' },
  ];

  const dateFormats = [
    { format: 'MM/DD/YYYY', example: '12/31/2023' },
    { format: 'DD/MM/YYYY', example: '31/12/2023' },
    { format: 'YYYY-MM-DD', example: '2023-12-31' },
    { format: 'DD/MMM/YYYY', example: '31/Dec/2023' },
  ];

  const availableColumns = [
    { id: 'symbol', name: 'Symbol' },
    { id: 'direction', name: 'Direction' },
    { id: 'entryPrice', name: 'Entry Price' },
    { id: 'exitPrice', name: 'Exit Price' },
    { id: 'quantity', name: 'Quantity' },
    { id: 'pnl', name: 'P&L' },
    { id: 'rMultiple', name: 'R-Multiple' },
    { id: 'efficiency', name: 'Efficiency' },
    { id: 'date', name: 'Date' },
    { id: 'strategy', name: 'Strategy' },
    { id: 'timeframe', name: 'Timeframe' },
    { id: 'commission', name: 'Commission' },
  ];

  const colorSchemes = [
    { id: 'default', name: 'Default', description: 'Standard color palette' },
    { id: 'colorblind', name: 'Colorblind Friendly', description: 'Accessible colors for colorblindness' },
    { id: 'highContrast', name: 'High Contrast', description: 'Maximum contrast for better visibility' },
  ];

  return (
    <div className="space-y-6">
      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-5 w-5" />
            Theme & Appearance
          </CardTitle>
          <CardDescription>
            Customize the visual appearance of your trading interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Theme Mode</Label>
            <RadioGroup 
              value={preferences.theme} 
              onValueChange={(value) => handleInputChange('theme', value as DisplayPrefs['theme'])}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="theme-light" />
                <Label htmlFor="theme-light" className="flex items-center gap-2 cursor-pointer">
                  <Sun className="h-4 w-4" />
                  Light
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="theme-dark" />
                <Label htmlFor="theme-dark" className="flex items-center gap-2 cursor-pointer">
                  <Moon className="h-4 w-4" />
                  Dark
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="theme-system" />
                <Label htmlFor="theme-system" className="flex items-center gap-2 cursor-pointer">
                  <Laptop className="h-4 w-4" />
                  System
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Currency and Number Format */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5" />
            Localization & Formats
          </CardTitle>
          <CardDescription>
            Configure how numbers, currencies, and dates are displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Currency Settings */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Currency Display</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency-symbol">Currency Symbol</Label>
                <Select
                  value={preferences.currency.symbol}
                  onValueChange={(value) => handleCurrencyChange('symbol', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.symbol}>
                        <span className="flex items-center gap-2">
                          <span className="font-mono">{currency.symbol}</span>
                          <span>{currency.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency-position">Position</Label>
                <Select
                  value={preferences.currency.position}
                  onValueChange={(value) => handleCurrencyChange('position', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="before">Before ($100)</SelectItem>
                    <SelectItem value="after">After (100$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency-decimals">Decimal Places</Label>
                <Select
                  value={preferences.currency.decimalPlaces.toString()}
                  onValueChange={(value) => handleCurrencyChange('decimalPlaces', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 ($100)</SelectItem>
                    <SelectItem value="2">2 ($100.00)</SelectItem>
                    <SelectItem value="4">4 ($100.0000)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <Label className="text-sm">Preview:</Label>
              <p className="font-mono text-lg">
                {preferences.currency.position === 'before' 
                  ? `${preferences.currency.symbol}123.${Array(preferences.currency.decimalPlaces).fill('4').join('')}`
                  : `123.${Array(preferences.currency.decimalPlaces).fill('4').join('')}${preferences.currency.symbol}`
                }
              </p>
            </div>
          </div>

          {/* Number Format */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Number Format</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="thousands-separator">Thousands Separator</Label>
                <Select
                  value={preferences.numberFormat.thousandsSeparator}
                  onValueChange={(value) => handleNumberFormatChange('thousandsSeparator', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=",">, (Comma)</SelectItem>
                    <SelectItem value=".">. (Period)</SelectItem>
                    <SelectItem value=" "> (Space)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="decimal-separator">Decimal Separator</Label>
                <Select
                  value={preferences.numberFormat.decimalSeparator}
                  onValueChange={(value) => handleNumberFormatChange('decimalSeparator', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=".">. (Period)</SelectItem>
                    <SelectItem value=",">, (Comma)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Date Format */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Date & Time Format</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date-format">Date Format</Label>
                <Select
                  value={preferences.dateFormat}
                  onValueChange={(value) => handleInputChange('dateFormat', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dateFormats.map((format) => (
                      <SelectItem key={format.format} value={format.format}>
                        <span className="flex items-center justify-between w-full">
                          <span>{format.format}</span>
                          <span className="text-muted-foreground ml-2">{format.example}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time-format">Time Format</Label>
                <Select
                  value={preferences.timeFormat}
                  onValueChange={(value) => handleInputChange('timeFormat', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12-hour (2:30 PM)</SelectItem>
                    <SelectItem value="24h">24-hour (14:30)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            Charts & Visualization
          </CardTitle>
          <CardDescription>
            Customize chart appearance and color schemes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label className="text-base font-medium">Color Scheme</Label>
            <RadioGroup 
              value={preferences.charts.colorScheme} 
              onValueChange={(value) => handleChartsChange('colorScheme', value)}
            >
              {colorSchemes.map((scheme) => (
                <div key={scheme.id} className="flex items-start space-x-2">
                  <RadioGroupItem value={scheme.id} id={`scheme-${scheme.id}`} className="mt-1" />
                  <div className="space-y-1 cursor-pointer" onClick={() => handleChartsChange('colorScheme', scheme.id)}>
                    <Label htmlFor={`scheme-${scheme.id}`} className="cursor-pointer">
                      {scheme.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {scheme.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={preferences.charts.primaryColor}
                  onChange={(e) => handleChartsChange('primaryColor', e.target.value)}
                  className="w-12 h-10 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={preferences.charts.primaryColor}
                  onChange={(e) => handleChartsChange('primaryColor', e.target.value)}
                  placeholder="#0ea5e9"
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="success-color">Success Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="success-color"
                  type="color"
                  value={preferences.charts.successColor}
                  onChange={(e) => handleChartsChange('successColor', e.target.value)}
                  className="w-12 h-10 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={preferences.charts.successColor}
                  onChange={(e) => handleChartsChange('successColor', e.target.value)}
                  placeholder="#10b981"
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="error-color">Error Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="error-color"
                  type="color"
                  value={preferences.charts.errorColor}
                  onChange={(e) => handleChartsChange('errorColor', e.target.value)}
                  className="w-12 h-10 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={preferences.charts.errorColor}
                  onChange={(e) => handleChartsChange('errorColor', e.target.value)}
                  placeholder="#ef4444"
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium">Chart Options</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label className="text-sm font-normal">Show Grid Lines</Label>
                  <p className="text-xs text-muted-foreground">
                    Display grid lines on charts for easier reading
                  </p>
                </div>
                <Switch
                  checked={preferences.charts.showGridLines}
                  onCheckedChange={(checked) => handleChartsChange('showGridLines', checked)}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label className="text-sm font-normal">Show Labels</Label>
                  <p className="text-xs text-muted-foreground">
                    Display value labels on chart data points
                  </p>
                </div>
                <Switch
                  checked={preferences.charts.showLabels}
                  onCheckedChange={(checked) => handleChartsChange('showLabels', checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Layout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Layout className="h-5 w-5" />
            Dashboard Layout
          </CardTitle>
          <CardDescription>
            Customize your dashboard layout and default view
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label className="text-base font-medium">Layout Density</Label>
            <RadioGroup 
              value={preferences.dashboard.layout} 
              onValueChange={(value) => handleDashboardChange('layout', value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="compact" id="layout-compact" />
                <Label htmlFor="layout-compact">Compact - More information in less space</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="comfortable" id="layout-comfortable" />
                <Label htmlFor="layout-comfortable">Comfortable - Balanced spacing</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="spacious" id="layout-spacious" />
                <Label htmlFor="layout-spacious">Spacious - More breathing room</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium">Default View</Label>
            <Select
              value={preferences.dashboard.defaultView}
              onValueChange={(value) => handleDashboardChange('defaultView', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview - General statistics</SelectItem>
                <SelectItem value="recent">Recent - Latest trades</SelectItem>
                <SelectItem value="performance">Performance - Detailed metrics</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label htmlFor="cards-per-row" className="text-base font-medium">
              Cards per Row: {preferences.dashboard.cardsPerRow}
            </Label>
            <Slider
              id="cards-per-row"
              min={1}
              max={5}
              step={1}
              value={[preferences.dashboard.cardsPerRow]}
              onValueChange={(value) => handleDashboardChange('cardsPerRow', value[0])}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>1 (Full width)</span>
              <span>5 (Very compact)</span>
            </div>
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label className="text-sm font-normal">Show Welcome Message</Label>
              <p className="text-xs text-muted-foreground">
                Display welcome message on dashboard
              </p>
            </div>
            <Switch
              checked={preferences.dashboard.showWelcomeMessage}
              onCheckedChange={(checked) => handleDashboardChange('showWelcomeMessage', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Table2 className="h-5 w-5" />
            Table Display
          </CardTitle>
          <CardDescription>
            Configure how data tables are displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rows-per-page">Rows per Page</Label>
              <Select
                value={preferences.tables.rowsPerPage.toString()}
                onValueChange={(value) => handleTablesChange('rowsPerPage', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 rows</SelectItem>
                  <SelectItem value="25">25 rows</SelectItem>
                  <SelectItem value="50">50 rows</SelectItem>
                  <SelectItem value="100">100 rows</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label className="text-sm font-normal">Show Row Numbers</Label>
                <p className="text-xs text-muted-foreground">
                  Display row numbers in tables
                </p>
              </div>
              <Switch
                checked={preferences.tables.showRowNumbers}
                onCheckedChange={(checked) => handleTablesChange('showRowNumbers', checked)}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label className="text-sm font-normal">Alternate Row Colors</Label>
                <p className="text-xs text-muted-foreground">
                  Use zebra striping for better readability
                </p>
              </div>
              <Switch
                checked={preferences.tables.alternateRowColors}
                onCheckedChange={(checked) => handleTablesChange('alternateRowColors', checked)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium">Visible Columns</Label>
            <p className="text-sm text-muted-foreground">
              Choose which columns are visible in trade tables by default
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableColumns.map((column) => {
                const isVisible = preferences.tables.visibleColumns.includes(column.id);
                return (
                  <Button
                    key={column.id}
                    variant={isVisible ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleColumnVisibility(column.id)}
                    className={cn(
                      "justify-start",
                      isVisible && "bg-primary text-primary-foreground"
                    )}
                  >
                    {isVisible ? (
                      <Eye className="h-3 w-3 mr-2" />
                    ) : (
                      <EyeOff className="h-3 w-3 mr-2" />
                    )}
                    {column.name}
                  </Button>
                );
              })}
            </div>
            
            <p className="text-xs text-muted-foreground">
              {preferences.tables.visibleColumns.length} of {availableColumns.length} columns selected
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}