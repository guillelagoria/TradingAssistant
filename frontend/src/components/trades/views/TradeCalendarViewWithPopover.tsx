import React, { useState } from 'react';
import { Trade } from '@/types';
import TradeCalendarView from './TradeCalendarView';
import DayDetailPopover from './DayDetailPopover';

interface TradeCalendarViewWithPopoverProps {
  trades: Trade[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  onViewTrade: (trade: Trade) => void;
  onEditTrade?: (trade: Trade) => void;
  onDeleteTrade?: (trade: Trade) => void;
  onAddTrade?: (date: Date) => void;
  loading?: boolean;
  className?: string;
}

interface DayPopoverState {
  isOpen: boolean;
  date: Date | null;
  trades: Trade[];
}

/**
 * TradeCalendarViewWithPopover
 *
 * Enhanced version of TradeCalendarView that integrates the DayDetailPopover
 * for better handling of multiple trades per day.
 *
 * Features:
 * - Shows detailed popover when clicking on a day with trades
 * - Responsive: popover on desktop, sheet on mobile
 * - Individual trade actions (view, edit, delete)
 * - Quick add trade functionality
 * - Professional animations and styling
 */
export default function TradeCalendarViewWithPopover({
  trades,
  currentMonth,
  onMonthChange,
  onViewTrade,
  onEditTrade,
  onDeleteTrade,
  onAddTrade,
  loading = false,
  className
}: TradeCalendarViewWithPopoverProps) {
  const [dayPopover, setDayPopover] = useState<DayPopoverState>({
    isOpen: false,
    date: null,
    trades: []
  });

  // Handle day click from calendar
  const handleDayClick = (date: Date, dayTrades: Trade[]) => {
    // If there are multiple trades, show the popover
    if (dayTrades.length > 1) {
      setDayPopover({
        isOpen: true,
        date,
        trades: dayTrades
      });
    }
    // If there's only one trade, view it directly
    else if (dayTrades.length === 1) {
      onViewTrade(dayTrades[0]);
    }
    // If no trades, add a new one if callback is provided
    else if (onAddTrade) {
      onAddTrade(date);
    }
  };

  // Close popover
  const handleClosePopover = () => {
    setDayPopover({
      isOpen: false,
      date: null,
      trades: []
    });
  };

  // Handle view trade from popover
  const handleViewTradeFromPopover = (trade: Trade) => {
    handleClosePopover();
    onViewTrade(trade);
  };

  // Handle edit trade from popover
  const handleEditTradeFromPopover = (trade: Trade) => {
    handleClosePopover();
    if (onEditTrade) {
      onEditTrade(trade);
    }
  };

  // Handle delete trade from popover
  const handleDeleteTradeFromPopover = (trade: Trade) => {
    if (onDeleteTrade) {
      onDeleteTrade(trade);
    }
    // Keep popover open after delete to show updated list
  };

  // Handle add trade from popover
  const handleAddTradeFromPopover = (date: Date) => {
    handleClosePopover();
    if (onAddTrade) {
      onAddTrade(date);
    }
  };

  return (
    <>
      {/* Standard Calendar View */}
      <TradeCalendarView
        trades={trades}
        currentMonth={currentMonth}
        onMonthChange={onMonthChange}
        onDayClick={handleDayClick}
        loading={loading}
        className={className}
      />

      {/* Day Detail Popover */}
      {dayPopover.date && (
        <DayDetailPopover
          trades={dayPopover.trades}
          date={dayPopover.date}
          isOpen={dayPopover.isOpen}
          onClose={handleClosePopover}
          onViewTrade={handleViewTradeFromPopover}
          onEditTrade={onEditTrade ? handleEditTradeFromPopover : undefined}
          onDeleteTrade={onDeleteTrade ? handleDeleteTradeFromPopover : undefined}
          onAddTrade={onAddTrade ? handleAddTradeFromPopover : undefined}
        >
          {/* This children prop is not used in this case since we control state manually */}
          <div />
        </DayDetailPopover>
      )}
    </>
  );
}

/*
Usage Example:

```tsx
import { TradeCalendarViewWithPopover } from '@/components/trades';

function TradingCalendar() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleViewTrade = (trade: Trade) => {
    // Open trade details modal
  };

  const handleEditTrade = (trade: Trade) => {
    // Open edit trade form
  };

  const handleDeleteTrade = (trade: Trade) => {
    // Show confirmation and delete
  };

  const handleAddTrade = (date: Date) => {
    // Open new trade form with pre-filled date
  };

  return (
    <TradeCalendarViewWithPopover
      trades={trades}
      currentMonth={currentMonth}
      onMonthChange={setCurrentMonth}
      onViewTrade={handleViewTrade}
      onEditTrade={handleEditTrade}
      onDeleteTrade={handleDeleteTrade}
      onAddTrade={handleAddTrade}
    />
  );
}
```

Key Features:

1. **Smart Day Handling**:
   - Multiple trades: Shows detailed popover
   - Single trade: Direct view
   - No trades: Quick add (if enabled)

2. **Responsive Design**:
   - Desktop: Elegant popover with backdrop blur
   - Mobile: Bottom sheet for better touch interaction

3. **Individual Trade Actions**:
   - View trade details
   - Edit trade (if callback provided)
   - Delete trade (if callback provided)
   - Quick trade cards with hover effects

4. **Professional UX**:
   - Smooth animations with Framer Motion
   - Glass morphism styling
   - Color-coded P&L indicators
   - Accessibility support (keyboard navigation, screen readers)

5. **Day Summary**:
   - Total P&L for the day
   - Win/loss breakdown
   - Trade count and win rate
   - Open trades indicator

This enhanced calendar view provides a much better user experience
for traders who frequently have multiple trades per day, while
maintaining the simplicity for days with single or no trades.
*/