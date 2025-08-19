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
import { PetSprite } from './PetSprite';

import { Pet as PetType, PetRarity, PetStats } from '../types/pet';
import { PetRarity as PetRarityComponent } from './PetRarity';

interface PetProps {
  name: string;
  type: string;
  rarity: PetRarity;
  stats: PetStats;
  onPet?: () => void;
  onFeed?: () => void;
  onPlay?: () => void;
}

export function Pet({
  name,
  type,
  happiness = 100,
  energy = 100,
  hunger = 100,
  onPet,
  onFeed,
  onPlay,
}: PetProps) {
  // Animation values
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const bounceHeight = useSharedValue(0);
  
  // Theme colors
  const backgroundColor = useThemeColor('background');
  const textColor = useThemeColor('text');

  // Animated styles
  const petStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
        { translateY: bounceHeight.value },
      ],
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

  const handleFeed = () => {
    playFeedAnimation();
    onFeed?.();
  };

  const handlePlay = () => {
    playBounceAnimation();
    onPlay?.();
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ThemedText style={styles.name}>{name}</ThemedText>
      
      <Pressable onPress={handlePet}>
        <Animated.View style={[styles.pet, petStyle]}>
          <PetSprite type={type} size={120} isAnimating={true} />
        </Animated.View>
      </Pressable>

      <View style={styles.stats}>
        <ThemedText>❤️ {happiness}%</ThemedText>
        <ThemedText>⚡ {energy}%</ThemedText>
        <ThemedText>🍖 {hunger}%</ThemedText>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={handleFeed} style={styles.button}>
          <ThemedText>Feed</ThemedText>
        </Pressable>
        <Pressable onPress={handlePlay} style={styles.button}>
          <ThemedText>Play</ThemedText>
        </Pressable>
      </View>
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
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    minWidth: 80,
    alignItems: 'center',
  },
});
