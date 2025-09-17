import { Trade, Strategy } from '@prisma/client';
import { calculateTradeStats } from '../utils/calculations';

export const calculateDashboardStats = (trades: Trade[]) => {
  // Use the comprehensive calculateTradeStats function that includes streaks
  const stats = calculateTradeStats(trades);

  // Map to the expected format for the dashboard
  return {
    totalTrades: stats.totalTrades,
    winTrades: stats.winTrades,
    lossTrades: stats.lossTrades,
    breakevenTrades: stats.breakevenTrades,
    winRate: stats.winRate,
    totalPnl: stats.totalPnl,
    avgWin: stats.avgWin,
    avgLoss: stats.avgLoss,
    profitFactor: stats.profitFactor,
    maxWin: stats.maxWin,
    maxLoss: stats.maxLoss,
    avgRMultiple: stats.avgRMultiple,
    avgEfficiency: stats.avgEfficiency,
    totalCommission: stats.totalCommission,
    netPnl: stats.netPnl,
    currentWinStreak: stats.currentWinStreak,
    currentLossStreak: stats.currentLossStreak,
    maxWinStreak: stats.maxWinStreak,
    maxLossStreak: stats.maxLossStreak
  };
};

export const calculateProfitLossChart = (trades: Trade[], period: string) => {
  const closedTrades = trades
    .filter(t => t.exitDate && t.netPnl !== null)
    .sort((a, b) => new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime());

  if (closedTrades.length === 0) return [];

  const chartData: { date: string; cumulative: number; daily: number }[] = [];
  let cumulativePnL = 0;

  // Group trades by period
  const groupedTrades = new Map<string, Trade[]>();
  
  closedTrades.forEach(trade => {
    const date = new Date(trade.exitDate!);
    let key: string;

    switch (period) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        key = String(date.getFullYear());
        break;
      default:
        key = date.toISOString().split('T')[0];
    }

    if (!groupedTrades.has(key)) {
      groupedTrades.set(key, []);
    }
    groupedTrades.get(key)!.push(trade);
  });

  // Calculate cumulative P&L for each period
  Array.from(groupedTrades.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([date, periodTrades]) => {
      const dailyPnL = periodTrades.reduce((sum, t) => sum + t.netPnl!, 0);
      cumulativePnL += dailyPnL;
      
      chartData.push({
        date,
        cumulative: Math.round(cumulativePnL * 100) / 100,
        daily: Math.round(dailyPnL * 100) / 100
      });
    });

  return chartData;
};

export const calculateEfficiencyAnalysis = (trades: Trade[]) => {
  const tradesWithEfficiency = trades.filter(t => 
    t.efficiency !== null && 
    t.maxFavorablePrice !== null && 
    t.maxAdversePrice !== null
  );

  if (tradesWithEfficiency.length === 0) {
    return {
      avgEfficiency: 0,
      bestEfficiency: 0,
      worstEfficiency: 0,
      efficiencyDistribution: [],
      totalMissedProfit: 0
    };
  }

  const efficiencies = tradesWithEfficiency.map(t => t.efficiency!);
  const avgEfficiency = efficiencies.reduce((sum, e) => sum + e, 0) / efficiencies.length;
  const bestEfficiency = Math.max(...efficiencies);
  const worstEfficiency = Math.min(...efficiencies);

  // Calculate efficiency distribution
  const ranges = [
    { range: '0-20%', min: 0, max: 20, count: 0 },
    { range: '21-40%', min: 21, max: 40, count: 0 },
    { range: '41-60%', min: 41, max: 60, count: 0 },
    { range: '61-80%', min: 61, max: 80, count: 0 },
    { range: '81-100%', min: 81, max: 100, count: 0 }
  ];

  efficiencies.forEach(eff => {
    const range = ranges.find(r => eff >= r.min && eff <= r.max);
    if (range) range.count++;
  });

  // Calculate total missed profit
  const totalMissedProfit = tradesWithEfficiency.reduce((sum, trade) => {
    const actualPnL = trade.netPnl || 0;
    const maxPossiblePnL = trade.direction === 'LONG' 
      ? (trade.maxFavorablePrice! - trade.entryPrice) * trade.quantity
      : (trade.entryPrice - trade.maxAdversePrice!) * trade.quantity;
    
    return sum + Math.max(0, maxPossiblePnL - actualPnL);
  }, 0);

  return {
    avgEfficiency: Math.round(avgEfficiency * 100) / 100,
    bestEfficiency: Math.round(bestEfficiency * 100) / 100,
    worstEfficiency: Math.round(worstEfficiency * 100) / 100,
    efficiencyDistribution: ranges,
    totalMissedProfit: Math.round(totalMissedProfit * 100) / 100
  };
};

export const calculateWhatIfScenarios = (trades: Trade[], scenario: string) => {
  const closedTrades = trades.filter(t => t.exitPrice !== null && t.netPnl !== null);
  
  if (closedTrades.length === 0) {
    return {
      scenario,
      originalPnL: 0,
      scenarioPnL: 0,
      difference: 0,
      improvement: 0
    };
  }

  const originalPnL = closedTrades.reduce((sum, t) => sum + t.netPnl!, 0);
  let scenarioPnL: number;

  switch (scenario) {
    case 'perfectEntry':
      // Entry at most favorable price
      scenarioPnL = closedTrades.reduce((sum, trade) => {
        if (!trade.maxAdversePrice) return sum + trade.netPnl!;
        
        const betterEntry = trade.direction === 'LONG' ? trade.maxAdversePrice : trade.maxFavorablePrice!;
        const improvedPnL = trade.direction === 'LONG'
          ? (trade.exitPrice! - betterEntry) * trade.quantity
          : (betterEntry - trade.exitPrice!) * trade.quantity;
        
        return sum + (improvedPnL - (trade.commission || 0));
      }, 0);
      break;

    case 'perfectExit':
      // Exit at most favorable price
      scenarioPnL = closedTrades.reduce((sum, trade) => {
        if (!trade.maxFavorablePrice) return sum + trade.netPnl!;
        
        const betterExit = trade.direction === 'LONG' ? trade.maxFavorablePrice : trade.maxAdversePrice!;
        const improvedPnL = trade.direction === 'LONG'
          ? (betterExit - trade.entryPrice) * trade.quantity
          : (trade.entryPrice - betterExit) * trade.quantity;
        
        return sum + (improvedPnL - (trade.commission || 0));
      }, 0);
      break;

    case 'noStopLoss':
      // All trades run to maximum favorable
      scenarioPnL = closedTrades.reduce((sum, trade) => {
        if (!trade.maxFavorablePrice) return sum + trade.netPnl!;
        
        const maxPnL = trade.direction === 'LONG'
          ? (trade.maxFavorablePrice - trade.entryPrice) * trade.quantity
          : (trade.entryPrice - trade.maxAdversePrice!) * trade.quantity;
        
        return sum + (maxPnL - (trade.commission || 0));
      }, 0);
      break;

    case 'tightStopLoss':
      // Stop loss at 1% from entry
      scenarioPnL = closedTrades.reduce((sum, trade) => {
        const stopPrice = trade.direction === 'LONG' 
          ? trade.entryPrice * 0.99 
          : trade.entryPrice * 1.01;
        
        const exitPrice = trade.maxAdversePrice && 
          ((trade.direction === 'LONG' && trade.maxAdversePrice <= stopPrice) ||
           (trade.direction === 'SHORT' && trade.maxAdversePrice >= stopPrice))
          ? stopPrice
          : trade.exitPrice!;
        
        const pnL = trade.direction === 'LONG'
          ? (exitPrice - trade.entryPrice) * trade.quantity
          : (trade.entryPrice - exitPrice) * trade.quantity;
        
        return sum + (pnL - (trade.commission || 0));
      }, 0);
      break;

    default:
      scenarioPnL = originalPnL;
  }

  const difference = scenarioPnL - originalPnL;
  const improvement = originalPnL !== 0 ? (difference / Math.abs(originalPnL)) * 100 : 0;

  return {
    scenario,
    originalPnL: Math.round(originalPnL * 100) / 100,
    scenarioPnL: Math.round(scenarioPnL * 100) / 100,
    difference: Math.round(difference * 100) / 100,
    improvement: Math.round(improvement * 100) / 100
  };
};

export const calculateStrategyPerformance = (trades: (Trade & { strategy: Strategy | null })[]) => {
  const strategiesMap = new Map<string, Trade[]>();
  
  trades.forEach(trade => {
    if (trade.strategy) {
      const strategyName = trade.strategy.name;
      if (!strategiesMap.has(strategyName)) {
        strategiesMap.set(strategyName, []);
      }
      strategiesMap.get(strategyName)!.push(trade);
    }
  });

  const performance = Array.from(strategiesMap.entries()).map(([name, strategyTrades]) => {
    const stats = calculateDashboardStats(strategyTrades);
    return {
      strategy: name,
      ...stats
    };
  });

  return performance.sort((a, b) => b.totalPnl - a.totalPnl);
};