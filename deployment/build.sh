#!/bin/bash

# Build and Optimize Smart Contracts for XION
set -e

echo "🏗️  Building XION Pet Game Smart Contracts..."

# Navigate to contracts directory
cd contracts

echo "📦 Installing dependencies..."
cargo check

echo "🔧 Building user map contract..."
cargo build --release --target wasm32-unknown-unknown

echo "🚀 Optimizing contract with Docker..."
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/optimizer:0.16.0

echo "✅ Contracts built and optimized!"
echo "📁 Optimized contracts are in the artifacts/ directory"

# List generated artifacts
ls -la artifacts/

echo ""
echo "🎯 Ready for deployment to XION!"
echo "   Run ./deployment/deploy.sh to deploy to testnet"