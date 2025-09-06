# XION Pet Game Smart Contract Deployment

This directory contains scripts and configuration for deploying the XION Pet Game smart contracts to the XION blockchain.

## Prerequisites

1. **Install xiond CLI**:
   ```bash
   # Follow the XION installation guide
   # https://docs.burnt.com/xion/developers/featured-guides/setup-local-environment/interact-with-xion-chain-setup-xion-daemon
   ```

2. **Install Docker**:
   ```bash
   # Docker is required for contract optimization
   # https://www.docker.com/get-started
   ```

3. **Create and Fund a Wallet**:
   ```bash
   # Generate a new wallet
   xiond keys add <your-wallet-name>
   
   # Fund it using the XION faucet
   # https://faucet.xion.burnt.com/
   ```

4. **Set Environment Variables**:
   ```bash
   export WALLET="your-wallet-name-or-address"
   ```

## Smart Contracts

The XION Pet Game includes 4 smart contracts:

1. **User Map Contract** (`user_map_contract.rs`)
   - Stores user game data (pets owned, progress, etc.)
   - Maps user addresses to JSON data

2. **Pet NFT Contract** (`pet_nft_contract.rs`)
   - CW721-based NFT contract for pets, furniture, and decorations
   - Supports zkTLS proof verification for minting
   - Compatible with XION marketplace

3. **Achievement Contract** (`achievement_contract.rs`)
   - Manages game achievements and rewards
   - Validates achievement completion with zkTLS proofs
   - Tracks user progress and completion

4. **Pet Interaction Contract** (`pet_interaction_contract.rs`)
   - Handles pet care activities (feed, play, clean)
   - Records game sessions and scores
   - Manages pet status updates with zkTLS verification

## Deployment Process

### Step 1: Build and Optimize Contracts

```bash
# Make scripts executable
chmod +x deployment/*.sh

# Build and optimize all contracts
./deployment/build.sh
```

This will:
- Build all contracts with `cargo build --release --target wasm32-unknown-unknown`
- Optimize contracts using CosmWasm optimizer
- Generate optimized `.wasm` files in `contracts/artifacts/`

### Step 2: Deploy to XION Testnet

```bash
# Set your wallet
export WALLET="your-wallet-name"

# Deploy all contracts
./deployment/deploy.sh
```

This will:
1. Upload all contract code to XION testnet
2. Get code IDs for each contract
3. Instantiate all contracts with proper configuration
4. Display contract addresses for your app

### Step 3: Test Deployed Contracts

```bash
# Set contract addresses (from deploy.sh output)
export USER_MAP_CONTRACT_ADDRESS="xion1..."
export PET_NFT_CONTRACT_ADDRESS="xion1..."
export ACHIEVEMENT_CONTRACT_ADDRESS="xion1..."
export INTERACTION_CONTRACT_ADDRESS="xion1..."

# Run tests
./deployment/test.sh
```

### Step 4: Update Your App

Add the deployed contract addresses to your `.env.local` file:

```env
EXPO_PUBLIC_USER_MAP_CONTRACT_ADDRESS=xion1...
EXPO_PUBLIC_PET_NFT_CONTRACT_ADDRESS=xion1...
EXPO_PUBLIC_ACHIEVEMENT_CONTRACT_ADDRESS=xion1...
EXPO_PUBLIC_PET_INTERACTION_CONTRACT_ADDRESS=xion1...
```

## Contract Interactions

### User Map Contract

```bash
# Store user data
SET_MSG='{"set_value": {"key": "", "value": "{\"pets\": [\"cat1\", \"dog1\"]}"}}'
xiond tx wasm execute $USER_MAP_ADDR "$SET_MSG" --from $WALLET

# Query user data
QUERY_MSG='{"get_value_by_user": {"address": "xion1..."}}'
xiond query wasm contract-state smart $USER_MAP_ADDR "$QUERY_MSG"
```

### Pet NFT Contract

```bash
# Mint a pet NFT
MINT_MSG='{"mint": {"token_id": "pet-1", "owner": "xion1...", "extension": {"name": "Fluffy", "description": "A cute cat"}}}'
xiond tx wasm execute $PET_NFT_ADDR "$MINT_MSG" --from $WALLET

# Query NFT info
xiond query wasm contract-state smart $PET_NFT_ADDR '{"owner_of": {"token_id": "pet-1"}}'
```

### Achievement Contract

```bash
# Query achievements
xiond query wasm contract-state smart $ACHIEVEMENT_ADDR '{"all_achievements": {}}'

# Submit achievement proof
PROOF_MSG='{"submit_achievement_proof": {"achievement_id": "first-pet", "proof": {...}}}'
xiond tx wasm execute $ACHIEVEMENT_ADDR "$PROOF_MSG" --from $WALLET
```

### Pet Interaction Contract

```bash
# Record pet care activity
CARE_MSG='{"record_care_activity": {"pet_id": "pet-1", "activity": {...}, "proof": {...}}}'
xiond tx wasm execute $INTERACTION_ADDR "$CARE_MSG" --from $WALLET

# Query pet status
xiond query wasm contract-state smart $INTERACTION_ADDR '{"pet_status": {"pet_id": "pet-1"}}'
```

## Troubleshooting

### Common Issues

1. **Transaction fails with "out of gas"**:
   - Increase gas limit: `--gas 2000000`
   - Increase gas adjustment: `--gas-adjustment 2.0`

2. **Contract instantiation fails**:
   - Check wallet balance: `xiond query bank balances $WALLET_ADDR`
   - Verify contract code was uploaded successfully

3. **Contract not found**:
   - Ensure you're using the correct contract address
   - Check the contract exists: `xiond query wasm list-contracts`

4. **Docker optimization fails**:
   - Make sure Docker is running
   - Check Docker has enough disk space
   - Try pulling the optimizer image manually: `docker pull cosmwasm/optimizer:0.16.0`

### Getting Help

- **XION Documentation**: https://docs.burnt.com/xion/
- **CosmWasm Documentation**: https://docs.cosmwasm.com/
- **XION Discord**: Join for community support

## Security Considerations

⚠️ **Important Security Notes**:

1. **Private Keys**: Never commit private keys or mnemonics to version control
2. **Admin Keys**: The deployment scripts set up contracts without admin for security
3. **Testing**: Always test on testnet before mainnet deployment
4. **Upgrades**: These contracts are immutable once deployed
5. **Funds**: Only use testnet tokens for testing

## Contract Addresses

After deployment, your contract addresses will be:

```
📋 Contract Addresses:
   📜 User Map Contract:        xion1...
   🐾 Pet NFT Contract:         xion1...
   🎯 Achievement Contract:     xion1...
   🎮 Pet Interaction Contract: xion1...
```

Keep these addresses secure and add them to your app configuration.