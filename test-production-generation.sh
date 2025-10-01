#!/bin/bash

echo "Testing Caption Generation in Production"
echo "========================================"
echo ""

# Test 1: Check environment
echo "1. Checking environment variables..."
curl -s https://captioncrafter-vercel.vercel.app/api/debug-env | jq '.'
echo ""

# Test 2: Check usage for a test user
echo "2. Checking usage for test user (ID: 888)..."
curl -s "https://captioncrafter-vercel.vercel.app/api/usage?userId=888" | jq '.'
echo ""

# Test 3: Try to generate a caption
echo "3. Attempting to generate caption..."
curl -s -X POST https://captioncrafter-vercel.vercel.app/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 888,
    "platform": "instagram", 
    "topic": "test fitness", 
    "tone": "Casual", 
    "length": "medium", 
    "num_variants": 1, 
    "include_emojis": true
  }' | jq '.'
echo ""

echo "Test complete!"

