import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  MarketInfo,
  TradeFormState,
  TradeFormValidation,
  NewTrade,
  MoodRating
} from '../types/trade';
import { useTradeCalculations } from './useTradeCalculations';
import { useFormAnimations } from './useFormAnimations';
import { useMarketData } from './useMarketData';

interface UseTradeFormOptions {
  initialData?: Partial<TradeFormState>;
  autoSave?: boolean;
  autoSaveDelay?: number;
  enableAnimations?: boolean;
  validationMode?: 'onChange' | 'onBlur' | 'onSubmit';
  defaultMarket?: string;
}

interface UseTradeFormReturn {
  // Form state
  formState: TradeFormState;
  validation: TradeFormValidation;
  isDirty: boolean;
  isValid: boolean;

  // Form actions
  updateField: <K extends keyof TradeFormState>(field: K, value: TradeFormState[K]) => void;
  updateMultipleFields: (updates: Partial<TradeFormState>) => void;
  resetForm: () => void;
  setMarket: (market: MarketInfo) => void;

  // Calculations
  calculations: ReturnType<typeof useTradeCalculations>['calculations'];
  isCalculating: boolean;
  recalculate: () => void;

  // Animations
  animationState: ReturnType<typeof useFormAnimations>[0];

  // Market data
  selectedMarket: MarketInfo | null;
  availableMarkets: MarketInfo[];

  // Submission
  canSubmit: boolean;
  submitTrade: () => Promise<NewTrade | null>;

  // Auto-save
  lastSaved: Date | null;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
}

const DEFAULT_FORM_STATE: TradeFormState = {
  marketInfo: null,
  entryPrice: '',
  stopLoss: '',
  takeProfit: '',
  exitPrice: '',
  moodRating: 3,
  imageUrl: '',
  maxFavorablePrice: '',
  maxAdversePrice: '',
  notes: '',
};

/**
 * Comprehensive hook for managing the simplified trade form
 * Combines form state, validation, calculations, animations, and market data
 */
export function useTradeForm(options: UseTradeFormOptions = {}): UseTradeFormReturn {
  const {
    initialData = {},
    autoSave = false,
    autoSaveDelay = 2000,
    enableAnimations = true,
    validationMode = 'onChange',
    defaultMarket = 'ES'
  } = options;

  // Initialize form state
  const [formState, setFormState] = useState<TradeFormState>({
    ...DEFAULT_FORM_STATE,
    ...initialData,
  });

  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Market data hook
  const { selectedMarket, availableMarkets, selectMarket } = useMarketData({
    defaultMarket,
    loadOnMount: true,
  });

  // Set initial market info
  useEffect(() => {
    if (selectedMarket && !formState.marketInfo) {
      setFormState(prev => ({
        ...prev,
        marketInfo: selectedMarket,
      }));
    }
  }, [selectedMarket, formState.marketInfo]);

  // Prepare inputs for calculations
  const calculationInputs = useMemo(() => ({
    entryPrice: parseFloat(formState.entryPrice) || 0,
    stopLoss: parseFloat(formState.stopLoss) || 0,
    takeProfit: parseFloat(formState.takeProfit) || 0,
    exitPrice: parseFloat(formState.exitPrice) || 0,
    maxFavorablePrice: formState.maxFavorablePrice ? parseFloat(formState.maxFavorablePrice) : undefined,
    maxAdversePrice: formState.maxAdversePrice ? parseFloat(formState.maxAdversePrice) : undefined,
    marketInfo: formState.marketInfo,
  }), [formState]);

  // Trade calculations hook
  const {
    calculations,
    isCalculating,
    calculateNow
  } = useTradeCalculations(calculationInputs, {
    debounceMs: 300,
    autoCalculate: validationMode === 'onChange',
  });

  // Form animations hook
  const [animationState, animationControls] = useFormAnimations({
    enableAnimations,
  });

  // Form validation
  const validation = useMemo((): TradeFormValidation => {
    const errors: Partial<Record<keyof TradeFormState, string>> = {};
    const warnings: Partial<Record<keyof TradeFormState, string>> = {};

    // Required field validation
    if (!formState.marketInfo) {
      errors.marketInfo = 'Please select a market';
    }

    if (!formState.entryPrice || parseFloat(formState.entryPrice) <= 0) {
      errors.entryPrice = 'Entry price must be greater than zero';
    }

    if (!formState.exitPrice || parseFloat(formState.exitPrice) <= 0) {
      errors.exitPrice = 'Exit price must be greater than zero';
    }

    if (!formState.stopLoss || parseFloat(formState.stopLoss) <= 0) {
      errors.stopLoss = 'Stop loss must be greater than zero';
    }

    if (!formState.takeProfit || parseFloat(formState.takeProfit) <= 0) {
      errors.takeProfit = 'Take profit must be greater than zero';
    }

    // Logic validation using calculations
    if (calculations.errors.length > 0) {
      calculations.errors.forEach(error => {
        if (error.includes('stop loss')) errors.stopLoss = error;
        if (error.includes('take profit')) errors.takeProfit = error;
        if (error.includes('entry price')) errors.entryPrice = error;
        if (error.includes('exit price')) errors.exitPrice = error;
      });
    }

    // Warnings for suboptimal trades
    if (calculations.isValid) {
      if (calculations.riskRewardRatio < 1) {
        warnings.takeProfit = 'Risk-reward ratio is less than 1:1';
      }
      if (calculations.efficiency < 50 && formState.maxFavorablePrice) {
        warnings.exitPrice = 'Trade efficiency is below 50%';
      }
    }

    const isValid = Object.keys(errors).length === 0 && calculations.isValid;

    return { isValid, errors, warnings };
  }, [formState, calculations]);

  // Update single field
  const updateField = useCallback(<K extends keyof TradeFormState>(
    field: K,
    value: TradeFormState[K]
  ) => {
    setFormState(prev => ({
      ...prev,
      [field]: value,
    }));
    setIsDirty(true);

    if (validationMode === 'onChange') {
      // Trigger animations on value changes
      if (['entryPrice', 'exitPrice', 'stopLoss', 'takeProfit'].includes(field)) {
        animationControls.startCalculation();
      }
    }
  }, [validationMode, animationControls]);

  // Update multiple fields
  const updateMultipleFields = useCallback((updates: Partial<TradeFormState>) => {
    setFormState(prev => ({
      ...prev,
      ...updates,
    }));
    setIsDirty(true);

    if (validationMode === 'onChange') {
      animationControls.startCalculation();
    }
  }, [validationMode, animationControls]);

  // Set market
  const setMarket = useCallback((market: MarketInfo) => {
    selectMarket(market.symbol);
    updateField('marketInfo', market);
  }, [selectMarket, updateField]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormState({ ...DEFAULT_FORM_STATE, ...initialData });
    setIsDirty(false);
    setSaveStatus('idle');
    animationControls.reset();
  }, [initialData, animationControls]);

  // Manual recalculation
  const recalculate = useCallback(() => {
    animationControls.startCalculation();
    const result = calculateNow();
    setTimeout(() => {
      animationControls.showResults();
    }, 500);
    return result;
  }, [calculateNow, animationControls]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !isDirty) return;

    const saveTimeout = setTimeout(() => {
      setSaveStatus('saving');

      // Simulate save operation
      setTimeout(() => {
        setLastSaved(new Date());
        setSaveStatus('saved');
        setIsDirty(false);
      }, 500);
    }, autoSaveDelay);

    return () => clearTimeout(saveTimeout);
  }, [formState, isDirty, autoSave, autoSaveDelay]);

  // Submit trade
  const submitTrade = useCallback(async (): Promise<NewTrade | null> => {
    if (!validation.isValid || !formState.marketInfo) {
      return null;
    }

    try {
      const trade: NewTrade = {
        // Market info
        marketInfo: formState.marketInfo,

        // Essential prices
        entryPrice: parseFloat(formState.entryPrice),
        stopLoss: parseFloat(formState.stopLoss),
        takeProfit: parseFloat(formState.takeProfit),
        exitPrice: parseFloat(formState.exitPrice),

        // Simple metadata
        moodRating: formState.moodRating,
        imageUrl: formState.imageUrl || undefined,

        // Optional fields
        maxFavorablePrice: formState.maxFavorablePrice ? parseFloat(formState.maxFavorablePrice) : undefined,
        maxAdversePrice: formState.maxAdversePrice ? parseFloat(formState.maxAdversePrice) : undefined,
        notes: formState.notes || undefined,

        // Auto-calculated fields
        direction: calculations.direction,
        pnlPoints: calculations.pnlPoints,
        pnlUsd: calculations.pnlUsd,
        riskRewardRatio: calculations.riskRewardRatio,
        efficiency: calculations.efficiency,

        // System fields
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'current-user', // This would come from auth context
      };

      return trade;
    } catch (error) {
      console.error('Failed to create trade:', error);
      return null;
    }
  }, [formState, calculations, validation.isValid]);

  // Can submit check
  const canSubmit = useMemo(() => {
    return validation.isValid && !isCalculating && formState.marketInfo !== null;
  }, [validation.isValid, isCalculating, formState.marketInfo]);

  return {
    // Form state
    formState,
    validation,
    isDirty,
    isValid: validation.isValid,

    // Form actions
    updateField,
    updateMultipleFields,
    resetForm,
    setMarket,

    // Calculations
    calculations,
    isCalculating,
    recalculate,

    // Animations
    animationState,

    // Market data
    selectedMarket,
    availableMarkets,

    // Submission
    canSubmit,
    submitTrade,

    // Auto-save
    lastSaved,
    saveStatus,
  };
}

export default useTradeForm;