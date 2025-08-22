import React from 'react';
import { StyleSheet, View, Pressable, Dimensions } from 'react-native';
import { ThemedText } from './ThemedText';
import { PetSVG } from './PetSVG';
import type { Pet as PetType } from '../types/pet';

const QUICK_SWAP_WIDTH = 70;

interface QuickSwapPetsProps {
  pets: PetType[];
  activePet: PetType;
  onSwapPet: (pet: PetType) => void;
  isGameActive: boolean;
}

export function QuickSwapPets({
  pets,
  activePet,
  onSwapPet,
  isGameActive
}: QuickSwapPetsProps) {
  if (!isGameActive || pets.length === 0) return null;

  return (
    <View style={styles.container}>
      {pets.map((pet, index) => (
        <Pressable
          key={pet.id}
          style={[
            styles.petButton,
            pet.id === activePet.id && styles.activePet
          ]}
          onPress={() => onSwapPet(pet)}
        >
          <PetSVG
            type={pet.type}
            size={40}
            isAnimating={false}
            rarity={pet.rarity}
          />
          <View style={styles.cooldownOverlay}>
            <ThemedText style={styles.swapNumber}>{index + 1}</ThemedText>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 10,
    top: '30%',
    width: QUICK_SWAP_WIDTH,
    gap: 10,
    alignItems: 'center',
  },
  petButton: {
    width: QUICK_SWAP_WIDTH,
    height: QUICK_SWAP_WIDTH,
    borderRadius: QUICK_SWAP_WIDTH / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activePet: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  cooldownOverlay: {
    position: 'absolute',
    right: -5,
    top: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swapNumber: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
