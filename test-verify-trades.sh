#!/bin/bash

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWdiaWpyYncwMDAwODhyc2Fja3ZsY2E0IiwiZW1haWwiOiJ0ZXN0dXNlckBleGFtcGxlLmNvbSIsIm5hbWUiOiJUZXN0IFVzZXIiLCJpYXQiOjE3NTk1NDI1MDgsImV4cCI6MTc1OTU0MzQwOH0.9rOK9Rpd5ghM1x8uQ7O2-YUS8iTsfgao6ayc37HN5R4"

echo "📊 Verificando trades guardados..."
curl -s -X GET http://localhost:3001/api/trades \
  -H "Authorization: Bearer $TOKEN" | jq '.data.trades[] | {symbol, direction, entryPrice, exitPrice, pnl, commission, netPnl}'
