# NewTradeForm Component

## Overview
A modern, single-form trade input component built with shadcn/ui and Framer Motion animations. This component replaces the previous multi-step wizard approach with a streamlined, animated form that provides real-time calculations and comprehensive validation.

## Features

### ✨ User Experience
- **Smooth Animations**: Market selection triggers form fields to slide in elegantly
- **Real-time Calculations**: P&L, efficiency, and risk metrics update as you type
- **Modern Design**: Glassmorphism-inspired styling with beautiful gradients
- **Responsive Layout**: Works perfectly on all screen sizes
- **Loading States**: Skeleton UI and loading indicators throughout

### 📊 Trade Management
- **Complete Trade Data**: All essential fields from entry to exit
- **Smart Validation**: Real-time validation with helpful error messages
- **Auto-calculations**: Profit/Loss, Risk/Reward ratios, efficiency metrics
- **Market Awareness**: Popular trading symbols with search capability

### 🎨 Interactive Elements
- **Mood Rating**: 5-point emoji scale with hover effects (😢 😕 😐 😊 😄)
- **Image Upload**: Drag & drop chart screenshots with preview
- **Expandable Details**: Accordion-style optional fields
- **Smart Inputs**: Type-aware inputs with proper validation

### 📈 Real-time Analytics
- **Live P&L Calculation**: Updates as you enter prices
- **R-Multiple Display**: Risk/reward ratio in real-time
- **Efficiency Tracking**: How much of favorable move was captured
- **Commission Calculation**: Automatic commission and net P&L

## Component Structure

### Props Interface
```typescript
interface NewTradeFormProps {
  onSubmit: (trade: TradeFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<TradeFormData>;
  isLoading?: boolean;
}
```

### Form Layout
1. **Market Selection** - Required dropdown with popular symbols
2. **Trade Details** - Direction, prices, quantities, dates
3. **Mood Rating** - Emoji-based sentiment tracking
4. **Image Upload** - Chart screenshot with preview
5. **Optional Details** - Expandable accordion section
6. **Live Summary** - Real-time calculation display
7. **Form Actions** - Save and cancel buttons

## Animation Flow

### Entry Animation
- Form starts with just market selection visible
- Selecting a market triggers a smooth slide-in of all other fields
- Each section has staggered entrance timing for visual polish

### Interactive Animations
- Mood emojis scale on hover (110%) and tap (95%)
- Image upload shows smooth fade-in with preview
- Accordion expands with height animation
- Summary cards slide in from the bottom

### Loading States
- Button shows spinner during submission
- Form fields disable during loading
- Smooth transitions between states

## Usage Examples

### Basic Usage
```tsx
import NewTradeForm from '@/components/trades/NewTradeForm';

function TradePage() {
  const handleSubmit = async (tradeData: TradeFormData) => {
    await saveTradeToAPI(tradeData);
  };

  return (
    <NewTradeForm
      onSubmit={handleSubmit}
      onCancel={() => navigate('/trades')}
    />
  );
}
```

### Pre-filled Form
```tsx
const initialData = {
  symbol: 'AAPL',
  direction: TradeDirection.LONG,
  entryPrice: 150.25,
  quantity: 100
};

<NewTradeForm
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  initialData={initialData}
/>
```

### With Loading State
```tsx
const { addTrade, loading } = useTradeStore();

<NewTradeForm
  onSubmit={addTrade}
  onCancel={handleCancel}
  isLoading={loading}
/>
```

## Key Features Implementation

### Real-time Calculations
- Uses `useMemo` with form watch for performance
- Debounced updates (300ms) to prevent excessive recalculations
- Shows P&L, percentage, R-multiple, efficiency in live summary

### Form Validation
- Real-time validation using react-hook-form
- Custom validation rules for trading logic
- Stop loss and take profit price validation based on direction
- Date validation ensuring exit after entry

### Image Handling
- File upload with image preview
- Drag & drop support
- Image removal functionality
- Base64 encoding for form submission

### Accessibility
- Full keyboard navigation support
- ARIA labels for all interactive elements
- Screen reader friendly
- Proper focus management
- Color contrast compliant

## Dependencies
- **shadcn/ui**: Form, Input, Select, Button, Card, Badge, Textarea, Accordion
- **framer-motion**: Animations and transitions
- **react-hook-form**: Form state management and validation
- **lucide-react**: Icons throughout the interface
- **date-fns**: Date handling and formatting

## Integration
The component integrates seamlessly with the existing tradeStore via the `ModernTradeFormPage` wrapper, which handles navigation and error states.

## Performance
- Optimized re-renders with React.memo and useMemo
- Efficient form field watching
- Lazy loading of heavy animations
- Minimal bundle size impact with tree-shaking

## Browser Support
- Chrome/Safari/Firefox/Edge (latest 2 versions)
- Mobile responsive design
- Touch-friendly interactions
- Smooth animations on all platforms