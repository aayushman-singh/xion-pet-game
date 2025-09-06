#!/bin/bash

# Deploy Smart Contracts to XION Testnet
set -e

# Configuration
CHAIN_ID="xion-testnet-2"
NODE_URL="https://rpc.xion-testnet-2.burnt.com:443"
GAS_PRICES="0.001uxion"
GAS_ADJUSTMENT="1.3"

# Check if wallet is set
if [ -z "$WALLET" ]; then
    echo "❌ Please set WALLET environment variable:"
    echo "   export WALLET=\"your-wallet-name-or-address\""
    exit 1
fi

echo "🚀 Deploying XION Pet Game Smart Contracts to $CHAIN_ID..."
echo "👛 Using wallet: $WALLET"

# Check if optimized contracts exist
if [ ! -d "contracts/artifacts" ] || [ -z "$(ls -A contracts/artifacts)" ]; then
    echo "❌ No optimized contracts found. Please run ./deployment/build.sh first"
    exit 1
fi

cd contracts/artifacts

echo ""
echo "📜 Step 1: Deploying User Map Contract..."
USER_MAP_RES=$(xiond tx wasm store user_map_contract.wasm \
    --chain-id $CHAIN_ID \
    --gas-adjustment $GAS_ADJUSTMENT \
    --gas-prices $GAS_PRICES \
    --gas auto \
    -y --output json \
    --node $NODE_URL \
    --from $WALLET)

USER_MAP_TXHASH=$(echo $USER_MAP_RES | jq -r '.txhash')
echo "🔍 User Map deployment tx: $USER_MAP_TXHASH"
sleep 6

USER_MAP_CODE_ID=$(xiond query tx $USER_MAP_TXHASH \
    --node $NODE_URL \
    --output json | jq -r '.events[-1].attributes[1].value')
echo "📋 User Map Code ID: $USER_MAP_CODE_ID"

echo ""
echo "🐾 Step 2: Deploying Pet NFT Contract..."
PET_NFT_RES=$(xiond tx wasm store pet_nft_contract.wasm \
    --chain-id $CHAIN_ID \
    --gas-adjustment $GAS_ADJUSTMENT \
    --gas-prices $GAS_PRICES \
    --gas auto \
    -y --output json \
    --node $NODE_URL \
    --from $WALLET)

PET_NFT_TXHASH=$(echo $PET_NFT_RES | jq -r '.txhash')
echo "🔍 Pet NFT deployment tx: $PET_NFT_TXHASH"
sleep 6

PET_NFT_CODE_ID=$(xiond query tx $PET_NFT_TXHASH \
    --node $NODE_URL \
    --output json | jq -r '.events[-1].attributes[1].value')
echo "📋 Pet NFT Code ID: $PET_NFT_CODE_ID"

echo ""
echo "🎯 Step 3: Deploying Achievement Contract..."
ACHIEVEMENT_RES=$(xiond tx wasm store achievement_contract.wasm \
    --chain-id $CHAIN_ID \
    --gas-adjustment $GAS_ADJUSTMENT \
    --gas-prices $GAS_PRICES \
    --gas auto \
    -y --output json \
    --node $NODE_URL \
    --from $WALLET)

ACHIEVEMENT_TXHASH=$(echo $ACHIEVEMENT_RES | jq -r '.txhash')
echo "🔍 Achievement deployment tx: $ACHIEVEMENT_TXHASH"
sleep 6

ACHIEVEMENT_CODE_ID=$(xiond query tx $ACHIEVEMENT_TXHASH \
    --node $NODE_URL \
    --output json | jq -r '.events[-1].attributes[1].value')
echo "📋 Achievement Code ID: $ACHIEVEMENT_CODE_ID"

echo ""
echo "🎮 Step 4: Deploying Pet Interaction Contract..."
INTERACTION_RES=$(xiond tx wasm store pet_interaction_contract.wasm \
    --chain-id $CHAIN_ID \
    --gas-adjustment $GAS_ADJUSTMENT \
    --gas-prices $GAS_PRICES \
    --gas auto \
    -y --output json \
    --node $NODE_URL \
    --from $WALLET)

INTERACTION_TXHASH=$(echo $INTERACTION_RES | jq -r '.txhash')
echo "🔍 Pet Interaction deployment tx: $INTERACTION_TXHASH"
sleep 6

INTERACTION_CODE_ID=$(xiond query tx $INTERACTION_TXHASH \
    --node $NODE_URL \
    --output json | jq -r '.events[-1].attributes[1].value')
echo "📋 Pet Interaction Code ID: $INTERACTION_CODE_ID"

echo ""
echo "🏠 Step 5: Instantiating Contracts..."

# Instantiate User Map Contract
echo "📜 Instantiating User Map Contract..."
USER_MAP_INIT='{"admin": null}'
xiond tx wasm instantiate $USER_MAP_CODE_ID "$USER_MAP_INIT" \
    --from $WALLET \
    --label "xion-pet-game-user-map" \
    --gas-prices $GAS_PRICES \
    --gas auto \
    --gas-adjustment $GAS_ADJUSTMENT \
    -y --no-admin \
    --chain-id $CHAIN_ID \
    --node $NODE_URL

sleep 6

# Get User Map contract address
USER_MAP_ADDR=$(xiond query wasm list-contract-by-code $USER_MAP_CODE_ID --node $NODE_URL --output json | jq -r '.contracts[0]')
echo "📍 User Map Contract Address: $USER_MAP_ADDR"

# Instantiate Pet NFT Contract
echo "🐾 Instantiating Pet NFT Contract..."
PET_NFT_INIT="{\"name\": \"XION Pet Game NFTs\", \"symbol\": \"XPET\", \"minter\": \"$WALLET\"}"
xiond tx wasm instantiate $PET_NFT_CODE_ID "$PET_NFT_INIT" \
    --from $WALLET \
    --label "xion-pet-game-nft" \
    --gas-prices $GAS_PRICES \
    --gas auto \
    --gas-adjustment $GAS_ADJUSTMENT \
    -y --no-admin \
    --chain-id $CHAIN_ID \
    --node $NODE_URL

sleep 6

# Get Pet NFT contract address
PET_NFT_ADDR=$(xiond query wasm list-contract-by-code $PET_NFT_CODE_ID --node $NODE_URL --output json | jq -r '.contracts[0]')
echo "📍 Pet NFT Contract Address: $PET_NFT_ADDR"

# Instantiate Achievement Contract
echo "🎯 Instantiating Achievement Contract..."
ACHIEVEMENT_INIT="{\"admin\": \"$WALLET\", \"pet_nft_contract\": \"$PET_NFT_ADDR\"}"
xiond tx wasm instantiate $ACHIEVEMENT_CODE_ID "$ACHIEVEMENT_INIT" \
    --from $WALLET \
    --label "xion-pet-game-achievements" \
    --gas-prices $GAS_PRICES \
    --gas auto \
    --gas-adjustment $GAS_ADJUSTMENT \
    -y --no-admin \
    --chain-id $CHAIN_ID \
    --node $NODE_URL

sleep 6

# Get Achievement contract address
ACHIEVEMENT_ADDR=$(xiond query wasm list-contract-by-code $ACHIEVEMENT_CODE_ID --node $NODE_URL --output json | jq -r '.contracts[0]')
echo "📍 Achievement Contract Address: $ACHIEVEMENT_ADDR"

# Instantiate Pet Interaction Contract
echo "🎮 Instantiating Pet Interaction Contract..."
INTERACTION_INIT="{\"admin\": \"$WALLET\", \"achievement_contract\": \"$ACHIEVEMENT_ADDR\", \"pet_nft_contract\": \"$PET_NFT_ADDR\"}"
xiond tx wasm instantiate $INTERACTION_CODE_ID "$INTERACTION_INIT" \
    --from $WALLET \
    --label "xion-pet-game-interaction" \
    --gas-prices $GAS_PRICES \
    --gas auto \
    --gas-adjustment $GAS_ADJUSTMENT \
    -y --no-admin \
    --chain-id $CHAIN_ID \
    --node $NODE_URL

sleep 6

# Get Pet Interaction contract address
INTERACTION_ADDR=$(xiond query wasm list-contract-by-code $INTERACTION_CODE_ID --node $NODE_URL --output json | jq -r '.contracts[0]')
echo "📍 Pet Interaction Contract Address: $INTERACTION_ADDR"

echo ""
echo "🎉 Deployment Complete! 🎉"
echo ""
echo "📋 Contract Addresses:"
echo "   📜 User Map Contract:        $USER_MAP_ADDR"
echo "   🐾 Pet NFT Contract:         $PET_NFT_ADDR"
echo "   🎯 Achievement Contract:     $ACHIEVEMENT_ADDR"
echo "   🎮 Pet Interaction Contract: $INTERACTION_ADDR"
echo ""
echo "🔧 Next Steps:"
echo "1. Add these addresses to your .env.local file:"
echo "   EXPO_PUBLIC_USER_MAP_CONTRACT_ADDRESS=$USER_MAP_ADDR"
echo "   EXPO_PUBLIC_PET_NFT_CONTRACT_ADDRESS=$PET_NFT_ADDR"
echo "   EXPO_PUBLIC_ACHIEVEMENT_CONTRACT_ADDRESS=$ACHIEVEMENT_ADDR"
echo "   EXPO_PUBLIC_PET_INTERACTION_CONTRACT_ADDRESS=$INTERACTION_ADDR"
echo ""
echo "2. Test your contracts with ./deployment/test.sh"
echo "3. Update your React Native app to use the new contract addresses"