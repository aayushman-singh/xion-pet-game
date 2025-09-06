#!/bin/bash

# Setup Environment Configuration for XION Pet Game
set -e

echo "🔧 Setting up XION Pet Game environment configuration..."

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "📄 .env.local already exists. Creating backup..."
    cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)
fi

# Copy example to .env.local
cp .env.example .env.local

echo "✅ Created .env.local from template"
echo ""
echo "📝 Next steps:"
echo "1. Deploy your contracts: ./deployment/deploy.sh"
echo "2. Update .env.local with your contract addresses"
echo "3. Configure your Abstraxion key (if using wallet integration)"
echo ""
echo "📋 Contract addresses to add after deployment:"
echo "   EXPO_PUBLIC_USER_MAP_CONTRACT_ADDRESS=xion1..."
echo "   EXPO_PUBLIC_PET_NFT_CONTRACT_ADDRESS=xion1..."
echo "   EXPO_PUBLIC_ACHIEVEMENT_CONTRACT_ADDRESS=xion1..."
echo "   EXPO_PUBLIC_PET_INTERACTION_CONTRACT_ADDRESS=xion1..."