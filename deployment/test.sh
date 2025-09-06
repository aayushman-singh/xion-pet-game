#!/bin/bash

# Test XION Pet Game Smart Contracts
set -e

# Configuration
CHAIN_ID="xion-testnet-2"
NODE_URL="https://rpc.xion-testnet-2.burnt.com:443"

# Check if wallet is set
if [ -z "$WALLET" ]; then
    echo "❌ Please set WALLET environment variable"
    exit 1
fi

# Contract addresses (replace with actual deployed addresses)
USER_MAP_ADDR="${USER_MAP_CONTRACT_ADDRESS:-}"
PET_NFT_ADDR="${PET_NFT_CONTRACT_ADDRESS:-}"
ACHIEVEMENT_ADDR="${ACHIEVEMENT_CONTRACT_ADDRESS:-}"
INTERACTION_ADDR="${INTERACTION_CONTRACT_ADDRESS:-}"

if [ -z "$USER_MAP_ADDR" ] || [ -z "$PET_NFT_ADDR" ] || [ -z "$ACHIEVEMENT_ADDR" ] || [ -z "$INTERACTION_ADDR" ]; then
    echo "❌ Please set contract address environment variables or run deploy.sh first"
    echo "   USER_MAP_CONTRACT_ADDRESS"
    echo "   PET_NFT_CONTRACT_ADDRESS"
    echo "   ACHIEVEMENT_CONTRACT_ADDRESS"
    echo "   INTERACTION_CONTRACT_ADDRESS"
    exit 1
fi

echo "🧪 Testing XION Pet Game Smart Contracts..."
echo "👛 Using wallet: $WALLET"

# Get wallet address
WALLET_ADDR=$(xiond keys show $WALLET --address)
echo "📍 Wallet address: $WALLET_ADDR"

echo ""
echo "📜 Test 1: User Map Contract - Set user data..."
USER_DATA='{"hasStarterPet": true, "starterPet": {"id": "starter-cat", "name": "Test Cat", "type": "cat", "rarity": "common"}, "pets": ["starter-cat"]}'
SET_MSG="{\"set_value\": {\"key\": \"\", \"value\": \"$USER_DATA\"}}"

xiond tx wasm execute $USER_MAP_ADDR "$SET_MSG" \
    --from $WALLET \
    --gas-prices 0.025uxion \
    --gas auto \
    --gas-adjustment 1.3 \
    -y \
    --chain-id $CHAIN_ID \
    --node $NODE_URL

sleep 3

echo "🔍 Querying user data..."
QUERY_MSG="{\"get_value_by_user\": {\"address\": \"$WALLET_ADDR\"}}"
xiond query wasm contract-state smart $USER_MAP_ADDR "$QUERY_MSG" --node $NODE_URL --output json

echo ""
echo "🐾 Test 2: Pet NFT Contract - Mint a pet NFT..."
MINT_MSG="{\"mint\": {\"token_id\": \"test-pet-$(date +%s)\", \"owner\": \"$WALLET_ADDR\", \"token_uri\": \"https://api.example.com/pet/1\", \"extension\": {\"name\": \"Test Cat\", \"description\": \"A test cat NFT\", \"image\": \"https://api.example.com/pet/1.png\", \"attributes\": [{\"trait_type\": \"Type\", \"value\": \"cat\"}, {\"trait_type\": \"Rarity\", \"value\": \"common\"}]}}}"

xiond tx wasm execute $PET_NFT_ADDR "$MINT_MSG" \
    --from $WALLET \
    --gas-prices 0.025uxion \
    --gas auto \
    --gas-adjustment 1.3 \
    -y \
    --chain-id $CHAIN_ID \
    --node $NODE_URL

sleep 3

echo "🔍 Querying NFT count..."
xiond query wasm contract-state smart $PET_NFT_ADDR '{"num_tokens": {}}' --node $NODE_URL --output json

echo ""
echo "🎯 Test 3: Achievement Contract - Query config..."
xiond query wasm contract-state smart $ACHIEVEMENT_ADDR '{"config": {}}' --node $NODE_URL --output json

echo ""
echo "🎮 Test 4: Pet Interaction Contract - Query config..."
xiond query wasm contract-state smart $INTERACTION_ADDR '{"config": {}}' --node $NODE_URL --output json

echo ""
echo "✅ All tests completed successfully!"
echo ""
echo "🎉 Your XION Pet Game contracts are working!"