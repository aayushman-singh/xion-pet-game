import React from 'react';
import { StyleSheet, ScrollView, Pressable } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAbstraxionAccount } from "@burnt-labs/abstraxion-react-native";

export default function ExploreScreen() {
  const { data: account, isConnected } = useAbstraxionAccount();

  const mockPets = [
    { id: '1', name: 'Whiskers', type: 'cat', rarity: 'rare', owner: '0x123...' },
    { id: '2', name: 'Buddy', type: 'dog', rarity: 'epic', owner: '0x456...' },
    { id: '3', name: 'Fluffy', type: 'cat', rarity: 'legendary', owner: '0x789...' },
  ];

  if (!isConnected) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>Explore Other Pets</ThemedText>
        <ThemedText style={styles.description}>
          Please connect your wallet to explore pets from other players
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedText style={styles.title}>Explore Other Pets</ThemedText>
      <ThemedText style={styles.description}>
        Discover amazing pets from other players
      </ThemedText>

      <ThemedView style={styles.petsContainer}>
        {mockPets.map((pet) => (
          <ThemedView key={pet.id} style={styles.petCard}>
            <ThemedText style={styles.petName}>{pet.name}</ThemedText>
            <ThemedText style={styles.petType}>Type: {pet.type}</ThemedText>
            <ThemedText style={styles.petRarity}>Rarity: {pet.rarity}</ThemedText>
            <ThemedText style={styles.petOwner}>Owner: {pet.owner}</ThemedText>
            <Pressable style={styles.viewButton}>
              <ThemedText style={styles.viewButtonText}>View Pet</ThemedText>
            </Pressable>
          </ThemedView>
        ))}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.8,
  },
  petsContainer: {
    gap: 15,
  },
  petCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  petName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  petType: {
    fontSize: 14,
    marginBottom: 3,
  },
  petRarity: {
    fontSize: 14,
    marginBottom: 3,
  },
  petOwner: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 10,
  },
  viewButton: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
