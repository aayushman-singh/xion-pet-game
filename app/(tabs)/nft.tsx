import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { PetMinterDemo } from '@/components/PetMinterDemo';
import { ExternalDataProofDemo } from '@/components/ExternalDataProofDemo';

/**
 * NFT tab enhanced with real Reclaim Protocol zkTLS demonstration
 * Shows genuine Dave integration for hackathon submission
 */
export default function NFTScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText style={styles.title}>
          🎯 Real Dave (Reclaim) zkTLS Demo
        </ThemedText>
        
        <ThemedText style={styles.subtitle}>
          Genuine zkTLS Proof Generation
        </ThemedText>
        
        <PetMinterDemo />
        <ExternalDataProofDemo />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.7,
  },
});