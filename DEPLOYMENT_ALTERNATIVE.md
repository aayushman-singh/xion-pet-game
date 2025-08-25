# 🚀 Alternative XION Contract Deployment Guide

Since we're encountering build issues with the Docker optimizer, here's an alternative approach to get your contracts deployed and working.

## Quick Start: Deploy Using xiond CLI

### Step 1: Get Pre-built WASM Files

For now, let's use simplified versions of your contracts. I'll provide you with the deployment commands and you can iterate on the contract logic later.

### Step 2: Set up XION CLI in WSL

```bash
# In WSL
wsl

# Update system and install dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget jq build-essential

# Download and install xiond
wget https://github.com/burnt-labs/xion/releases/latest/download/xiond-linux-amd64
chmod +x xiond-linux-amd64
sudo mv xiond-linux-amd64 /usr/local/bin/xiond

# Verify installation
xiond version
```

### Step 3: Create and Fund Wallet

```bash
# Create a new wallet
xiond keys add my-wallet

# Save the mnemonic and address!
# Fund the wallet from XION testnet faucet
# Visit: https://faucet.xion-testnet-1.burnt.com/
```

### Step 4: Deploy Simplified Contracts

Since the build is failing, let's use a simplified approach. You can deploy basic CosmWasm contracts first and then upgrade them later.

#### Deploy a Basic NFT Contract

```bash
# Download a working CosmWasm NFT contract
wget https://github.com/CosmWasm/cw-nfts/releases/download/v0.16.0/cw721_base.wasm

# Store the contract
xiond tx wasm store cw721_base.wasm --from my-wallet --chain-id xion-testnet-1 --gas-prices 0.025uxion --gas auto --gas-adjustment 1.3 -y

# Get the code ID from the transaction
# Query the code info
xiond query wasm list-code

# Instantiate the contract (replace CODE_ID with the actual ID)
xiond tx wasm instantiate CODE_ID '{
  "name": "XION Pets",
  "symbol": "PETS",
  "minter": "YOUR_WALLET_ADDRESS"
}' --from my-wallet --label "xion-pets" --chain-id xion-testnet-1 --gas-prices 0.025uxion --gas auto --gas-adjustment 1.3 -y
```

### Step 5: Update Your App

Once you have deployed contracts, update your `.env.local`:

```env
# Add these contract addresses
PET_NFT_CONTRACT_ADDRESS=xion1...
ACHIEVEMENT_CONTRACT_ADDRESS=xion1...
PET_INTERACTION_CONTRACT_ADDRESS=xion1...
```

## Next Steps

1. **Deploy basic contracts**: Get the fundamental infrastructure working
2. **Test integration**: Make sure your app can interact with the contracts
3. **Iterate on contract logic**: Once basic deployment works, we can add the zkTLS features
4. **Upgrade contracts**: Use CosmWasm's upgrade mechanism to add advanced features

## Why This Approach Works

- ✅ **Faster iteration**: Get contracts deployed quickly
- ✅ **Proven code**: Uses battle-tested CosmWasm contracts
- ✅ **Incremental improvement**: Add features gradually
- ✅ **Real testing**: Test the full deployment and integration flow

## Resume Building Later

Once you have the basic deployment working, we can:
1. Fix the dependency issues in a separate environment
2. Build the contracts with proper zkTLS integration
3. Upgrade the deployed contracts with new logic

This gets you unblocked and moving forward with your project while we solve the build issues!
