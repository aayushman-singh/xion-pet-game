import React, { useEffect } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '../hooks/useThemeColor';
import { PetSVG } from './PetSVG';
import { usePetCare } from '../hooks/usePetCare';
import { useDaveIntegration } from '../hooks/useDaveIntegration';
import { useAbstraxionAccount } from '@burnt-labs/abstraxion-react-native';
import { formatTimeRemaining } from '../types/petCareTimers';

import { Pet as PetType, PetRarity, PetStats, PetStatus } from '../types/pet';
import { PetRarity as PetRarityComponent } from './PetRarity';

interface PetProps {
  name: string;
  type: string;
  rarity: PetRarity;
  status?: PetStatus;
  stats?: PetStatus; // Alternative prop name for compatibility
  onPet?: () => void;
  onFeed?: () => void;
  onPlay?: () => void;
  draggable?: boolean; // New prop to control if pet is draggable
}

export function Pet({
  name,
  type,
  rarity,
  status: initialStatus,
  stats,
  onPet,
  onFeed,
  onPlay,
  draggable = false,
}: PetProps) {
  // Use status prop if available, otherwise fall back to stats prop
  const petStatus = initialStatus || stats;
  const {
    status,
    isLoading,
    error,
    feedCooldown,
    playCooldown,
    performAction,
    getStatusDescription
  } = usePetCare(petStatus);
  
  // Dave XION SDK integration for zkTLS proofs
  const { generatePetCareProof, isGeneratingProof, getProviderIds } = useDaveIntegration();
  const { data: account } = useAbstraxionAccount();
  // Animation values
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const bounceHeight = useSharedValue(0);
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  // Animated styles
  const petStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
        { translateY: bounceHeight.value },
      ] as const,
    };
  });

  // Pet animations
  const playBounceAnimation = () => {
    bounceHeight.value = withSequence(
      withSpring(-20),
      withSpring(0),
      withSpring(-10),
      withSpring(0)
    );
  };

  const playHappyAnimation = () => {
    rotation.value = withSequence(
      withTiming(-5, { duration: 200 }),
      withTiming(5, { duration: 200 }),
      withTiming(0, { duration: 200 })
    );
  };

  const playFeedAnimation = () => {
    scale.value = withSequence(
      withSpring(1.2),
      withSpring(1)
    );
  };

  // Interaction handlers
  const handlePet = () => {
    playHappyAnimation();
    onPet?.();
  };

  const handleFeed = async () => {
    if (feedCooldown === 0 && status) {
      playFeedAnimation();
      
      // Generate real zkTLS proof for the feeding action using Reclaim Protocol
      try {
        const providerIds = getProviderIds();
        const proof = await generatePetCareProof(name, 'feed', status.happiness, account?.bech32Address, providerIds.petCare);
        console.log('🍽️ Generated real zkTLS proof for feeding:', proof.id);
        if ('reclaim_proof' in proof && proof.reclaim_proof) {
          console.log('✅ Using genuine Reclaim Protocol proof');
        }
      } catch (error) {
        console.warn('zkTLS proof generation failed, continuing with action:', error);
      }
      
      performAction({ type: 'feed', timestamp: Date.now(), petId: name });
      onFeed?.();
    }
  };

  const handlePlay = async () => {
    if (playCooldown === 0 && status) {
      playBounceAnimation();
      
      // Generate real zkTLS proof for the play action using Reclaim Protocol
      try {
        const providerIds = getProviderIds();
        const proof = await generatePetCareProof(name, 'play', status.happiness, account?.bech32Address, providerIds.petCare);
        console.log('🎮 Generated real zkTLS proof for playing:', proof.id);
        if ('reclaim_proof' in proof && proof.reclaim_proof) {
          console.log('✅ Using genuine Reclaim Protocol proof');
        }
      } catch (error) {
        console.warn('zkTLS proof generation failed, continuing with action:', error);
      }
      
      performAction({ type: 'play', timestamp: Date.now(), petId: name });
      onPlay?.();
    }
  };

  // If draggable, only return the pet sprite without container
  if (draggable) {
    return (
      <Pressable onPress={handlePet}>
        <Animated.View style={[styles.pet, petStyle]}>
          <PetSVG type={type} size={120} isAnimating={true} rarity={rarity} />
        </Animated.View>
      </Pressable>
    );
  }

  // Full pet component with UI
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ThemedText style={styles.name}>{name}</ThemedText>
      
      <Pressable onPress={handlePet}>
        <Animated.View style={[styles.pet, petStyle]}>
          <PetSVG type={type} size={120} isAnimating={true} rarity={rarity} />
        </Animated.View>
      </Pressable>

      {status && (
        <View style={styles.status}>
          <ThemedText style={styles.mood}>{getStatusDescription()}</ThemedText>
          <View style={styles.stats}>
            <ThemedText>❤️ {status.happiness}%</ThemedText>
            <ThemedText>⚡ {status.energy}%</ThemedText>
          </View>
        </View>
      )}

      {status && (
        <View style={styles.actions}>
          <View style={styles.actionContainer}>
            <Pressable 
              onPress={handleFeed} 
              style={[styles.button, feedCooldown > 0 && styles.buttonDisabled]}
              disabled={feedCooldown > 0}
            >
              <ThemedText>Feed</ThemedText>
              {feedCooldown > 0 && (
                <ThemedText style={styles.cooldown}>
                  {formatTimeRemaining(feedCooldown)}
                </ThemedText>
              )}
            </Pressable>
            <Pressable 
              onPress={handlePlay} 
              style={[styles.button, playCooldown > 0 && styles.buttonDisabled]}
              disabled={playCooldown > 0}
            >
              <ThemedText>Play</ThemedText>
              {playCooldown > 0 && (
                <ThemedText style={styles.cooldown}>
                  {formatTimeRemaining(playCooldown)}
                </ThemedText>
              )}
            </Pressable>
          </View>
          {error && <ThemedText style={styles.error}>{error}</ThemedText>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    margin: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  pet: {
    marginVertical: 20,
  },
  petPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  status: {
    alignItems: 'center',
    width: '100%',
    marginVertical: 10,
  },
  mood: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 10,
  },
  actions: {
    width: '100%',
    alignItems: 'center',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 10,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    minWidth: 100,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
    backgroundColor: '#f0f0f0',
  },
  cooldown: {
    fontSize: 12,
    marginTop: 5,
    opacity: 0.7,
  },
  error: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 5,
  },
});
