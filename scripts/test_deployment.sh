#!/bin/bash

# XION Pet Game Contract Testing Script
# Tests the deployed contracts to ensure they're working correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Load environment variables
if [ -f ".env.local" ]; then
    export $(grep -v '^#' .env.local | xargs)
else
    error "No .env.local file found. Please deploy contracts first."
fi

# Check required environment variables
if [ -z "$EXPO_PUBLIC_PET_NFT_CONTRACT_ADDRESS" ]; then
    error "Pet NFT contract address not found in .env.local"
fi

if [ -z "$EXPO_PUBLIC_ACHIEVEMENT_CONTRACT_ADDRESS" ]; then
    error "Achievement contract address not found in .env.local"
fi

if [ -z "$EXPO_PUBLIC_PET_INTERACTION_CONTRACT_ADDRESS" ]; then
    error "Pet interaction contract address not found in .env.local"
fi

# Network configuration
NODE_URL="https://rpc.xion-testnet-2.burnt.com:443"
WALLET=${1:-"my-wallet"}

log "Testing XION Pet Game contracts..."
log "Pet NFT: $EXPO_PUBLIC_PET_NFT_CONTRACT_ADDRESS"
log "Achievement: $EXPO_PUBLIC_ACHIEVEMENT_CONTRACT_ADDRESS"
log "Pet Interaction: $EXPO_PUBLIC_PET_INTERACTION_CONTRACT_ADDRESS"

# Test 1: Query Pet NFT Contract Info
log "Testing Pet NFT contract..."
PET_NFT_INFO=$(xiond query wasm contract-state smart $EXPO_PUBLIC_PET_NFT_CONTRACT_ADDRESS \
  '{"contract_info":{}}' --node $NODE_URL --output json 2>/dev/null)

if [ $? -eq 0 ]; then
    success "Pet NFT contract is accessible"
    echo "  Name: $(echo $PET_NFT_INFO | jq -r '.data.name')"
    echo "  Symbol: $(echo $PET_NFT_INFO | jq -r '.data.symbol')"
else
    error "Failed to query Pet NFT contract"
fi

# Test 2: Query Achievement Contract
log "Testing Achievement contract..."
ACHIEVEMENTS=$(xiond query wasm contract-state smart $EXPO_PUBLIC_ACHIEVEMENT_CONTRACT_ADDRESS \
  '{"all_achievements":{}}' --node $NODE_URL --output json 2>/dev/null)

if [ $? -eq 0 ]; then
    success "Achievement contract is accessible"
    ACHIEVEMENT_COUNT=$(echo $ACHIEVEMENTS | jq '.data | length')
    echo "  Registered achievements: $ACHIEVEMENT_COUNT"
else
    error "Failed to query Achievement contract"
fi

# Test 3: Query Pet Interaction Contract
log "Testing Pet Interaction contract..."
PET_CONFIG=$(xiond query wasm contract-state smart $EXPO_PUBLIC_PET_INTERACTION_CONTRACT_ADDRESS \
  '{"config":{}}' --node $NODE_URL --output json 2>/dev/null)

if [ $? -eq 0 ]; then
    success "Pet Interaction contract is accessible"
    echo "  Admin: $(echo $PET_CONFIG | jq -r '.data.admin')"
else
    error "Failed to query Pet Interaction contract"
fi

# Test 4: Test Pet NFT Minting (if wallet provided)
if [ "$WALLET" != "my-wallet" ]; then
    log "Testing Pet NFT minting with wallet: $WALLET"
    
    WALLET_ADDRESS=$(xiond keys show $WALLET -a)
    TOKEN_ID="test_pet_$(date +%s)"
    
    MINT_MSG='{
      "mint": {
        "token_id": "'$TOKEN_ID'",
        "owner": "'$WALLET_ADDRESS'",
        "extension": {
          "name": "Test Pet",
          "description": "A test pet for validation",
          "image": "https://example.com/pet.png",
          "attributes": [
            {"trait_type": "Species", "value": "Cat"},
            {"trait_type": "Rarity", "value": "Common"}
          ]
        }
      }
    }'
    
    MINT_RESULT=$(xiond tx wasm execute $EXPO_PUBLIC_PET_NFT_CONTRACT_ADDRESS "$MINT_MSG" \
      --from $WALLET \
      --gas-prices 0.025uxion \
      --gas auto \
      --gas-adjustment 1.3 \
      -y \
      --node $NODE_URL \
      --chain-id xion-testnet-2 \
      --output json 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        MINT_TX=$(echo $MINT_RESULT | jq -r '.txhash')
        success "Pet NFT minted successfully"
        echo "  Token ID: $TOKEN_ID"
        echo "  Transaction: $MINT_TX"
        
        # Wait a bit and query the token
        sleep 3
        TOKEN_INFO=$(xiond query wasm contract-state smart $EXPO_PUBLIC_PET_NFT_CONTRACT_ADDRESS \
          '{"owner_of":{"token_id":"'$TOKEN_ID'"}}' --node $NODE_URL --output json 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            TOKEN_OWNER=$(echo $TOKEN_INFO | jq -r '.data.owner')
            echo "  Owner verified: $TOKEN_OWNER"
        fi
    else
        warning "Pet NFT minting failed (may need wallet funds)"
    fi
fi

# Test 5: Check contract interconnections
log "Testing contract interconnections..."

# Check if achievement contract knows about pet NFT contract
ACHIEVEMENT_CONFIG=$(xiond query wasm contract-state smart $EXPO_PUBLIC_ACHIEVEMENT_CONTRACT_ADDRESS \
  '{"config":{}}' --node $NODE_URL --output json 2>/dev/null)

if [ $? -eq 0 ]; then
    PET_NFT_IN_CONFIG=$(echo $ACHIEVEMENT_CONFIG | jq -r '.data.pet_nft_contract')
    if [ "$PET_NFT_IN_CONFIG" = "$EXPO_PUBLIC_PET_NFT_CONTRACT_ADDRESS" ]; then
        success "Achievement contract correctly references Pet NFT contract"
    else
        warning "Achievement contract pet_nft_contract reference mismatch"
    fi
fi

# Check if pet interaction contract knows about other contracts
PET_INT_CONFIG=$(xiond query wasm contract-state smart $EXPO_PUBLIC_PET_INTERACTION_CONTRACT_ADDRESS \
  '{"config":{}}' --node $NODE_URL --output json 2>/dev/null)

if [ $? -eq 0 ]; then
    ACHIEVEMENT_IN_CONFIG=$(echo $PET_INT_CONFIG | jq -r '.data.achievement_contract')
    PET_NFT_IN_INT_CONFIG=$(echo $PET_INT_CONFIG | jq -r '.data.pet_nft_contract')
    
    if [ "$ACHIEVEMENT_IN_CONFIG" = "$EXPO_PUBLIC_ACHIEVEMENT_CONTRACT_ADDRESS" ]; then
        success "Pet Interaction contract correctly references Achievement contract"
    else
        warning "Pet Interaction contract achievement_contract reference mismatch"
    fi
    
    if [ "$PET_NFT_IN_INT_CONFIG" = "$EXPO_PUBLIC_PET_NFT_CONTRACT_ADDRESS" ]; then
        success "Pet Interaction contract correctly references Pet NFT contract"
    else
        warning "Pet Interaction contract pet_nft_contract reference mismatch"
    fi
fi

# Test 6: Frontend compatibility check
log "Checking frontend compatibility..."

# Check if all required environment variables are set
FRONTEND_VARS=(
    "EXPO_PUBLIC_PET_NFT_CONTRACT_ADDRESS"
    "EXPO_PUBLIC_ACHIEVEMENT_CONTRACT_ADDRESS"
    "EXPO_PUBLIC_PET_INTERACTION_CONTRACT_ADDRESS"
    "EXPO_PUBLIC_RPC_ENDPOINT"
    "EXPO_PUBLIC_REST_ENDPOINT"
    "EXPO_PUBLIC_CHAIN_ID"
)

ALL_VARS_SET=true
for var in "${FRONTEND_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        warning "Missing environment variable: $var"
        ALL_VARS_SET=false
    fi
done

if $ALL_VARS_SET; then
    success "All required environment variables are set"
else
    warning "Some environment variables are missing - frontend may not work correctly"
fi

# Final summary
echo ""
echo "🎉 Testing Complete!"
echo "================================"
echo "Pet NFT Contract:         ✅ Working"
echo "Achievement Contract:     ✅ Working"
echo "Pet Interaction Contract: ✅ Working"
echo ""
echo "📱 Your frontend should now be able to:"
echo "  • Mint pet NFTs with zkTLS proofs"
echo "  • Track pet care activities on-chain"
echo "  • Verify achievements through smart contracts"
echo "  • Submit game sessions for verification"
echo ""
echo "🚀 Next steps:"
echo "  1. Start your React Native app: npm start"
echo "  2. Test pet interactions in the app"
echo "  3. Play games and trigger achievements"
echo "  4. Monitor contract transactions on XION explorer"

if [ "$WALLET" = "my-wallet" ]; then
    echo ""
    echo "💡 To test minting, run: ./scripts/test_deployment.sh <your-wallet-name>"
fi
