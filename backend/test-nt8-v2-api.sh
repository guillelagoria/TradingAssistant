#!/bin/bash

# Test NinjaTrader 8 Import V2 API

echo "====================================="
echo "Testing NT8 Import V2 API"
echo "====================================="

# First, we need to get an auth token
# This assumes you have a test user. Update credentials as needed.
echo -e "\n1. Getting authentication token..."

AUTH_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

TOKEN=$(echo $AUTH_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo "Failed to get auth token. Response:"
  echo $AUTH_RESPONSE
  echo ""
  echo "Please ensure:"
  echo "1. The backend is running (npm run dev)"
  echo "2. A test user exists with email: test@example.com"
  exit 1
fi

echo "Got token: ${TOKEN:0:20}..."

# Get account ID (assuming first account)
echo -e "\n2. Getting account ID..."
ACCOUNTS_RESPONSE=$(curl -s -X GET http://localhost:3001/api/accounts \
  -H "Authorization: Bearer $TOKEN")

ACCOUNT_ID=$(echo $ACCOUNTS_RESPONSE | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')

if [ -z "$ACCOUNT_ID" ]; then
  echo "No accounts found. Creating a test account..."
  CREATE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/accounts \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Test Account",
      "accountType": "DEMO",
      "creationDate": "2025-01-01T00:00:00Z",
      "initialBalance": 10000
    }')

  ACCOUNT_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*' | sed 's/"id":"//')
fi

echo "Using account ID: $ACCOUNT_ID"

# Test Preview endpoint
echo -e "\n3. Testing PREVIEW endpoint..."
echo "Uploading file: test-nt8-v2.csv"

PREVIEW_RESPONSE=$(curl -s -X POST http://localhost:3001/api/nt8-import-v2/preview \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-nt8-v2.csv" \
  -F "accountId=$ACCOUNT_ID")

echo "Preview Response:"
echo $PREVIEW_RESPONSE | python3 -m json.tool 2>/dev/null || echo $PREVIEW_RESPONSE

# Extract summary from preview
TOTAL=$(echo $PREVIEW_RESPONSE | grep -o '"total":[0-9]*' | sed 's/"total"://')
VALID=$(echo $PREVIEW_RESPONSE | grep -o '"valid":[0-9]*' | sed 's/"valid"://')
DUPLICATES=$(echo $PREVIEW_RESPONSE | grep -o '"duplicates":[0-9]*' | sed 's/"duplicates"://')
ERRORS=$(echo $PREVIEW_RESPONSE | grep -o '"errors":[0-9]*' | sed 's/"errors"://')

echo -e "\nPreview Summary:"
echo "  Total rows: $TOTAL"
echo "  Valid trades: $VALID"
echo "  Duplicates: $DUPLICATES"
echo "  Errors: $ERRORS"

# Test Execute endpoint
echo -e "\n4. Testing EXECUTE endpoint..."
read -p "Do you want to execute the import? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  EXECUTE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/nt8-import-v2/execute \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@test-nt8-v2.csv" \
    -F "accountId=$ACCOUNT_ID")

  echo "Execute Response:"
  echo $EXECUTE_RESPONSE | python3 -m json.tool 2>/dev/null || echo $EXECUTE_RESPONSE

  # Extract import results
  IMPORTED=$(echo $EXECUTE_RESPONSE | grep -o '"imported":[0-9]*' | sed 's/"imported"://')
  echo -e "\nImport Summary:"
  echo "  Imported: $IMPORTED trades"

  # Test duplicate prevention
  echo -e "\n5. Testing DUPLICATE prevention..."
  echo "Re-importing the same file..."

  DUPLICATE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/nt8-import-v2/execute \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@test-nt8-v2.csv" \
    -F "accountId=$ACCOUNT_ID")

  IMPORTED2=$(echo $DUPLICATE_RESPONSE | grep -o '"imported":[0-9]*' | sed 's/"imported"://')
  DUPLICATES2=$(echo $DUPLICATE_RESPONSE | grep -o '"duplicates":[0-9]*' | sed 's/"duplicates"://')

  echo "Duplicate Test Results:"
  echo "  Imported: $IMPORTED2 (should be 0)"
  echo "  Duplicates: $DUPLICATES2 (should be $TOTAL)"
else
  echo "Import skipped."
fi

echo -e "\n====================================="
echo "Test Complete!"
echo "====================================="