import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EnhancedTradeForm from '@/components/trades/EnhancedTradeForm';
import { KeyboardShortcutsPanel } from '@/components/ui/keyboard-shortcuts-panel';
import { Button } from '@/components/ui/button';
import {
  Keyboard,
  Zap,
  Target,
  ArrowRight,
  CheckCircle,
  Clock,
  TrendingUp,
  MousePointer,
  Hash,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

const KeyboardNavigationDemo: React.FC = () => {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [activeDemo, setActiveDemo] = useState('overview');

  const features = [
    {
      icon: Zap,
      title: "Lightning-Fast Entry",
      description: "Complete a trade entry in under 30 seconds using only keyboard input",
      shortcuts: ["Enter", "Tab", "Ctrl+S", "Ctrl+Enter"]
    },
    {
      icon: Target,
      title: "Smart Auto-Advance",
      description: "Fields automatically advance when complete, maintaining your flow",
      shortcuts: ["Auto-advance", "Field validation", "Progress tracking"]
    },
    {
      icon: Hash,
      title: "Quick Select Options",
      description: "Use number keys (1-9) and letters (a-z) for instant selections",
      shortcuts: ["1-9", "a-z", "Space", "L/S toggle"]
    },
    {
      icon: ArrowUp,
      title: "Precision Controls",
      description: "Increment/decrement values with arrow keys respecting tick sizes",
      shortcuts: ["Ctrl+↑↓", "Market tick size", "Real-time validation"]
    }
  ];

  const shortcuts = [
    { keys: ['ctrl', 's'], description: 'Save draft', category: 'General' },
    { keys: ['ctrl', 'enter'], description: 'Submit form', category: 'General' },
    { keys: ['escape'], description: 'Cancel/Close', category: 'General' },
    { keys: ['f1'], description: 'Toggle shortcuts help', category: 'General' },
    { keys: ['alt', '1'], description: 'Go to Entry tab', category: 'Navigation' },
    { keys: ['alt', '2'], description: 'Go to Risk tab', category: 'Navigation' },
    { keys: ['alt', '3'], description: 'Go to Exit tab', category: 'Navigation' },
    { keys: ['alt', '4'], description: 'Go to Analysis tab', category: 'Navigation' },
    { keys: ['1'], description: 'Select ES market', category: 'Quick Select' },
    { keys: ['2'], description: 'Select NQ market', category: 'Quick Select' },
    { keys: ['l'], description: 'Long position', category: 'Quick Select' },
    { keys: ['s'], description: 'Short position', category: 'Quick Select' },
    { keys: ['space'], description: 'Toggle Long/Short', category: 'Quick Actions' },
    { keys: ['ctrl', 'arrowup'], description: 'Increase by tick size', category: 'Numeric Controls' },
    { keys: ['ctrl', 'arrowdown'], description: 'Decrease by tick size', category: 'Numeric Controls' },
    { keys: ['enter'], description: 'Next field', category: 'Flow Control' },
    { keys: ['tab'], description: 'Navigate fields', category: 'Flow Control' }
  ];

  return (
    <div className="container mx-auto py-6 max-w-6xl space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Keyboard className="h-6 w-6 text-primary" />
            Enhanced Keyboard Navigation
            <Badge variant="secondary" className="text-xs">
              Ultra-Fast Trade Entry
            </Badge>
          </CardTitle>
          <CardDescription>
            Experience professional-grade keyboard shortcuts and navigation designed for rapid trade entry.
            Complete a full trade entry in under 30 seconds without touching your mouse.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeDemo} onValueChange={setActiveDemo}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Feature Overview</TabsTrigger>
          <TabsTrigger value="live-demo">Live Demo</TabsTrigger>
          <TabsTrigger value="shortcuts">Keyboard Shortcuts</TabsTrigger>
        </TabsList>

        {/* Feature Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="relative">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <feature.icon className="h-5 w-5 text-primary" />
                    {feature.title}
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {feature.shortcuts.map((shortcut, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {shortcut}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Start Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                30-Second Trade Entry Challenge
              </CardTitle>
              <CardDescription>
                Follow this optimized flow to complete a trade entry in record time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Select Market</p>
                    <p className="text-xs text-muted-foreground">Press 1 for ES, 2 for NQ</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Set Direction</p>
                    <p className="text-xs text-muted-foreground">L for Long, S for Short</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Enter Price & Size</p>
                    <p className="text-xs text-muted-foreground">Ctrl+↑↓ for adjustments</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Submit</p>
                    <p className="text-xs text-muted-foreground">Ctrl+Enter to save</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-semibold">Pro Tips</span>
                </div>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Fields auto-advance when complete - keep typing without thinking</li>
                  <li>• Use Alt+1,2,3,4 to jump between tabs instantly</li>
                  <li>• Smart defaults fill risk management automatically</li>
                  <li>• Real-time validation prevents errors before submission</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Demo */}
        <TabsContent value="live-demo">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MousePointer className="h-5 w-5" />
                  Interactive Demo
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowShortcuts(true)}
                  className="flex items-center gap-2"
                >
                  <Keyboard className="h-4 w-4" />
                  Show Shortcuts (F1)
                </Button>
              </CardTitle>
              <CardDescription>
                Try the enhanced trade form below. Use keyboard shortcuts for the fastest experience.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/20 p-6 rounded-lg border-2 border-dashed border-muted-foreground/20">
                <EnhancedTradeForm
                  onSuccess={() => {
                    // Demo success handler
                    alert('Demo trade saved! In real app, this would navigate to trade history.');
                  }}
                  onCancel={() => {
                    // Demo cancel handler
                    alert('Demo cancelled. In real app, this would return to previous page.');
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Keyboard Shortcuts */}
        <TabsContent value="shortcuts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Complete Keyboard Reference
              </CardTitle>
              <CardDescription>
                Master these shortcuts to achieve maximum trading efficiency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {Object.entries(
                  shortcuts.reduce((acc, shortcut) => {
                    const category = shortcut.category || 'General';
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(shortcut);
                    return acc;
                  }, {} as Record<string, typeof shortcuts>)
                ).map(([category, categoryShortcuts]) => (
                  <div key={category}>
                    <h4 className="text-lg font-semibold mb-3 text-primary">
                      {category}
                    </h4>
                    <div className="grid gap-2">
                      {categoryShortcuts.map((shortcut, index) => (
                        <div
                          key={`${category}-${index}`}
                          className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50"
                        >
                          <span className="text-sm">{shortcut.description}</span>
                          <div className="flex items-center gap-1">
                            {shortcut.keys.map((key, keyIndex) => (
                              <React.Fragment key={keyIndex}>
                                {keyIndex > 0 && (
                                  <span className="text-xs text-muted-foreground">+</span>
                                )}
                                <Badge
                                  variant="outline"
                                  className="text-xs px-2 py-1 font-mono"
                                >
                                  {key === 'arrowup' ? '↑' :
                                   key === 'arrowdown' ? '↓' :
                                   key === 'ctrl' ? 'Ctrl' :
                                   key === 'alt' ? 'Alt' :
                                   key === 'enter' ? 'Enter' :
                                   key === 'escape' ? 'Esc' :
                                   key.toUpperCase()}
                                </Badge>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-semibold">Performance Targets</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-blue-700">
                    <strong>Beginner:</strong> 60 seconds per trade
                  </div>
                  <div className="text-blue-700">
                    <strong>Intermediate:</strong> 45 seconds per trade
                  </div>
                  <div className="text-blue-700">
                    <strong>Expert:</strong> 30 seconds per trade
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Keyboard shortcuts panel */}
      <KeyboardShortcutsPanel
        shortcuts={shortcuts}
        visible={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
};

export default KeyboardNavigationDemo;