import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Filter, 
  Search, 
  Calendar, 
  Bookmark,
  RefreshCw,
  Code,
  Eye
} from 'lucide-react';
import { TradeTableWithFilters } from '@/components/trades';
import { 
  AdvancedFilters,
  SearchFilter,
  DateRangeFilter,
  FilterPresets,
  FilterButton
} from '@/components/filters';
import { useTradeStore } from '@/store/tradeStore';
import { cn } from '@/lib/utils';

export function AdvancedFiltersDemo() {
  const [demoMode, setDemoMode] = useState<'overview' | 'live'>('overview');
  
  const {
    trades,
    filters,
    customPresets,
    setFilters,
    clearFilters,
    savePreset,
    deletePreset
  } = useTradeStore();

  const features = [
    {
      icon: Search,
      title: 'Smart Search',
      description: 'Search across all trade fields with autocomplete suggestions',
      highlights: ['Fuzzy matching', 'Field-specific search', 'Real-time suggestions']
    },
    {
      icon: Calendar,
      title: 'Advanced Date Filtering',
      description: 'Flexible date range selection with smart presets',
      highlights: ['Quick presets', 'Custom ranges', 'Relative dates']
    },
    {
      icon: Filter,
      title: 'Multi-Criteria Filtering',
      description: 'Filter by P&L, R-Multiple, position size, efficiency, and more',
      highlights: ['Range filters', 'Multiple selection', 'Real-time validation']
    },
    {
      icon: Bookmark,
      title: 'Custom Presets',
      description: 'Save and manage your favorite filter combinations',
      highlights: ['Default presets', 'Custom presets', 'Quick apply']
    }
  ];

  const codeExamples = {
    basicUsage: `// Basic usage with TradeTableWithFilters
import { TradeTableWithFilters } from '@/components/trades';

<TradeTableWithFilters
  onView={handleView}
  onEdit={handleEdit}
  onDelete={handleDelete}
  showFilters={true}
  showPresets={true}
/>`,

    advancedFiltering: `// Advanced filtering with custom logic
import { AdvancedFilters, applyFilters } from '@/components/filters';
import { useTradeStore } from '@/store/tradeStore';

const { trades, filters, setFilters } = useTradeStore();

const filteredTrades = trades.filter(trade => 
  applyFilters(trade, filters)
);

<AdvancedFilters
  filters={filters}
  trades={trades}
  onFiltersChange={setFilters}
  showPresets={true}
/>`,

    searchImplementation: `// Search with autocomplete
import { SearchFilter, getSearchSuggestions } from '@/components/filters';

<SearchFilter
  searchTerm={searchTerm}
  searchFields={[SearchField.ALL]}
  trades={trades}
  onSearchChange={setSearchTerm}
  onSearchFieldsChange={setSearchFields}
/>`,

    customPresets: `// Custom filter presets
import { FilterPresets, DEFAULT_FILTER_PRESETS } from '@/components/filters';

const customPresets = [
  {
    id: 'profitable-swing',
    name: 'Profitable Swing Trades',
    description: 'Winning swing trades with good R-Multiple',
    filters: {
      result: TradeResult.WIN,
      strategy: Strategy.SWING,
      rMultipleMin: 1.5,
      holdingPeriodMin: 1440 // > 1 day
    }
  }
];

<FilterPresets
  currentFilters={filters}
  customPresets={customPresets}
  onApplyPreset={setFilters}
  onSavePreset={savePreset}
/>`
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Advanced Trading Filters Demo</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Explore powerful filtering and search capabilities for your trading data. 
          Filter by P&L, date ranges, strategies, efficiency metrics, and more.
        </p>
        
        <div className="flex items-center justify-center gap-2">
          <Button
            variant={demoMode === 'overview' ? 'default' : 'outline'}
            onClick={() => setDemoMode('overview')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Overview
          </Button>
          <Button
            variant={demoMode === 'live' ? 'default' : 'outline'}
            onClick={() => setDemoMode('live')}
          >
            <Filter className="h-4 w-4 mr-2" />
            Live Demo
          </Button>
        </div>
      </div>

      {demoMode === 'overview' && (
        <Tabs defaultValue="features" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="examples">Code Examples</TabsTrigger>
            <TabsTrigger value="api">API Reference</TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card key={feature.title}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-primary" />
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        {feature.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {feature.highlights.map((highlight) => (
                          <Badge key={highlight} variant="secondary">
                            {highlight}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="examples" className="space-y-6">
            <div className="grid gap-6">
              {Object.entries(codeExamples).map(([key, code]) => (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{code}</code>
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Filter Types & Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Basic Filters</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Symbol search</li>
                      <li>• Direction (LONG/SHORT)</li>
                      <li>• Result (WIN/LOSS/BREAKEVEN)</li>
                      <li>• Strategy selection</li>
                      <li>• Order type</li>
                      <li>• Timeframe</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Advanced Filters</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• P&L range filters</li>
                      <li>• R-Multiple range</li>
                      <li>• Position size range</li>
                      <li>• Efficiency percentage</li>
                      <li>• Holding period (minutes)</li>
                      <li>• Multiple selection filters</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Search Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Search Fields</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• All fields</li>
                      <li>• Symbol</li>
                      <li>• Notes</li>
                      <li>• Strategy</li>
                      <li>• Custom strategy</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Search Features</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Case insensitive</li>
                      <li>• Fuzzy matching</li>
                      <li>• Real-time suggestions</li>
                      <li>• Highlighting matches</li>
                      <li>• Debounced input</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Performance</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Memoized results</li>
                      <li>• Virtual scrolling ready</li>
                      <li>• Efficient re-renders</li>
                      <li>• Background processing</li>
                      <li>• Cached suggestions</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {demoMode === 'live' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Live Demo - Try the Filters!</CardTitle>
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset Filters
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <TradeTableWithFilters
                showFilters={true}
                showPresets={true}
                defaultFiltersOpen={true}
                showExport={true}
                exportTitle="Demo Export"
              />
            </CardContent>
          </Card>
        </div>
      )}

      <Separator />

      <div className="text-center text-sm text-muted-foreground">
        <p>
          This advanced filtering system provides comprehensive search and filter capabilities 
          for trading data analysis. All components are fully responsive and accessible.
        </p>
      </div>
    </div>
  );
}

export default AdvancedFiltersDemo;