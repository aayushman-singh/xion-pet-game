#!/bin/bash

# Build script for XION contracts
# This script builds each contract individually using Docker

set -e

echo "🔨 Building XION Smart Contracts..."

# Function to build a single contract
build_contract() {
    local contract_name=$1
    local contract_dir=$2
    
    echo "📦 Building $contract_name..."
    
    cd "$contract_dir"
    
    # Try different optimizer versions until one works
    optimizers=("0.15.1" "0.14.0" "0.13.0")
    
    for version in "${optimizers[@]}"; do
        echo "  Trying optimizer version $version..."
        
        if docker run --rm -v "$(pwd)":/code \
           --mount type=volume,source="${contract_name}_cache",target=/target \
           --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
           cosmwasm/optimizer:$version; then
            echo "  ✅ $contract_name built successfully with optimizer $version"
            break
        else
            echo "  ❌ Failed with optimizer $version, trying next..."
            # Try without volume mounts
            if docker run --rm -v "$(pwd)":/code cosmwasm/optimizer:$version; then
                echo "  ✅ $contract_name built successfully with optimizer $version (no cache)"
                break
            fi
        fi
    done
    
    # Check if artifacts were created
    if [ -d "artifacts" ] && [ -f "artifacts/"*.wasm ]; then
        echo "  📁 Artifacts created successfully"
        ls -la artifacts/
    else
        echo "  ❌ No artifacts found for $contract_name"
        return 1
    fi
    
    cd - > /dev/null
}

# Build each contract
echo "🏗️  Starting contract builds..."

# Pet NFT Contract
build_contract "pet-nft" "pet-nft"

# Achievement Contract
build_contract "achievement" "achievement"

# Pet Interaction Contract
build_contract "pet-interaction" "pet-interaction"

echo "🎉 All contracts built successfully!"
echo ""
echo "📋 Contract Artifacts:"
find . -name "*.wasm" -type f | while read -r file; do
    echo "  - $file ($(stat -c%s "$file" | numfmt --to=iec-i)B)"
done

echo ""
echo "🚀 Ready for deployment!"
