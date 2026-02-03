#!/bin/bash
# Test script for Gemini Service

CHAT_ID="PEXFI-1090"
PROMPT=${1:-"Tell me a short joke"}
SYSTEM="
You are a helpful AI assistant integrated into YouTrack.
Project you are working on is hosted on GitHub at dappvibe/pexfi. NEVER query other projects.
Use MCP to access code, if it is not available stop thinking and report error.
You have access to the issue title, description, and comments history.
If the user asks for code, provide it in markdown code blocks.
"
SYSTEM="Project you are working on is hosted on GitHub at dappvibe/pexfi."

# Use local env vars if present to test headers
#RESPONSE=$(curl -s -X POST "https://gemini.dappvibe.online/chat/$CHAT_ID" \
RESPONSE=$(curl -s -X POST "http://localhost:3000/chat/$CHAT_ID" \
  -H "Content-Type: application/json" \
  -H "GEMINI-API-KEY: $GEMINI_API_KEY" \
  -H "GITHUB-TOKEN: $GITHUB_TOKEN" \
  -H "YOUTRACK-URL: https://dappvibe.youtrack.cloud" \
  -H "YOUTRACK-TOKEN: $YOUTRACK_GEMINI_PERMTOKEN" \
  -d "{\"model\": \"gemini-3-pro-preview\", \"last_interaction_id\": \"v1_Chd1bWFCYWNpeEY4Nm1rZFVQaWQ2QnVBVRIXdW1hQmFjaXhGODZta2RVUGlkNkJ1QVU\", \"prompt\": \"$PROMPT\", \"system_instruction\": \"$SYSTEM\"}")

echo "Response from API:"
echo "$RESPONSE"
