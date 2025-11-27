#!/bin/bash

# Chat API Testing Script
# Make sure server is running on localhost:3000

BASE_URL="http://localhost:3000/api"
TOKEN=""

echo "================================"
echo "Chat API Testing"
echo "================================"
echo ""

# 1. Health Check
echo "1. Testing Health Check..."
curl -s -X GET "http://localhost:3000/health" | jq .
echo -e "\n"

# 2. Register
echo "2. Testing Register..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "081234567890",
    "password": "password123"
  }')
echo "$REGISTER_RESPONSE" | jq .
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.token')
echo "Token: $TOKEN"
echo -e "\n"

# 3. Login
echo "3. Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "081234567890",
    "password": "password123"
  }')
echo "$LOGIN_RESPONSE" | jq .
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')
echo -e "\n"

# 4. Get Profile
echo "4. Testing Get Profile..."
curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo -e "\n"

# 5. Search Users
echo "5. Testing Search Users..."
curl -s -X GET "$BASE_URL/users/search?q=Test" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo -e "\n"

# 6. Create Chat
echo "6. Testing Create Chat..."
CHAT_RESPONSE=$(curl -s -X POST "$BASE_URL/chats" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": [2],
    "isGroup": false
  }')
echo "$CHAT_RESPONSE" | jq .
CHAT_ID=$(echo "$CHAT_RESPONSE" | jq -r '.data.chatId')
echo "Chat ID: $CHAT_ID"
echo -e "\n"

# 7. Get All Chats
echo "7. Testing Get All Chats..."
curl -s -X GET "$BASE_URL/chats" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo -e "\n"

# 8. Get Chat Detail
echo "8. Testing Get Chat Detail..."
curl -s -X GET "$BASE_URL/chats/$CHAT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo -e "\n"

# 9. Get Messages
echo "9. Testing Get Messages..."
curl -s -X GET "$BASE_URL/chats/$CHAT_ID/messages?limit=20" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo -e "\n"

# 10. Upload File
echo "10. Testing Upload File..."
# Create a test file
echo "Test file content" > test.txt
curl -s -X POST "$BASE_URL/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.txt" | jq .
rm test.txt
echo -e "\n"

# 11. Update Profile
echo "11. Testing Update Profile..."
curl -s -X PUT "$BASE_URL/users/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test User"
  }' | jq .
echo -e "\n"

# 12. Update Chat
echo "12. Testing Update Chat..."
curl -s -X PUT "$BASE_URL/chats/$CHAT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Chat Title"
  }' | jq .
echo -e "\n"

# 13. Leave Chat
echo "13. Testing Leave Chat..."
curl -s -X POST "$BASE_URL/chats/$CHAT_ID/leave" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo -e "\n"

echo "================================"
echo "All tests completed!"
echo "================================"