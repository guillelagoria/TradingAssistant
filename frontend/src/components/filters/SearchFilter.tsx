import { useState, useEffect, useRef } from 'react';
import { Search, X, Hash, FileText, Target, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trade, SearchField } from '@/types';
import { 
  getSearchSuggestions, 
  getFieldValues,
  createDebouncedSearch,
  formatSearchResultCount
} from '@/utils/searchHelpers';
import { cn } from '@/lib/utils';

interface SearchFilterProps {
  searchTerm?: string;
  searchFields?: SearchField[];
  trades: Trade[];
  resultCount?: number;
  onSearchChange: (term: string) => void;
  onSearchFieldsChange: (fields: SearchField[]) => void;
  className?: string;
  placeholder?: string;
}

const SEARCH_FIELD_OPTIONS = [
  { value: SearchField.ALL, label: 'All Fields', icon: Search },
  { value: SearchField.SYMBOL, label: 'Symbol', icon: Hash },
  { value: SearchField.NOTES, label: 'Notes', icon: FileText },
  { value: SearchField.STRATEGY, label: 'Strategy', icon: Target },
  { value: SearchField.CUSTOM_STRATEGY, label: 'Custom Strategy', icon: Settings }
];

export function SearchFilter({
  searchTerm = '',
  searchFields = [SearchField.ALL],
  trades,
  resultCount,
  onSearchChange,
  onSearchFieldsChange,
  className,
  placeholder = 'Search trades...'
}: SearchFilterProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Create debounced search function
  const debouncedSearch = useRef(
    createDebouncedSearch((term: string) => {
      onSearchChange(term);
      if (term.trim()) {
        const searchSuggestions = getSearchSuggestions(trades, term);
        setSuggestions(searchSuggestions);
      } else {
        setSuggestions([]);
      }
    }, 300)
  );

  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    debouncedSearch.current(localSearchTerm);
  }, [localSearchTerm]);

  const handleInputChange = (value: string) => {
    setLocalSearchTerm(value);
    setShowSuggestions(true);
    setSelectedSuggestionIndex(-1);
  };

  const handleClearSearch = () => {
    setLocalSearchTerm('');
    onSearchChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: any) => {
    setLocalSearchTerm(suggestion.text);
    onSearchChange(suggestion.text);
    setShowSuggestions(false);
    
    // Optionally adjust search fields based on suggestion
    if (suggestion.field !== SearchField.ALL) {
      onSearchFieldsChange([suggestion.field]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          const suggestion = suggestions[selectedSuggestionIndex];
          handleSuggestionClick(suggestion);
        } else {
          setShowSuggestions(false);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const getFieldIcon = (field: SearchField) => {
    const option = SEARCH_FIELD_OPTIONS.find(opt => opt.value === field);
    return option?.icon || Search;
  };

  const getFieldLabel = (field: SearchField) => {
    const option = SEARCH_FIELD_OPTIONS.find(opt => opt.value === field);
    return option?.label || field;
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Search</Label>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={localSearchTerm}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (localSearchTerm.trim() && suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => {
              // Delay hiding to allow clicking on suggestions
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            placeholder={placeholder}
            className={cn(
              "pl-10 pr-10",
              searchTerm && "ring-2 ring-primary/20"
            )}
          />
          {localSearchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              onClick={handleClearSearch}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          
          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div 
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto"
            >
              <Command>
                <CommandList>
                  <CommandGroup heading="Suggestions">
                    {suggestions.map((suggestion, index) => {
                      const Icon = getFieldIcon(suggestion.field);
                      return (
                        <CommandItem
                          key={`${suggestion.field}-${suggestion.text}`}
                          className={cn(
                            "flex items-center gap-2 cursor-pointer",
                            index === selectedSuggestionIndex && "bg-accent"
                          )}
                          onSelect={() => handleSuggestionClick(suggestion)}
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="flex-1">{suggestion.text}</span>
                          <Badge variant="outline" className="text-xs">
                            {suggestion.count}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {getFieldLabel(suggestion.field)}
                          </Badge>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
                {suggestions.length === 0 && (
                  <CommandEmpty>No suggestions found</CommandEmpty>
                )}
              </Command>
            </div>
          )}
        </div>
      </div>

      {/* Search Field Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Search In</Label>
        <Select
          value={searchFields[0] || SearchField.ALL}
          onValueChange={(value) => onSearchFieldsChange([value as SearchField])}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SEARCH_FIELD_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Active Search Fields Display */}
      {searchFields.length > 1 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Active Fields</Label>
          <div className="flex flex-wrap gap-1">
            {searchFields.map((field) => (
              <Badge key={field} variant="outline" className="text-xs">
                {getFieldLabel(field)}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  onClick={() => {
                    const newFields = searchFields.filter(f => f !== field);
                    onSearchFieldsChange(newFields.length > 0 ? newFields : [SearchField.ALL]);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Search Results Count */}
      {searchTerm && resultCount !== undefined && (
        <div className="text-xs text-muted-foreground">
          {formatSearchResultCount(resultCount, searchTerm)}
        </div>
      )}

      {/* Quick Search Buttons */}
      {!searchTerm && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quick Search</Label>
          <div className="flex flex-wrap gap-2">
            {getFieldValues(trades, SearchField.SYMBOL).slice(0, 4).map((symbol) => (
              <Button
                key={symbol}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  setLocalSearchTerm(symbol);
                  onSearchChange(symbol);
                  onSearchFieldsChange([SearchField.SYMBOL]);
                }}
              >
                <Hash className="h-3 w-3 mr-1" />
                {symbol}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchFilter;