import React from 'react';
import { ScrollView, StyleSheet, Pressable } from 'react-native';
import { PetMinter } from '@/components/PetMinter';
import { useAbstraxionAccount } from "@burnt-labs/abstraxion-react-native";
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

export default function NFTScreen() {
  const { data: account, login, isConnected } = useAbstraxionAccount();

  const handlePetMinted = (petData: any) => {
    // TODO: Update pet collection in state/chain
    console.log('Pet minted:', petData);
  };

  if (!isConnected) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>Connect Wallet</ThemedText>
        <ThemedText style={styles.description}>
          Please connect your wallet to mint and manage your pets.
        </ThemedText>
        <Pressable style={styles.connectButton} onPress={login}>
          <ThemedText style={styles.connectButtonText}>Connect Wallet</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <PetMinter onPetMinted={handlePetMinted} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  connectButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 40,
    alignItems: 'center',
  },
  connectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
