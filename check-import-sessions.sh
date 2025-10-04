#!/bin/bash

# Login
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"NewPass456"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken')

echo "📋 Import Sessions History:"
echo ""

curl -s -X GET "http://localhost:3001/api/import/sessions?limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.sessions[] | {
    id: .id,
    fileName: .fileName,
    status: .status,
    total: .totalRows,
    imported: .importedRows,
    errors: .errorRows,
    duplicates: .duplicateRows,
    createdAt: .createdAt
  }'
