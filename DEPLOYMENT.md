# 🚀 XION Pet Game Smart Contract Deployment Guide

This guide will walk you through deploying your XION Pet Game smart contracts to the XION blockchain and connecting them to your React Native app.

## 📋 Prerequisites

### 1. Development Tools
- ✅ **Node.js** (v16+), **npm/yarn**
- ✅ **Rust** with `wasm32-unknown-unknown` target
- ✅ **Docker** (for contract optimization)
- ✅ **xiond CLI** (XION daemon)
- ✅ **Funded XION testnet wallet**

### 2. Install Rust and WebAssembly
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown
```

### 3. Install xiond CLI
Follow [XION docs](https://docs.burnt.com/xion/developers/featured-guides/setup-local-environment/interact-with-xion-chain-setup-xion-daemon)

### 4. Create Wallet
```bash
xiond keys add my-wallet
# Fund at https://faucet.xion.burnt.com/
```

## 🏗️ Smart Contract Architecture

Your game includes 4 contracts:

1. **🗂️ User Map** - Store user game data
2. **🐾 Pet NFT** - Manage pet/item NFTs (CW721)
3. **🏆 Achievement** - Track achievements with zkTLS proofs
4. **🎮 Pet Interaction** - Handle pet care and game sessions

## 🚀 Quick Deployment

```bash
# 1. Setup environment
export WALLET="my-wallet"
./deployment/setup-env.sh

# 2. Build contracts
./deployment/build.sh

# 3. Deploy to testnet
./deployment/deploy.sh

# 4. Test deployment
./deployment/test.sh

# 5. Update .env.local with contract addresses
# 6. Start your app
npm start
```

## 📄 Contract Addresses

After deployment, update `.env.local`:

```env
EXPO_PUBLIC_USER_MAP_CONTRACT_ADDRESS=xion1...
EXPO_PUBLIC_PET_NFT_CONTRACT_ADDRESS=xion1...
EXPO_PUBLIC_ACHIEVEMENT_CONTRACT_ADDRESS=xion1...
EXPO_PUBLIC_PET_INTERACTION_CONTRACT_ADDRESS=xion1...
```

## 🎮 Test Your Game

1. **Home Tab**: Claim starter pet
2. **Pet Tab**: Interact with pets  
3. **Play Tab**: Jump game with scores
4. **NFT Tab**: Mint and trade NFTs

## 🔧 Troubleshooting

- **Out of gas**: Use `--gas 2000000 --gas-adjustment 2.0`
- **Insufficient funds**: Get tokens from [faucet](https://faucet.xion.burnt.com/)
- **Command not found**: Install xiond and add to PATH

## 🎉 Success!

Your pet game now runs on XION blockchain with:
- ✅ Smart contracts deployed
- ✅ On-chain pet system
- ✅ NFT marketplace
- ✅ Achievement tracking

Happy building! 🚀