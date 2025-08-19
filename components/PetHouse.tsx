import React from 'react';
import { StyleSheet, View, Pressable, ScrollView } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useThemeColor } from '../hooks/useThemeColor';

interface GridItem {
  id: string;
  type: 'pet' | 'decoration';
  x: number;
  y: number;
  component: React.ReactNode;
}

interface PetHouseProps {
  items: GridItem[];
  onItemMove?: (id: string, x: number, y: number) => void;
}

const GRID_SIZE = 8; // 8x8 grid
const CELL_SIZE = 50;

export function PetHouse({ items, onItemMove }: PetHouseProps) {
  const backgroundColor = useThemeColor('background');
  const borderColor = useThemeColor('border');

  // Create grid cells
  const renderGrid = () => {
    const cells = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        cells.push(
          <View
            key={`${i}-${j}`}
            style={[
              styles.gridCell,
              {
                borderColor,
                left: j * CELL_SIZE,
                top: i * CELL_SIZE,
              },
            ]}
          />
        );
      }
    }
    return cells;
  };

  // Render placed items
  const renderItems = () => {
    return items.map((item) => (
      <DraggableItem
        key={item.id}
        item={item}
        onMove={onItemMove}
        gridSize={GRID_SIZE}
        cellSize={CELL_SIZE}
      />
    ));
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>My Pet House</ThemedText>
      <ScrollView
        horizontal
        contentContainerStyle={styles.scrollContent}
        showsHorizontalScrollIndicator={false}
      >
        <View
          style={[
            styles.house,
            {
              backgroundColor,
              width: GRID_SIZE * CELL_SIZE,
              height: GRID_SIZE * CELL_SIZE,
            },
          ]}
        >
          {renderGrid()}
          {renderItems()}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

interface DraggableItemProps {
  item: GridItem;
  onMove?: (id: string, x: number, y: number) => void;
  gridSize: number;
  cellSize: number;
}

function DraggableItem({ item, onMove, gridSize, cellSize }: DraggableItemProps) {
  const translateX = useSharedValue(item.x * cellSize);
  const translateY = useSharedValue(item.y * cellSize);

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = item.x * cellSize + e.translationX;
      translateY.value = item.y * cellSize + e.translationY;
    })
    .onEnd((e) => {
      // Snap to grid
      const newX = Math.max(0, Math.min(gridSize - 1, Math.round((item.x * cellSize + e.translationX) / cellSize)));
      const newY = Math.max(0, Math.min(gridSize - 1, Math.round((item.y * cellSize + e.translationY) / cellSize)));
      
      translateX.value = withSpring(newX * cellSize);
      translateY.value = withSpring(newY * cellSize);
      
      onMove?.(item.id, newX, newY);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.draggableItem, animatedStyle]}>
        {item.component}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 10,
  },
  house: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  gridCell: {
    position: 'absolute',
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 0.5,
    opacity: 0.3,
  },
  draggableItem: {
    position: 'absolute',
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
