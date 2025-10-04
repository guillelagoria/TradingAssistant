# NinjaTrader 8 CSV Import System V2

## Overview
A completely new, simple, and robust import system for NinjaTrader 8 CSV exports. This version addresses critical issues in the previous implementation:

- **No Duplicates:** Strict duplicate detection prevents importing the same trade twice
- **Correct Number Parsing:** Handles European format (6387,50 → 6387.50) and currency (-$ 200,00 → -200.00)
- **Simple Architecture:** Maximum 200 lines per file, no complex abstractions
- **Clear Error Reporting:** Specific error messages per field and row
- **No Sessions:** Direct upload → parse → validate → import flow

## File Structure

```
backend/src/
├── utils/
│   ├── numberParser.ts          # Parse European numbers and currency
│   ├── dateParser.ts             # Parse NT8 date format (D/M/YYYY HH:mm:ss)
│   └── csvParser.ts              # Parse CSV with semicolon delimiter
├── types/
│   └── nt8ImportV2.types.ts      # TypeScript interfaces
├── services/
│   └── nt8ImportV2.service.ts    # Core business logic
├── controllers/
│   └── nt8ImportV2.controller.ts # HTTP request handlers
└── routes/
    └── nt8ImportV2.routes.ts     # API endpoint definitions
```

## CSV Format Support

### Delimiter: `;` (semicolon)

### Number Formats:
- **European decimal:** `6387,50` → 6387.50
- **Currency with symbol:** `-$ 200,00` → -200.00 or `$ 212,50` → 212.50

### Date Format:
- **Format:** `D/M/YYYY HH:mm:ss` or `DD/MM/YYYY HH:mm:ss`
- **Example:** `2/9/2025 12:18:21` = September 2, 2025 at 12:18:21

### Expected Columns (23 total):
1. Trade number
2. Instrument (e.g., "ES SEP25", "NQ DEC25")
3. Account
4. Strategy
5. Market pos. (Long/Short)
6. Qty
7. Entry price (European format)
8. Exit price (European format)
9. Entry time (D/M/YYYY HH:mm:ss)
10. Exit time
11. Entry name
12. Exit name (Stop1, Target1, etc.)
13. Profit (currency format)
14. Cum. net profit
15. Commission
16-19. Various fees
20. MAE (Maximum Adverse Excursion)
21. MFE (Maximum Favorable Excursion)
22. ETD (Entry to Drawdown)
23. Bars

## API Endpoints

### Base URL: `/api/nt8-import-v2`

All endpoints require authentication via JWT token in Authorization header.

### 1. Preview Import

**Endpoint:** `POST /api/nt8-import-v2/preview`

**Description:** Parse and validate CSV file without saving to database

**Request:**
- **Method:** POST
- **Headers:**
  - `Authorization: Bearer <token>`
- **Body (multipart/form-data):**
  - `file`: CSV file (required)
  - `accountId`: Trading account ID (required)

**Response:**
```json
{
  "total": 3,
  "valid": 3,
  "duplicates": 0,
  "errors": 0,
  "trades": [
    {
      "rowNumber": 2,
      "trade": {
        "symbol": "ES",
        "direction": "LONG",
        "quantity": 1,
        "entryPrice": 6387.5,
        "exitPrice": 6383.5,
        "entryDate": "2025-09-02T15:18:21.000Z",
        "exitDate": "2025-09-02T15:35:29.000Z",
        "pnl": -200,
        "commission": 5,
        "mae": 200,
        "mfe": 175
      },
      "isValid": true,
      "isDuplicate": false,
      "errors": []
    }
  ]
}
```

### 2. Execute Import

**Endpoint:** `POST /api/nt8-import-v2/execute`

**Description:** Import valid, non-duplicate trades to database

**Request:**
- Same as preview endpoint

**Response:**
```json
{
  "total": 3,
  "imported": 3,
  "duplicates": 0,
  "errors": 0,
  "summary": {
    "message": "Successfully imported 3 trades",
    "details": [
      "Total rows: 3",
      "Imported: 3",
      "Duplicates skipped: 0",
      "Errors: 0"
    ]
  },
  "trades": [...]
}
```

## Duplicate Detection

A trade is considered a duplicate if an existing trade in the database has ALL of the following matching:

- `userId` (same user)
- `accountId` (same account)
- `symbol` (same instrument, e.g., "ES")
- `direction` (LONG or SHORT)
- `entryPrice` (exact match)
- `quantity` (exact match)
- `entryDate` (exact match to the second)

## Field Mapping

### CSV → Database

| CSV Column | Database Field | Processing |
|------------|----------------|------------|
| Instrument | `symbol` | Extract first part (e.g., "ES SEP25" → "ES") |
| Market pos. | `direction` | "Long" → "LONG", "Short" → "SHORT" |
| Qty | `quantity` | Parse European number |
| Entry price | `entryPrice` | Parse European number |
| Exit price | `exitPrice` | Parse European number (null if empty) |
| Entry time | `entryDate` | Parse NT8 date format |
| Exit time | `exitDate` | Parse NT8 date format (null if empty) |
| Profit | `pnl` | Parse currency format |
| Commission | `commission` | Parse currency format |
| MAE | `mae` | Parse European number |
| MFE | `mfe` | Parse European number |
| Strategy | `nt8Strategy` | Store original NT8 strategy name |
| Account | `nt8Account` | Store original NT8 account name |
| Exit name | `exitName` | Store exit signal name |
| Trade number | (metadata) | Used for tracking only |

### Auto-Generated Fields

- `orderType`: Set to "MARKET" for all NT8 imports
- `source`: Set to "NT8_IMPORT"
- `userId`: From authenticated user
- `accountId`: From request parameter

## Testing

### 1. Unit Tests (Parsing Logic)

Run the test script to verify all parsing functions:

```bash
cd backend
npx ts-node src/scripts/testNT8ImportV2.ts
```

**Expected Output:**
```
=== NinjaTrader 8 Import V2 Test ===

Test 1: European Number Parsing
-----------------------------------
  "6387,50" → 6387.5
  "-$ 200,00" → -200
  "$ 175,00" → 175
  ...
```

### 2. Integration Tests (API Endpoints)

Use the provided shell script to test the complete API flow:

```bash
cd backend
./test-nt8-v2-api.sh
```

This script will:
1. Authenticate and get a token
2. Get/create a test account
3. Preview import
4. Execute import (with confirmation)
5. Test duplicate prevention by re-importing

### 3. Manual Testing with cURL

**Preview Import:**
```bash
curl -X POST http://localhost:3001/api/nt8-import-v2/preview \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-nt8-v2.csv" \
  -F "accountId=YOUR_ACCOUNT_ID"
```

**Execute Import:**
```bash
curl -X POST http://localhost:3001/api/nt8-import-v2/execute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-nt8-v2.csv" \
  -F "accountId=YOUR_ACCOUNT_ID"
```

## Error Handling

### Common Errors

1. **No file uploaded:**
   - Status: 400
   - Response: `{ "error": "No file uploaded" }`

2. **No authentication:**
   - Status: 401
   - Response: `{ "error": "User not authenticated" }`

3. **No account ID:**
   - Status: 400
   - Response: `{ "error": "Account ID is required" }`

4. **Invalid file format:**
   - Status: 400
   - Response: `{ "error": "Only CSV and TXT files are allowed" }`

5. **File too large:**
   - Status: 400
   - Response: File size limit exceeded (10MB max)

### Field Validation Errors

Returned per trade in the `errors` array:

```json
{
  "rowNumber": 5,
  "errors": [
    "Row 5: symbol - Symbol is required",
    "Row 5: entryPrice - Entry price must be greater than 0"
  ]
}
```

## Edge Cases Handled

1. **Empty values:** Return 0 for numbers, null for dates
2. **Invalid numbers:** Return 0 instead of crashing
3. **Invalid dates:** Return null instead of crashing
4. **Missing columns:** Handled gracefully with validation errors
5. **Extra whitespace:** Trimmed automatically
6. **Multiple decimal formats:** Both comma and period supported
7. **Currency symbols:** $ symbol removed automatically
8. **Negative values:** Properly parsed with minus sign

## Performance Characteristics

- **File size limit:** 10MB
- **Processing speed:** ~100-500 rows per second (depends on database)
- **Memory usage:** ~2x file size (held in memory during processing)
- **Database queries:** 1 duplicate check per trade + 1 insert per valid trade

## Database Schema

Uses existing Prisma `Trade` model with these key fields:

```typescript
model Trade {
  id              String         @id @default(cuid())
  userId          String         // From auth
  accountId       String         // From request
  symbol          String         // Extracted from instrument
  direction       TradeDirection // LONG | SHORT
  orderType       OrderType      // MARKET
  entryDate       DateTime       // Parsed from CSV
  entryPrice      Float          // Parsed European format
  quantity        Float          // Parsed European format
  exitDate        DateTime?      // Optional
  exitPrice       Float?         // Optional
  pnl             Float?         // Parsed from Profit
  commission      Float          // Parsed from Commission
  mae             Float?         // Maximum Adverse Excursion
  mfe             Float?         // Maximum Favorable Excursion
  nt8Strategy     String?        // Original NT8 strategy
  nt8Account      String?        // Original NT8 account
  exitName        String?        // Stop1, Target1, etc.
  source          TradeSource    // NT8_IMPORT
}
```

## Migration from V1

To migrate from the old import system:

1. **No data migration needed** - V2 uses the same database schema
2. **Update frontend** to use new endpoints:
   - `/api/nt8-import-v2/preview` instead of `/api/import/nt8/preview`
   - `/api/nt8-import-v2/execute` instead of `/api/import/nt8/execute`
3. **Remove session logic** - V2 doesn't use sessions
4. **Update error handling** - Error format is different

## Code Quality

- **TypeScript strict mode:** Enabled
- **Lines per file:** Maximum 200
- **Cyclomatic complexity:** Low (simple if/else only)
- **Dependencies:** Only papaparse added
- **Test coverage:** Unit tests for all parsing functions

## Future Enhancements (Optional)

- [ ] Support for other NT8 export formats (Excel, XML)
- [ ] Batch processing for very large files (>10MB)
- [ ] Progress reporting for long imports
- [ ] Advanced validation rules (price ranges, date ranges)
- [ ] Import history tracking
- [ ] Rollback functionality for completed imports

## Troubleshooting

### Issue: Dates are off by one day
**Cause:** Timezone conversion
**Solution:** Dates are stored in UTC. Frontend should display in user's timezone.

### Issue: Numbers not parsing correctly
**Cause:** Wrong decimal separator
**Solution:** Ensure CSV uses European format with comma (,) as decimal separator

### Issue: Duplicates not detected
**Cause:** Slight differences in entry data
**Solution:** Check that entry price, quantity, and date match exactly (to the second)

### Issue: All trades marked as errors
**Cause:** Wrong CSV delimiter
**Solution:** Ensure CSV uses semicolon (;) as delimiter

## Support

For issues or questions:
1. Check test script output for parsing errors
2. Review backend logs for detailed error messages
3. Verify CSV format matches NT8 export exactly
4. Test with sample file first (test-nt8-v2.csv)

---

**Version:** 2.0.0
**Last Updated:** 2025-10-04
**Tested with:** NinjaTrader 8 CSV exports