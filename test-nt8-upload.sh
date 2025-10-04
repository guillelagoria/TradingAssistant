#!/bin/bash

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWdiaWpyYncwMDAwODhyc2Fja3ZsY2E0IiwiZW1haWwiOiJ0ZXN0dXNlckBleGFtcGxlLmNvbSIsIm5hbWUiOiJUZXN0IFVzZXIiLCJpYXQiOjE3NTk1NDI1MDgsImV4cCI6MTc1OTU0MzQwOH0.9rOK9Rpd5ghM1x8uQ7O2-YUS8iTsfgao6ayc37HN5R4"

echo "📤 Uploading CSV file..."
curl -s -X POST http://localhost:3001/api/import/nt8/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-nt8-data.csv" | jq '.'
