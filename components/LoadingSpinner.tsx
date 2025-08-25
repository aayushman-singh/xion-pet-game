import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';

interface LoadingSpinnerProps {
  inline?: boolean;
}

const { width, height } = Dimensions.get('window');

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  inline = false
}) => {
  if (inline) {
    return (
      <View style={styles.inlineContainer}>
        <Image 
          source={require('../assets/images/loading.gif')}
          style={styles.inlineLoadingGif}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/images/loading.gif')}
        style={styles.loadingGif}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGif: {
    width: Math.min(width * 0.8, height * 0.8),
    height: Math.min(width * 0.8, height * 0.8),
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineLoadingGif: {
    width: 40,
    height: 40,
  },
});
