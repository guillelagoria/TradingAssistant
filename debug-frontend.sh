#!/bin/bash

# Login
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"NewPass456"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken')
USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.data.user.id')

echo "============================================"
echo "  DEBUG: Frontend Data Issues"
echo "============================================"
echo ""
echo "User ID: $USER_ID"
echo ""

# Get accounts
echo "📊 Accounts:"
ACCOUNTS=$(curl -s -X GET "http://localhost:3001/api/accounts" \
  -H "Authorization: Bearer $TOKEN")

echo "$ACCOUNTS" | jq '.data[] | {id, name, isActive}'
echo ""

# Get active account ID
ACTIVE_ACCOUNT_ID=$(echo "$ACCOUNTS" | jq -r '.data[] | select(.isActive == true) | .id')
echo "Active Account ID: $ACTIVE_ACCOUNT_ID"
echo ""

# Get trades for active account
echo "📋 Trades for active account:"
TRADES=$(curl -s -X GET "http://localhost:3001/api/trades?accountId=$ACTIVE_ACCOUNT_ID&limit=50" \
  -H "Authorization: Bearer $TOKEN")

TRADE_COUNT=$(echo "$TRADES" | jq '.data.pagination.total')
echo "Total trades: $TRADE_COUNT"
echo ""

if [ "$TRADE_COUNT" -gt "0" ]; then
  echo "First 5 trades:"
  echo "$TRADES" | jq '.data.trades[0:5] | .[] | {id, symbol, direction, entryPrice, pnl, accountId}'
else
  echo "⚠️  No trades found for active account!"
  echo ""
  echo "Checking ALL trades (no account filter):"
  ALL_TRADES=$(curl -s -X GET "http://localhost:3001/api/trades?limit=50" \
    -H "Authorization: Bearer $TOKEN")
  
  ALL_COUNT=$(echo "$ALL_TRADES" | jq '.data.pagination.total')
  echo "Total trades (all accounts): $ALL_COUNT"
  
  if [ "$ALL_COUNT" -gt "0" ]; then
    echo ""
    echo "⚠️  WARNING: Trades exist but are associated with different account!"
    echo ""
    echo "Trades by account:"
    echo "$ALL_TRADES" | jq -r '.data.trades | group_by(.accountId) | .[] | "\(.[0].accountId): \(length) trades"'
  fi
fi

echo ""
echo "============================================"
