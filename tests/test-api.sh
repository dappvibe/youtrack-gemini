#!/bin/bash
# Test script for Gemini Service

echo "Testing Gemini Service..."
CHAT_ID="PEXFI-1090"
echo "1. Creating Interaction via POST /chat/$CHAT_ID"

# Use local env vars if present to test headers
RESPONSE=$(curl -s -X POST "http://localhost:3000/chat/$CHAT_ID" \
  -H "Content-Type: application/json" \
  -H "GEMINI-API-KEY: $GEMINI_API_KEY" \
  -H "GITHUB-TOKEN: $GITHUB_TOKEN" \
  -H "YOUTRACK-URL: https://dappvibe.youtrack.cloud" \
  -H "GITHUB-PROJECT: dappvibe/pexfi" \
  -H "YOUTRACK-TOKEN: $YOUTRACK_TOKEN" \
  -d '{"prompt": "Tell me a short joke", "system_instruction": "You are a comedian"}')

echo "Response from API:"
echo "$RESPONSE"
