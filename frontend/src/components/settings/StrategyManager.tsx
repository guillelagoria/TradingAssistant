import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  MoreHorizontal,
  Eye,
  EyeOff,
  Star,
  BarChart3,
  Calendar,
  Tag,
  GripVertical,
  Copy,
  Download,
  Upload,
} from 'lucide-react';

import useSettingsStore from '@/store/settingsStore';
import { type Strategy, DEFAULT_STRATEGY, TIMEFRAMES } from '@/types/settings';
import { validateStrategy } from '@/utils/settingsHelpers';
import { cn } from '@/lib/utils';

interface StrategyFormData {
  name: string;
  description: string;
  rules: string;
  category: string;
  timeframe: string;
  tags: string[];
  isActive: boolean;
}

const defaultFormData: StrategyFormData = {
  name: '',
  description: '',
  rules: '',
  category: 'Custom',
  timeframe: '1h',
  tags: [],
  isActive: true,
};

const strategyCategories = [
  'Trend Following',
  'Swing Trading',
  'Day Trading',
  'Scalping',
  'Breakout',
  'Reversal',
  'Momentum',
  'Mean Reversion',
  'Arbitrage',
  'Custom',
];

const commonTags = [
  'High Frequency',
  'Low Risk',
  'High Risk',
  'Beginner',
  'Advanced',
  'Technical',
  'Fundamental',
  'News Trading',
  'Support/Resistance',
  'Pattern Trading',
];

export function StrategyManager() {
  const { strategies, addStrategy, updateStrategy, deleteStrategy, toggleStrategyActive, reorderStrategies } = useSettingsStore();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [formData, setFormData] = useState<StrategyFormData>(defaultFormData);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');

  const handleCreateStrategy = () => {
    setEditingStrategy(null);
    setFormData(defaultFormData);
    setValidationErrors({});
    setIsDialogOpen(true);
  };

  const handleEditStrategy = (strategy: Strategy) => {
    setEditingStrategy(strategy);
    setFormData({
      name: strategy.name,
      description: strategy.description || '',
      rules: strategy.rules || '',
      category: strategy.category || 'Custom',
      timeframe: strategy.timeframe || '1h',
      tags: strategy.tags || [],
      isActive: strategy.isActive,
    });
    setValidationErrors({});
    setIsDialogOpen(true);
  };

  const handleFormSubmit = () => {
    const errors = validateStrategy({
      name: formData.name,
      description: formData.description,
      rules: formData.rules,
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (editingStrategy) {
      updateStrategy(editingStrategy.id, formData);
    } else {
      addStrategy(formData);
    }

    setIsDialogOpen(false);
    setFormData(defaultFormData);
    setValidationErrors({});
  };

  const handleDeleteStrategy = (id: string) => {
    if (confirm('Are you sure you want to delete this strategy? This action cannot be undone.')) {
      deleteStrategy(id);
    }
  };

  const handleDuplicateStrategy = (strategy: Strategy) => {
    const duplicatedStrategy = {
      ...strategy,
      name: `${strategy.name} (Copy)`,
      id: undefined as any,
      createdAt: undefined as any,
    };
    delete duplicatedStrategy.id;
    delete duplicatedStrategy.createdAt;
    
    addStrategy(duplicatedStrategy);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const handleQuickAddTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag],
      });
    }
  };

  const exportStrategies = () => {
    const dataStr = JSON.stringify(strategies, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trading-strategies-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importStrategies = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedStrategies = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedStrategies)) {
          importedStrategies.forEach((strategy) => {
            // Remove ID to create new strategies
            const { id, createdAt, ...strategyData } = strategy;
            addStrategy(strategyData);
          });
        }
      } catch (error) {
        alert('Invalid file format. Please select a valid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const getStrategyStats = (strategy: Strategy) => {
    // In a real app, these would come from actual trade data
    return {
      totalTrades: strategy.totalTrades || 0,
      winRate: strategy.winRate || 0,
      avgReturn: strategy.avgReturn || 0,
      maxDrawdown: strategy.maxDrawdown || 0,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Strategy Manager</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage your trading strategies for better organization and analysis
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".json"
            onChange={importStrategies}
            className="hidden"
            id="import-strategies"
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('import-strategies')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportStrategies}
            disabled={strategies.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button onClick={handleCreateStrategy}>
            <Plus className="h-4 w-4 mr-2" />
            New Strategy
          </Button>
        </div>
      </div>

      {/* Strategies Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Your Strategies ({strategies.length})
          </CardTitle>
          <CardDescription>
            Manage your trading strategies and track their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {strategies.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No strategies yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first trading strategy to get started
              </p>
              <Button onClick={handleCreateStrategy}>
                <Plus className="h-4 w-4 mr-2" />
                Create Strategy
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px]"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Timeframe</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {strategies.map((strategy, index) => {
                  const stats = getStrategyStats(strategy);
                  return (
                    <TableRow key={strategy.id}>
                      <TableCell>
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{strategy.name}</span>
                            {strategy.isDefault && (
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            )}
                          </div>
                          {strategy.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {strategy.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{strategy.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{strategy.timeframe}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {strategy.tags?.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {(strategy.tags?.length || 0) > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{(strategy.tags?.length || 0) - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStrategyActive(strategy.id)}
                          >
                            {strategy.isActive ? (
                              <Eye className="h-3 w-3 text-green-600" />
                            ) : (
                              <EyeOff className="h-3 w-3 text-muted-foreground" />
                            )}
                          </Button>
                          <span className={cn(
                            'text-xs',
                            strategy.isActive ? 'text-green-600' : 'text-muted-foreground'
                          )}>
                            {strategy.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-3 w-3" />
                            <span>{stats.totalTrades} trades</span>
                          </div>
                          {stats.winRate > 0 && (
                            <div className="text-muted-foreground">
                              {stats.winRate}% win rate
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditStrategy(strategy)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateStrategy(strategy)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteStrategy(strategy.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Strategy Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStrategy ? 'Edit Strategy' : 'Create New Strategy'}
            </DialogTitle>
            <DialogDescription>
              {editingStrategy 
                ? 'Update your trading strategy details' 
                : 'Define a new trading strategy for better organization and analysis'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="strategy-name">Strategy Name *</Label>
                <Input
                  id="strategy-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Breakout Trading"
                  className={cn(validationErrors.name && 'border-red-500')}
                />
                {validationErrors.name && (
                  <p className="text-sm text-red-600">{validationErrors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="strategy-category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {strategyCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="strategy-timeframe">Preferred Timeframe</Label>
                  <Select 
                    value={formData.timeframe} 
                    onValueChange={(value) => setFormData({ ...formData, timeframe: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEFRAMES.map((timeframe) => (
                        <SelectItem key={timeframe} value={timeframe}>
                          {timeframe}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="strategy-description">Description</Label>
                <Textarea
                  id="strategy-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the strategy..."
                  className={cn(validationErrors.description && 'border-red-500')}
                />
                {validationErrors.description && (
                  <p className="text-sm text-red-600">{validationErrors.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="strategy-rules">Trading Rules</Label>
                <Textarea
                  id="strategy-rules"
                  value={formData.rules}
                  onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                  placeholder="Entry and exit criteria, risk management rules..."
                  rows={4}
                  className={cn(validationErrors.rules && 'border-red-500')}
                />
                {validationErrors.rules && (
                  <p className="text-sm text-red-600">{validationErrors.rules}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Tags */}
            <div className="space-y-3">
              <Label>Tags</Label>
              
              {/* Current Tags */}
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-3 w-3 p-0 hover:bg-red-100"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      ×
                    </Button>
                  </Badge>
                ))}
              </div>

              {/* Add New Tag */}
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button variant="outline" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Quick Add Common Tags */}
              <div className="space-y-2">
                <Label className="text-sm">Quick Add:</Label>
                <div className="flex flex-wrap gap-1">
                  {commonTags
                    .filter(tag => !formData.tags.includes(tag))
                    .map((tag) => (
                      <Button
                        key={tag}
                        variant="outline"
                        size="sm"
                        className="text-xs h-6"
                        onClick={() => handleQuickAddTag(tag)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {tag}
                      </Button>
                    ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Status */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Strategy Status</Label>
                <p className="text-xs text-muted-foreground">
                  Active strategies are available for selection when creating trades
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFormSubmit}>
              {editingStrategy ? 'Update Strategy' : 'Create Strategy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}