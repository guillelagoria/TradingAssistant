# Multi-Account System Implementation

## Overview

This document describes the comprehensive frontend implementation for the multi-account trading diary system. The system allows users to manage multiple trading accounts (Demo and Live), switch between them seamlessly, and maintain separate trading records and statistics for each account.

## Features

- 🏦 **Multiple Account Support**: Demo and Live account types
- 🔄 **Seamless Account Switching**: Quick account selection with real-time updates
- 📊 **Account-Specific Statistics**: Independent P&L, win rates, and performance metrics
- 💰 **Multi-Currency Support**: USD, EUR, GBP, JPY, CHF, CAD, AUD
- 🎨 **Modern UI Components**: Built with shadcn/ui and Framer Motion animations
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🔐 **Type Safety**: Full TypeScript implementation
- ⚡ **Performance Optimized**: Zustand state management with selective re-renders

## Architecture

### File Structure
```
frontend/src/
├── types/
│   └── account.ts              # Account TypeScript types and interfaces
├── services/
│   └── accountService.ts       # API service for account operations
├── store/
│   └── accountStore.ts         # Zustand store for account state management
└── components/
    └── layout/
        ├── AccountSelector.tsx  # Main account selector component
        └── AccountDemo.tsx      # Demo/example component
```

### Core Components

#### 1. Account Types (`/types/account.ts`)

Comprehensive TypeScript definitions including:

- **Core Types**: `Account`, `AccountStats`, `AccountSummary`
- **Request/Response Types**: `CreateAccountRequest`, `UpdateAccountRequest`, API response types
- **Enums**: `AccountType` (DEMO/LIVE), `SubscriptionTier`, supported currencies
- **Component Props**: `AccountSelectorProps`, `AccountCardProps`
- **Validation Types**: `AccountValidationErrors`

```typescript
interface Account {
  id: string;
  userId: string;
  name: string;
  accountType: AccountType;
  currency: string;
  creationDate: Date;
  initialBalance: number;
  currentBalance?: number;
  // ... additional fields
}
```

#### 2. Account Service (`/services/accountService.ts`)

Complete API service with methods for:

- **CRUD Operations**: Create, read, update, delete accounts
- **Account Management**: Set active account, get account statistics
- **Data Export**: Export account data in CSV/JSON formats
- **Validation**: Account name uniqueness validation
- **Performance Metrics**: Get account performance over time

```typescript
export const accountService = {
  getAccounts(): Promise<Account[]>,
  createAccount(data: CreateAccountRequest): Promise<Account>,
  updateAccount(id: string, data: UpdateAccountRequest): Promise<Account>,
  deleteAccount(id: string): Promise<void>,
  setActiveAccount(accountId: string): Promise<void>,
  getAccountStats(accountId: string): Promise<AccountStats>,
  // ... additional methods
};
```

#### 3. Account Store (`/store/accountStore.ts`)

Zustand-based state management with:

- **State Management**: Accounts list, active account, statistics, loading/error states
- **Actions**: All CRUD operations, account switching, statistics management
- **Persistence**: Active account persistence via localStorage
- **Selectors**: Optimized hooks for component consumption
- **Initialization**: Auto-load accounts and restore active account

```typescript
const useAccountStore = create<AccountState>()((set, get) => ({
  // State
  accounts: [],
  activeAccount: null,
  accountStats: {},
  loading: false,
  error: null,

  // Actions
  fetchAccounts: async () => { /* ... */ },
  switchAccount: async (accountId: string) => { /* ... */ },
  // ... additional actions
}));
```

#### 4. Account Selector Component (`/components/layout/AccountSelector.tsx`)

Feature-rich UI component with:

- **Visual Design**: Modern card-based layout with avatars and badges
- **Real-time Data**: Balance display, P&L indicators, account type badges
- **Animations**: Framer Motion animations for smooth interactions
- **Responsive**: Adapts to different screen sizes
- **Accessibility**: WCAG compliant with proper ARIA labels
- **Customizable**: Props for showing/hiding features, custom handlers

```typescript
interface AccountSelectorProps {
  className?: string;
  showBalance?: boolean;
  showCreateButton?: boolean;
  onCreateAccount?: () => void;
}
```

## Usage Examples

### 1. Initialize the Account Store

In your app's root component:

```typescript
import { useEffect } from 'react';
import { initializeAccountStore } from '@/store/accountStore';

function App() {
  useEffect(() => {
    // Initialize account store on app load
    initializeAccountStore();
  }, []);

  return <YourAppComponents />;
}
```

### 2. Use Account Hooks in Components

```typescript
import {
  useActiveAccount,
  useAccounts,
  useAccountStats,
  useAccountActions
} from '@/store/accountStore';

function TradingDashboard() {
  const activeAccount = useActiveAccount();
  const accounts = useAccounts();
  const accountStats = useAccountStats();
  const { switchAccount, createAccount } = useAccountActions();

  // Component logic using account data
  return (
    <div>
      <h1>Welcome to {activeAccount?.name}</h1>
      <p>Balance: {formatCurrency(activeAccount?.currentBalance)}</p>
      {/* ... rest of component */}
    </div>
  );
}
```

### 3. Add Account Selector to Layout

```typescript
import AccountSelector from '@/components/layout/AccountSelector';

function Header() {
  const handleCreateAccount = () => {
    // Navigate to account creation or open modal
    navigate('/accounts/new');
  };

  return (
    <header>
      <div className="brand">...</div>

      <AccountSelector
        showBalance={true}
        showCreateButton={true}
        onCreateAccount={handleCreateAccount}
      />

      <div className="user-menu">...</div>
    </header>
  );
}
```

### 4. Filter Trades by Active Account

```typescript
import { useActiveAccount } from '@/store/accountStore';
import { useTradeStore } from '@/store/tradeStore';

function TradeList() {
  const activeAccount = useActiveAccount();
  const { trades, fetchTrades } = useTradeStore();

  useEffect(() => {
    if (activeAccount) {
      // Fetch trades for active account
      fetchTrades({ accountId: activeAccount.id });
    }
  }, [activeAccount, fetchTrades]);

  return (
    <div>
      {trades.map(trade => (
        <TradeCard key={trade.id} trade={trade} />
      ))}
    </div>
  );
}
```

## Integration with Existing Codebase

### 1. Update Trade Store

The trade store should be updated to filter trades by active account:

```typescript
// In tradeStore.ts
const { getActiveAccountId } = useAccountStore.getState();

fetchTrades: async (filters = {}) => {
  const activeAccountId = getActiveAccountId();
  if (activeAccountId) {
    filters.accountId = activeAccountId;
  }
  // ... existing fetch logic
}
```

### 2. Update API Calls

Ensure all trade-related API calls include the account context:

```typescript
// Add account ID to trade creation
const createTrade = async (tradeData) => {
  const activeAccountId = getActiveAccountId();
  return tradesService.createTrade({
    ...tradeData,
    accountId: activeAccountId
  });
};
```

### 3. Update Navigation

Add account context to route guards and navigation:

```typescript
// Protect routes that require an active account
function ProtectedRoute({ children }) {
  const activeAccount = useActiveAccount();

  if (!activeAccount) {
    return <AccountSelectionPage />;
  }

  return children;
}
```

## Styling and Theming

The components use Tailwind CSS classes and follow the existing design system:

- **Colors**: Blue for Demo accounts, Green for Live accounts
- **Typography**: Consistent with shadcn/ui design tokens
- **Spacing**: Uses standard Tailwind spacing scale
- **Animations**: Subtle Framer Motion animations
- **Dark Mode**: Full dark mode support

## Performance Considerations

- **Selective Re-renders**: Zustand selectors prevent unnecessary re-renders
- **Lazy Loading**: Account statistics loaded on demand
- **Local Storage**: Active account persisted for fast app initialization
- **Error Boundaries**: Graceful error handling with user feedback
- **Optimistic Updates**: UI updates before API confirmation

## Testing Recommendations

### Unit Tests
- Account service API methods
- Account store actions and state updates
- Component rendering with different props

### Integration Tests
- Account switching flow
- Statistics loading and display
- Error handling scenarios

### E2E Tests
- Complete account creation flow
- Account switching and data persistence
- Multi-account trade management

## Security Considerations

- **Multi-tenancy**: Users can only access their own accounts
- **Input Validation**: All account data validated on frontend and backend
- **Authentication**: JWT tokens required for all account operations
- **Authorization**: Account-level permissions enforced
- **Data Sanitization**: All user inputs sanitized before storage

## Future Enhancements

- **Account Templates**: Predefined account setups for different trading styles
- **Account Sharing**: Controlled sharing of account statistics
- **Advanced Analytics**: Cross-account performance comparison
- **Account Backup**: Export/import account configurations
- **Account Archiving**: Soft delete with restore capability

## API Requirements

The frontend expects these backend endpoints:

```
GET    /api/accounts                    # Get user's accounts
POST   /api/accounts                    # Create new account
GET    /api/accounts/:id                # Get specific account
PUT    /api/accounts/:id                # Update account
DELETE /api/accounts/:id                # Delete account
POST   /api/accounts/:id/activate       # Set as active account
GET    /api/accounts/active             # Get current active account
GET    /api/accounts/:id/stats          # Get account statistics
GET    /api/accounts/summary            # Get accounts summary
GET    /api/accounts/:id/performance    # Get performance over time
GET    /api/accounts/:id/export         # Export account data
```

## Configuration

Environment variables for account system:

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_MAX_ACCOUNTS_PER_USER=10
VITE_DEFAULT_CURRENCY=USD
VITE_ENABLE_ACCOUNT_SHARING=false
```

## Troubleshooting

### Common Issues

1. **Account not switching**: Check if `initializeAccountStore()` is called
2. **Statistics not loading**: Verify API endpoints are accessible
3. **Components not re-rendering**: Ensure using the correct Zustand selectors
4. **TypeScript errors**: Check if all account types are properly imported

### Debug Mode

Enable debug logging:

```typescript
// In accountStore.ts
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Account store action:', action, payload);
}
```

## Support

For issues or questions regarding the multi-account system:

1. Check this documentation
2. Review the demo component (`AccountDemo.tsx`)
3. Examine TypeScript types for API contracts
4. Test with the provided examples

---

This implementation provides a complete, production-ready multi-account system that integrates seamlessly with the existing Trading Diary application while maintaining code quality, performance, and user experience standards.