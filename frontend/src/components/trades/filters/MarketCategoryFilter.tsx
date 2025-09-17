import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  TrendingUp,
  DollarSign,
  Bitcoin,
  Building2,
  Fuel,
  ChevronDown,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export enum MarketCategory {
  FOREX = 'forex',
  CRYPTO = 'crypto',
  STOCKS = 'stocks',
  INDICES = 'indices',
  COMMODITIES = 'commodities'
}

interface MarketCategoryConfig {
  id: MarketCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  patterns: RegExp[];
  color: string;
  bgColor: string;
}

const MARKET_CATEGORIES: MarketCategoryConfig[] = [
  {
    id: MarketCategory.FOREX,
    label: 'Forex',
    icon: DollarSign,
    patterns: [
      /^[A-Z]{3}\/[A-Z]{3}$/,  // EUR/USD, GBP/JPY
      /^[A-Z]{6}$/,            // EURUSD, GBPJPY
    ],
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200'
  },
  {
    id: MarketCategory.CRYPTO,
    label: 'Crypto',
    icon: Bitcoin,
    patterns: [
      /^BTC/i, /^ETH/i, /^ADA/i, /^SOL/i, /^DOGE/i, /^XRP/i,
      /^DOT/i, /^LINK/i, /^LTC/i, /^BCH/i, /^UNI/i, /^AVAX/i,
      /crypto/i, /coin/i
    ],
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200'
  },
  {
    id: MarketCategory.STOCKS,
    label: 'Stocks',
    icon: TrendingUp,
    patterns: [
      /^AAPL$/i, /^TSLA$/i, /^GOOGL?$/i, /^MSFT$/i, /^AMZN$/i,
      /^META$/i, /^NVDA$/i, /^NFLX$/i, /^AMD$/i, /^INTC$/i,
      /^[A-Z]{1,5}$/,  // Most stock symbols are 1-5 letters
    ],
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200'
  },
  {
    id: MarketCategory.INDICES,
    label: 'Indices',
    icon: Building2,
    patterns: [
      /^SPX$/i, /^NQ$/i, /^ES$/i, /^YM$/i, /^RTY$/i,
      /^SPY$/i, /^QQQ$/i, /^IWM$/i, /^DIA$/i,
      /^US\d+$/i, /^NAS100$/i, /^DJ30$/i, /^SP500$/i,
      /index/i, /^VIX$/i
    ],
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200'
  },
  {
    id: MarketCategory.COMMODITIES,
    label: 'Commodities',
    icon: Fuel,
    patterns: [
      /^GC$/i, /^SI$/i, /^CL$/i, /^NG$/i, /^HG$/i,
      /^XAUUSD$/i, /^XAGUSD$/i, /^USOIL$/i, /^UKOIL$/i,
      /gold/i, /silver/i, /oil/i, /gas/i, /copper/i,
      /^WTI$/i, /^BRENT$/i
    ],
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200'
  }
];

interface MarketCategoryFilterProps {
  selectedCategories: MarketCategory[];
  onCategoriesChange: (categories: MarketCategory[]) => void;
  symbols: string[]; // All available symbols to categorize
  className?: string;
}

function MarketCategoryFilter({
  selectedCategories,
  onCategoriesChange,
  symbols,
  className
}: MarketCategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Categorize symbols and count them
  const categorizedSymbols = useMemo(() => {
    const categorized: Record<MarketCategory, string[]> = {
      [MarketCategory.FOREX]: [],
      [MarketCategory.CRYPTO]: [],
      [MarketCategory.STOCKS]: [],
      [MarketCategory.INDICES]: [],
      [MarketCategory.COMMODITIES]: []
    };

    symbols.forEach(symbol => {
      let categorized_symbol = false;

      for (const category of MARKET_CATEGORIES) {
        for (const pattern of category.patterns) {
          if (pattern.test(symbol)) {
            categorized[category.id].push(symbol);
            categorized_symbol = true;
            break;
          }
        }
        if (categorized_symbol) break;
      }
    });

    return categorized;
  }, [symbols]);

  const handleCategoryToggle = (category: MarketCategory, checked: boolean) => {
    if (checked) {
      onCategoriesChange([...selectedCategories, category]);
    } else {
      onCategoriesChange(selectedCategories.filter(c => c !== category));
    }
  };

  const handleSelectAll = () => {
    onCategoriesChange(MARKET_CATEGORIES.map(c => c.id));
  };

  const handleClearAll = () => {
    onCategoriesChange([]);
  };

  const getDisplayText = () => {
    if (selectedCategories.length === 0) {
      return 'All Markets';
    }

    if (selectedCategories.length === 1) {
      const category = MARKET_CATEGORIES.find(c => c.id === selectedCategories[0]);
      return category?.label || 'Market';
    }

    if (selectedCategories.length === MARKET_CATEGORIES.length) {
      return 'All Markets';
    }

    return `${selectedCategories.length} Markets`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-between h-9 min-w-[140px]",
            selectedCategories.length > 0 && selectedCategories.length < MARKET_CATEGORIES.length && "border-primary/30 bg-primary/5",
            className
          )}
        >
          <span className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {getDisplayText()}
          </span>
          <div className="flex items-center gap-1">
            {selectedCategories.length > 0 && selectedCategories.length < MARKET_CATEGORIES.length && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                {selectedCategories.length}
              </Badge>
            )}
            <ChevronDown className="h-3 w-3" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 shadow-lg border-border/50"
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          {/* Header */}
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Market Categories</h4>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-7 text-xs"
                >
                  All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-7 text-xs"
                >
                  None
                </Button>
              </div>
            </div>
          </div>

          {/* Categories List */}
          <div className="p-2 space-y-1">
            {MARKET_CATEGORIES.map((category) => {
              const symbolCount = categorizedSymbols[category.id].length;
              const isSelected = selectedCategories.includes(category.id);
              const Icon = category.icon;

              return (
                <motion.div
                  key={category.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all",
                    "hover:bg-accent/50",
                    isSelected && "bg-accent/20 border border-border/50"
                  )}
                  onClick={() => handleCategoryToggle(category.id, !isSelected)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) =>
                      handleCategoryToggle(category.id, checked as boolean)
                    }
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />

                  <div className={cn(
                    "p-2 rounded-md",
                    isSelected ? category.bgColor : "bg-muted/50"
                  )}>
                    <Icon className={cn(
                      "h-4 w-4",
                      isSelected ? category.color : "text-muted-foreground"
                    )} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {category.label}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          symbolCount > 0 && isSelected && "border-primary/30 bg-primary/10"
                        )}
                      >
                        {symbolCount}
                      </Badge>
                    </div>
                    {symbolCount > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {categorizedSymbols[category.id]
                          .slice(0, 3)
                          .join(', ')}
                        {symbolCount > 3 && ` +${symbolCount - 3} more`}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer */}
          {selectedCategories.length > 0 && (
            <div className="p-3 border-t border-border/30 bg-muted/30">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {selectedCategories.length} of {MARKET_CATEGORIES.length} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-6 px-2 text-xs text-destructive hover:bg-destructive/10"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </PopoverContent>
    </Popover>
  );
}

export default MarketCategoryFilter;
export type { MarketCategoryConfig };