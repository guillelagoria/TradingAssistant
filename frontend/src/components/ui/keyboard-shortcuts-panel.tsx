import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Keyboard, X } from "lucide-react";

export interface KeyboardShortcut {
  keys: string[];
  description: string;
  category?: string;
}

interface KeyboardShortcutsPanelProps {
  shortcuts: KeyboardShortcut[];
  visible: boolean;
  onClose?: () => void;
  className?: string;
}

const formatKey = (key: string): string => {
  const keyMap: Record<string, string> = {
    ctrl: "Ctrl",
    alt: "Alt",
    shift: "Shift",
    meta: "Cmd",
    enter: "Enter",
    escape: "Esc",
    arrowup: "↑",
    arrowdown: "↓",
    arrowleft: "←",
    arrowright: "→",
    " ": "Space"
  };
  return keyMap[key.toLowerCase()] || key.toUpperCase();
};

const KeyboardShortcutsPanel: React.FC<KeyboardShortcutsPanelProps> = ({
  shortcuts,
  visible,
  onClose,
  className
}) => {
  // Group shortcuts by category
  const groupedShortcuts = React.useMemo(() => {
    const groups: Record<string, KeyboardShortcut[]> = {};
    shortcuts.forEach(shortcut => {
      const category = shortcut.category || 'General';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(shortcut);
    });
    return groups;
  }, [shortcuts]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <Card className={cn("relative max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            <div>
              <CardTitle className="text-lg">Keyboard Shortcuts</CardTitle>
              <CardDescription>Speed up your trade entry with these shortcuts</CardDescription>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                {category}
              </h4>
              <div className="grid gap-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={`${category}-${index}`}
                    className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50"
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
                            className="text-xs px-1.5 py-0.5 font-mono"
                          >
                            {formatKey(key)}
                          </Badge>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export { KeyboardShortcutsPanel };