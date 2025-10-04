#!/bin/bash

echo "🧪 Testing NT8 Import..."
echo ""

# Test 1: Upload file
echo "📤 Step 1: Uploading CSV file..."
UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:3001/api/import/nt8/upload \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQiLCJpYXQiOjE3NTgxMTM4ODl9._qwCX3ZXu7IEDxDMvRiWplFU9V8w4gV41KiPIG828t4" \
  -F "file=@test-nt8-data.csv")

echo "Upload Response:"
echo "$UPLOAD_RESPONSE" | jq '.'

SESSION_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.sessionId')
echo ""
echo "✅ Session ID: $SESSION_ID"
echo ""

# Test 2: Preview import
echo "🔍 Step 2: Previewing import (dry run)..."
PREVIEW_RESPONSE=$(curl -s -X POST http://localhost:3001/api/import/nt8/preview \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQiLCJpYXQiOjE3NTgxMTM4ODl9._qwCX3ZXu7IEDxDMvRiWplFU9V8w4gV41KiPIG828t4" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\",\"skipDuplicates\":true,\"defaultCommission\":4.04}")

echo "Preview Response:"
echo "$PREVIEW_RESPONSE" | jq '.data.summary'
echo ""
echo "First trade preview:"
echo "$PREVIEW_RESPONSE" | jq '.data.trades[0]'
echo ""

# Test 3: Execute import
echo "💾 Step 3: Executing final import..."
EXECUTE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/import/nt8/execute \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQiLCJpYXQiOjE3NTgxMTM4ODl9._qwCX3ZXu7IEDxDMvRiWplFU9V8w4gV41KiPIG828t4" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\",\"skipDuplicates\":true,\"defaultCommission\":4.04}")

echo "Execute Response:"
echo "$EXECUTE_RESPONSE" | jq '.data.summary'
echo ""

echo "✅ Import test completed!"
