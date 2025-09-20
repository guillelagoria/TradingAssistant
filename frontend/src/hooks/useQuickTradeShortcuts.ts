import { useEffect, useCallback } from 'react';

interface UseQuickTradeShortcutsProps {
  onOpenQuickTrade: (direction?: 'LONG' | 'SHORT') => void;
  enabled?: boolean;
}

/**
 * Hook for managing quick trade keyboard shortcuts
 * Ctrl+Alt+B = Open quick trade with LONG direction
 * Ctrl+Alt+S = Open quick trade with SHORT direction
 */
export const useQuickTradeShortcuts = ({
  onOpenQuickTrade,
  enabled = true
}: UseQuickTradeShortcutsProps) => {

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Only handle shortcuts when enabled and not in an input field
    if (!enabled) return;

    const isInInput = (event.target as HTMLElement)?.tagName === 'INPUT' ||
                     (event.target as HTMLElement)?.tagName === 'TEXTAREA' ||
                     (event.target as HTMLElement)?.contentEditable === 'true';

    // Allow shortcuts even in input fields for maximum speed
    // Users can always cancel if accidentally triggered

    // Check for Ctrl+Alt+B (Buy/Long)
    if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'b') {
      event.preventDefault();
      event.stopPropagation();
      onOpenQuickTrade('LONG');
      return;
    }

    // Check for Ctrl+Alt+S (Sell/Short)
    if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      event.stopPropagation();
      onOpenQuickTrade('SHORT');
      return;
    }
  }, [onOpenQuickTrade, enabled]);

  useEffect(() => {
    if (!enabled) return;

    // Add event listener to document for global shortcuts
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  return {
    // Return useful info about shortcuts for UI display
    shortcuts: {
      long: 'Ctrl+Alt+B',
      short: 'Ctrl+Alt+S'
    }
  };
};