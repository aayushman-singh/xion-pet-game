import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Alert } from 'react-native';
import { useAbstraxionAccount, useAbstraxionSigningClient } from "@burnt-labs/abstraxion-react-native";
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { LoadingSpinner } from './LoadingSpinner';

import { PetType, PetRarity, RARITY_CHANCES } from '../types/pet';

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
  {
    id: 'rabbit',
    name: 'Rabbit',
    emoji: '🐰',
    basePrice: '15',
    description: 'A quick and cute companion',
    baseStats: {
      happiness: 100,
      energy: 100,
      hunger: 100,
      strength: 4,
      agility: 9,
      intelligence: 6,
    },
  },
  {
    id: 'hamster',
    name: 'Hamster',
    emoji: '🐹',
    basePrice: '8',
    description: 'A tiny but energetic friend',
    baseStats: {
      happiness: 100,
      energy: 100,
      hunger: 100,
      strength: 3,
      agility: 7,
      intelligence: 5,
    },
  },
  {
    id: 'dragon',
    name: 'Dragon',
    emoji: '🐲',
    basePrice: '50',
    description: 'A mythical and powerful companion',
    baseStats: {
      happiness: 100,
      energy: 100,
      hunger: 100,
      strength: 10,
      agility: 8,
      intelligence: 9,
    },
  },
];

// Function to determine pet rarity based on chances
function determineRarity(): PetRarity {
  const rand = Math.random() * 100;
  let sum = 0;
  
  for (const [rarity, chance] of Object.entries(RARITY_CHANCES)) {
    sum += chance;
    if (rand <= sum) {
      return rarity as PetRarity;
    }
  }
  
  return 'common';
}

interface PetMinterProps {
  onPetMinted?: (petData: any) => void;
}

export function PetMinter({ onPetMinted }: PetMinterProps) {
  const { data: account } = useAbstraxionAccount();
  const { client: signingClient } = useAbstraxionSigningClient();
  const [selectedPet, setSelectedPet] = useState<string | null>(null);
  const [isMinting, setIsMinting] = useState(false);

  const handleMint = async (petType: string) => {
    if (!account?.bech32Address || !signingClient) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    setIsMinting(true);
    try {
      // This will be replaced with actual NFT minting contract call
      const mintMsg = {
        mint_pet: {
          owner: account.bech32Address,
          pet_type: petType,
        },
      };

      // TODO: Replace with actual contract address from environment
      const contractAddress = process.env.EXPO_PUBLIC_PET_NFT_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error('Pet NFT contract address not configured');
      }

      const fee = {
        amount: [{ amount: '1000', denom: 'uxion' }],
        gas: '200000',
      };

      const result = await signingClient.execute(
        account.bech32Address,
        contractAddress,
        mintMsg,
        fee,
        'Minting new pet'
      );

      if (result) {
        Alert.alert('Success', 'Your new pet has been minted!');
        onPetMinted?.(result);
      }
    } catch (error) {
      console.error('Minting error:', error);
      Alert.alert('Error', 'Failed to mint pet. Please try again.');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Mint New Pet</ThemedText>
      <View style={styles.petsGrid}>
        {PET_TYPES.map((pet) => (
          <Pressable
            key={pet.id}
            style={[
              styles.petOption,
              selectedPet === pet.id && styles.selectedPet,
            ]}
            onPress={() => setSelectedPet(pet.id)}
          >
            <ThemedText style={styles.petEmoji}>{pet.emoji}</ThemedText>
            <ThemedText style={styles.petName}>{pet.name}</ThemedText>
            <ThemedText style={styles.petPrice}>{pet.basePrice} XION</ThemedText>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[
          styles.mintButton,
          (!selectedPet || isMinting) && styles.disabledButton,
        ]}
        disabled={!selectedPet || isMinting}
        onPress={() => selectedPet && handleMint(selectedPet)}
      >
                 {isMinting ? (
           <LoadingSpinner inline />
         ) : (
           <ThemedText style={styles.mintButtonText}>Mint Pet</ThemedText>
         )}
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 16,
    margin: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  petsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 10,
    marginBottom: 20,
  },
  petOption: {
    width: '45%',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedPet: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  petEmoji: {
    fontSize: 32,
    marginBottom: 5,
  },
  petName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  petPrice: {
    fontSize: 14,
    opacity: 0.7,
  },
  mintButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  mintButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
