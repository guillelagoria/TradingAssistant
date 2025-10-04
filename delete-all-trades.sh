#!/bin/bash

# Login first
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

# Get account ID
echo "🏦 Getting account info..."
ACCOUNT_RESPONSE=$(curl -s -X GET http://localhost:3001/api/accounts \
  -H "Authorization: Bearer $TOKEN")

ACCOUNT_ID=$(echo "$ACCOUNT_RESPONSE" | jq -r '.data[0].id')
echo "Account ID: $ACCOUNT_ID"
echo ""

# Get all trades
echo "📊 Getting all trades..."
TRADES_RESPONSE=$(curl -s -X GET "http://localhost:3001/api/trades?limit=100" \
  -H "Authorization: Bearer $TOKEN")

TRADE_COUNT=$(echo "$TRADES_RESPONSE" | jq '.data.pagination.total')
echo "Total trades found: $TRADE_COUNT"
echo ""

if [ "$TRADE_COUNT" -gt 0 ]; then
  echo "🗑️  Deleting all trades..."
  
  # Get all trade IDs
  TRADE_IDS=$(echo "$TRADES_RESPONSE" | jq -r '.data.trades[].id')
  
  COUNT=0
  for TRADE_ID in $TRADE_IDS; do
    echo "  Deleting trade $TRADE_ID..."
    curl -s -X DELETE "http://localhost:3001/api/trades/$TRADE_ID" \
      -H "Authorization: Bearer $TOKEN" > /dev/null
    COUNT=$((COUNT + 1))
  done
  
  echo ""
  echo "✅ Deleted $COUNT trades"
else
  echo "ℹ️  No trades to delete"
fi

echo ""
echo "🔍 Verifying deletion..."
FINAL_CHECK=$(curl -s -X GET "http://localhost:3001/api/trades" \
  -H "Authorization: Bearer $TOKEN")

REMAINING=$(echo "$FINAL_CHECK" | jq '.data.pagination.total')
echo "Remaining trades: $REMAINING"

if [ "$REMAINING" = "0" ]; then
  echo "✅ All trades successfully deleted!"
else
  echo "⚠️  Warning: $REMAINING trades still remaining"
fi
