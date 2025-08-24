import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Alert } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useDaveIntegration } from '../hooks/useDaveIntegration';
import { PetType, PetRarity, RARITY_CHANCES } from '../types/pet';

/**
 * Demo component showing Dave XION SDK integration for NFT minting
 * Essential for hackathon demonstration
 */

const PET_TYPES: PetType[] = [
  {
    id: 'cat',
    name: 'Cat',
    emoji: '🐱',
    basePrice: '10',
    description: 'A graceful feline companion',
    baseStats: {
      happiness: 100,
      energy: 100,
      hunger: 100,
      strength: 5,
      agility: 8,
      intelligence: 7,
    },
  },
  {
    id: 'dog',
    name: 'Dog',
    emoji: '🐶',
    basePrice: '10',
    description: 'A loyal canine friend',
    baseStats: {
      happiness: 100,
      energy: 100,
      hunger: 100,
      strength: 7,
      agility: 7,
      intelligence: 6,
    },
  },
];

export function PetMinterDemo() {
  const [selectedPetType, setSelectedPetType] = useState<PetType>(PET_TYPES[0]);
  const [isMinting, setIsMinting] = useState(false);
  const [lastMintedToken, setLastMintedToken] = useState<string | null>(null);
  
  const { generateNFTProof, isGeneratingProof, isReady, getProviderIds } = useDaveIntegration();

  // Function to determine pet rarity
  function determineRarity(): PetRarity {
    const rand = Math.random() * 100;
    
    if (rand < RARITY_CHANCES.legendary) return PetRarity.LEGENDARY;
    if (rand < RARITY_CHANCES.epic) return PetRarity.EPIC;
    if (rand < RARITY_CHANCES.rare) return PetRarity.RARE;
    if (rand < RARITY_CHANCES.uncommon) return PetRarity.UNCOMMON;
    return PetRarity.COMMON;
  }

  const handleMintWithZkTLS = async () => {
    if (!isReady) {
      Alert.alert('Dave SDK Not Ready', 'Please wait for the SDK to initialize');
      return;
    }

    setIsMinting(true);
    try {
      // Generate unique token ID
      const tokenId = `pet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const rarity = determineRarity();
      
      // Prepare NFT metadata
      const nftData = {
        tokenId,
        owner: 'demo_wallet_address', // In real app, get from wallet
        attributes: [
          { trait_type: 'Species', value: selectedPetType.name },
          { trait_type: 'Rarity', value: rarity },
          { trait_type: 'Strength', value: selectedPetType.baseStats.strength.toString() },
          { trait_type: 'Agility', value: selectedPetType.baseStats.agility.toString() },
          { trait_type: 'Intelligence', value: selectedPetType.baseStats.intelligence.toString() },
        ],
        rarity
      };

      // Generate zkTLS proof for NFT minting (HACKATHON DEMO)
      console.log('🔄 Generating zkTLS proof for NFT mint...');
      const providerIds = getProviderIds();
      const proof = await generateNFTProof({
        ...nftData,
        providerId: providerIds.nftMint
      });
      
      // Simulate minting delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setLastMintedToken(tokenId);
      
      Alert.alert(
        '🎉 NFT Minted Successfully!',
        `Token ID: ${tokenId}\nRarity: ${rarity}\nzkTLS Proof: ${proof.id}`,
        [{ text: 'OK' }]
      );
      
      console.log('✅ NFT minted with zkTLS proof:', {
        tokenId,
        rarity,
        proofId: proof.id
      });

    } catch (error) {
      console.error('❌ Minting failed:', error);
      Alert.alert('Minting Failed', 'Please try again');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>🚀 Dave SDK NFT Minting Demo</ThemedText>
      
      <View style={styles.statusContainer}>
        <ThemedText style={styles.statusText}>
          Dave SDK Status: {isReady ? '✅ Ready' : '⏳ Initializing...'}
        </ThemedText>
        {isGeneratingProof && (
          <ThemedText style={styles.statusText}>🔄 Generating zkTLS proof...</ThemedText>
        )}
      </View>

      <View style={styles.petSelector}>
        <ThemedText style={styles.sectionTitle}>Select Pet Type:</ThemedText>
        {PET_TYPES.map((petType) => (
          <Pressable
            key={petType.id}
            style={[
              styles.petOption,
              selectedPetType.id === petType.id && styles.selectedPetOption
            ]}
            onPress={() => setSelectedPetType(petType)}
          >
            <ThemedText style={styles.petEmoji}>{petType.emoji}</ThemedText>
            <ThemedText style={styles.petName}>{petType.name}</ThemedText>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[
          styles.mintButton,
          (isMinting || !isReady) && styles.mintButtonDisabled
        ]}
        onPress={handleMintWithZkTLS}
        disabled={isMinting || !isReady}
      >
        <ThemedText style={styles.mintButtonText}>
          {isMinting ? '⏳ Minting with zkTLS...' : '🎯 Mint NFT with zkTLS Proof'}
        </ThemedText>
      </Pressable>

      {lastMintedToken && (
        <View style={styles.resultContainer}>
          <ThemedText style={styles.resultTitle}>Last Minted:</ThemedText>
          <ThemedText style={styles.resultText}>{lastMintedToken}</ThemedText>
        </View>
      )}

      <View style={styles.demoNote}>
        <ThemedText style={styles.demoNoteText}>
          🎮 This demo shows Dave XION SDK integration for zkTLS proof generation during NFT minting - essential for hackathon submission!
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  petSelector: {
    marginBottom: 20,
  },
  petOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPetOption: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  petEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  petName: {
    fontSize: 16,
    fontWeight: '500',
  },
  mintButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  mintButtonDisabled: {
    backgroundColor: '#ccc',
  },
  mintButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resultContainer: {
    padding: 15,
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderRadius: 8,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  resultText: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  demoNote: {
    padding: 15,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
  },
  demoNoteText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
