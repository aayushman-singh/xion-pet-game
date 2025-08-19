import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '../hooks/useThemeColor';

interface DecorationProps {
  type: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  size?: number;
}

export function Decoration({ type, rarity = 'common', size = 40 }: DecorationProps) {
  const backgroundColor = useThemeColor('background');
  const textColor = useThemeColor('text');

  // Get decoration color based on rarity
  const getRarityColor = () => {
    switch (rarity) {
      case 'legendary':
        return '#FFD700';
      case 'epic':
        return '#9400D3';
      case 'rare':
        return '#4169E1';
      default:
        return '#808080';
    }
  };

  // Get decoration emoji based on type
  const getDecorationEmoji = () => {
    switch (type) {
      case 'chair':
        return '🪑';
      case 'table':
        return '🪟';
      case 'plant':
        return '🌿';
      case 'lamp':
        return '💡';
      case 'bed':
        return '🛏️';
      default:
        return '📦';
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor: getRarityColor(),
          width: size,
          height: size,
        },
      ]}
    >
      <ThemedText style={styles.emoji}>{getDecorationEmoji()}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 20,
  },
});
