import { TradeDirection, Strategy, Timeframe, OrderType } from './trade';

/**
 * Trade Template for quick form filling
 */
export interface TradeTemplate {
  id: string;
  name: string;
  description?: string;
  symbol?: string; // Market symbol (e.g., 'ES')
  direction?: TradeDirection;
  quantity?: number;
  orderType?: OrderType;
  stopLossPoints?: number;
  takeProfitPoints?: number;
  strategy?: Strategy;
  timeframe?: Timeframe;
  // Metadata
  isDefault?: boolean; // System default templates
  createdAt: Date;
  updatedAt?: Date;
  usageCount?: number; // Track how many times used
}

export interface TemplateFormData extends Omit<TradeTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'> {
  // For creating/editing templates
}

// Predefined default templates
export const DEFAULT_TEMPLATES: Omit<TradeTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'ES Scalp',
    description: 'Quick ES scalp with tight stop',
    symbol: 'ES',
    direction: TradeDirection.LONG,
    quantity: 1,
    orderType: OrderType.MARKET,
    stopLossPoints: 5,
    takeProfitPoints: 15,
    strategy: Strategy.SCALPING,
    timeframe: Timeframe.M5,
    isDefault: true,
  },
  {
    name: 'NQ Day Trade',
    description: 'Standard NQ day trading setup',
    symbol: 'NQ',
    direction: TradeDirection.LONG,
    quantity: 1,
    orderType: OrderType.LIMIT,
    stopLossPoints: 10,
    takeProfitPoints: 30,
    strategy: Strategy.DAY_TRADING,
    timeframe: Timeframe.M15,
    isDefault: true,
  },
  {
    name: 'YM Swing',
    description: 'YM swing trade with wider stops',
    symbol: 'YM',
    direction: TradeDirection.LONG,
    quantity: 1,
    orderType: OrderType.LIMIT,
    stopLossPoints: 20,
    takeProfitPoints: 60,
    strategy: Strategy.SWING,
    timeframe: Timeframe.H1,
    isDefault: true,
  },
  {
    name: 'ES Short',
    description: 'ES short position standard',
    symbol: 'ES',
    direction: TradeDirection.SHORT,
    quantity: 1,
    orderType: OrderType.MARKET,
    stopLossPoints: 8,
    takeProfitPoints: 20,
    strategy: Strategy.DAY_TRADING,
    timeframe: Timeframe.M15,
    isDefault: true,
  }
];