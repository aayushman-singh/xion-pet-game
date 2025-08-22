import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Dimensions, Animated, PanResponder, Pressable, Alert } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAbstraxionAccount } from "@burnt-labs/abstraxion-react-native";
import { PetSVG } from '@/components/PetSVG';
import { GameVerificationService } from '@/services/gameVerification';
import { XIONVerificationService } from '@/services/verification';
import type { GameScore } from '@/types/zkTLS';
import { QuickSwapPets } from '@/components/QuickSwapPets';
import type { Pet } from '@/types/pet';
import { PetRarity } from '@/types/pet';
import { PetSelector } from '@/components/PetSelector';
import { PET_BONUSES } from '@/types/petBonuses';

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

interface GameSession {
  sessionId: string;
  startTime: number;
  endTime: number;
  selectedPets: string[];
  petSwaps: any[];
  maxHeight: number;
  finalScore: number;
  timestamp: number;
  signature: string;
  proof: any;
}

interface GameState {
  score: number;
  highScore: number;
  isPlaying: boolean;
  gameOver: boolean;
}

export default function PlayScreen() {
  const { data: account, isConnected } = useAbstraxionAccount();
  const [selectedPets, setSelectedPets] = useState<Pet[]>([]);
  const [activePet, setActivePet] = useState<Pet | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    highScore: 0,
    isPlaying: false,
    gameOver: false,
  });
  
  const gameVerification = useRef(new GameVerificationService()).current;
  const currentSession = useRef<GameSession | null>(null);

  // Mock pets data - replace with your actual pets data
  const availablePets: Pet[] = [
    { id: '1', name: 'Whiskers', emoji: '🐱', basePrice: '100', description: 'A curious cat', baseStats: { happiness: 50, energy: 50, hunger: 50, strength: 60, agility: 80, intelligence: 70 }, rarity: PetRarity.RARE, type: 'cat' },
    { id: '2', name: 'Buddy', emoji: '🐶', basePrice: '150', description: 'A loyal dog', baseStats: { happiness: 50, energy: 50, hunger: 50, strength: 80, agility: 60, intelligence: 60 }, rarity: PetRarity.EPIC, type: 'dog' },
    { id: '3', name: 'Fluffy', emoji: '🐰', basePrice: '200', description: 'A fast rabbit', baseStats: { happiness: 50, energy: 50, hunger: 50, strength: 50, agility: 90, intelligence: 50 }, rarity: PetRarity.LEGENDARY, type: 'rabbit' },
    { id: '4', name: 'Spike', emoji: '🐕', basePrice: '80', description: 'A brave dog', baseStats: { happiness: 50, energy: 50, hunger: 50, strength: 70, agility: 50, intelligence: 55 }, rarity: PetRarity.COMMON, type: 'dog' },
    { id: '5', name: 'Luna', emoji: '🐈', basePrice: '120', description: 'A mysterious cat', baseStats: { happiness: 50, energy: 50, hunger: 50, strength: 55, agility: 75, intelligence: 80 }, rarity: PetRarity.EPIC, type: 'cat' },
  ];

  // Game physics state
  const playerPos = useRef(new Animated.ValueXY({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 100 })).current;
  const velocity = useRef({ x: 0, y: 0 });
  const platforms = useRef<Platform[]>([]);
  const animationFrame = useRef<number | null>(null);
  const currentPlayerPos = useRef({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 100 });
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
          const newX = currentPlayerPos.current.x + gestureState.dx;
          currentPlayerPos.current.x = newX;
          playerPos.setValue({
            x: newX,
            y: currentPlayerPos.current.y,
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
    let newX = currentPlayerPos.current.x;
    let newY = currentPlayerPos.current.y + velocity.current.y;

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

    // Update score and verify height reached
    const currentHeight = Math.floor((SCREEN_HEIGHT - newY) / 10);
    if (currentHeight > gameState.score) {
      setGameState(prev => ({ ...prev, score: currentHeight }));
      gameVerification.updateMaxHeight(currentHeight);
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

    currentPlayerPos.current = { x: newX, y: newY };
    playerPos.setValue({ x: newX, y: newY });
    animationFrame.current = requestAnimationFrame(gameLoop);
  };

  const handlePetSelection = (pet: Pet) => {
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

  const handlePetSwap = async (pet: Pet) => {
    if (gameState.isPlaying) {
      try {
        const currentHeight = Math.floor((SCREEN_HEIGHT - currentPlayerPos.current.y) / 10);
        const swapAction = await gameVerification.swapActivePet(pet.id, currentHeight);
        console.log('Pet swap verified:', swapAction);
        setActivePet(pet);
        // Here we'll add pet-specific bonuses later
      } catch (error) {
        console.error('Failed to verify pet swap:', error);
      }
    }
  };

  const startGame = async () => {
    if (!activePet || selectedPets.length === 0) return;
    
    try {
      // Start new game session with zkTLS verification
      const session = await gameVerification.startGameSession(selectedPets);
      currentSession.current = session;
      console.log('Game session started:', session);

      initializePlatforms();
      setGameState({
        score: 0,
        highScore: gameState.highScore,
        isPlaying: true,
        gameOver: false,
      });
      velocity.current = { x: 0, y: 0 };
      currentPlayerPos.current = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 100 };
      playerPos.setValue({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 100 });
      animationFrame.current = requestAnimationFrame(gameLoop);
    } catch (error) {
      console.error('Failed to start game session:', error);
      // Handle session start failure
      Alert.alert(
        'Error',
        'Failed to start game session. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const endGame = async () => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
    
    const finalScore = gameState.score;
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      gameOver: true,
      highScore: Math.max(prev.highScore, finalScore),
    }));

    // Verify and record the score
    if (account?.bech32Address && currentSession.current) {
      try {
        // End game session with verification
        const finalSession = await gameVerification.endGameSession(finalScore);
        console.log('Game session ended:', finalSession);

        // Verify final score
        const verifiedScore = await gameVerification.verifyGameScore(finalScore, finalSession);
        console.log('Score verified:', verifiedScore);

        // Reset session
        currentSession.current = null;

      } catch (error) {
        console.error('Failed to verify game session:', error);
        Alert.alert(
          'Warning',
          'Failed to verify game session. Your score might not be recorded.',
          [{ text: 'OK' }]
        );
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
            type={activePet.type || 'cat'}
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
      {activePet && (
        <QuickSwapPets
          pets={selectedPets}
          activePet={activePet}
          onSwapPet={handlePetSwap}
          isGameActive={gameState.isPlaying}
        />
      )}

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
  buttonDisabled: {
    backgroundColor: '#cccccc',
    opacity: 0.6,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
