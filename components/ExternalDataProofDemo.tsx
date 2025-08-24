import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Alert, TextInput } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useDaveIntegration } from '../hooks/useDaveIntegration';

/**
 * Game-specific zkTLS verification using Reclaim Protocol
 * Proves legitimate game data and pet interactions
 */
export function ExternalDataProofDemo() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [proofResults, setProofResults] = useState<any[]>([]);
  const [petId, setPetId] = useState('');
  const [gameSessionId, setGameSessionId] = useState('');
  
  const { generateExternalDataProof, isReady, getProviderIds } = useDaveIntegration();

  /**
   * Generate zkTLS proof for pet health status verification
   * Proves that pet status updates are legitimate and not cheated
   */
  const handlePetHealthProof = async () => {
    if (!petId.trim()) {
      Alert.alert('Error', 'Please enter a pet ID');
      return;
    }

    setIsGenerating(true);
    try {
      console.log('🔄 Generating zkTLS proof for pet health verification...');
      
      const providerIds = getProviderIds();
      const proof = await generateExternalDataProof({
        platform: 'pet_health',
        endpoint: `https://api.your-pet-game.com/pets/${petId}/health`,
        expectedValue: 'healthy',
        userIdentifier: petId,
        providerId: providerIds.petHealth
      } as any);

      setProofResults(prev => [...prev, {
        ...proof,
        platform: 'Pet Health',
        username: `Pet ${petId}`,
        timestamp: Date.now()
      }]);

      Alert.alert(
        '✅ Pet Health Proof Generated!',
        `Successfully verified pet health status for: ${petId}\n\nProof ID: ${proof.id}`,
        [{ text: 'OK' }]
      );

      console.log('✅ Pet health zkTLS proof generated:', proof);
      
    } catch (error) {
      console.error('Pet health proof generation failed:', error);
      Alert.alert('Info', 'This demonstrates zkTLS verification of pet health data to prevent cheating.');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Generate zkTLS proof for game session score verification
   * Proves that high scores are legitimate and not manipulated
   */
  const handleGameScoreProof = async () => {
    if (!gameSessionId.trim()) {
      Alert.alert('Error', 'Please enter a game session ID');
      return;
    }

    setIsGenerating(true);
    try {
      console.log('🔄 Generating zkTLS proof for game score verification...');
      
      const providerIds = getProviderIds();
      const proof = await generateExternalDataProof({
        platform: 'game_score',
        endpoint: `https://api.your-pet-game.com/game/sessions/${gameSessionId}/score`,
        expectedValue: 'verified',
        userIdentifier: gameSessionId,
        providerId: providerIds.gameScore
      } as any);

      setProofResults(prev => [...prev, {
        ...proof,
        platform: 'Game Score',
        username: `Session ${gameSessionId}`,
        timestamp: Date.now()
      }]);

      Alert.alert(
        '✅ Game Score Proof Generated!',
        `Successfully verified game score for session: ${gameSessionId}\n\nProof ID: ${proof.id}`,
        [{ text: 'OK' }]
      );

      console.log('✅ Game score zkTLS proof generated:', proof);
      
    } catch (error) {
      console.error('Game score proof generation failed:', error);
      Alert.alert('Info', 'This demonstrates zkTLS verification of game scores to prevent cheating.');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Generate zkTLS proof for pet achievement verification
   * Proves that achievement progress is legitimate
   */
  const handleAchievementProof = async () => {
    setIsGenerating(true);
    try {
      console.log('🔄 Generating zkTLS proof for achievement verification...');
      
      const proof = await generateExternalDataProof({
        platform: 'pet_achievement',
        endpoint: 'https://api.your-pet-game.com/achievements/verify',
        expectedValue: 'achievement_unlocked',
        userIdentifier: 'current_player'
      });

      setProofResults(prev => [...prev, {
        ...proof,
        platform: 'Pet Achievement',
        username: 'Achievement Unlock',
        timestamp: Date.now()
      }]);

      Alert.alert(
        '✅ Achievement Proof Generated!',
        `Successfully verified pet achievement progress\n\nProof ID: ${proof.id}`,
        [{ text: 'OK' }]
      );

      console.log('✅ Pet achievement zkTLS proof generated:', proof);
      
    } catch (error) {
      console.error('Achievement proof generation failed:', error);
      Alert.alert('Info', 'This demonstrates zkTLS verification of achievement progress to prevent cheating.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>🎮 Game Data Verification</ThemedText>
      <ThemedText style={styles.subtitle}>zkTLS Anti-Cheat & Progress Verification</ThemedText>
      
      <View style={styles.statusContainer}>
        <ThemedText style={styles.statusText}>
          Reclaim zkTLS Status: {isReady ? '✅ Ready' : '⏳ Initializing...'}
        </ThemedText>
        {isGenerating && (
          <ThemedText style={styles.statusText}>🔄 Generating zkTLS proof...</ThemedText>
        )}
      </View>

      {/* Pet Health Verification */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>🐾 Pet Health Verification</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="Enter Pet ID (e.g., pet_001)"
          value={petId}
          onChangeText={setPetId}
          autoCapitalize="none"
        />
        <Pressable
          style={[styles.button, styles.petButton, (isGenerating || !isReady) && styles.buttonDisabled]}
          onPress={handlePetHealthProof}
          disabled={isGenerating || !isReady}
        >
          <ThemedText style={styles.buttonText}>
            Verify Pet Health Status
          </ThemedText>
        </Pressable>
        <ThemedText style={styles.description}>
          Proves pet health updates are legitimate and prevent status manipulation
        </ThemedText>
      </View>

      {/* Game Score Verification */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>🏆 Game Score Verification</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="Enter Game Session ID"
          value={gameSessionId}
          onChangeText={setGameSessionId}
          autoCapitalize="none"
        />
        <Pressable
          style={[styles.button, styles.gameButton, (isGenerating || !isReady) && styles.buttonDisabled]}
          onPress={handleGameScoreProof}
          disabled={isGenerating || !isReady}
        >
          <ThemedText style={styles.buttonText}>
            Verify Game Score
          </ThemedText>
        </Pressable>
        <ThemedText style={styles.description}>
          Proves high scores are legitimate and prevent score manipulation
        </ThemedText>
      </View>

      {/* Achievement Verification */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>🏅 Achievement Verification</ThemedText>
        <Pressable
          style={[styles.button, styles.achievementButton, (isGenerating || !isReady) && styles.buttonDisabled]}
          onPress={handleAchievementProof}
          disabled={isGenerating || !isReady}
        >
          <ThemedText style={styles.buttonText}>
            Verify Achievement Progress
          </ThemedText>
        </Pressable>
        <ThemedText style={styles.description}>
          Proves achievement unlocks are legitimate and prevent progress manipulation
        </ThemedText>
      </View>

      {/* Proof Results */}
      {proofResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <ThemedText style={styles.resultsTitle}>Generated Proofs:</ThemedText>
          {proofResults.slice(-3).map((proof, index) => (
            <View key={index} style={styles.proofItem}>
              <ThemedText style={styles.proofPlatform}>{proof.platform}</ThemedText>
              <ThemedText style={styles.proofId}>ID: {proof.id}</ThemedText>
              <ThemedText style={styles.proofTime}>
                {new Date(proof.timestamp).toLocaleTimeString()}
              </ThemedText>
              <ThemedText style={styles.proofStatus}>
                {proof.reclaim_proof ? '✅ Real Reclaim Proof' : '⚠️ Fallback Proof'}
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      <View style={styles.infoBox}>
        <ThemedText style={styles.infoTitle}>🛡️ zkTLS Anti-Cheat System</ThemedText>
        <ThemedText style={styles.infoText}>
          This uses Reclaim Protocol (Dave) to generate genuine zkTLS proofs that verify game data integrity. Perfect for:
          {'\n'}🐾 Pet health & status verification{'\n'}🏆 Game score anti-cheat protection{'\n'}🏅 Achievement progress validation{'\n'}📊 Leaderboard integrity
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
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
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  petButton: {
    backgroundColor: '#FF6B35',
  },
  gameButton: {
    backgroundColor: '#1DA1F2',
  },
  achievementButton: {
    backgroundColor: '#FFD700',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  resultsContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00FF00',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  proofItem: {
    padding: 10,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  proofPlatform: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  proofId: {
    fontSize: 12,
    fontFamily: 'monospace',
    opacity: 0.8,
  },
  proofTime: {
    fontSize: 12,
    opacity: 0.6,
  },
  proofStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  infoBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
