#!/bin/bash

# Login
echo "🔐 Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"NewPass456"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken')
USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.data.user.id')

if [ "$TOKEN" = "null" ]; then
  echo "❌ Login failed"
  exit 1
fi

echo "✅ Logged in as user: $USER_ID"
echo ""

# Delete all import sessions
echo "🗑️  Deleting all import sessions..."
SESSIONS=$(curl -s -X GET "http://localhost:3001/api/import/sessions?limit=100" \
  -H "Authorization: Bearer $TOKEN")

SESSION_IDS=$(echo "$SESSIONS" | jq -r '.data.sessions[].id')

for SESSION_ID in $SESSION_IDS; do
  echo "  Deleting session $SESSION_ID (with trades)..."
  curl -s -X DELETE "http://localhost:3001/api/import/sessions/$SESSION_ID?deleteTrades=true" \
    -H "Authorization: Bearer $TOKEN" > /dev/null
done

echo ""
echo "✅ Cleanup complete!"
echo ""

# Verify
echo "🔍 Final verification:"
echo ""

TRADES=$(curl -s -X GET "http://localhost:3001/api/trades?limit=1" \
  -H "Authorization: Bearer $TOKEN")
TRADE_COUNT=$(echo "$TRADES" | jq '.data.pagination.total')

SESSIONS=$(curl -s -X GET "http://localhost:3001/api/import/sessions?limit=1" \
  -H "Authorization: Bearer $TOKEN")
SESSION_COUNT=$(echo "$SESSIONS" | jq '.data.pagination.total')

echo "  Remaining trades: $TRADE_COUNT"
echo "  Remaining import sessions: $SESSION_COUNT"

if [ "$TRADE_COUNT" = "0" ] && [ "$SESSION_COUNT" = "0" ]; then
  echo ""
  echo "✅ Database is completely clean!"
else
  echo ""
  echo "⚠️  Warning: Some data still remains"
fi
