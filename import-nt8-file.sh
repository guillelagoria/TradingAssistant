#!/bin/bash

# Usage: ./import-nt8-file.sh <path-to-csv-file> [commission]
# Example: ./import-nt8-file.sh my-trades.csv 4.04

if [ -z "$1" ]; then
  echo "❌ Error: No file specified"
  echo "Usage: ./import-nt8-file.sh <path-to-csv-file> [commission]"
  echo "Example: ./import-nt8-file.sh my-trades.csv 4.04"
  exit 1
fi

FILE_PATH="$1"
COMMISSION="${2:-4.04}"

if [ ! -f "$FILE_PATH" ]; then
  echo "❌ Error: File not found: $FILE_PATH"
  exit 1
fi

echo "======================================"
echo "  NT8 Trade Import Tool"
echo "======================================"
echo ""
echo "File: $FILE_PATH"
echo "Default Commission: $COMMISSION"
echo ""

# Login
echo "🔐 Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"NewPass456"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  echo "$LOGIN_RESPONSE" | jq '.'
  exit 1
fi

echo "✅ Logged in successfully"
echo ""

# Upload file
echo "📤 Uploading file..."
UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:3001/api/import/nt8/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$FILE_PATH")

SUCCESS=$(echo "$UPLOAD_RESPONSE" | jq -r '.success')
if [ "$SUCCESS" != "true" ]; then
  echo "❌ Upload failed"
  echo "$UPLOAD_RESPONSE" | jq '.'
  exit 1
fi

SESSION_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.sessionId')
FILE_NAME=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.fileName')

echo "✅ File uploaded successfully"
echo "   Session ID: $SESSION_ID"
echo "   File Name: $FILE_NAME"
echo ""

# Preview
echo "🔍 Previewing import (dry run)..."
PREVIEW_RESPONSE=$(curl -s -X POST http://localhost:3001/api/import/nt8/preview \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\",\"skipDuplicates\":true,\"defaultCommission\":$COMMISSION}")

PREVIEW_STATUS=$(echo "$PREVIEW_RESPONSE" | jq -r '.data.status')
TOTAL=$(echo "$PREVIEW_RESPONSE" | jq -r '.data.summary.total')
ERRORS=$(echo "$PREVIEW_RESPONSE" | jq -r '.data.summary.errors')
DUPLICATES=$(echo "$PREVIEW_RESPONSE" | jq -r '.data.summary.duplicates')

echo "Preview Results:"
echo "  Status: $PREVIEW_STATUS"
echo "  Total rows: $TOTAL"
echo "  Errors: $ERRORS"
echo "  Duplicates: $DUPLICATES"
echo ""

# Show first 3 trades preview
echo "First 3 trades preview:"
echo "$PREVIEW_RESPONSE" | jq '.data.trades[0:3][] | {
  row: .rowNumber,
  success: .success,
  symbol: .trade.instrument,
  direction: .trade.direction,
  entry: .trade.price,
  exit: .trade.exitPrice,
  pnl: .trade.pnl
}'
echo ""

# Show errors if any
if [ "$ERRORS" != "0" ]; then
  echo "⚠️  Errors found:"
  echo "$PREVIEW_RESPONSE" | jq '.data.errors[]'
  echo ""
fi

# Ask for confirmation
echo "======================================"
read -p "Do you want to proceed with the import? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ] && [ "$CONFIRM" != "y" ]; then
  echo "❌ Import cancelled"
  exit 0
fi

echo ""
echo "💾 Executing final import..."

# Execute import
EXECUTE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/import/nt8/execute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\",\"skipDuplicates\":true,\"defaultCommission\":$COMMISSION}")

EXECUTE_STATUS=$(echo "$EXECUTE_RESPONSE" | jq -r '.data.status')
IMPORTED=$(echo "$EXECUTE_RESPONSE" | jq -r '.data.summary.imported')
SKIPPED=$(echo "$EXECUTE_RESPONSE" | jq -r '.data.summary.skipped')
FINAL_ERRORS=$(echo "$EXECUTE_RESPONSE" | jq -r '.data.summary.errors')

echo ""
echo "======================================"
echo "  Import Complete!"
echo "======================================"
echo ""
echo "Status: $EXECUTE_STATUS"
echo "Imported: $IMPORTED trades"
echo "Skipped: $SKIPPED trades"
echo "Errors: $FINAL_ERRORS trades"
echo ""

if [ "$EXECUTE_STATUS" = "COMPLETED" ]; then
  echo "✅ Import successful!"
else
  echo "⚠️  Import completed with issues"
fi
