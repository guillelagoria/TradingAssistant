import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Star,
  Clock,
  TrendingUp,
  TrendingDown,
  Save,
  X,
  Sparkles,
  Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTemplateStore } from '@/store/templateStore';
import { TradeTemplate } from '@/types/template';
import { TradeDirection, Strategy, Timeframe, OrderType } from '@/types';

interface TemplateSelectorProps {
  onApplyTemplate: (template: TradeTemplate) => void;
  currentFormValues?: Partial<TradeTemplate>;
}

export default function TemplateSelector({ onApplyTemplate, currentFormValues }: TemplateSelectorProps) {
  const {
    templates,
    selectedTemplateId,
    selectTemplate,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplateById
  } = useTemplateStore();

  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TradeTemplate | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [isSavingCurrent, setIsSavingCurrent] = useState(false);

  // Sort templates: defaults first, then by usage count
  const sortedTemplates = [...templates].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return (b.usageCount || 0) - (a.usageCount || 0);
  });

  const handleSelectTemplate = (templateId: string | null) => {
    if (templateId === null) {
      selectTemplate(null);
      return;
    }

    const template = getTemplateById(templateId);
    if (template) {
      selectTemplate(templateId);
      onApplyTemplate(template);
    }
  };

  const handleSaveCurrentAsTemplate = () => {
    if (!currentFormValues || !newTemplateName.trim()) return;

    addTemplate({
      name: newTemplateName,
      description: newTemplateDescription,
      ...currentFormValues
    });

    setNewTemplateName('');
    setNewTemplateDescription('');
    setIsSavingCurrent(false);
  };

  const handleDeleteTemplate = (templateId: string) => {
    deleteTemplate(templateId);
    if (selectedTemplateId === templateId) {
      selectTemplate(null);
    }
  };

  const formatTemplateDetails = (template: TradeTemplate) => {
    const details = [];

    if (template.symbol) details.push(template.symbol);
    if (template.direction) {
      details.push(
        <span className={cn(
          "font-medium",
          template.direction === TradeDirection.LONG ? "text-green-600" : "text-red-600"
        )}>
          {template.direction}
        </span>
      );
    }
    if (template.quantity) details.push(`${template.quantity} contracts`);
    if (template.stopLossPoints) details.push(`SL: ${template.stopLossPoints}pts`);
    if (template.takeProfitPoints) details.push(`TP: ${template.takeProfitPoints}pts`);

    return details;
  };

  return (
    <div className="mb-4 p-3 bg-muted/30 rounded-lg border">
      {/* Single line layout */}
      <div className="flex items-center justify-between gap-3">
        {/* Left side: Title and Select */}
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium whitespace-nowrap">Templates:</span>
          </div>

          <div className="flex-1 min-w-0">
            <Select value={selectedTemplateId || 'none'} onValueChange={(value) => handleSelectTemplate(value === 'none' ? null : value)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Quick-fill form" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">None - Start from scratch</span>
                </SelectItem>

                {sortedTemplates.length > 0 && (
                  <>
                    {sortedTemplates.filter(t => t.isDefault).length > 0 && (
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        Default Templates
                      </div>
                    )}

                    {sortedTemplates.filter(t => t.isDefault).map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-2">
                            <Star className="w-3 h-3 text-yellow-500" />
                            <span className="font-medium">{template.name}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground ml-4">
                            {formatTemplateDetails(template).map((detail, i) => (
                              <React.Fragment key={i}>
                                {i > 0 && <span>·</span>}
                                {detail}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </SelectItem>
                    ))}

                    {sortedTemplates.filter(t => !t.isDefault).length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                          Custom Templates
                        </div>

                        {sortedTemplates.filter(t => !t.isDefault).map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium">{template.name}</span>
                              <div className="flex items-center space-x-2 text-xs text-muted-foreground ml-4">
                                {formatTemplateDetails(template).map((detail, i) => (
                                  <React.Fragment key={i}>
                                    {i > 0 && <span>·</span>}
                                    {detail}
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right side: Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Dialog open={isSavingCurrent} onOpenChange={setIsSavingCurrent}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Save current form as template">
                <Save className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Current Settings as Template</DialogTitle>
                <DialogDescription>
                  Create a new template from your current form settings
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Template Name *</Label>
                  <Input
                    id="template-name"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="e.g., ES Morning Scalp"
                  />
                </div>

                <div>
                  <Label htmlFor="template-description">Description</Label>
                  <Textarea
                    id="template-description"
                    value={newTemplateDescription}
                    onChange={(e) => setNewTemplateDescription(e.target.value)}
                    placeholder="Describe when to use this template..."
                    className="h-20"
                  />
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Template will include:</p>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    {currentFormValues?.symbol && <div>• Market: {currentFormValues.symbol}</div>}
                    {currentFormValues?.direction && <div>• Direction: {currentFormValues.direction}</div>}
                    {currentFormValues?.quantity && <div>• Quantity: {currentFormValues.quantity}</div>}
                    {currentFormValues?.stopLossPoints && <div>• Stop Loss: {currentFormValues.stopLossPoints} pts</div>}
                    {currentFormValues?.takeProfitPoints && <div>• Take Profit: {currentFormValues.takeProfitPoints} pts</div>}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSavingCurrent(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveCurrentAsTemplate}
                  disabled={!newTemplateName.trim()}
                >
                  Save Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Manage templates">
                <Edit2 className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Manage Templates</DialogTitle>
                <DialogDescription>
                  Create, edit, and organize your trading templates
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="all">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All Templates</TabsTrigger>
                  <TabsTrigger value="defaults">Defaults</TabsTrigger>
                  <TabsTrigger value="custom">Custom</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <ScrollArea className="h-[400px] w-full pr-4">
                    <div className="space-y-2">
                      {sortedTemplates.map((template) => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          onEdit={(t) => setEditingTemplate(t)}
                          onDelete={() => handleDeleteTemplate(template.id)}
                          isSelected={selectedTemplateId === template.id}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="defaults">
                  <ScrollArea className="h-[400px] w-full pr-4">
                    <div className="space-y-2">
                      {sortedTemplates.filter(t => t.isDefault).map((template) => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          onEdit={(t) => setEditingTemplate(t)}
                          onDelete={() => handleDeleteTemplate(template.id)}
                          isSelected={selectedTemplateId === template.id}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="custom">
                  <ScrollArea className="h-[400px] w-full pr-4">
                    <div className="space-y-2">
                      {sortedTemplates.filter(t => !t.isDefault).map((template) => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          onEdit={(t) => setEditingTemplate(t)}
                          onDelete={() => handleDeleteTemplate(template.id)}
                          isSelected={selectedTemplateId === template.id}
                        />
                      ))}
                      {sortedTemplates.filter(t => !t.isDefault).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">No custom templates yet</p>
                          <p className="text-xs">Save your current settings to create one</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Template applied notification - compact */}
      <AnimatePresence>
        {selectedTemplateId && getTemplateById(selectedTemplateId) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 pt-2 border-t border-muted-foreground/20"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-primary">
                <Sparkles className="w-3 h-3" />
                <span className="font-medium">{getTemplateById(selectedTemplateId)?.name} applied</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => selectTemplate(null)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Template Card Component
interface TemplateCardProps {
  template: TradeTemplate;
  onEdit: (template: TradeTemplate) => void;
  onDelete: () => void;
  isSelected: boolean;
}

function TemplateCard({ template, onEdit, onDelete, isSelected }: TemplateCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-3 rounded-lg border transition-all",
        isSelected ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            {template.isDefault && <Star className="w-4 h-4 text-yellow-500" />}
            <span className="font-medium">{template.name}</span>
            {template.usageCount && template.usageCount > 0 && (
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Used {template.usageCount}x
              </Badge>
            )}
          </div>

          {template.description && (
            <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
          )}

          <div className="flex items-center space-x-3 mt-2 text-xs">
            {template.symbol && <Badge variant="secondary">{template.symbol}</Badge>}
            {template.direction && (
              <Badge variant={template.direction === TradeDirection.LONG ? "default" : "destructive"}>
                {template.direction === TradeDirection.LONG ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                {template.direction}
              </Badge>
            )}
            {template.quantity && <span>Qty: {template.quantity}</span>}
            {template.stopLossPoints && <span>SL: {template.stopLossPoints}pts</span>}
            {template.takeProfitPoints && <span>TP: {template.takeProfitPoints}pts</span>}
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {!template.isDefault && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(template)}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onDelete}
                className="h-8 w-8 p-0 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}