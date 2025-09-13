import { useState } from 'react';
import { 
  Bookmark, 
  Plus, 
  Trash2, 
  Edit, 
  Star, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Clock,
  Target,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TradeFilters, FilterPreset } from '@/types';
import { DEFAULT_FILTER_PRESETS, getActiveFiltersCount } from '@/utils/filterHelpers';
import { cn } from '@/lib/utils';

interface FilterPresetsProps {
  currentFilters: TradeFilters;
  onApplyPreset: (filters: TradeFilters) => void;
  onSavePreset?: (preset: Omit<FilterPreset, 'id'>) => void;
  onDeletePreset?: (presetId: string) => void;
  customPresets?: FilterPreset[];
  className?: string;
}

const PRESET_ICONS = {
  'winning-trades': TrendingUp,
  'losing-trades': TrendingDown,
  'large-positions': DollarSign,
  'short-term': Clock,
  'this-month': BarChart3,
  'high-r-multiple': Target
};

export function FilterPresets({
  currentFilters,
  onApplyPreset,
  onSavePreset,
  onDeletePreset,
  customPresets = [],
  className
}: FilterPresetsProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');

  const allPresets = [...DEFAULT_FILTER_PRESETS, ...customPresets];
  const hasActiveFilters = getActiveFiltersCount(currentFilters) > 0;

  const handleApplyPreset = (preset: FilterPreset) => {
    onApplyPreset(preset.filters);
  };

  const handleSavePreset = () => {
    if (!presetName.trim() || !onSavePreset) return;

    onSavePreset({
      name: presetName.trim(),
      description: presetDescription.trim(),
      filters: currentFilters,
      isDefault: false
    });

    setPresetName('');
    setPresetDescription('');
    setShowSaveDialog(false);
  };

  const handleDeletePreset = (preset: FilterPreset) => {
    if (!preset.isDefault && onDeletePreset) {
      onDeletePreset(preset.id);
    }
  };

  const getPresetIcon = (preset: FilterPreset) => {
    const IconComponent = PRESET_ICONS[preset.id as keyof typeof PRESET_ICONS] || Bookmark;
    return IconComponent;
  };

  const getPresetBadgeText = (preset: FilterPreset): string => {
    const activeFilters = getActiveFiltersCount(preset.filters);
    return `${activeFilters} filter${activeFilters !== 1 ? 's' : ''}`;
  };

  const isPresetActive = (preset: FilterPreset): boolean => {
    return JSON.stringify(preset.filters) === JSON.stringify(currentFilters);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Filter Presets</Label>
        
        {hasActiveFilters && onSavePreset && (
          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <Plus className="h-3 w-3 mr-1" />
                Save Current
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Filter Preset</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="preset-name">Preset Name</Label>
                  <Input
                    id="preset-name"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="e.g., My Winning Strategy"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preset-description">Description (optional)</Label>
                  <Textarea
                    id="preset-description"
                    value={presetDescription}
                    onChange={(e) => setPresetDescription(e.target.value)}
                    placeholder="Describe what this preset filters for..."
                    className="resize-none"
                    rows={3}
                  />
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Current Filters:</p>
                  <p className="text-xs text-muted-foreground">
                    {getActiveFiltersCount(currentFilters)} active filters will be saved
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSavePreset} disabled={!presetName.trim()}>
                  Save Preset
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Default Presets */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Default Presets</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DEFAULT_FILTER_PRESETS.map((preset) => {
            const Icon = getPresetIcon(preset);
            const isActive = isPresetActive(preset);
            
            return (
              <Card 
                key={preset.id} 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-sm",
                  isActive && "ring-2 ring-primary/50 bg-primary/5"
                )}
                onClick={() => handleApplyPreset(preset)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <Icon className={cn(
                      "h-4 w-4 mt-0.5 flex-shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium truncate">{preset.name}</h4>
                        {isActive && <Star className="h-3 w-3 text-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {preset.description}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {getPresetBadgeText(preset)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Custom Presets */}
      {customPresets.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Custom Presets</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {customPresets.map((preset) => {
              const isActive = isPresetActive(preset);
              
              return (
                <Card 
                  key={preset.id} 
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-sm group",
                    isActive && "ring-2 ring-primary/50 bg-primary/5"
                  )}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <Bookmark className={cn(
                        "h-4 w-4 mt-0.5 flex-shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )} />
                      <div className="flex-1 min-w-0" onClick={() => handleApplyPreset(preset)}>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium truncate">{preset.name}</h4>
                          {isActive && <Star className="h-3 w-3 text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {preset.description || 'Custom filter preset'}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {getPresetBadgeText(preset)}
                        </Badge>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleApplyPreset(preset)}>
                            <Bookmark className="h-4 w-4 mr-2" />
                            Apply Preset
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeletePreset(preset)}
                            className="text-destructive"
                            disabled={preset.isDefault}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Apply Buttons */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Quick Apply</div>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_FILTER_PRESETS.slice(0, 4).map((preset) => (
            <Button
              key={preset.id}
              variant={isPresetActive(preset) ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => handleApplyPreset(preset)}
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FilterPresets;