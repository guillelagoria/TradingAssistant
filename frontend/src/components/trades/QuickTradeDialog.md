# Quick Trade Logger

Ultra-fast trade entry component with keyboard shortcuts and minimalist design.

## Features

### 🚀 Speed Optimized
- **< 100ms Backend Response**: Dedicated quick endpoint with minimal validation
- **Auto-focus**: Immediate keyboard access when opened
- **Smart Defaults**: Pre-fills common fields automatically
- **Background Processing**: Account balance updates happen asynchronously

### ⌨️ Keyboard Shortcuts
- `Ctrl+Alt+B` - Open quick trade with LONG direction
- `Ctrl+Alt+S` - Open quick trade with SHORT direction
- `Enter` - Navigate to next field / Submit when complete
- `Tab` (on direction field) - Toggle LONG/SHORT
- `Esc` - Close dialog

### 🧠 Smart Features
- **Clipboard Detection**: Automatically fills symbol from clipboard if valid
- **Last Trade Symbol**: Pre-fills from most recent trade symbol
- **Direction Pre-fill**: Supports opening with specific direction (LONG/SHORT)
- **Field Validation**: Real-time validation with clear error messages

### 📱 User Experience
- **Minimalist Design**: Only essential fields for maximum speed
- **Visual Feedback**: Animated direction toggle with color coding
- **Progress Indicators**: Loading states and success feedback
- **Tooltips**: Helpful hints for keyboard shortcuts

## Usage

### Integration in Header
```typescript
import QuickTradeDialog from '@/components/trades/QuickTradeDialog';
import { useQuickTradeShortcuts } from '@/hooks/useQuickTradeShortcuts';

// In component:
const [quickTradeOpen, setQuickTradeOpen] = useState(false);
const [quickTradeDirection, setQuickTradeDirection] = useState<'LONG' | 'SHORT' | undefined>();

// Setup shortcuts
useQuickTradeShortcuts({
  onOpenQuickTrade: (direction) => {
    setQuickTradeDirection(direction);
    setQuickTradeOpen(true);
  },
  enabled: true
});

// Render dialog
<QuickTradeDialog
  open={quickTradeOpen}
  onOpenChange={setQuickTradeOpen}
  prefilledDirection={quickTradeDirection}
/>
```

### Standalone Usage
```typescript
<QuickTradeDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  prefilledDirection="LONG" // Optional
/>
```

## API Integration

Uses the optimized `/api/trades/quick` endpoint:

### Request Format
```json
{
  "symbol": "ES",
  "direction": "LONG",
  "entryPrice": 4580.75,
  "quantity": 1,
  "stopLoss": 4570.00
}
```

### Response Format
```json
{
  "success": true,
  "data": {
    "id": "trade-id",
    "symbol": "ES",
    "direction": "LONG",
    "source": "QUICK_LOGGER",
    // ... other trade fields
  },
  "meta": {
    "source": "QUICK_LOGGER",
    "responseTime": "4ms"
  }
}
```

## Technical Details

### Backend Optimizations
- Minimal validation for speed (only required fields)
- Async balance updates (non-blocking)
- Smart defaults applied server-side
- Response time tracking

### Frontend Optimizations
- Auto-focus management
- Keyboard navigation flow
- Real-time form validation
- Smooth animations with Framer Motion

### Database Schema
Trades created via Quick Logger are marked with:
- `source: "QUICK_LOGGER"`
- `orderType: "MARKET"`
- `notes: "Quick Logger Entry"`

## Best Practices

1. **Speed First**: Minimize required fields
2. **Keyboard Driven**: Support full keyboard navigation
3. **Visual Feedback**: Clear success/error states
4. **Non-blocking**: Don't wait for balance updates
5. **Smart Defaults**: Reduce user input where possible

## Performance Metrics

- **Target Response Time**: < 100ms
- **Actual Response Time**: 2-4ms (measured)
- **UI Interaction Time**: < 50ms to first input
- **Total Entry Time**: < 10 seconds for experienced users