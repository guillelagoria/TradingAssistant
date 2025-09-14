import { useState, useCallback, useEffect } from 'react';
import { FormAnimationState } from '../types/trade';

interface UseFormAnimationsOptions {
  enableAnimations?: boolean;
  calculationDelay?: number;
  resultsDisplayDelay?: number;
}

interface AnimationTriggers {
  startCalculation: () => void;
  showResults: () => void;
  slideLeft: () => void;
  slideRight: () => void;
  fadeIn: () => void;
  fadeOut: () => void;
  reset: () => void;
}

/**
 * Custom hook for managing form animation states and transitions
 * Provides smooth transitions for calculation states and form interactions
 */
export function useFormAnimations(options: UseFormAnimationsOptions = {}): [FormAnimationState, AnimationTriggers] {
  const {
    enableAnimations = true,
    calculationDelay = 150,
    resultsDisplayDelay = 300
  } = options;

  const [animationState, setAnimationState] = useState<FormAnimationState>({
    isCalculating: false,
    showResults: false,
    slideDirection: 'none',
    fadeState: 'none',
  });

  const [timeouts, setTimeouts] = useState<NodeJS.Timeout[]>([]);

  // Clear all pending timeouts
  const clearAllTimeouts = useCallback(() => {
    timeouts.forEach(timeout => clearTimeout(timeout));
    setTimeouts([]);
  }, [timeouts]);

  // Start calculation animation
  const startCalculation = useCallback(() => {
    if (!enableAnimations) return;

    clearAllTimeouts();
    setAnimationState(prev => ({
      ...prev,
      isCalculating: true,
      showResults: false,
      fadeState: 'out',
    }));

    // Show calculating state briefly
    const timeout = setTimeout(() => {
      setAnimationState(prev => ({
        ...prev,
        fadeState: 'in',
      }));
    }, calculationDelay);

    setTimeouts([timeout]);
  }, [enableAnimations, calculationDelay, clearAllTimeouts]);

  // Show results with animation
  const showResults = useCallback(() => {
    if (!enableAnimations) {
      setAnimationState(prev => ({
        ...prev,
        isCalculating: false,
        showResults: true,
        fadeState: 'in',
      }));
      return;
    }

    clearAllTimeouts();

    const timeout1 = setTimeout(() => {
      setAnimationState(prev => ({
        ...prev,
        isCalculating: false,
        fadeState: 'out',
      }));
    }, calculationDelay);

    const timeout2 = setTimeout(() => {
      setAnimationState(prev => ({
        ...prev,
        showResults: true,
        fadeState: 'in',
      }));
    }, resultsDisplayDelay);

    setTimeouts([timeout1, timeout2]);
  }, [enableAnimations, calculationDelay, resultsDisplayDelay, clearAllTimeouts]);

  // Slide animations
  const slideLeft = useCallback(() => {
    if (!enableAnimations) return;

    setAnimationState(prev => ({
      ...prev,
      slideDirection: 'left',
    }));

    const timeout = setTimeout(() => {
      setAnimationState(prev => ({
        ...prev,
        slideDirection: 'none',
      }));
    }, 300);

    setTimeouts(prev => [...prev, timeout]);
  }, [enableAnimations]);

  const slideRight = useCallback(() => {
    if (!enableAnimations) return;

    setAnimationState(prev => ({
      ...prev,
      slideDirection: 'right',
    }));

    const timeout = setTimeout(() => {
      setAnimationState(prev => ({
        ...prev,
        slideDirection: 'none',
      }));
    }, 300);

    setTimeouts(prev => [...prev, timeout]);
  }, [enableAnimations]);

  // Fade animations
  const fadeIn = useCallback(() => {
    setAnimationState(prev => ({
      ...prev,
      fadeState: 'in',
    }));
  }, []);

  const fadeOut = useCallback(() => {
    setAnimationState(prev => ({
      ...prev,
      fadeState: 'out',
    }));
  }, []);

  // Reset all animations
  const reset = useCallback(() => {
    clearAllTimeouts();
    setAnimationState({
      isCalculating: false,
      showResults: false,
      slideDirection: 'none',
      fadeState: 'none',
    });
  }, [clearAllTimeouts]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  return [
    animationState,
    {
      startCalculation,
      showResults,
      slideLeft,
      slideRight,
      fadeIn,
      fadeOut,
      reset,
    }
  ];
}

// Hook for simple loading animations
export function useLoadingAnimation(isLoading: boolean, delay: number = 200) {
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isLoading) {
      timeout = setTimeout(() => {
        setShowSpinner(true);
      }, delay);
    } else {
      setShowSpinner(false);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isLoading, delay]);

  return showSpinner;
}

// Hook for staggered list animations
export function useStaggeredAnimation(items: any[], staggerDelay: number = 100) {
  const [visibleItems, setVisibleItems] = useState(0);

  useEffect(() => {
    if (items.length === 0) {
      setVisibleItems(0);
      return;
    }

    const timeouts: NodeJS.Timeout[] = [];

    for (let i = 0; i < items.length; i++) {
      const timeout = setTimeout(() => {
        setVisibleItems(i + 1);
      }, i * staggerDelay);

      timeouts.push(timeout);
    }

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [items.length, staggerDelay]);

  return visibleItems;
}

// Hook for smooth value transitions
export function useValueTransition(
  value: number,
  duration: number = 300,
  precision: number = 2
): number {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (value === displayValue) return;

    const startValue = displayValue;
    const difference = value - startValue;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const currentValue = startValue + (difference * easedProgress);
      setDisplayValue(Number(currentValue.toFixed(precision)));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration, precision, displayValue]);

  return displayValue;
}