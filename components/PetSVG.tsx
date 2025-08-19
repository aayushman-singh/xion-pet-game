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
}

export function PetSVG({ type, size = 120, isAnimating = true }: PetSVGProps) {
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

  const renderCat = () => (
    <View style={[styles.petContainer, { width: size, height: size }]}>
      <Image
        source={require('../assets/images/cat-sprite.png')}
        style={[styles.petImage, { width: size, height: size }]}
        resizeMode="contain"
      />
    </View>
  );

  const renderDog = () => (
    <View style={[styles.petContainer, { width: size, height: size }]}>
      <Image
        source={require('../assets/images/dog-sprite.png')}
        style={[styles.petImage, { width: size, height: size }]}
        resizeMode="contain"
      />
    </View>
  );

  const getPetSVG = () => {
    switch (type) {
      case 'dog':
        return renderDog();
      case 'starter-cat':
      case 'cat':
      default:
        return renderCat();
    }
  };

  return (
    <View style={styles.container}>
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
  },
  petContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  petImage: {
    borderRadius: 8,
  },
});
