# Settings System Documentation

## Overview

The comprehensive settings system provides a complete user preferences and configuration management solution for the Trading Diary application. It includes settings for trading preferences, display customization, account management, and notifications.

## Architecture

### Components Structure

```
src/components/settings/
├── UserSettings.tsx          # Main settings container with tabs
├── TradingPreferences.tsx    # Trading-specific settings
├── DisplayPreferences.tsx    # UI and display settings
├── AccountSettings.tsx       # Account management settings
├── NotificationSettings.tsx  # Alerts and notifications
└── index.ts                 # Component exports
```

### Core Files

```
src/utils/
├── settingsHelpers.ts       # Validation, formatting, import/export
├── preferenceStore.ts       # Local storage management
└── ...

src/hooks/
├── useSettings.ts           # Main settings hook
└── ...

src/types/
├── user.ts                  # Settings types and defaults
└── ...
```

## Features

### 1. Trading Preferences
- **Default Trading Parameters**: Commission, position size, risk tolerance
- **Risk Management**: Stop loss and take profit defaults
- **Favorite Symbols**: Quick access trading instruments
- **Default Timeframes**: Common analysis timeframes
- **Trading Strategies**: Custom strategy management
- **Auto-Calculate Settings**: Toggle automatic calculations

### 2. Display Preferences
- **Theme Selection**: Light, dark, or system theme
- **Currency Display**: Symbol, position, decimal places
- **Number Formatting**: Thousands separator, decimal places
- **Date/Time Formats**: Customizable date and time display
- **Chart Configuration**: Colors, grid lines, labels
- **Dashboard Layout**: Density, cards per row, default view
- **Table Settings**: Pagination, visible columns, styling

### 3. Account Settings
- **Profile Management**: Name, email, avatar, bio
- **Security Settings**: 2FA, session timeout, login history
- **Data Management**: Backup, retention, export format
- **Privacy Controls**: Analytics sharing, data collection

### 4. Notification Settings
- **Email Notifications**: Trade alerts, reports, system updates
- **Browser Notifications**: Real-time alerts and reminders
- **Risk Management Alerts**: Loss limits, drawdown warnings
- **Performance Notifications**: Progress updates, milestones

## Usage

### Basic Usage

```tsx
import { useSettings } from '@/hooks/useSettings';

function MyComponent() {
  const {
    preferences,
    updatePreferences,
    saveSettings,
    isDirty,
    validationErrors
  } = useSettings();

  const handleTradingUpdate = (trading: Partial<TradingPreferences>) => {
    updatePreferences({ trading });
  };

  return (
    <div>
      <input
        value={preferences.trading.defaultCommission}
        onChange={(e) => handleTradingUpdate({
          defaultCommission: parseFloat(e.target.value) || 0
        })}
      />
      {isDirty && <button onClick={saveSettings}>Save</button>}
    </div>
  );
}
```

### Category-Specific Hooks

```tsx
import { useTradingPreferences, useDisplayPreferences } from '@/hooks/useSettings';

// Use specific preference categories
function TradingSettings() {
  const { preferences, updatePreferences, validationErrors } = useTradingPreferences();
  
  return (
    <input
      value={preferences.defaultCommission}
      onChange={(e) => updatePreferences({
        defaultCommission: parseFloat(e.target.value) || 0
      })}
    />
  );
}
```

### Theme and Formatting

```tsx
import { useTheme, useCurrencyFormat, useDateFormat } from '@/hooks/useSettings';

function MyComponent() {
  const { theme, setTheme } = useTheme();
  const { formatCurrency } = useCurrencyFormat();
  const { formatDate } = useDateFormat();

  return (
    <div>
      <button onClick={() => setTheme('dark')}>Dark Mode</button>
      <p>Balance: {formatCurrency(1234.56)}</p>
      <p>Date: {formatDate(new Date(), true)}</p>
    </div>
  );
}
```

## Data Persistence

### Local Storage
- Automatic saving to localStorage
- Cross-tab synchronization
- Backup creation
- Migration support

### Backend Integration
Settings are structured for easy backend integration:

```tsx
// The saveSettings function can be extended to sync with backend
const saveSettings = async () => {
  // Validate locally
  const errors = validatePreferences(preferences);
  if (hasErrors(errors)) throw new Error('Validation failed');
  
  // Save to backend (TODO: implement)
  // await api.updateUserPreferences(preferences);
  
  // Mark as clean locally
  preferenceStore.saveChanges();
};
```

## Validation System

### Built-in Validation
- Type checking with TypeScript
- Range validation (e.g., position size 0.1-100%)
- Format validation (email, colors, symbols)
- Required field validation

### Custom Validation
```tsx
import { validatePreferences } from '@/utils/settingsHelpers';

const errors = validatePreferences(preferences);
// Returns: { trading?: {...}, display?: {...}, ... }
```

## Import/Export

### Export Settings
```tsx
const { exportSettings } = useSettings();

const handleExport = async () => {
  const data = await exportSettings();
  // Download as JSON file
  const blob = new Blob([data], { type: 'application/json' });
  // ... download logic
};
```

### Import Settings
```tsx
const { importSettings } = useSettings();

const handleImport = async (file: File) => {
  const text = await file.text();
  await importSettings(text);
};
```

## Extension Points

### Adding New Settings

1. **Update Types** (`src/types/user.ts`):
```tsx
export interface TradingPreferences {
  // existing fields...
  newFeature: boolean;
}
```

2. **Update Defaults**:
```tsx
export const DEFAULT_PREFERENCES = {
  trading: {
    // existing defaults...
    newFeature: false,
  },
  // ...
};
```

3. **Add Validation** (`src/utils/settingsHelpers.ts`):
```tsx
export function validateTradingPreferences(preferences: TradingPreferences) {
  const errors: Record<string, string> = {};
  
  // existing validations...
  if (typeof preferences.newFeature !== 'boolean') {
    errors.newFeature = 'Must be a boolean value';
  }
  
  return errors;
}
```

4. **Update UI Component**:
```tsx
// In TradingPreferences.tsx
<Switch
  checked={preferences.newFeature}
  onCheckedChange={(checked) => handleInputChange('newFeature', checked)}
/>
```

### Custom Hooks

Create specialized hooks for common use cases:

```tsx
// src/hooks/useRiskManagement.ts
export function useRiskManagement() {
  const { preferences, updatePreferences } = useSettings();
  
  const setMaxDailyLoss = (percent: number) => {
    updatePreferences({
      notifications: {
        ...preferences.notifications,
        risk: {
          ...preferences.notifications.risk,
          dailyLossLimit: percent,
        },
      },
    });
  };
  
  return {
    maxDailyLoss: preferences.notifications.risk.dailyLossLimit,
    setMaxDailyLoss,
  };
}
```

## Best Practices

### Performance
- Use category-specific hooks when possible
- Avoid unnecessary re-renders with React.memo
- Debounce rapid updates

### User Experience
- Show validation errors immediately
- Provide live preview of changes
- Auto-save with clear dirty state indicators
- Confirm destructive actions (reset, delete)

### Data Integrity
- Always validate before saving
- Create backups before major changes
- Handle migration between setting versions
- Gracefully handle corrupted data

## Testing

### Unit Tests
Test individual validation and formatting functions:

```tsx
import { validateTradingPreferences, formatCurrency } from '@/utils/settingsHelpers';

describe('Settings validation', () => {
  it('should validate position size range', () => {
    const preferences = { defaultPositionSizePercent: 150 };
    const errors = validateTradingPreferences(preferences);
    expect(errors.defaultPositionSizePercent).toBeDefined();
  });
});
```

### Integration Tests
Test the complete settings flow with React Testing Library:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { UserSettings } from '@/components/settings/UserSettings';

test('should update trading commission', async () => {
  render(<UserSettings />);
  
  const input = screen.getByLabelText(/commission/i);
  fireEvent.change(input, { target: { value: '5.00' } });
  
  expect(input.value).toBe('5.00');
});
```

## Troubleshooting

### Common Issues

1. **Settings not persisting**
   - Check localStorage quota
   - Verify JSON serialization
   - Check for storage event conflicts

2. **Validation errors**
   - Review validation rules
   - Check data types
   - Ensure required fields are present

3. **Theme not applying**
   - Check CSS variable updates
   - Verify theme provider integration
   - Check for CSS specificity issues

4. **Import/Export failures**
   - Validate JSON format
   - Check for version compatibility
   - Ensure all required fields are present