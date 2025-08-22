import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Dimensions, Animated, PanResponder, Pressable } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAbstraxionAccount } from "@burnt-labs/abstraxion-react-native";
import { PetSVG } from '@/components/PetSVG';
import { XIONVerificationService } from '@/services/verification';
import type { GameScore } from '@/types/achievements';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const PLATFORM_HEIGHT = 15;
const PLATFORM_WIDTH = 60;
const PLAYER_SIZE = 50;

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface GameState {
  score: number;
  highScore: number;
  isPlaying: boolean;
  gameOver: boolean;
}

export default function PlayScreen() {
  const { data: account, isConnected } = useAbstraxionAccount();
  const [selectedPets, setSelectedPets] = useState<PetType[]>([]);
  const [activePet, setActivePet] = useState<PetType | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    highScore: 0,
    isPlaying: false,
    gameOver: false,
  });

  // Mock pets data - replace with your actual pets data
  const availablePets = [
    { id: '1', name: 'Whiskers', type: 'cat', rarity: 'rare' },
    { id: '2', name: 'Buddy', type: 'dog', rarity: 'epic' },
    { id: '3', name: 'Fluffy', type: 'rabbit', rarity: 'legendary' },
    { id: '4', name: 'Spike', type: 'dog', rarity: 'common' },
    { id: '5', name: 'Luna', type: 'cat', rarity: 'epic' },
  ];

  // Game physics state
  const playerPos = useRef(new Animated.ValueXY({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 100 })).current;
  const velocity = useRef({ x: 0, y: 0 });
  const platforms = useRef<Platform[]>([]);
  const animationFrame = useRef<number>();
  const verificationService = new XIONVerificationService();

  // Initialize platforms
  const initializePlatforms = () => {
    platforms.current = [];
    // Add initial platform under player
    platforms.current.push({
      x: SCREEN_WIDTH / 2 - PLATFORM_WIDTH / 2,
      y: SCREEN_HEIGHT - 50,
      width: PLATFORM_WIDTH,
      height: PLATFORM_HEIGHT,
    });

    // Add random platforms
    for (let i = 0; i < 10; i++) {
      platforms.current.push({
        x: Math.random() * (SCREEN_WIDTH - PLATFORM_WIDTH),
        y: SCREEN_HEIGHT - 200 - i * 100,
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
      });
    }
  };

  // Pan responder for player movement
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gameState.isPlaying) {
          playerPos.setValue({
            x: playerPos.x._value + gestureState.dx,
            y: playerPos.y._value,
          });
        }
      },
    })
  ).current;

  // Game loop
  const gameLoop = () => {
    if (!gameState.isPlaying) return;

    // Apply gravity
    velocity.current.y += GRAVITY;

    // Update player position
    let newX = playerPos.x._value;
    let newY = playerPos.y._value + velocity.current.y;

    // Screen wrapping for x-axis
    if (newX < 0) newX = SCREEN_WIDTH;
    if (newX > SCREEN_WIDTH) newX = 0;

    // Check platform collisions
    platforms.current.forEach((platform) => {
      if (
        newY + PLAYER_SIZE > platform.y &&
        newY + PLAYER_SIZE < platform.y + platform.height &&
        newX > platform.x - PLAYER_SIZE / 2 &&
        newX < platform.x + platform.width + PLAYER_SIZE / 2 &&
        velocity.current.y > 0
      ) {
        newY = platform.y - PLAYER_SIZE;
        velocity.current.y = JUMP_FORCE;
      }
    });

    // Update score based on height reached
    const newScore = Math.floor((SCREEN_HEIGHT - newY) / 10);
    if (newScore > gameState.score) {
      setGameState(prev => ({ ...prev, score: newScore }));
    }

    // Game over condition
    if (newY > SCREEN_HEIGHT) {
      endGame();
      return;
    }

    // Camera follow (move platforms down)
    if (newY < SCREEN_HEIGHT / 2) {
      const diff = SCREEN_HEIGHT / 2 - newY;
      newY = SCREEN_HEIGHT / 2;
      platforms.current = platforms.current.map(platform => ({
        ...platform,
        y: platform.y + diff,
      }));

      // Remove platforms that are off screen and add new ones
      platforms.current = platforms.current.filter(p => p.y < SCREEN_HEIGHT);
      while (platforms.current.length < 10) {
        platforms.current.push({
          x: Math.random() * (SCREEN_WIDTH - PLATFORM_WIDTH),
          y: platforms.current[platforms.current.length - 1].y - 100,
          width: PLATFORM_WIDTH,
          height: PLATFORM_HEIGHT,
        });
      }
    }

    playerPos.setValue({ x: newX, y: newY });
    animationFrame.current = requestAnimationFrame(gameLoop);
  };

  const handlePetSelection = (pet: PetType) => {
    if (selectedPets.find(p => p.id === pet.id)) {
      setSelectedPets(selectedPets.filter(p => p.id !== pet.id));
      if (activePet?.id === pet.id) {
        setActivePet(selectedPets[0] || null);
      }
    } else if (selectedPets.length < 3) {
      setSelectedPets([...selectedPets, pet]);
      if (!activePet) {
        setActivePet(pet);
      }
    }
  };

  const handlePetSwap = (pet: PetType) => {
    if (gameState.isPlaying) {
      setActivePet(pet);
      // Here we'll add pet-specific bonuses later
    }
  };

  const startGame = () => {
    if (!activePet || selectedPets.length === 0) return;
    initializePlatforms();
    setGameState({
      score: 0,
      highScore: gameState.highScore,
      isPlaying: true,
      gameOver: false,
    });
    velocity.current = { x: 0, y: 0 };
    playerPos.setValue({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 100 });
    animationFrame.current = requestAnimationFrame(gameLoop);
  };

  const endGame = async () => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
    
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      gameOver: true,
      highScore: Math.max(prev.highScore, prev.score),
    }));

    // Verify and record the score
    if (account?.bech32Address && selectedPet) {
      try {
        const gameScore: GameScore = {
          petId: selectedPet.id,
          score: gameState.score,
          gameType: 'doodleJump',
          metadata: {
            heightReached: gameState.score * 10,
            powerupsCollected: 0,
            timeSpent: 0,
          },
          timestamp: Date.now(),
          signature: '',
          proof: null,
        };

        const proof = await verificationService.verifyGameScore(gameScore);
        console.log('Score verified:', proof);
      } catch (error) {
        console.error('Failed to verify score:', error);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);

  if (!isConnected) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>Pet Jump Game</ThemedText>
        <ThemedText style={styles.description}>
          Please connect your wallet to play with your pets
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.score}>Score: {gameState.score}</ThemedText>
      <ThemedText style={styles.highScore}>High Score: {gameState.highScore}</ThemedText>

      <Animated.View
        style={[styles.player, playerPos.getLayout()]}
        {...panResponder.panHandlers}
      >
        {activePet && (
          <PetSVG
            type={activePet.type}
            size={PLAYER_SIZE}
            isAnimating={gameState.isPlaying}
            rarity={activePet.rarity}
          />
        )}
      </Animated.View>

      {platforms.current.map((platform, index) => (
        <View
          key={index}
          style={[
            styles.platform,
            {
              left: platform.x,
              top: platform.y,
              width: platform.width,
              height: platform.height,
            },
          ]}
        />
      ))}

      {/* Quick swap UI */}
      <QuickSwapPets
        pets={selectedPets}
        activePet={activePet}
        onSwapPet={handlePetSwap}
        isGameActive={gameState.isPlaying}
      />

      {!gameState.isPlaying && (
        <View style={styles.menuContainer}>
          {gameState.gameOver && (
            <ThemedText style={styles.gameOver}>Game Over!</ThemedText>
          )}
          
          <PetSelector
            pets={availablePets}
            selectedPets={selectedPets}
            onSelectPet={handlePetSelection}
            maxSelections={3}
          />

          <Pressable
            style={[styles.startButton, !activePet && styles.buttonDisabled]}
            onPress={startGame}
            disabled={!activePet}
          >
            <ThemedText style={styles.startButtonText}>
              {selectedPets.length === 0 
                ? 'Select Pets to Play' 
                : !activePet 
                  ? 'Select Active Pet' 
                  : 'Start Game'}
            </ThemedText>
          </Pressable>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.8,
  },
  score: {
    position: 'absolute',
    top: 20,
    left: 20,
    fontSize: 20,
    fontWeight: 'bold',
    zIndex: 1,
  },
  highScore: {
    position: 'absolute',
    top: 20,
    right: 20,
    fontSize: 20,
    fontWeight: 'bold',
    zIndex: 1,
  },
  player: {
    position: 'absolute',
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    backgroundColor: 'transparent',
  },
  platform: {
    position: 'absolute',
    backgroundColor: '#2196F3',
    borderRadius: 5,
  },
  menuContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  gameOver: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#ff4444',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
