import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useAbstraxionAccount } from '@burnt-labs/abstraxion-react-native';
import { useDaveIntegration } from '../hooks/useDaveIntegration';

/**
 * Status component showing XION Abstraxion and zkTLS integration
 * Essential for hackathon demonstration
 */
export function XionDemoStatus() {
  const { data: account, isConnected, isConnecting, login, logout } = useAbstraxionAccount();
  const { isReady, lastProof, getStatus } = useDaveIntegration();

  const status = getStatus();

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>🚀 XION Integration Status</ThemedText>
      
      {/* Wallet Connection Status */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>💰 Wallet Connection</ThemedText>
        <View style={styles.statusRow}>
          <ThemedText style={styles.label}>Status:</ThemedText>
          <ThemedText style={[
            styles.status,
            { color: isConnected ? '#00FF00' : '#FF6B6B' }
          ]}>
            {isConnecting ? '⏳ Connecting...' : isConnected ? '✅ Connected' : '❌ Disconnected'}
          </ThemedText>
        </View>
        
        {isConnected && account?.bech32Address && (
          <View style={styles.statusRow}>
            <ThemedText style={styles.label}>Address:</ThemedText>
            <ThemedText style={styles.address}>
              {account.bech32Address.substring(0, 16)}...
            </ThemedText>
          </View>
        )}

        <Pressable
          style={[styles.button, isConnecting && styles.buttonDisabled]}
          onPress={isConnected ? logout : login}
          disabled={isConnecting}
        >
          <ThemedText style={styles.buttonText}>
            {isConnecting ? 'Connecting...' : isConnected ? 'Disconnect' : 'Connect Wallet'}
          </ThemedText>
        </Pressable>
      </View>

      {/* zkTLS Status */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>🔐 zkTLS Proof System</ThemedText>
        <View style={styles.statusRow}>
          <ThemedText style={styles.label}>Status:</ThemedText>
          <ThemedText style={[
            styles.status,
            { color: isReady ? '#00FF00' : '#FFA500' }
          ]}>
            {isReady ? '✅ Ready' : '⏳ Initializing...'}
          </ThemedText>
        </View>
        
        <View style={styles.statusRow}>
          <ThemedText style={styles.label}>Initialized:</ThemedText>
          <ThemedText style={styles.value}>
            {new Date(status.timestamp).toLocaleTimeString()}
          </ThemedText>
        </View>

        {lastProof && (
          <View style={styles.proofContainer}>
            <ThemedText style={styles.label}>Last Proof Generated:</ThemedText>
            <View style={styles.proofDetails}>
              <ThemedText style={styles.proofText}>ID: {lastProof.id}</ThemedText>
              <ThemedText style={styles.proofText}>Type: {lastProof.proof_type}</ThemedText>
              <ThemedText style={styles.proofText}>Status: ✅ Verified</ThemedText>
            </View>
          </View>
        )}
      </View>

      {/* Demo Instructions */}
      <View style={styles.demoSection}>
        <ThemedText style={styles.demoTitle}>🎮 Demo Instructions</ThemedText>
        <ThemedText style={styles.demoText}>
          1. Feed/play with pets → Generates pet care proofs{'\n'}
          2. Complete a game → Generates game session proofs{'\n'}
          3. Mint NFTs → Generates minting proofs{'\n'}
          4. Check console for proof details!
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  address: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    padding: 4,
    borderRadius: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  proofContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderRadius: 6,
  },
  proofDetails: {
    marginTop: 4,
  },
  proofText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  demoSection: {
    padding: 12,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
