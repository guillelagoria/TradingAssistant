#!/bin/bash

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWdiaWpyYncwMDAwODhyc2Fja3ZsY2E0IiwiZW1haWwiOiJ0ZXN0dXNlckBleGFtcGxlLmNvbSIsIm5hbWUiOiJUZXN0IFVzZXIiLCJpYXQiOjE3NTk1NDI1MDgsImV4cCI6MTc1OTU0MzQwOH0.9rOK9Rpd5ghM1x8uQ7O2-YUS8iTsfgao6ayc37HN5R4"
SESSION_ID="ccdbc15f3cd879583d8606137a3eaddb"

echo "🔍 Previewing import..."
curl -s -X POST http://localhost:3001/api/import/nt8/preview \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\",\"skipDuplicates\":true,\"defaultCommission\":4.04}" | jq '.'
