import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Star,
  Plus,
  X,
  Search,
  TrendingUp,
  Bitcoin,
  Banknote,
  BarChart3,
  Zap,
  GripVertical,
  Download,
  Upload,
  Filter,
} from 'lucide-react';

import useSettingsStore from '@/store/settingsStore';
import { POPULAR_SYMBOLS } from '@/types/settings';
import { cn } from '@/lib/utils';

type SymbolCategory = keyof typeof POPULAR_SYMBOLS;

interface GroupedSymbol {
  symbol: string;
  category: SymbolCategory;
  isInFavorites: boolean;
}

export function FavoriteSymbols() {
  const { 
    preferences, 
    addFavoriteSymbol, 
    removeFavoriteSymbol, 
    reorderFavoriteSymbols 
  } = useSettingsStore();
  
  const [newSymbol, setNewSymbol] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SymbolCategory | 'all'>('all');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const favoriteSymbols = preferences.trading.favoriteSymbols;

  const handleAddSymbol = () => {
    const symbol = newSymbol.trim().toUpperCase();
    if (symbol && !favoriteSymbols.includes(symbol)) {
      addFavoriteSymbol(symbol);
      setNewSymbol('');
    }
  };

  const handleRemoveSymbol = (symbol: string) => {
    removeFavoriteSymbol(symbol);
  };

  const handleQuickAdd = (symbol: string) => {
    if (!favoriteSymbols.includes(symbol)) {
      addFavoriteSymbol(symbol);
    }
  };

  const exportSymbols = () => {
    const dataStr = JSON.stringify(favoriteSymbols, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `favorite-symbols-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importSymbols = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSymbols = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedSymbols)) {
          importedSymbols.forEach((symbol) => {
            if (typeof symbol === 'string' && !favoriteSymbols.includes(symbol)) {
              addFavoriteSymbol(symbol);
            }
          });
        }
      } catch (error) {
        alert('Invalid file format. Please select a valid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Group all popular symbols with their categories
  const allSymbols: GroupedSymbol[] = Object.entries(POPULAR_SYMBOLS).flatMap(
    ([category, symbols]) =>
      symbols.map((symbol) => ({
        symbol,
        category: category as SymbolCategory,
        isInFavorites: favoriteSymbols.includes(symbol),
      }))
  );

  // Filter symbols based on search and category
  const filteredSymbols = allSymbols.filter((item) => {
    const matchesSearch = item.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory && !item.isInFavorites;
  });

  const getCategoryIcon = (category: SymbolCategory) => {
    const icons = {
      forex: Banknote,
      crypto: Bitcoin,
      stocks: TrendingUp,
      indices: BarChart3,
      commodities: Zap,
    };
    return icons[category];
  };

  const getCategoryColor = (category: SymbolCategory) => {
    const colors = {
      forex: 'text-blue-600',
      crypto: 'text-orange-600',
      stocks: 'text-green-600',
      indices: 'text-purple-600',
      commodities: 'text-yellow-600',
    };
    return colors[category];
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      reorderFavoriteSymbols(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Favorite Symbols</h3>
          <p className="text-sm text-muted-foreground">
            Manage your favorite trading symbols for quick access in the trade form
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".json"
            onChange={importSymbols}
            className="hidden"
            id="import-symbols"
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('import-symbols')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportSymbols}
            disabled={favoriteSymbols.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Current Favorites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Your Favorites ({favoriteSymbols.length})
          </CardTitle>
          <CardDescription>
            Drag and drop to reorder. Click the × to remove.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {favoriteSymbols.length === 0 ? (
            <div className="text-center py-8">
              <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No favorite symbols yet</h3>
              <p className="text-muted-foreground mb-4">
                Add symbols you trade frequently for quick access
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {favoriteSymbols.map((symbol, index) => (
                <div
                  key={symbol}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className={cn(
                    'group relative flex items-center gap-2 p-2 bg-muted rounded-lg cursor-move transition-all',
                    draggedIndex === index && 'opacity-50 scale-95'
                  )}
                >
                  <GripVertical className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                  <span className="flex-1 text-sm font-medium">{symbol}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-100"
                    onClick={() => handleRemoveSymbol(symbol)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add New Symbol */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Symbol
          </CardTitle>
          <CardDescription>
            Add custom symbols or select from popular instruments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Manual Add */}
          <div className="flex gap-2">
            <Input
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              placeholder="Enter symbol (e.g., EURUSD, AAPL)"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddSymbol();
                }
              }}
            />
            <Button onClick={handleAddSymbol} disabled={!newSymbol.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <Separator />

          {/* Browse Popular Symbols */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search symbols..."
                  className="w-48"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as any)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="forex">Forex</SelectItem>
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="stocks">Stocks</SelectItem>
                    <SelectItem value="indices">Indices</SelectItem>
                    <SelectItem value="commodities">Commodities</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="all" className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  <span className="hidden sm:inline">All</span>
                </TabsTrigger>
                <TabsTrigger value="forex" className="flex items-center gap-1">
                  <Banknote className="h-3 w-3" />
                  <span className="hidden sm:inline">Forex</span>
                </TabsTrigger>
                <TabsTrigger value="crypto" className="flex items-center gap-1">
                  <Bitcoin className="h-3 w-3" />
                  <span className="hidden sm:inline">Crypto</span>
                </TabsTrigger>
                <TabsTrigger value="stocks" className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span className="hidden sm:inline">Stocks</span>
                </TabsTrigger>
                <TabsTrigger value="indices" className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  <span className="hidden sm:inline">Indices</span>
                </TabsTrigger>
                <TabsTrigger value="commodities" className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  <span className="hidden sm:inline">Commodities</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <div className="space-y-4">
                  {Object.entries(POPULAR_SYMBOLS).map(([category, symbols]) => {
                    const Icon = getCategoryIcon(category as SymbolCategory);
                    const availableSymbols = symbols.filter(symbol => !favoriteSymbols.includes(symbol));
                    
                    if (availableSymbols.length === 0) return null;

                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Icon className={cn('h-4 w-4', getCategoryColor(category as SymbolCategory))} />
                          <h4 className="font-medium capitalize">{category}</h4>
                          <Badge variant="outline" className="text-xs">
                            {availableSymbols.length} available
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {availableSymbols
                            .filter(symbol => symbol.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map((symbol) => (
                              <Button
                                key={symbol}
                                variant="outline"
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => handleQuickAdd(symbol)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                {symbol}
                              </Button>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {Object.keys(POPULAR_SYMBOLS).map((category) => (
                <TabsContent key={category} value={category} className="mt-4">
                  <div className="flex flex-wrap gap-1">
                    {POPULAR_SYMBOLS[category as SymbolCategory]
                      .filter(symbol => 
                        !favoriteSymbols.includes(symbol) &&
                        symbol.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((symbol) => (
                        <Button
                          key={symbol}
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => handleQuickAdd(symbol)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {symbol}
                        </Button>
                      ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4" />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium">Total Favorites</div>
              <div className="text-muted-foreground">{favoriteSymbols.length}</div>
            </div>
            <div>
              <div className="font-medium">Forex Pairs</div>
              <div className="text-muted-foreground">
                {favoriteSymbols.filter(symbol => 
                  POPULAR_SYMBOLS.forex.includes(symbol)
                ).length}
              </div>
            </div>
            <div>
              <div className="font-medium">Crypto</div>
              <div className="text-muted-foreground">
                {favoriteSymbols.filter(symbol => 
                  POPULAR_SYMBOLS.crypto.includes(symbol)
                ).length}
              </div>
            </div>
            <div>
              <div className="font-medium">Stocks</div>
              <div className="text-muted-foreground">
                {favoriteSymbols.filter(symbol => 
                  POPULAR_SYMBOLS.stocks.includes(symbol)
                ).length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}