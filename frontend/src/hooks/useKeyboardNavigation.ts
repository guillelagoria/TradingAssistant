import { useCallback, useEffect, useRef, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

export interface KeyboardNavigationField {
  name: string;
  tabOrder: number;
  skipWhen?: () => boolean;
  onEnterPress?: (value: any) => void;
  autoAdvanceWhen?: (value: any) => boolean;
  incrementStep?: number;
  decrementStep?: number;
  quickSelectOptions?: { key: string; value: any; label: string }[];
}

export interface KeyboardShortcut {
  keys: string[];
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

interface UseKeyboardNavigationOptions {
  form: UseFormReturn<any>;
  fields: KeyboardNavigationField[];
  shortcuts?: KeyboardShortcut[];
  onTabChange?: (tabName: string) => void;
  tabs?: string[];
  autoSave?: () => void;
  onSubmit?: () => void;
  onCancel?: () => void;
}

export const useKeyboardNavigation = ({
  form,
  fields,
  shortcuts = [],
  onTabChange,
  tabs = [],
  autoSave,
  onSubmit,
  onCancel
}: UseKeyboardNavigationOptions) => {
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [showShortcutHints, setShowShortcutHints] = useState(false);
  const [fieldCompletionStatus, setFieldCompletionStatus] = useState<Record<string, boolean>>({});
  const fieldsRef = useRef<Map<string, HTMLElement>>(new Map());
  const shortcutTimeoutRef = useRef<NodeJS.Timeout>();

  // Sort fields by tab order for navigation sequence
  const sortedFields = fields.sort((a, b) => a.tabOrder - b.tabOrder);

  // Default shortcuts
  const defaultShortcuts: KeyboardShortcut[] = [
    {
      keys: ['ctrl', 's'],
      action: () => autoSave?.(),
      description: 'Save draft',
      preventDefault: true
    },
    {
      keys: ['ctrl', 'enter'],
      action: () => onSubmit?.(),
      description: 'Submit form',
      preventDefault: true
    },
    {
      keys: ['escape'],
      action: () => onCancel?.(),
      description: 'Cancel/Close',
      preventDefault: true
    },
    {
      keys: ['f1'],
      action: () => setShowShortcutHints(prev => !prev),
      description: 'Toggle shortcut hints',
      preventDefault: true
    }
  ];

  // Combine default and custom shortcuts
  const allShortcuts = [...defaultShortcuts, ...shortcuts];

  // Register field element reference
  const registerField = useCallback((fieldName: string, element: HTMLElement | null) => {
    if (element) {
      fieldsRef.current.set(fieldName, element);
    } else {
      fieldsRef.current.delete(fieldName);
    }
  }, []);

  // Navigate to next field in sequence
  const navigateToNext = useCallback(() => {
    const availableFields = sortedFields.filter(field => !field.skipWhen?.());
    let nextIndex = currentFieldIndex + 1;

    while (nextIndex < availableFields.length && availableFields[nextIndex]?.skipWhen?.()) {
      nextIndex++;
    }

    if (nextIndex < availableFields.length) {
      const nextField = availableFields[nextIndex];
      const element = fieldsRef.current.get(nextField.name);
      if (element) {
        element.focus();
        setCurrentFieldIndex(nextIndex);
      }
    }
  }, [currentFieldIndex, sortedFields]);

  // Navigate to previous field in sequence
  const navigateToPrevious = useCallback(() => {
    const availableFields = sortedFields.filter(field => !field.skipWhen?.());
    let prevIndex = currentFieldIndex - 1;

    while (prevIndex >= 0 && availableFields[prevIndex]?.skipWhen?.()) {
      prevIndex--;
    }

    if (prevIndex >= 0) {
      const prevField = availableFields[prevIndex];
      const element = fieldsRef.current.get(prevField.name);
      if (element) {
        element.focus();
        setCurrentFieldIndex(prevIndex);
      }
    }
  }, [currentFieldIndex, sortedFields]);

  // Navigate to specific field by name
  const navigateToField = useCallback((fieldName: string) => {
    const fieldIndex = sortedFields.findIndex(field => field.name === fieldName);
    if (fieldIndex !== -1) {
      const element = fieldsRef.current.get(fieldName);
      if (element) {
        element.focus();
        setCurrentFieldIndex(fieldIndex);
      }
    }
  }, [sortedFields]);

  // Handle numeric field increment/decrement
  const adjustNumericValue = useCallback((fieldName: string, increment: boolean) => {
    const field = fields.find(f => f.name === fieldName);
    if (!field) return;

    const currentValue = form.getValues(fieldName) || 0;
    const step = increment
      ? (field.incrementStep || 0.01)
      : -(field.decrementStep || field.incrementStep || 0.01);

    const newValue = Number(currentValue) + step;
    form.setValue(fieldName, Math.max(0, newValue));
  }, [fields, form]);

  // Quick select handler for fields with predefined options
  const handleQuickSelect = useCallback((key: string) => {
    const currentField = sortedFields[currentFieldIndex];
    if (currentField?.quickSelectOptions) {
      const option = currentField.quickSelectOptions.find(opt => opt.key === key);
      if (option) {
        form.setValue(currentField.name, option.value);
        // Auto-advance if configured
        if (currentField.autoAdvanceWhen?.(option.value)) {
          navigateToNext();
        }
      }
    }
  }, [currentFieldIndex, sortedFields, form, navigateToNext]);

  // Check if shortcuts match pressed keys
  const matchShortcut = useCallback((pressedKeys: string[], shortcut: KeyboardShortcut) => {
    if (pressedKeys.length !== shortcut.keys.length) return false;
    return shortcut.keys.every(key => pressedKeys.includes(key.toLowerCase()));
  }, []);

  // Global keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    const pressedKeys: string[] = [];

    // Build pressed keys array
    if (event.ctrlKey) pressedKeys.push('ctrl');
    if (event.altKey) pressedKeys.push('alt');
    if (event.shiftKey) pressedKeys.push('shift');
    if (event.metaKey) pressedKeys.push('meta');
    pressedKeys.push(event.key.toLowerCase());

    // Check for shortcuts first
    for (const shortcut of allShortcuts) {
      if (matchShortcut(pressedKeys, shortcut)) {
        if (shortcut.preventDefault) {
          event.preventDefault();
        }
        shortcut.action();
        return;
      }
    }

    // Handle quick select keys (1-9, a-z for field options)
    const isQuickSelectKey = /^[1-9a-z]$/.test(event.key.toLowerCase());
    if (isQuickSelectKey && !event.ctrlKey && !event.altKey) {
      const currentField = sortedFields[currentFieldIndex];
      if (currentField?.quickSelectOptions && target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        event.preventDefault();
        handleQuickSelect(event.key.toLowerCase());
        return;
      }
    }

    // Handle navigation for input fields
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      const fieldName = target.getAttribute('name') || target.getAttribute('data-field');
      const field = fields.find(f => f.name === fieldName);

      switch (event.key) {
        case 'Enter':
          event.preventDefault();
          if (field?.onEnterPress) {
            field.onEnterPress(form.getValues(fieldName!));
          } else {
            navigateToNext();
          }
          break;

        case 'ArrowUp':
          if (target.tagName === 'INPUT' && field && event.ctrlKey) {
            event.preventDefault();
            adjustNumericValue(fieldName!, true);
          }
          break;

        case 'ArrowDown':
          if (target.tagName === 'INPUT' && field && event.ctrlKey) {
            event.preventDefault();
            adjustNumericValue(fieldName!, false);
          }
          break;

        case 'Tab':
          // Let default tab behavior handle most cases, but update our tracking
          const direction = event.shiftKey ? -1 : 1;
          setTimeout(() => {
            const newFocused = document.activeElement as HTMLElement;
            const newFieldName = newFocused?.getAttribute('name') || newFocused?.getAttribute('data-field');
            if (newFieldName) {
              const newIndex = sortedFields.findIndex(f => f.name === newFieldName);
              if (newIndex !== -1) {
                setCurrentFieldIndex(newIndex);
              }
            }
          }, 0);
          break;
      }
    }

    // Handle tab switching with Alt + number keys
    if (event.altKey && /^[1-9]$/.test(event.key) && tabs.length > 0) {
      event.preventDefault();
      const tabIndex = parseInt(event.key) - 1;
      if (tabIndex < tabs.length && onTabChange) {
        onTabChange(tabs[tabIndex]);
      }
    }
  }, [
    allShortcuts,
    matchShortcut,
    sortedFields,
    currentFieldIndex,
    handleQuickSelect,
    fields,
    form,
    navigateToNext,
    adjustNumericValue,
    tabs,
    onTabChange
  ]);

  // Update field completion status
  const updateFieldStatus = useCallback(() => {
    const newStatus: Record<string, boolean> = {};

    fields.forEach(field => {
      const value = form.getValues(field.name);
      const isEmpty = value === undefined || value === null || value === '';
      const isValid = !form.getFieldState(field.name).error;
      newStatus[field.name] = !isEmpty && isValid;
    });

    setFieldCompletionStatus(newStatus);
  }, [fields, form]);

  // Watch form values and update completion status
  useEffect(() => {
    const subscription = form.watch(updateFieldStatus);
    return () => subscription.unsubscribe();
  }, [form, updateFieldStatus]);

  // Setup keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Show shortcut hints briefly when F1 is pressed
  useEffect(() => {
    if (showShortcutHints) {
      if (shortcutTimeoutRef.current) {
        clearTimeout(shortcutTimeoutRef.current);
      }
      shortcutTimeoutRef.current = setTimeout(() => {
        setShowShortcutHints(false);
      }, 5000);
    }
    return () => {
      if (shortcutTimeoutRef.current) {
        clearTimeout(shortcutTimeoutRef.current);
      }
    };
  }, [showShortcutHints]);

  return {
    // Navigation methods
    navigateToNext,
    navigateToPrevious,
    navigateToField,
    registerField,

    // State
    currentFieldIndex,
    fieldCompletionStatus,
    showShortcutHints,

    // Helpers
    adjustNumericValue,
    handleQuickSelect,

    // Computed values
    currentField: sortedFields[currentFieldIndex],
    availableShortcuts: allShortcuts,
    completionProgress: Object.values(fieldCompletionStatus).filter(Boolean).length / fields.length
  };
};