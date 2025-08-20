import React, { useState } from 'react';
import { StyleSheet, View, Pressable, ScrollView, Image } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
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
  scene: 'inside' | 'outside' | 'both'; // Which scene(s) this item can appear in
  category?: 'furniture' | 'decoration'; // New: furniture vs decoration
}

interface PetHouseProps {
  items: GridItem[];
  onItemMove?: (id: string, x: number, y: number) => void;
  scene?: 'inside' | 'outside';
}

const GRID_SIZE = 8; // 8x8 grid
const CELL_SIZE = 60; // Increased cell size for bigger house

export function PetHouse({ items, onItemMove, scene = 'inside' }: PetHouseProps) {
  const backgroundColor = useThemeColor('background');
  const borderColor = useThemeColor('border');
  const [isDragging, setIsDragging] = useState(false);
  const [currentScene, setCurrentScene] = useState(scene);

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
                borderColor: isDragging ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)',
                borderWidth: isDragging ? 1 : 0.5,
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

  // Render placed items - only show items for current scene
  const renderItems = () => {
    return items
      .filter(item => 
        item.scene === 'both' || 
        item.scene === currentScene
      )
      .map((item) => (
        <DraggableItem
          key={item.id}
          item={item}
          onMove={onItemMove}
          onDragStateChange={setIsDragging}
          gridSize={GRID_SIZE}
          cellSize={CELL_SIZE}
          currentScene={currentScene}
        />
      ));
  };

    return (
    <ThemedView style={styles.container}>
      {/* Scene Label */}
      <View style={styles.sceneLabel}>
        <ThemedText style={styles.sceneLabelText}>
          {currentScene === 'inside' ? '🏠 Inside the House' : '🌳 Outside in the Field'}
        </ThemedText>
      </View>
      
      <ScrollView
        horizontal
        contentContainerStyle={styles.scrollContent}
        showsHorizontalScrollIndicator={false}
      >
        <View
          style={[
            styles.house,
            {
              width: GRID_SIZE * CELL_SIZE,
              height: GRID_SIZE * CELL_SIZE,
            },
          ]}
        >
          {/* Background scene image */}
          <Image
            source={currentScene === 'inside' 
              ? require('../assets/images/house.png')
              : require('../assets/images/field.jpg')
            }
            style={[
              styles.roomBackground,
              currentScene === 'outside' && styles.outsideBackground
            ]}
          />
          {renderGrid()}
          {renderItems()}
          
          {/* Height restriction indicators - both scenes at y=4 */}
          <View style={[styles.restrictionLine, { top: 4 * CELL_SIZE }]} />
          <ThemedText style={[styles.restrictionLabel, { top: 4 * CELL_SIZE - 20 }]}>
            Ground Level (y=4)
          </ThemedText>
        </View>
      </ScrollView>
      
      {/* Scene Toggle Buttons - below the canvas */}
      <View style={styles.sceneToggle}>
        <Pressable 
          style={[styles.sceneButton, currentScene === 'inside' && styles.activeSceneButton]}
          onPress={() => setCurrentScene('inside')}
        >
          <ThemedText style={styles.sceneButtonText}>🏠 Inside</ThemedText>
        </Pressable>
        <Pressable 
          style={[styles.sceneButton, currentScene === 'outside' && styles.activeSceneButton]}
          onPress={() => setCurrentScene('outside')}
        >
          <ThemedText style={styles.sceneButtonText}>🌳 Outside</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

interface DraggableItemProps {
  item: GridItem;
  onMove?: (id: string, x: number, y: number) => void;
  onDragStateChange?: (isDragging: boolean) => void;
  gridSize: number;
  cellSize: number;
  currentScene: 'inside' | 'outside';
}

function DraggableItem({ item, onMove, onDragStateChange, gridSize, cellSize, currentScene }: DraggableItemProps) {
  const translateX = useSharedValue(item.x * cellSize);
  const translateY = useSharedValue(item.y * cellSize);

  const gesture = Gesture.Pan()
    .onBegin(() => {
      if (onDragStateChange) {
        runOnJS(onDragStateChange)(true);
      }
    })
    .onUpdate((e) => {
      translateX.value = item.x * cellSize + e.translationX;
      translateY.value = item.y * cellSize + e.translationY;
    })
    .onEnd((e) => {
      // Snap to grid
      let newX = Math.max(0, Math.min(gridSize - 1, Math.round((item.x * cellSize + e.translationX) / cellSize)));
      let newY = Math.max(0, Math.min(gridSize - 1, Math.round((item.y * cellSize + e.translationY) / cellSize)));
      
      // Enforce height restrictions based on category and scene
      if (item.category === 'furniture') {
        if (currentScene === 'inside') {
          // Inside furniture must be above y=4 (floating furniture)
          newY = Math.max(4, newY);
          console.log(`Inside furniture restricted to y >= 4, final y: ${newY}`);
        } else if (currentScene === 'outside') {
          // Outside furniture must be above y=4 (ground level)
          newY = Math.max(4, newY);
          console.log(`Outside furniture restricted to y >= 4, final y: ${newY}`);
        }
      }
      // Decorations can go anywhere (no height restrictions)
      
      translateX.value = withSpring(newX * cellSize);
      translateY.value = withSpring(newY * cellSize);
      
      if (onMove) {
        runOnJS(onMove)(item.id, newX, newY);
      }
      
      if (onDragStateChange) {
        runOnJS(onDragStateChange)(false);
      }
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
  sceneLabel: {
    alignItems: 'center',
    marginBottom: 15,
  },
  sceneLabelText: {
    fontSize: 18,
    fontWeight: 'bold',
    opacity: 0.8,
  },
  sceneToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 10,
  },
  sceneButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeSceneButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#2E7D32',
  },
  sceneButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  scrollContent: {
    padding: 10,
  },
  house: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  roomBackground: {
    position: 'absolute',
    width: '120%', // Make image bigger than container
    height: '120%', // Make image bigger than container
    left: '-10%', // Center the larger image
    top: '-10%', // Center the larger image
    zIndex: 0,
  },
  outsideBackground: {
    // Additional styling for outdoor scene if needed
  },
  gridCell: {
    position: 'absolute',
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 0.5,
    opacity: 0.05, // Very subtle grid over the background
    zIndex: 1,
  },
  draggableItem: {
    position: 'absolute',
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2, // Ensure items appear above background and grid
  },
  restrictionLine: {
    position: 'absolute',
    left: 0,
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // Subtle white line
    zIndex: 1,
  },
  restrictionLabel: {
    position: 'absolute',
    left: 10,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: 'bold',
    zIndex: 1,
  },

});
