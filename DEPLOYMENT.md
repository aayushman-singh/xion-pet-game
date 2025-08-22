# XION Pet Game - Smart Contract Deployment Guide

This guide walks you through deploying the XION Pet Game smart contracts using the same pattern as the XION documentation.

## 🏗️ Architecture Overview

The game consists of three main smart contracts:

1. **Pet NFT Contract** (`pet_nft_contract.rs`) - Manages pet NFTs with zkTLS proof validation
2. **Achievement Contract** (`achievement_contract.rs`) - Handles achievement verification and rewards
3. **Pet Interaction Contract** (`pet_interaction_contract.rs`) - Tracks pet care activities and game sessions

## 📋 Prerequisites

Before deploying, ensure you have:

- **XION CLI installed**: Follow [XION installation guide](https://docs.burnt.com/xion/developers/featured-guides/setup-local-environment/interact-with-xion-chain-setup-xion-daemon)
- **Docker installed and running**: Required for contract optimization
- **Funded wallet**: Get testnet tokens from [XION Faucet](https://faucet.xion.burnt.com/)

## 🔧 Setup Your Wallet

### Generate a Wallet

```bash
# Create a new wallet
xiond keys add my-wallet

# Or use an existing one
xiond keys show my-wallet
```

### Fund Your Wallet

Visit the [XION Faucet](https://faucet.xion.burnt.com/) or use the Discord faucet to get testnet tokens.

## 🚀 Deployment Options

### Option 1: Automated Deployment (Recommended)

Use our comprehensive deployment script:

```bash
# Make the script executable
chmod +x scripts/deploy_xion_contracts.sh

# Deploy all contracts
./scripts/deploy_xion_contracts.sh my-wallet
```

This script will:
1. Build and optimize all contracts
2. Deploy them in the correct order
3. Set up initial achievements
4. Update your `.env.local` file
5. Generate a deployment summary

### Option 2: Manual Deployment

Follow the step-by-step process below for more control.

## 📝 Step-by-Step Manual Deployment

### 1. Build and Optimize Contracts

```bash
# Navigate to contracts directory
cd contracts

# Build with CosmWasm optimizer
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/optimizer:0.16.0

cd ..
```

### 2. Set Environment Variables

```bash
# Set your wallet name
WALLET="my-wallet"

# Get your wallet address
WALLET_ADDRESS=$(xiond keys show $WALLET -a)

# XION network configuration
CHAIN_ID="xion-testnet-2"
NODE_URL="https://rpc.xion-testnet-2.burnt.com:443"
GAS_PRICES="0.025uxion"
GAS_ADJUSTMENT="1.3"
```

### 3. Deploy Pet NFT Contract

```bash
# Upload the contract
RES=$(xiond tx wasm store ./contracts/artifacts/pet_nft_contract.wasm \
      --chain-id $CHAIN_ID \
      --gas-adjustment $GAS_ADJUSTMENT \
      --gas-prices $GAS_PRICES \
      --gas auto \
      -y --output json \
      --node $NODE_URL \
      --from $WALLET)

# Get transaction hash
TXHASH=$(echo $RES | jq -r '.txhash')
echo "Upload TX: $TXHASH"

# Wait for transaction to process
sleep 5

# Get code ID
CODE_ID=$(xiond query tx $TXHASH \
  --node $NODE_URL \
  --output json | jq -r '.events[] | select(.type == "store_code") | .attributes[] | select(.key == "code_id") | .value')

echo "Code ID: $CODE_ID"

# Instantiate the contract
MSG='{ "name": "XION Pet NFTs", "symbol": "XPET", "minter": "'$WALLET_ADDRESS'" }'

xiond tx wasm instantiate $CODE_ID "$MSG" \
  --from $WALLET \
  --label "xion-pet-nft-v1" \
  --gas-prices $GAS_PRICES \
  --gas auto \
  --gas-adjustment $GAS_ADJUSTMENT \
  -y --no-admin \
  --chain-id $CHAIN_ID \
  --node $NODE_URL

# Get the instantiate transaction hash and contract address
# (Follow the same pattern as in the XION docs)
```

### 4. Deploy Achievement Contract

```bash
# Upload achievement contract
RES=$(xiond tx wasm store ./contracts/artifacts/achievement_contract.wasm \
      --chain-id $CHAIN_ID \
      --gas-adjustment $GAS_ADJUSTMENT \
      --gas-prices $GAS_PRICES \
      --gas auto \
      -y --output json \
      --node $NODE_URL \
      --from $WALLET)

# Follow same pattern as Pet NFT contract...
```

### 5. Deploy Pet Interaction Contract

```bash
# Upload pet interaction contract
RES=$(xiond tx wasm store ./contracts/artifacts/pet_interaction_contract.wasm \
      --chain-id $CHAIN_ID \
      --gas-adjustment $GAS_ADJUSTMENT \
      --gas-prices $GAS_PRICES \
      --gas auto \
      -y --output json \
      --node $NODE_URL \
      --from $WALLET)

# Follow same pattern...
```

## 🎯 Post-Deployment Setup

### Register Achievements

After deploying the achievement contract, register the initial achievements:

```bash
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
```

### Update Environment Configuration

Create or update your `.env.local` file:

```bash
# XION Contract Addresses
EXPO_PUBLIC_PET_NFT_CONTRACT_ADDRESS="xion1..."
EXPO_PUBLIC_ACHIEVEMENT_CONTRACT_ADDRESS="xion1..."
EXPO_PUBLIC_PET_INTERACTION_CONTRACT_ADDRESS="xion1..."

# XION Network Configuration
EXPO_PUBLIC_RPC_ENDPOINT="https://rpc.xion-testnet-2.burnt.com:443"
EXPO_PUBLIC_REST_ENDPOINT="https://api.xion-testnet-2.burnt.com"
EXPO_PUBLIC_CHAIN_ID="xion-testnet-2"
```

## 🔍 Testing Your Deployment

### Query Contracts

```bash
# Query pet NFT contract info
xiond query wasm contract-state smart $PET_NFT_CONTRACT \
  '{"contract_info":{}}' --node $NODE_URL

# Query all achievements
xiond query wasm contract-state smart $ACHIEVEMENT_CONTRACT \
  '{"all_achievements":{}}' --node $NODE_URL

# Query pet interaction config
xiond query wasm contract-state smart $PET_INTERACTION_CONTRACT \
  '{"config":{}}' --node $NODE_URL
```

### Test Pet NFT Minting

```bash
# Mint a test pet NFT
MINT_MSG='{
  "mint": {
    "token_id": "pet_001",
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

xiond tx wasm execute $PET_NFT_CONTRACT "$MINT_MSG" \
  --from $WALLET \
  --gas-prices $GAS_PRICES \
  --gas auto \
  --gas-adjustment $GAS_ADJUSTMENT \
  -y \
  --node $NODE_URL \
  --chain-id $CHAIN_ID
```

## 🎮 Integration with Frontend

After deployment, your React Native app will automatically use the deployed contracts through:

1. **ZkTLSManager** - Handles proof generation and contract interactions
2. **AchievementVerification** - Validates achievements on-chain
3. **PetCareService** - Submits pet status updates to contracts

The services are configured to:
- Generate zkTLS proofs for all interactions
- Submit proofs to appropriate contracts
- Query contract state for verification
- Handle achievement progress tracking

## 🔗 Next Steps

1. **Start your app**: `npm start` or `expo start`
2. **Test pet interactions**: Care for pets and verify status updates
3. **Play games**: Test achievement triggers
4. **Monitor contracts**: Use XION explorer to view transactions

## 📚 Additional Resources

- [XION Documentation](https://docs.burnt.com/xion)
- [CosmWasm Documentation](https://docs.cosmwasm.com)
- [zkTLS Integration Guide](https://docs.burnt.com/xion/developers/featured-guides/zk-tls)

## 🆘 Troubleshooting

### Common Issues

**Contract Upload Fails**
```bash
# Check if Docker is running
docker --version

# Verify contract artifacts exist
ls -la contracts/artifacts/
```

**Transaction Fails**
```bash
# Check wallet balance
xiond query bank balances $WALLET_ADDRESS --node $NODE_URL

# Verify network connectivity
xiond status --node $NODE_URL
```

**Frontend Can't Connect**
- Verify contract addresses in `.env.local`
- Check RPC endpoint configuration
- Ensure network connectivity

For more help, refer to the [XION Discord](https://discord.gg/xion) community.
