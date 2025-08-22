#!/bin/bash

# XION Pet Game Contract Deployment Script
# Following the exact pattern from XION documentation

set -e

# Configuration
CHAIN_ID="xion-testnet-2"
NODE_URL="https://rpc.xion-testnet-2.burnt.com:443"
GAS_PRICES="0.025uxion"
GAS_ADJUSTMENT="1.3"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log() {
    echo -e "${BLUE}[XION]${NC} $1"
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

# Check if wallet is provided
if [ -z "$1" ]; then
    error "Usage: $0 <wallet-name>"
fi

WALLET="$1"

# Verify wallet exists
log "Checking wallet: $WALLET"
if ! xiond keys show $WALLET > /dev/null 2>&1; then
    error "Wallet '$WALLET' not found. Create one with: xiond keys add $WALLET"
fi

# Get wallet address
WALLET_ADDRESS=$(xiond keys show $WALLET -a)
log "Using wallet address: $WALLET_ADDRESS"

# Build and optimize contracts
log "Building contracts with Docker optimizer..."
cd contracts

docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/optimizer:0.16.0

cd ..
success "Contracts optimized"

# Function to upload and instantiate a contract
deploy_contract() {
    local contract_name="$1"
    local instantiate_msg="$2"
    local label="$3"
    
    log "Deploying $contract_name..."
    
    # Upload contract
    log "Uploading $contract_name..."
    RES=$(xiond tx wasm store ./contracts/artifacts/${contract_name}.wasm \
          --chain-id $CHAIN_ID \
          --gas-adjustment $GAS_ADJUSTMENT \
          --gas-prices $GAS_PRICES \
          --gas auto \
          -y --output json \
          --node $NODE_URL \
          --from $WALLET)
    
    TXHASH=$(echo $RES | jq -r '.txhash')
    log "Upload transaction: $TXHASH"
    
    # Wait for transaction
    sleep 5
    
    # Get code ID
    CODE_ID=$(xiond query tx $TXHASH \
      --node $NODE_URL \
      --output json | jq -r '.events[] | select(.type == "store_code") | .attributes[] | select(.key == "code_id") | .value')
    
    log "Code ID: $CODE_ID"
    
    # Instantiate contract
    log "Instantiating $contract_name..."
    xiond tx wasm instantiate $CODE_ID "$instantiate_msg" \
      --from $WALLET \
      --label "$label" \
      --gas-prices $GAS_PRICES \
      --gas auto \
      --gas-adjustment $GAS_ADJUSTMENT \
      -y --no-admin \
      --chain-id $CHAIN_ID \
      --node $NODE_URL > /tmp/instantiate_result.json
    
    INST_TXHASH=$(cat /tmp/instantiate_result.json | jq -r '.txhash')
    log "Instantiate transaction: $INST_TXHASH"
    
    # Wait for transaction
    sleep 5
    
    # Get contract address
    CONTRACT=$(xiond query tx $INST_TXHASH \
      --node $NODE_URL \
      --output json | jq -r '.events[] | select(.type == "instantiate") | .attributes[] | select(.key == "_contract_address") | .value')
    
    success "$contract_name deployed at: $CONTRACT"
    echo $CONTRACT
}

# Deploy Pet NFT Contract
log "🐾 Deploying Pet NFT Contract..."
PET_NFT_MSG='{ "name": "XION Pet NFTs", "symbol": "XPET", "minter": "'$WALLET_ADDRESS'" }'
PET_NFT_CONTRACT=$(deploy_contract "pet_nft_contract" "$PET_NFT_MSG" "xion-pet-nft-v1")

# Deploy Achievement Contract
log "🏆 Deploying Achievement Contract..."
ACHIEVEMENT_MSG='{ "admin": "'$WALLET_ADDRESS'", "pet_nft_contract": "'$PET_NFT_CONTRACT'" }'
ACHIEVEMENT_CONTRACT=$(deploy_contract "achievement_contract" "$ACHIEVEMENT_MSG" "xion-achievement-v1")

# Deploy Pet Interaction Contract
log "🎮 Deploying Pet Interaction Contract..."
PET_INTERACTION_MSG='{ "admin": "'$WALLET_ADDRESS'", "achievement_contract": "'$ACHIEVEMENT_CONTRACT'", "pet_nft_contract": "'$PET_NFT_CONTRACT'" }'
PET_INTERACTION_CONTRACT=$(deploy_contract "pet_interaction_contract" "$PET_INTERACTION_MSG" "xion-pet-interaction-v1")

# Register sample achievements
log "🎯 Registering sample achievements..."

# Happy Pet Master Achievement
ACHIEVEMENT_1='{
  "register_achievement": {
    "achievement": {
      "id": "happy_pet_master",
      "title": "Happy Pet Master",
      "description": "Maintain 90% happiness for 24 hours",
      "category": "PET_CARE",
      "requirements": [{
        "trigger": "HAPPINESS_THRESHOLD",
        "threshold": "90",
        "additional_params": "{\"duration\": 86400000}"
      }],
      "reward": {
        "reward_type": "BADGE",
        "value": "happy_master_badge"
      },
      "active": true
    }
  }
}'

xiond tx wasm execute $ACHIEVEMENT_CONTRACT "$ACHIEVEMENT_1" \
  --from $WALLET \
  --gas-prices $GAS_PRICES \
  --gas auto \
  --gas-adjustment $GAS_ADJUSTMENT \
  -y \
  --node $NODE_URL \
  --chain-id $CHAIN_ID

# Height Master Achievement
ACHIEVEMENT_2='{
  "register_achievement": {
    "achievement": {
      "id": "height_master",
      "title": "Height Master",
      "description": "Reach a height of 1000 in a single game",
      "category": "GAME_SCORE",
      "requirements": [{
        "trigger": "HEIGHT_REACHED",
        "threshold": "1000"
      }],
      "reward": {
        "reward_type": "BADGE",
        "value": "height_master_badge"
      },
      "active": true
    }
  }
}'

xiond tx wasm execute $ACHIEVEMENT_CONTRACT "$ACHIEVEMENT_2" \
  --from $WALLET \
  --gas-prices $GAS_PRICES \
  --gas auto \
  --gas-adjustment $GAS_ADJUSTMENT \
  -y \
  --node $NODE_URL \
  --chain-id $CHAIN_ID

success "Sample achievements registered"

# Update environment file
log "📝 Updating environment configuration..."
ENV_FILE="../.env.local"

# Create or update .env.local
{
    echo "# XION Contract Addresses - Generated $(date)"
    echo "EXPO_PUBLIC_PET_NFT_CONTRACT_ADDRESS=\"$PET_NFT_CONTRACT\""
    echo "EXPO_PUBLIC_ACHIEVEMENT_CONTRACT_ADDRESS=\"$ACHIEVEMENT_CONTRACT\""
    echo "EXPO_PUBLIC_PET_INTERACTION_CONTRACT_ADDRESS=\"$PET_INTERACTION_CONTRACT\""
    echo ""
    echo "# XION Network Configuration"
    echo "EXPO_PUBLIC_RPC_ENDPOINT=\"$NODE_URL\""
    echo "EXPO_PUBLIC_REST_ENDPOINT=\"https://api.xion-testnet-2.burnt.com\""
    echo "EXPO_PUBLIC_CHAIN_ID=\"$CHAIN_ID\""
} > $ENV_FILE

# Create deployment summary
{
    echo "{"
    echo "  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
    echo "  \"chainId\": \"$CHAIN_ID\","
    echo "  \"wallet\": \"$WALLET_ADDRESS\","
    echo "  \"contracts\": {"
    echo "    \"petNft\": \"$PET_NFT_CONTRACT\","
    echo "    \"achievement\": \"$ACHIEVEMENT_CONTRACT\","
    echo "    \"petInteraction\": \"$PET_INTERACTION_CONTRACT\""
    echo "  }"
    echo "}"
} > deployment.json

success "Environment files updated"

# Display summary
echo ""
echo "🎉 Deployment Complete!"
echo "================================"
echo "Pet NFT Contract:        $PET_NFT_CONTRACT"
echo "Achievement Contract:    $ACHIEVEMENT_CONTRACT"
echo "Pet Interaction Contract: $PET_INTERACTION_CONTRACT"
echo ""
echo "📋 Next Steps:"
echo "1. Update your frontend services to use these contract addresses"
echo "2. Test contract interactions"
echo "3. Monitor the contracts on XION explorer"
echo ""
echo "🔍 Query examples:"
echo ""
echo "# Query pet NFT info"
echo "xiond query wasm contract-state smart $PET_NFT_CONTRACT '{\"contract_info\":{}}' --node $NODE_URL"
echo ""
echo "# Query all achievements"
echo "xiond query wasm contract-state smart $ACHIEVEMENT_CONTRACT '{\"all_achievements\":{}}' --node $NODE_URL"
echo ""
echo "# Query pet status"
echo "xiond query wasm contract-state smart $PET_INTERACTION_CONTRACT '{\"config\":{}}' --node $NODE_URL"
