import { Filter, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TradeFilters } from '@/types';
import { getActiveFiltersCount } from '@/utils/filterHelpers';
import { cn } from '@/lib/utils';

interface FilterButtonProps {
  filters: TradeFilters;
  isOpen: boolean;
  onToggle: () => void;
  onClearFilters: () => void;
  className?: string;
  showClearButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export function FilterButton({
  filters,
  isOpen,
  onToggle,
  onClearFilters,
  className,
  showClearButton = true,
  size = 'md',
  variant = 'outline'
}: FilterButtonProps) {
  const activeFiltersCount = getActiveFiltersCount(filters);
  const hasActiveFilters = activeFiltersCount > 0;

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 px-2 text-xs';
      case 'lg':
        return 'h-12 px-4 text-base';
      default:
        return 'h-10 px-3 text-sm';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'h-3 w-3';
      case 'lg':
        return 'h-5 w-5';
      default:
        return 'h-4 w-4';
    }
  };

  const getBadgeSize = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4 text-xs';
      case 'lg':
        return 'h-6 w-6 text-sm';
      default:
        return 'h-5 w-5 text-xs';
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Main Filter Toggle Button */}
      <Button
        variant={hasActiveFilters ? 'default' : variant}
        className={cn(
          getSizeClasses(),
          "relative",
          isOpen && "bg-accent text-accent-foreground",
          hasActiveFilters && variant === 'outline' && "border-primary/50 bg-primary/5"
        )}
        onClick={onToggle}
      >
        <Filter className={cn(getIconSize(), "mr-2")} />
        
        <span className="hidden sm:inline">
          {hasActiveFilters ? 'Filters' : 'Filter'}
        </span>
        
        {/* Active Filter Count Badge */}
        {hasActiveFilters && (
          <Badge 
            variant={variant === 'default' ? 'secondary' : 'default'}
            className={cn(
              getBadgeSize(),
              "ml-2 min-w-0 px-1 rounded-full flex items-center justify-center font-medium"
            )}
          >
            {activeFiltersCount}
          </Badge>
        )}
        
        {/* Dropdown Indicator */}
        <ChevronDown 
          className={cn(
            getIconSize(),
            "ml-1 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </Button>

      {/* Clear Filters Button */}
      {showClearButton && hasActiveFilters && (
        <Button
          variant="ghost"
          size={size}
          className={cn(
            getSizeClasses(),
            "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onClearFilters();
          }}
          title="Clear all filters"
        >
          <X className={getIconSize()} />
          <span className="hidden sm:inline ml-1">Clear</span>
        </Button>
      )}
    </div>
  );
}

interface CompactFilterButtonProps {
  filters: TradeFilters;
  isOpen: boolean;
  onToggle: () => void;
  onClearFilters: () => void;
  className?: string;
}

export function CompactFilterButton({
  filters,
  isOpen,
  onToggle,
  onClearFilters,
  className
}: CompactFilterButtonProps) {
  const activeFiltersCount = getActiveFiltersCount(filters);
  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant={hasActiveFilters ? 'default' : 'outline'}
        size="sm"
        className={cn(
          "h-8 px-2 relative",
          isOpen && "bg-accent text-accent-foreground"
        )}
        onClick={onToggle}
      >
        <Filter className="h-3 w-3" />
        {hasActiveFilters && (
          <Badge 
            variant="secondary"
            className="h-4 w-4 p-0 ml-1 text-xs rounded-full flex items-center justify-center"
          >
            {activeFiltersCount}
          </Badge>
        )}
      </Button>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={onClearFilters}
          title="Clear filters"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

interface FilterStatusProps {
  filters: TradeFilters;
  onClearFilters: () => void;
  className?: string;
}

export function FilterStatus({
  filters,
  onClearFilters,
  className
}: FilterStatusProps) {
  const activeFiltersCount = getActiveFiltersCount(filters);
  const hasActiveFilters = activeFiltersCount > 0;

  if (!hasActiveFilters) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>
          {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
        </span>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
        onClick={onClearFilters}
      >
        <X className="h-3 w-3 mr-1" />
        Clear all
      </Button>
    </div>
  );
}

export default FilterButton;