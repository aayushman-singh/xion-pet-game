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
  draggable?: boolean; // New prop to control if pet is draggable
}

export function Pet({
  name,
  type,
  rarity,
  stats,
  onPet,
  onFeed,
  onPlay,
  draggable = false,
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

  // If draggable, only return the pet sprite without container
  if (draggable) {
    return (
      <Pressable onPress={handlePet}>
        <Animated.View style={[styles.pet, petStyle]}>
          <PetSVG type={type} size={120} isAnimating={true} />
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
          <PetSVG type={type} size={120} isAnimating={true} />
        </Animated.View>
      </Pressable>

      <View style={styles.stats}>
        <ThemedText>❤️ {stats.happiness}%</ThemedText>
        <ThemedText>⚡ {stats.energy}%</ThemedText>
        <ThemedText>🍖 {stats.hunger}%</ThemedText>
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
