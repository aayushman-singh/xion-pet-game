// Note: DaveClient is now a mock implementation in types/zkTLS.ts
// For deployment scripts, you may need to use a different approach
// const { DaveClient } = require('@burnt-labs/dave-sdk');
const fs = require('fs');
const path = require('path');

async function deployNFTContract() {
  try {
    // Initialize Dave client
    const client = new DaveClient({
      rpcEndpoint: process.env.EXPO_PUBLIC_RPC_ENDPOINT || "https://rpc.xion-testnet-2.burnt.com:443",
      restEndpoint: process.env.EXPO_PUBLIC_REST_ENDPOINT || "https://api.xion-testnet-2.burnt.com",
    });

    // Load the compiled contract
    const contractPath = path.join(__dirname, '../artifacts/pet_nft_contract.wasm');
    const contractBytes = fs.readFileSync(contractPath);

    console.log('🚀 Deploying NFT Contract...');

    // Deploy the contract
    const deployResult = await client.deploy({
      code: contractBytes,
      instantiateMsg: {
        name: "XION Pet NFTs",
        symbol: "XPET",
        minter: process.env.DEPLOYER_ADDRESS, // Your wallet address
      },
      label: "xion-pet-nft-v1",
    });

    console.log('✅ Contract deployed successfully!');
    console.log('Contract Address:', deployResult.contractAddress);
    console.log('Transaction Hash:', deployResult.txHash);

    // Save the contract address to .env.local
    const envPath = path.join(__dirname, '../.env.local');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Add or update the NFT contract address
    if (envContent.includes('EXPO_PUBLIC_PET_NFT_CONTRACT_ADDRESS')) {
      envContent = envContent.replace(
        /EXPO_PUBLIC_PET_NFT_CONTRACT_ADDRESS="[^"]*"/,
        `EXPO_PUBLIC_PET_NFT_CONTRACT_ADDRESS="${deployResult.contractAddress}"`
      );
    } else {
      envContent += `\nEXPO_PUBLIC_PET_NFT_CONTRACT_ADDRESS="${deployResult.contractAddress}"`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log('📝 Updated .env.local with contract address');

    return deployResult.contractAddress;

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

// Alternative: Deploy using XION CLI
async function deployWithXIONCLI() {
  console.log('🔧 Alternative: Deploy using XION CLI');
  console.log('');
  console.log('1. Install XION CLI:');
  console.log('   npm install -g @burnt-labs/xion-cli');
  console.log('');
  console.log('2. Build the contract:');
  console.log('   cargo wasm');
  console.log('');
  console.log('3. Deploy:');
  console.log('   xion tx wasm store artifacts/pet_nft_contract.wasm --from your-wallet --gas-prices 0.025uxion --gas auto --gas-adjustment 1.3 -y');
  console.log('');
  console.log('4. Instantiate:');
  console.log('   xion tx wasm instantiate [CODE_ID] \'{"name":"XION Pet NFTs","symbol":"XPET","minter":"[YOUR_ADDRESS]"}\' --from your-wallet --label "xion-pet-nft" --gas-prices 0.025uxion --gas auto --gas-adjustment 1.3 -y');
  console.log('');
  console.log('5. Add the contract address to .env.local:');
  console.log('   EXPO_PUBLIC_PET_NFT_CONTRACT_ADDRESS="[CONTRACT_ADDRESS]"');
}

// Quick setup for hackathon
async function quickHackathonSetup() {
  console.log('🎯 Quick Hackathon Setup');
  console.log('');
  console.log('For immediate testing, you can:');
  console.log('');
  console.log('1. Use the demo mode (already implemented)');
  console.log('2. Deploy a simple contract using XION CLI');
  console.log('3. Use a pre-deployed test contract');
  console.log('');
  console.log('Demo mode is already working - you can test the full UI!');
}

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--cli')) {
    deployWithXIONCLI();
  } else if (args.includes('--hackathon')) {
    quickHackathonSetup();
  } else {
    deployNFTContract().catch(console.error);
  }
}

module.exports = { deployNFTContract, deployWithXIONCLI, quickHackathonSetup };
