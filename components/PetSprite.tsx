import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSequence,
  withSpring,
  withRepeat,
  Easing,
  withTiming,
} from 'react-native-reanimated';

interface PetSpriteProps {
  type: string;
  size?: number;
  isAnimating?: boolean;
}

export function PetSprite({ type, size = 120, isAnimating = true }: PetSpriteProps) {
  const animatedStyle = useAnimatedStyle(() => {
    if (!isAnimating) return {};

    // Gentle floating animation
    const translateY = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    return {
      transform: [{ translateY }],
    };
  });

  const getSpriteSource = (petType: string) => {
    switch (petType) {
      case 'starter-cat':
      case 'cat':
        return require('../assets/images/icon.png');
      default:
        return require('../assets/images/icon.png');
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.spriteContainer, animatedStyle]}>
        <Image
          source={getSpriteSource(type)}
          style={[
            styles.sprite,
            {
              width: size,
              height: size,
            },
          ]}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spriteContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sprite: {
    width: 120,
    height: 120,
  },
});
