# Account Service Documentation

## Overview
The Account Service provides comprehensive account management functionality for the Trading Diary application. It enables users to create multiple trading accounts with different configurations, supporting multi-account trading setups with subscription-based limits.

## Service Location
- **Service**: `/backend/src/services/account.service.ts`
- **Controller**: `/backend/src/controllers/account.controller.ts`
- **Routes**: `/backend/src/routes/account.routes.ts`
- **Validation**: `/backend/src/middleware/validation.ts`

## Database Schema
The service works with the `Account` model in Prisma:

```prisma
model Account {
  id                String          @id @default(cuid())
  userId            String
  name              String
  accountType       AccountType     @default(DEMO)
  currency          String          @default("USD")
  creationDate      DateTime
  initialBalance    Float
  currentBalance    Float?
  maxDrawdown       Float?
  profitTarget      Float?
  dataInfoName      String?
  dataInfoPassword  String?
  dataInfoNotes     String?
  isActive          Boolean         @default(true)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  user              User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  trades            Trade[]

  @@unique([userId, name])
  @@index([userId])
  @@index([userId, isActive])
}
```

## Core Functionality

### 1. CRUD Operations

#### `createAccount(userId, data)`
- Creates a new account with validation
- Enforces subscription-based account limits
- Automatically sets first account as active
- Validates unique account names per user
- **Validation**: Required fields, duplicate names, subscription limits

#### `getAccountById(accountId, userId)`
- Retrieves a single account by ID
- Ensures user ownership
- Includes trade count
- **Security**: Multi-tenancy enforcement

#### `getUserAccounts(userId)`
- Gets all accounts for a user
- Returns accounts sorted by active status and creation date
- Includes trade counts
- **Performance**: Optimized with indexes

#### `updateAccount(accountId, userId, data)`
- Updates account details
- Validates ownership and data integrity
- Prevents duplicate names
- **Validation**: All fields optional, ownership verification

#### `deleteAccount(accountId, userId)`
- Hard deletes account and all related trades
- Updates user's active account if needed
- Automatically sets another account as active if available
- **Cascade**: Handles related data cleanup

#### `setActiveAccount(userId, accountId)`
- Sets user's active/default account
- Updates user preferences
- Ensures only one active account per user
- **Consistency**: Atomic transaction for data integrity

### 2. Validation Rules

#### Account Limits by Subscription Tier
```typescript
const ACCOUNT_LIMITS = {
  [SubscriptionTier.FREE]: 1,
  [SubscriptionTier.TIER1]: 5,
  [SubscriptionTier.TIER2]: 10,
  [SubscriptionTier.ULTIMATE]: 100
};
```

#### Required Fields
- **name**: 1-100 characters, unique per user
- **initialBalance**: Positive number
- **creationDate**: Valid ISO 8601 date

#### Optional Fields
- **accountType**: DEMO or LIVE
- **currency**: 3-character code (default: USD)
- **currentBalance**: Positive number (default: initialBalance)
- **maxDrawdown**: Positive number
- **profitTarget**: Positive number
- **dataInfo fields**: For broker integration

### 3. Additional Features

#### `getAccountStats(accountId, userId)`
Calculates comprehensive account statistics:

```typescript
interface AccountStats {
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
  totalPnL: number;
  totalNetPnL: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  currentBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  roi: number;
  maxDrawdown: number;
  currentDrawdown: number;
}
```

#### `canCreateAccount(userId)`
- Checks if user can create more accounts
- Returns boolean based on subscription tier
- Used for UI state management

#### `getDefaultAccount(userId)`
- Gets user's active/default account
- Fallback logic for account selection
- Used when no accountId specified in requests

#### `getRemainingAccountSlots(userId)`
- Returns remaining account slots
- Useful for subscription upgrade prompts
- Calculates: limit - current count

#### `recalculateAccountBalance(accountId, userId)`
- Recalculates balance based on trade P&L
- Useful for data integrity checks
- Updates currentBalance field

#### `validateAccountOwnership(accountId, userId)`
- Security helper for ownership verification
- Used internally by other methods
- Returns boolean

## API Endpoints

### Account Management
```
GET    /api/accounts                     # Get all user accounts
GET    /api/accounts/default             # Get default account
GET    /api/accounts/can-create          # Check if can create more
GET    /api/accounts/:accountId          # Get specific account
GET    /api/accounts/:accountId/stats    # Get account statistics
POST   /api/accounts                     # Create new account
PUT    /api/accounts/:accountId          # Update account
PATCH  /api/accounts/:accountId/set-active           # Set as active
PATCH  /api/accounts/:accountId/recalculate-balance  # Recalculate balance
DELETE /api/accounts/:accountId          # Delete account
```

### Request/Response Examples

#### Create Account
```typescript
POST /api/accounts
{
  "name": "Live Trading Account",
  "accountType": "LIVE",
  "currency": "USD",
  "creationDate": "2024-01-01T00:00:00Z",
  "initialBalance": 50000,
  "profitTarget": 75000,
  "maxDrawdown": 5000
}
```

#### Response Format
```typescript
{
  "success": true,
  "data": {
    "id": "account_123",
    "userId": "user_456",
    "name": "Live Trading Account",
    "accountType": "LIVE",
    // ... other fields
    "_count": {
      "trades": 0
    }
  },
  "message": "Account created successfully"
}
```

## Integration with Trade System

### Automatic Account Handling
- When creating trades without accountId, uses default account
- Creates default account if user has none
- All trades linked to specific accounts
- Account deletion cascades to trades

### Trade Filtering
- Trades can be filtered by accountId
- Supports multi-account trade views
- Account-specific analytics

## Security Features

### Multi-tenancy
- All operations verify user ownership
- Account isolation between users
- Cascade deletes respect user boundaries

### Validation
- Express-validator integration
- Input sanitization
- Business rule enforcement

### Error Handling
- Comprehensive error messages
- Proper HTTP status codes
- Detailed validation feedback

## Performance Considerations

### Database Optimization
- Indexes on userId and isActive
- Unique constraints for data integrity
- Efficient cascade operations

### Query Optimization
- Minimal database calls
- Include trade counts in single query
- Paginated responses where needed

## Usage Examples

### Service Usage
```typescript
import { accountService } from '../services/account.service';

// Create account
const account = await accountService.createAccount(userId, {
  name: "Demo Account",
  creationDate: new Date(),
  initialBalance: 10000
});

// Get statistics
const stats = await accountService.getAccountStats(accountId, userId);

// Check limits
const canCreate = await accountService.canCreateAccount(userId);
```

### Controller Integration
All controllers include proper error handling, validation, and response formatting following the established API patterns.

## Future Enhancements

### Planned Features
- Account balance history tracking
- Automated balance updates from trade execution
- Account-specific commission settings
- Broker API integration using dataInfo fields
- Account templates for quick setup

### Extensibility
The service is designed to support future features:
- Multiple currencies per user
- Account-specific risk management rules
- Integration with external trading platforms
- Advanced account analytics and reporting

## Testing Considerations

### Unit Tests
- Service method validation
- Business logic verification
- Error handling scenarios

### Integration Tests
- API endpoint testing
- Database transaction verification
- Multi-tenancy validation

### Performance Tests
- Account creation limits
- Bulk operation performance
- Concurrent access handling

---

**Last Updated**: Account Service v1.0 - Complete Implementation
**Dependencies**: Prisma ORM, Express Validator, PostgreSQL
**Compatibility**: TypeScript, Node.js 18+