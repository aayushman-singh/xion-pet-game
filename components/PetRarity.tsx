import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ThemedText } from './ThemedText';
import { PetRarity as PetRarityType, PetStats, RARITY_COLORS } from '../types/pet';

interface PetRarityProps {
  rarity: PetRarityType;
  stats: PetStats;
  showAura?: boolean;
}

export function PetRarity({ rarity, stats, showAura = true }: PetRarityProps) {
  // Animated aura effect for rare+ pets
  const auraStyle = useAnimatedStyle(() => {
    if (!showAura || rarity === 'common') return {};

    const scale = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) })
      ),
      -1, // Infinite repeat
      true // Reverse
    );

    return {
      transform: [{ scale }],
      opacity: withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1500 }),
          withTiming(0.4, { duration: 1500 })
        ),
        -1,
        true
      ),
    };
  });

  const rarityColor = RARITY_COLORS[rarity];

  return (
    <View style={styles.container}>
      {showAura && rarity !== 'common' && (
        <Animated.View
          style={[
            styles.aura,
            { backgroundColor: rarityColor },
            auraStyle,
          ]}
        />
      )}
      
      <View style={styles.rarityBadge}>
        <ThemedText style={[styles.rarityText, { color: rarityColor }]}>
          {rarity.toUpperCase()}
        </ThemedText>
      </View>

      <View style={styles.stats}>
        <View style={styles.statRow}>
          <ThemedText style={styles.statLabel}>⚔️ STR</ThemedText>
          <ThemedText style={styles.statValue}>{stats.strength}</ThemedText>
        </View>
        <View style={styles.statRow}>
          <ThemedText style={styles.statLabel}>🏃 AGI</ThemedText>
          <ThemedText style={styles.statValue}>{stats.agility}</ThemedText>
        </View>
        <View style={styles.statRow}>
          <ThemedText style={styles.statLabel}>🧠 INT</ThemedText>
          <ThemedText style={styles.statValue}>{stats.intelligence}</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    padding: 10,
  },
  aura: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 20,
    opacity: 0.3,
  },
  rarityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 10,
  },
  rarityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  stats: {
    width: '100%',
    gap: 5,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
