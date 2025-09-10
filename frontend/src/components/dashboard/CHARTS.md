# Trading Diary Dashboard Charts

## Overview
This directory contains professional chart components built with Recharts for visualizing trading performance data.

## Chart Components

### 1. PnLChart.tsx
**Type:** Line Chart  
**Purpose:** Shows cumulative P&L evolution over time  
**Features:**
- Animated line chart with custom dots for each trade
- Color-coded dots (green for profitable trades, red for losses)
- Interactive tooltips showing trade details
- Zero reference line
- Responsive design with custom styling

### 2. WinRateChart.tsx
**Type:** Donut Chart  
**Purpose:** Displays win/loss ratio distribution  
**Features:**
- Donut chart with custom colors for wins/losses/breakeven
- Percentage labels on slices
- Custom legend with trade counts
- Statistics summary below chart
- Empty state for no data

### 3. DailyPnLChart.tsx
**Type:** Bar Chart  
**Purpose:** Shows daily P&L performance  
**Features:**
- Color-coded bars (green for profitable days, red for loss days)
- Configurable time range (default: last 30 days)
- Daily statistics in tooltips
- Success rate calculation
- Zero reference line

### 4. EfficiencyChart.tsx
**Type:** Scatter Plot  
**Purpose:** Analyzes trade efficiency vs P&L  
**Features:**
- Scatter plot with different colors for wins/losses
- Efficiency percentage on Y-axis, P&L on X-axis
- Average efficiency reference line
- Detailed trade information in tooltips
- Educational explanation of efficiency metric

## Chart Utilities

### chartHelpers.ts
Contains utility functions for data processing and formatting:
- `generateCumulativePnLData()` - Processes trades for P&L evolution
- `generateDailyPnLData()` - Aggregates trades by day
- `generateWinRateData()` - Calculates win/loss distribution
- `generateEfficiencyData()` - Prepares efficiency analysis data
- Color constants and formatting functions

## Integration

### Dashboard Integration
All charts are integrated into the main Dashboard component with:
- Responsive grid layout
- Automatic data fetching from Zustand store
- Real-time updates when trades change
- Mobile-friendly design

### Usage Example
```tsx
import { PnLChart, WinRateChart, DailyPnLChart, EfficiencyChart } from '@/components/dashboard';

function MyDashboard() {
  return (
    <div className="grid gap-6">
      <PnLChart height={350} />
      <div className="grid md:grid-cols-3 gap-6">
        <WinRateChart height={300} />
        <DailyPnLChart height={300} days={30} />
        <EfficiencyChart height={300} />
      </div>
    </div>
  );
}
```

## Styling

### Color Scheme
- **Profit/Wins:** #10b981 (green-500)
- **Loss:** #ef4444 (red-500)
- **Neutral:** #6b7280 (gray-500)
- **Primary:** #3b82f6 (blue-500)
- **Grid:** #e5e7eb (gray-200)

### Responsive Design
- Mobile-first approach
- Flexible grid layouts
- Adjustable chart heights
- Touch-friendly tooltips

## Empty States
Each chart includes thoughtful empty states when no data is available:
- Relevant icons and messaging
- Guidance on how to populate with data
- Consistent styling with the rest of the application

## Performance
- Lazy loading of chart data
- Optimized re-renders with React.memo (where appropriate)
- Efficient data processing with memoized calculations
- Smooth animations with reasonable duration

## Demo Component
`ChartDemo.tsx` provides a preview of all charts with sample data for:
- Development and testing
- User onboarding
- Design validation

## Dependencies
- `recharts` - Chart library
- `date-fns` - Date formatting and manipulation
- `@/store/tradeStore` - Zustand store for trade data
- `@/types` - TypeScript type definitions
- `@/components/ui/*` - shadcn/ui components for consistent styling