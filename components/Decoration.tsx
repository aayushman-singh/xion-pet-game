import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '../hooks/useThemeColor';

interface DecorationProps {
  type: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary' | 'mythical';
  size?: number;
  category: 'furniture' | 'decoration'; // New: furniture vs decoration
}

export function Decoration({ type, rarity = 'common', size = 40, category }: DecorationProps) {
  const backgroundColor = useThemeColor('background');
  const textColor = useThemeColor('text');

  // Get rarity shadow color and size
  const getRarityShadow = () => {
    switch (rarity) {
      case 'common':
        return { color: 'rgba(34, 197, 94, 0.2)', size: size * 1.05 }; // Green
      case 'rare':
        return { color: 'rgba(59, 130, 246, 0.3)', size: size * 1.08 }; // Blue
      case 'epic':
        return { color: 'rgba(147, 51, 234, 0.4)', size: size * 1.1 }; // Purple
      case 'legendary':
        return { color: 'rgba(245, 158, 11, 0.5)', size: size * 1.12 }; // Gold
      case 'mythical':
        return { color: 'rgba(236, 72, 153, 0.6)', size: size * 1.15 }; // Pink/Magenta
      default:
        return { color: 'rgba(34, 197, 94, 0.2)', size: size * 1.05 };
    }
  };

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

  const shadowStyle = getRarityShadow();

  return (
    <View style={styles.container}>
      {/* Rarity Shadow */}
      <View 
        style={[
          styles.rarityShadow, 
          { 
            width: shadowStyle.size, 
            height: shadowStyle.size, 
            backgroundColor: shadowStyle.color,
            borderRadius: shadowStyle.size / 2,
          }
        ]} 
      />
      
      <View
        style={[
          styles.decorationContainer,
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  decorationContainer: {
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 2,
  },
  emoji: {
    fontSize: 20,
  },
  rarityShadow: {
    position: 'absolute',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
