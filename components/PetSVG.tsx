import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ThemedText } from './ThemedText';

interface PetSVGProps {
  type: string;
  size?: number;
  isAnimating?: boolean;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary' | 'mythical';
}

// Static sprite mapping - React Native require() doesn't support dynamic paths
const PET_SPRITES = {
  'cat-sprite': require('../assets/images/cat-sprite.png'),
  'dog-sprite': require('../assets/images/dog-sprite.png'),
  'rabbit-sprite': require('../assets/images/rabbit-sprite.png'),
  'bird-sprite': require('../assets/images/bird-sprite.png'),
  'fish-sprite': require('../assets/images/fish-sprite.png'),
  'owl-sprite': require('../assets/images/owl-sprite.png'),
  'fox-sprite': require('../assets/images/fox-sprite.png'),
  'butterfly-sprite': require('../assets/images/butterfly-sprite.png'),
};

export function PetSVG({ type, size = 120, isAnimating = true, rarity = 'common' }: PetSVGProps) {
  const animatedStyle = useAnimatedStyle(() => {
    if (!isAnimating) return {};

    const translateY = withRepeat(
      withSequence(
        withTiming(-3, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    return {
      transform: [{ translateY }],
    };
  });

  // Get rarity shadow color and size
  const getRarityShadow = () => {
    switch (rarity) {
      case 'common':
        return { color: 'rgba(34, 197, 94, 0.25)', size: size * 1.05 }; // Green
      case 'rare':
        return { color: 'rgba(59, 130, 246, 0.3)', size: size * 1.08 }; // Blue
      case 'epic':
        return { color: 'rgba(147, 51, 234, 0.35)', size: size * 1.1 }; // Purple
      case 'legendary':
        return { color: 'rgba(245, 158, 11, 0.4)', size: size * 1.12 }; // Gold
      case 'mythical':
        return { color: 'rgba(236, 72, 153, 0.45)', size: size * 1.15 }; // Pink/Magenta
      default:
        return { color: 'rgba(34, 197, 94, 0.25)', size: size * 1.05 };
    }
  };

  const shadowStyle = getRarityShadow();

  const renderPetSprite = (spriteName: string) => {
    const spriteSource = PET_SPRITES[spriteName as keyof typeof PET_SPRITES];
    
    if (!spriteSource) {
      // Fallback to cat sprite if sprite not found
      console.warn(`Pet sprite not found: ${spriteName}, falling back to cat-sprite`);
      return (
        <View style={[styles.petContainer, { width: size, height: size }]}>
          <Image
            source={PET_SPRITES['cat-sprite']}
            style={[styles.petImage, { width: size, height: size }]}
            resizeMode="contain"
          />
        </View>
      );
    }

    return (
      <View style={[styles.petContainer, { width: size, height: size }]}>
        <Image
          source={spriteSource}
          style={[styles.petImage, { width: size, height: size }]}
          resizeMode="contain"
        />
      </View>
    );
  };

  const getPetSVG = () => {
    switch (type) {
      case 'dog':
        return renderPetSprite('dog-sprite');
      case 'rabbit':
        return renderPetSprite('rabbit-sprite');
      case 'bird':
        return renderPetSprite('bird-sprite');
      case 'fish':
        return renderPetSprite('fish-sprite');
      case 'owl':
        return renderPetSprite('owl-sprite');
      case 'fox':
        return renderPetSprite('fox-sprite');
      case 'butterfly':
        return renderPetSprite('butterfly-sprite');
      case 'starter-cat':
      case 'cat':
      default:
        return renderPetSprite('cat-sprite');
    }
  };

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
      
      <Animated.View style={[styles.petContainer, animatedStyle]}>
        {getPetSVG()}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  petContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 2,
  },
  petImage: {
    borderRadius: 8,
  },
  rarityShadow: {
    position: 'absolute',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
