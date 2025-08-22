const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Comprehensive deployment script for all XION pet game contracts
 * Following the XION deployment pattern from the documentation
 */

const XION_CONFIG = {
  chainId: "xion-testnet-2",
  rpcEndpoint: "https://rpc.xion-testnet-2.burnt.com:443",
  restEndpoint: "https://api.xion-testnet-2.burnt.com",
  gasPrice: "0.025uxion",
  gasAdjustment: "1.3"
};

class XIONContractDeployer {
  constructor(walletName) {
    this.walletName = walletName;
    this.deployedContracts = {};
  }

  log(message) {
    console.log(`[XION Deploy] ${message}`);
  }

  async executeCommand(command) {
    try {
      this.log(`Executing: ${command}`);
      const result = execSync(command, { encoding: 'utf-8' });
      return result.trim();
    } catch (error) {
      throw new Error(`Command failed: ${error.message}`);
    }
  }

  async buildContracts() {
    this.log('🔨 Building and optimizing contracts...');
    
    // Change to contracts directory
    process.chdir('./contracts');
    
    // Build all contracts using the CosmWasm optimizer
    const optimizeCommand = `docker run --rm -v "$(pwd)":/code \\
      --mount type=volume,source="$(basename "$(pwd)")_cache",target=/target \\
      --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \\
      cosmwasm/optimizer:0.16.0`;
    
    await this.executeCommand(optimizeCommand);
    
    // Change back to root
    process.chdir('../');
    
    this.log('✅ Contracts built and optimized');
  }

  async deployContract(contractName, instantiateMsg, label) {
    this.log(`🚀 Deploying ${contractName}...`);
    
    const wasmPath = `./contracts/artifacts/${contractName}.wasm`;
    
    // Upload contract
    const uploadCommand = `xiond tx wasm store ${wasmPath} \\
      --chain-id ${XION_CONFIG.chainId} \\
      --gas-adjustment ${XION_CONFIG.gasAdjustment} \\
      --gas-prices ${XION_CONFIG.gasPrice} \\
      --gas auto \\
      -y --output json \\
      --node ${XION_CONFIG.rpcEndpoint} \\
      --from ${this.walletName}`;
    
    const uploadResult = await this.executeCommand(uploadCommand);
    const uploadData = JSON.parse(uploadResult);
    const txHash = uploadData.txhash;
    
    this.log(`📝 Upload transaction: ${txHash}`);
    
    // Wait for transaction to be processed
    await this.waitForTransaction(txHash);
    
    // Get code ID
    const codeId = await this.getCodeId(txHash);
    this.log(`🆔 Code ID: ${codeId}`);
    
    // Instantiate contract
    const instantiateCommand = `xiond tx wasm instantiate ${codeId} '${JSON.stringify(instantiateMsg)}' \\
      --from ${this.walletName} \\
      --label "${label}" \\
      --gas-prices ${XION_CONFIG.gasPrice} \\
      --gas auto \\
      --gas-adjustment ${XION_CONFIG.gasAdjustment} \\
      -y --no-admin \\
      --chain-id ${XION_CONFIG.chainId} \\
      --node ${XION_CONFIG.rpcEndpoint}`;
    
    const instantiateResult = await this.executeCommand(instantiateCommand);
    const instantiateData = JSON.parse(instantiateResult);
    const instantiateTxHash = instantiateData.txhash;
    
    this.log(`📝 Instantiate transaction: ${instantiateTxHash}`);
    
    // Wait for transaction to be processed
    await this.waitForTransaction(instantiateTxHash);
    
    // Get contract address
    const contractAddress = await this.getContractAddress(instantiateTxHash);
    this.log(`📍 Contract address: ${contractAddress}`);
    
    this.deployedContracts[contractName] = {
      codeId,
      address: contractAddress,
      txHash: instantiateTxHash
    };
    
    return contractAddress;
  }

  async waitForTransaction(txHash) {
    this.log(`⏳ Waiting for transaction ${txHash} to be processed...`);
    // In a real implementation, you might want to poll the transaction status
    // For now, we'll just wait a bit
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  async getCodeId(txHash) {
    const queryCommand = `xiond query tx ${txHash} \\
      --node ${XION_CONFIG.rpcEndpoint} \\
      --output json`;
    
    const result = await this.executeCommand(queryCommand);
    const data = JSON.parse(result);
    
    // Extract code ID from events
    for (const event of data.events) {
      if (event.type === 'store_code') {
        for (const attr of event.attributes) {
          if (attr.key === 'code_id') {
            return attr.value;
          }
        }
      }
    }
    
    throw new Error('Could not find code ID in transaction');
  }

  async getContractAddress(txHash) {
    const queryCommand = `xiond query tx ${txHash} \\
      --node ${XION_CONFIG.rpcEndpoint} \\
      --output json`;
    
    const result = await this.executeCommand(queryCommand);
    const data = JSON.parse(result);
    
    // Extract contract address from events
    for (const event of data.events) {
      if (event.type === 'instantiate') {
        for (const attr of event.attributes) {
          if (attr.key === '_contract_address') {
            return attr.value;
          }
        }
      }
    }
    
    throw new Error('Could not find contract address in transaction');
  }

  async deployPetNFTContract(walletAddress) {
    const instantiateMsg = {
      name: "XION Pet NFTs",
      symbol: "XPET",
      minter: walletAddress
    };
    
    return await this.deployContract(
      'pet_nft_contract',
      instantiateMsg,
      'xion-pet-nft-v1'
    );
  }

  async deployAchievementContract(walletAddress, petNftAddress = null) {
    const instantiateMsg = {
      admin: walletAddress,
      pet_nft_contract: petNftAddress
    };
    
    return await this.deployContract(
      'achievement_contract',
      instantiateMsg,
      'xion-achievement-v1'
    );
  }

  async deployPetInteractionContract(walletAddress, achievementAddress = null, petNftAddress = null) {
    const instantiateMsg = {
      admin: walletAddress,
      achievement_contract: achievementAddress,
      pet_nft_contract: petNftAddress
    };
    
    return await this.deployContract(
      'pet_interaction_contract',
      instantiateMsg,
      'xion-pet-interaction-v1'
    );
  }

  async setupAchievements(achievementAddress) {
    this.log('🎯 Setting up initial achievements...');
    
    const achievements = [
      {
        id: 'happy_pet_master',
        title: 'Happy Pet Master',
        description: 'Maintain 90% happiness for 24 hours',
        category: 'PET_CARE',
        requirements: [{
          trigger: 'HAPPINESS_THRESHOLD',
          threshold: '90',
          additional_params: JSON.stringify({ duration: 86400000 })
        }],
        reward: {
          reward_type: 'BADGE',
          value: 'happy_master_badge'
        },
        active: true
      },
      {
        id: 'height_master',
        title: 'Height Master',
        description: 'Reach a height of 1000 in a single game',
        category: 'GAME_SCORE',
        requirements: [{
          trigger: 'HEIGHT_REACHED',
          threshold: '1000'
        }],
        reward: {
          reward_type: 'BADGE',
          value: 'height_master_badge'
        },
        active: true
      },
      {
        id: 'pet_collector',
        title: 'Pet Collector',
        description: 'Own 5 different pets',
        category: 'COLLECTION',
        requirements: [{
          trigger: 'PETS_OWNED',
          threshold: '5'
        }],
        reward: {
          reward_type: 'BADGE',
          value: 'collector_badge'
        },
        active: true
      }
    ];

    for (const achievement of achievements) {
      const registerCommand = `xiond tx wasm execute ${achievementAddress} \\
        '{"register_achievement":{"achievement":${JSON.stringify(achievement)}}}' \\
        --from ${this.walletName} \\
        --gas-prices ${XION_CONFIG.gasPrice} \\
        --gas auto \\
        --gas-adjustment ${XION_CONFIG.gasAdjustment} \\
        -y \\
        --node ${XION_CONFIG.rpcEndpoint} \\
        --chain-id ${XION_CONFIG.chainId}`;
      
      await this.executeCommand(registerCommand);
      this.log(`✅ Registered achievement: ${achievement.id}`);
    }
  }

  saveDeploymentResults() {
    const envPath = path.join(__dirname, '../.env.local');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Update or add contract addresses
    const contractEnvVars = {
      'EXPO_PUBLIC_PET_NFT_CONTRACT_ADDRESS': this.deployedContracts.pet_nft_contract?.address,
      'EXPO_PUBLIC_ACHIEVEMENT_CONTRACT_ADDRESS': this.deployedContracts.achievement_contract?.address,
      'EXPO_PUBLIC_PET_INTERACTION_CONTRACT_ADDRESS': this.deployedContracts.pet_interaction_contract?.address
    };
    
    for (const [key, value] of Object.entries(contractEnvVars)) {
      if (value) {
        const regex = new RegExp(`${key}="[^"]*"`);
        if (envContent.includes(key)) {
          envContent = envContent.replace(regex, `${key}="${value}"`);
        } else {
          envContent += `\n${key}="${value}"`;
        }
      }
    }
    
    fs.writeFileSync(envPath, envContent);
    this.log('📝 Updated .env.local with contract addresses');
    
    // Save detailed deployment info
    const deploymentInfo = {
      timestamp: new Date().toISOString(),
      chainId: XION_CONFIG.chainId,
      contracts: this.deployedContracts
    };
    
    fs.writeFileSync(
      path.join(__dirname, '../deployment.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    this.log('📄 Saved deployment details to deployment.json');
  }

  async deployAll() {
    try {
      this.log('🚀 Starting full deployment process...');
      
      // Get wallet address
      const walletInfo = await this.executeCommand(`xiond keys show ${this.walletName} --output json`);
      const walletData = JSON.parse(walletInfo);
      const walletAddress = walletData.address;
      
      this.log(`💰 Using wallet: ${walletAddress}`);
      
      // Build contracts
      await this.buildContracts();
      
      // Deploy Pet NFT Contract first
      const petNftAddress = await this.deployPetNFTContract(walletAddress);
      
      // Deploy Achievement Contract
      const achievementAddress = await this.deployAchievementContract(walletAddress, petNftAddress);
      
      // Deploy Pet Interaction Contract
      const petInteractionAddress = await this.deployPetInteractionContract(
        walletAddress,
        achievementAddress,
        petNftAddress
      );
      
      // Setup initial achievements
      await this.setupAchievements(achievementAddress);
      
      // Save results
      this.saveDeploymentResults();
      
      this.log('🎉 Deployment completed successfully!');
      this.log('\n📋 Deployment Summary:');
      this.log(`Pet NFT Contract: ${petNftAddress}`);
      this.log(`Achievement Contract: ${achievementAddress}`);
      this.log(`Pet Interaction Contract: ${petInteractionAddress}`);
      
    } catch (error) {
      this.log(`❌ Deployment failed: ${error.message}`);
      throw error;
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const walletName = args[0] || process.env.WALLET_NAME;
  
  if (!walletName) {
    console.error('❌ Please provide a wallet name: node deploy_all_contracts.js <wallet-name>');
    console.error('   Or set WALLET_NAME environment variable');
    process.exit(1);
  }
  
  const deployer = new XIONContractDeployer(walletName);
  await deployer.deployAll();
}

// Helper function for quick deployment
async function quickDeploy() {
  console.log('🎯 Quick Deployment Guide');
  console.log('');
  console.log('1. Ensure you have xiond installed and configured');
  console.log('2. Make sure your wallet is funded with testnet tokens');
  console.log('3. Run: node deploy_all_contracts.js <your-wallet-name>');
  console.log('');
  console.log('Alternative: Deploy individual contracts');
  console.log('');
  console.log('Deploy Pet NFT only:');
  console.log('  node deploy_all_contracts.js <wallet> --pet-nft-only');
  console.log('');
  console.log('Deploy Achievement system only:');
  console.log('  node deploy_all_contracts.js <wallet> --achievement-only');
}

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.length === 0) {
    quickDeploy();
  } else {
    main().catch(console.error);
  }
}

module.exports = { XIONContractDeployer, XION_CONFIG };
