# 📊 Multi-Account System Implementation Plan
## Trading Diary Application

---

## 🎯 Executive Summary

This document outlines the comprehensive implementation plan for adding a multi-account system to the Trading Diary application. Each user will be able to manage multiple trading accounts, with all trades and statistics filtered by the currently selected account.

---

## 📋 Feature Requirements

### Core Functionality
1. **Multiple Trading Accounts per User**: One-to-many relationship (User → Accounts)
2. **Active Account Selection**: Header dropdown for quick account switching
3. **Account Management UI**: Full CRUD operations from Settings page
4. **Automatic Trade Association**: New trades linked to active account
5. **Statistics Filtering**: All metrics scoped to selected account
6. **Data Isolation**: Complete multi-tenancy at account level

### Account Data Model
```typescript
interface Account {
  // Required fields
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  initialBalance: number;

  // Optional fields
  maxDrawdown?: number;
  profitTarget?: number;
  dataInfo?: {
    accountNumber?: string;
    password?: string;  // Encrypted
    notes?: string;
  };

  // Calculated fields
  currentBalance?: number;
  totalPnL?: number;
  isActive: boolean;

  // Metadata
  updatedAt: Date;
}
```

---

## 🏗️ Architecture Changes

### Database Schema Updates

#### 1. New Account Table
```prisma
model Account {
  id             String    @id @default(cuid())
  userId         String
  name           String
  initialBalance Float
  maxDrawdown    Float?
  profitTarget   Float?
  dataInfo       Json?     // Encrypted JSON for sensitive data
  isActive       Boolean   @default(false)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  // Relations
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  trades         Trade[]

  // Indexes
  @@unique([userId, name])
  @@index([userId, isActive])
  @@map("accounts")
}
```

#### 2. Update Trade Model
```prisma
model Trade {
  // ... existing fields ...
  accountId      String    // New required field
  account        Account   @relation(fields: [accountId], references: [id], onDelete: Cascade)

  // Update indexes
  @@index([accountId, entryDate])
  @@index([userId, accountId, symbol])
}
```

#### 3. Update User Model
```prisma
model User {
  // ... existing fields ...
  accounts       Account[]
  activeAccountId String?  // Track last selected account
}
```

---

## 🔄 Backend API Changes

### New Account Endpoints

#### Account Management
```typescript
// Account Routes
POST   /api/accounts              // Create new account
GET    /api/accounts              // Get all user accounts
GET    /api/accounts/:id          // Get specific account
PUT    /api/accounts/:id          // Update account
DELETE /api/accounts/:id          // Delete account
POST   /api/accounts/:id/activate // Set as active account
```

### Modified Trade Endpoints
All existing trade endpoints need to filter by `accountId`:

```typescript
// Updated query parameters
GET /api/trades?accountId={accountId}&...other_filters

// Trade creation must include accountId
POST /api/trades
{
  accountId: string,  // Required
  ...tradeData
}
```

### Modified Statistics Endpoints
```typescript
GET /api/stats?accountId={accountId}
GET /api/analysis/efficiency?accountId={accountId}
GET /api/analysis/breakeven?accountId={accountId}
```

---

## 🎨 Frontend Changes

### 1. New Components

#### AccountSelector (Header Component)
```typescript
// Location: frontend/src/components/layout/AccountSelector.tsx
interface AccountSelectorProps {
  currentAccount: Account | null;
  accounts: Account[];
  onAccountChange: (accountId: string) => void;
  onManageAccounts: () => void;
}
```

#### AccountManagement (Settings Component)
```typescript
// Location: frontend/src/components/settings/AccountManagement.tsx
interface AccountManagementProps {
  accounts: Account[];
  onCreateAccount: (data: AccountFormData) => void;
  onUpdateAccount: (id: string, data: AccountFormData) => void;
  onDeleteAccount: (id: string) => void;
}
```

### 2. State Management Updates

#### New Account Store
```typescript
// Location: frontend/src/store/accountStore.ts
interface AccountState {
  accounts: Account[];
  activeAccount: Account | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchAccounts: () => Promise<void>;
  createAccount: (data: AccountFormData) => Promise<Account>;
  updateAccount: (id: string, data: Partial<AccountFormData>) => Promise<Account>;
  deleteAccount: (id: string) => Promise<void>;
  setActiveAccount: (accountId: string) => Promise<void>;
  getActiveAccount: () => Account | null;
}
```

#### Update Trade Store
```typescript
interface TradeState {
  // Add account filtering
  activeAccountId: string | null;

  // Modify fetch to include accountId
  fetchTrades: (accountId: string, filters?: TradeFilters) => Promise<void>;
  addTrade: (accountId: string, tradeData: TradeFormData) => Promise<Trade>;
}
```

### 3. UI Modifications

#### Header Component Update
- Add AccountSelector dropdown
- Show active account name and balance
- Quick switch functionality

#### Settings Page
- Add new "Accounts" tab
- Full account management interface
- Account details form with validation

#### Dashboard Updates
- Filter all stats by active account
- Show account-specific metrics
- Account performance comparison (future)

#### Trade Form Updates
- Auto-associate with active account
- Show active account in form header
- Prevent submission without active account

---

## 📊 Implementation Phases

### Phase 1: Database & Backend Foundation (3-4 days)
**Priority: Critical**

1. **Database Schema Changes**
   - Create Account model in Prisma schema
   - Update Trade model with accountId
   - Update User model with activeAccountId
   - Generate and run migrations
   - Create seed data for testing

2. **Backend API Implementation**
   - Implement Account service layer
   - Create Account controllers
   - Set up Account routes
   - Add authentication middleware
   - Implement data encryption for sensitive fields

3. **Update Existing APIs**
   - Modify Trade controllers to filter by accountId
   - Update Statistics services
   - Update Analysis services
   - Add account validation middleware

**Dependencies**: None
**Deliverables**:
- Working Account CRUD API
- Updated Trade APIs with account filtering
- Database migrations completed

---

### Phase 2: Frontend State Management (2 days)
**Priority: Critical**

1. **Create Account Store**
   - Implement Zustand store for accounts
   - Add persistence layer
   - Create action methods
   - Add error handling

2. **Update Existing Stores**
   - Modify Trade store for account filtering
   - Update Settings store
   - Ensure store synchronization

**Dependencies**: Phase 1 (Account API)
**Deliverables**:
- Account store with full functionality
- Updated trade store with account support

---

### Phase 3: UI Components (3-4 days)
**Priority: Critical**

1. **Account Selector Component**
   - Dropdown with account list
   - Current balance display
   - Quick switch functionality
   - Loading states

2. **Account Management Components**
   - Account list view
   - Account form (create/edit)
   - Delete confirmation dialog
   - Validation and error handling

3. **Integration Updates**
   - Update Header with AccountSelector
   - Add Settings route and page
   - Create Accounts tab in Settings

**Dependencies**: Phase 2 (State Management)
**Deliverables**:
- Working AccountSelector in header
- Complete account management UI
- Settings page with Accounts tab

---

### Phase 4: Feature Integration (2-3 days)
**Priority: High**

1. **Trade Form Integration**
   - Add account association
   - Validation for active account
   - Display active account info

2. **Dashboard Integration**
   - Filter all stats by account
   - Update chart data queries
   - Add account info cards

3. **Trade History Integration**
   - Filter trades by account
   - Show account column
   - Update bulk operations

**Dependencies**: Phase 3 (UI Components)
**Deliverables**:
- All features working with account filtering
- Seamless account switching

---

### Phase 5: Data Migration & Testing (2 days)
**Priority: High**

1. **Data Migration**
   - Create default account for existing users
   - Migrate existing trades to default account
   - Backup strategy implementation

2. **Testing**
   - Unit tests for account services
   - Integration tests for APIs
   - Frontend component tests
   - E2E testing scenarios

**Dependencies**: Phase 4 (Feature Integration)
**Deliverables**:
- Migration scripts
- Test coverage report
- Bug fixes

---

### Phase 6: Polish & Optimization (1-2 days)
**Priority: Medium**

1. **Performance Optimization**
   - Query optimization
   - Caching strategy
   - Lazy loading

2. **UX Enhancements**
   - Loading skeletons
   - Error boundaries
   - Success notifications
   - Keyboard shortcuts

**Dependencies**: Phase 5 (Testing)
**Deliverables**:
- Optimized performance
- Enhanced user experience

---

## 🚧 Technical Considerations

### Security
1. **Data Isolation**
   - Strict account-level filtering in all queries
   - Validate account ownership in middleware
   - Prevent cross-account data access

2. **Sensitive Data**
   - Encrypt account credentials (dataInfo)
   - Use environment variables for encryption keys
   - Implement audit logging

### Performance
1. **Database Optimization**
   - Add proper indexes for accountId
   - Optimize JOIN queries
   - Consider query result caching

2. **Frontend Optimization**
   - Cache account list in localStorage
   - Implement optimistic updates
   - Use React.memo for expensive components

### Migration Strategy
1. **Backwards Compatibility**
   - Create default account for existing users
   - Set default account as active
   - Move all existing trades to default account

2. **Rollback Plan**
   - Keep backup of original schema
   - Implement feature flag for gradual rollout
   - Maintain data export functionality

---

## ⚠️ Potential Challenges

### 1. Data Migration Complexity
**Risk**: Existing trades without accountId
**Mitigation**:
- Create migration script with validation
- Test on staging environment first
- Implement dry-run capability

### 2. Performance Impact
**Risk**: Additional JOINs may slow queries
**Mitigation**:
- Add proper database indexes
- Implement query result caching
- Consider denormalization for stats

### 3. State Synchronization
**Risk**: Account switching causing stale data
**Mitigation**:
- Clear caches on account switch
- Implement proper loading states
- Use optimistic UI updates

### 4. User Experience
**Risk**: Confusion during account switching
**Mitigation**:
- Clear visual indicators of active account
- Confirmation dialogs for destructive actions
- Comprehensive onboarding flow

---

## 📝 Questions for Clarification

1. **Account Limits**
   - Should there be a maximum number of accounts per user?
   - Any restrictions for free vs premium users?

2. **Account Types**
   - Do we need different account types (demo, live, paper)?
   - Should accounts have different permission levels?

3. **Data Retention**
   - What happens to trades when an account is deleted?
   - Should we implement soft delete for accounts?

4. **Multi-Currency**
   - Will accounts support different currencies?
   - How should we handle currency conversion?

5. **Reporting**
   - Need for cross-account reporting/comparison?
   - Export functionality per account?

6. **Integration**
   - Future broker API integration requirements?
   - Import trades from broker accounts?

---

## 🎯 Success Metrics

1. **Technical Metrics**
   - Zero data leakage between accounts
   - Query performance < 200ms
   - 100% backward compatibility
   - Zero data loss during migration

2. **User Experience Metrics**
   - Account switch time < 1 second
   - Intuitive account management (< 3 clicks)
   - Clear account context indication
   - No confusion in account selection

3. **Business Metrics**
   - Support for unlimited accounts (per plan)
   - Reduced support tickets about data organization
   - Increased user engagement with multiple strategies

---

## 📅 Timeline Summary

**Total Estimated Time**: 13-16 days

- **Week 1**: Backend implementation + Frontend state management (5-6 days)
- **Week 2**: UI components + Feature integration (5-7 days)
- **Week 3**: Testing + Polish (3-4 days)

**Critical Path**:
Phase 1 → Phase 2 → Phase 3 → Phase 4

**Parallel Work Possible**:
- Documentation during all phases
- Test writing during implementation
- UI design while backend develops

---

## 🔄 Next Steps

1. **Immediate Actions**
   - Review and approve plan
   - Clarify open questions
   - Set up development branch
   - Create database backup

2. **Phase 1 Start**
   - Create Prisma schema changes
   - Design API contracts
   - Set up test data

3. **Communication**
   - Team alignment meeting
   - Set up progress tracking
   - Define success criteria

---

## 📚 References

- [Prisma Relations Documentation](https://www.prisma.io/docs/concepts/components/prisma-schema/relations)
- [Zustand State Management](https://github.com/pmndrs/zustand)
- [React Router Protected Routes](https://reactrouter.com/docs/en/v6)
- [PostgreSQL Indexing Best Practices](https://www.postgresql.org/docs/current/indexes.html)

---

**Document Version**: 1.0
**Created**: 2025-09-16
**Author**: Project Orchestrator
**Status**: Ready for Review