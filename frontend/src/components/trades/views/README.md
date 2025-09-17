# Trade Calendar View

A modern, animated calendar component for visualizing trading data by date.

## Features

- **Monthly Calendar Grid**: Clean calendar layout with date navigation
- **Trade Information**: Shows trade count, P&L, win/loss breakdown per day
- **Visual Indicators**: Color-coded cells based on profitability
- **Interactive Elements**: Click days to view trade details
- **Responsive Design**: Works on mobile and desktop
- **Framer Motion Animations**: Smooth transitions and micro-interactions
- **Empty State Handling**: Shows helpful prompts for days without trades
- **Open Trade Indicators**: Animated indicators for active trades

## Usage

```typescript
import { TradeCalendarView } from '@/components/trades';

function MyComponent() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleDayClick = (date: Date, trades: Trade[]) => {
    // Handle day click - show trade details, navigate to form, etc.
  };

  return (
    <TradeCalendarView
      trades={trades}
      currentMonth={currentMonth}
      onMonthChange={setCurrentMonth}
      onDayClick={handleDayClick}
      loading={loading}
    />
  );
}
```

## Props

- `trades`: Array of Trade objects to display
- `currentMonth`: Date object representing the current month to display
- `onMonthChange`: Callback when user navigates between months
- `onDayClick`: Callback when user clicks on a calendar day
- `loading`: Optional loading state
- `className`: Optional additional CSS classes

## Visual Design

- **Green days**: Profitable trading days
- **Red days**: Loss days
- **Amber days**: Breakeven days
- **Blue pulse**: Days with open trades
- **Today highlight**: Blue ring around current date
- **Symbol badges**: Shows top symbols traded each day

## Integration

The calendar view is integrated into the Trade History page with a table/calendar view toggle. Users can seamlessly switch between the detailed table view and the visual calendar overview.