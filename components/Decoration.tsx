import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '../hooks/useThemeColor';

interface DecorationProps {
  type: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  size?: number;
  category: 'furniture' | 'decoration'; // New: furniture vs decoration
}

export function Decoration({ type, rarity = 'common', size = 40, category }: DecorationProps) {
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

  // Get border color based on category
  const getCategoryBorderColor = () => {
    switch (category) {
      case 'furniture':
        return 'rgba(255, 165, 0, 0.4)'; // Subtle golden orange
      case 'decoration':
        return 'rgba(128, 0, 128, 0.4)'; // Subtle purple
      default:
        return 'rgba(128, 128, 128, 0.3)'; // Subtle gray
    }
  };

  // Get decoration emoji based on type
  const getDecorationEmoji = () => {
    switch (type) {
      // Indoor furniture
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
      case 'sofa':
        return '🛋️';
      case 'bookshelf':
        return '📚';
      case 'mirror':
        return '🪞';
      // Outdoor furniture
      case 'bench':
        return '🪑';
      case 'fountain':
        return '⛲';
      case 'statue':
        return '🗿';
      case 'gazebo':
        return '🏛️';
      // Outdoor nature (decorations)
      case 'tree':
        return '🌳';
      case 'rock':
        return '🪨';
      case 'bush':
        return '🌱';
      case 'flower':
        return '🌸';
      case 'mushroom':
        return '🍄';
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
          borderColor: getCategoryBorderColor(),
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
