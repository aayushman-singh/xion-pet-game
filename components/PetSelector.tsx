import * as React from 'react';
import { StyleSheet, View, ScrollView, Pressable, Dimensions } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { PetSVG } from './PetSVG';
import type { Pet as PetType } from '../types/pet';
import { PET_BONUSES } from '../types/petBonuses';

const SELECTOR_WIDTH = Dimensions.get('window').width * 0.9;
const PET_ITEM_WIDTH = SELECTOR_WIDTH / 3;

interface PetSelectorProps {
  pets: PetType[];
  selectedPets: PetType[];
  onSelectPet: (pet: PetType) => void;
  maxSelections?: number;
}

export function PetSelector({ 
  pets, 
  selectedPets, 
  onSelectPet, 
  maxSelections = 3 
}: PetSelectorProps) {
  const isPetSelected = (pet: PetType) => {
    return selectedPets.some(selected => selected.id === pet.id);
  };

  const canSelectMore = selectedPets.length < maxSelections;
  const isPetOwned = (pet: PetType) => pet.owned === true;

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>
        Select up to {maxSelections} pets ({selectedPets.length}/{maxSelections})
      </ThemedText>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {pets.map((pet) => {
          const isSelected = isPetSelected(pet);
          const isOwned = isPetOwned(pet);
          const canSelect = (isSelected || canSelectMore) && isOwned;
          
          return (
            <Pressable
              key={pet.id}
              onPress={() => {
                if (canSelect) {
                  onSelectPet(pet);
                }
              }}
              style={[
                styles.petItem,
                isSelected && styles.selectedPet,
                !isOwned && styles.unownedPet,
                !canSelect && !isSelected && styles.disabledPet
              ]}
            >
              <PetSVG
                type={pet.type || 'cat'}
                size={60}
                isAnimating={false}
                rarity={pet.rarity}
              />
              <ThemedText style={[
                styles.petName,
                !isOwned && styles.unownedText
              ]}>
                {pet.name}
                {!isOwned && ' (Not Owned)'}
              </ThemedText>
              <ThemedText style={[
                styles.petRarity,
                !isOwned && styles.unownedText
              ]}>
                {pet.rarity}
              </ThemedText>
              {pet.type && PET_BONUSES[pet.type]?.activeBonus && (
                <ThemedText style={[
                  styles.petBonus,
                  !isOwned && styles.unownedText
                ]}>
                  {PET_BONUSES[pet.type]?.activeBonus?.description}
                </ThemedText>
              )}
              {pet.type && PET_BONUSES[pet.type]?.passiveBonus && (
                <ThemedText style={[
                  styles.petBonus, 
                  styles.passiveBonus,
                  !isOwned && styles.unownedText
                ]}>
                  + {PET_BONUSES[pet.type]?.passiveBonus?.description}
                </ThemedText>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SELECTOR_WIDTH,
    padding: 15,
    borderRadius: 12,
    alignSelf: 'center',
    marginVertical: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
  petItem: {
    width: PET_ITEM_WIDTH - 20,
    height: 250, // Increased from 140 for taller cards
    marginHorizontal: 5,
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPet: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  unownedPet: {
    opacity: 0.4,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderColor: '#999',
  },
  disabledPet: {
    opacity: 0.5,
  },
  petName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
  petRarity: {
    fontSize: 12,
    opacity: 0.7,
  },
  petBonus: {
    fontSize: 11,
    color: '#4CAF50',
    marginTop: 2,
  },
  passiveBonus: {
    color: '#2196F3',
  },
  unownedText: {
    color: '#666',
    opacity: 0.7,
  },
});
