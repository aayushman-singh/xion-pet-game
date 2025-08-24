import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Dimensions, Animated, PanResponder, Pressable, Alert } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAbstraxionAccount } from "@burnt-labs/abstraxion-react-native";
import { PetSVG } from '@/components/PetSVG';
import { GameVerificationService } from '@/services/gameVerification';
import { XIONVerificationService } from '@/services/verification';
import { useDaveIntegration } from '@/hooks/useDaveIntegration';
// import type { GameScore } from '@/types/zkTLS'; // Not needed
import { QuickSwapPets } from '@/components/QuickSwapPets';
import type { Pet } from '@/types/pet';
import { PetRarity } from '@/types/pet';
import { PetSelector } from '@/components/PetSelector';
import { PET_BONUSES } from '@/types/petBonuses';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const PLATFORM_HEIGHT = 15;
const PLATFORM_WIDTH = 80;
const PLAYER_SIZE = 50;
const MOVEMENT_SPEED = 10;

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
  
  // Dave XION SDK integration for zkTLS proofs (HACKATHON DEMO)
  const { generateGameProof, isGeneratingProof, getProviderIds } = useDaveIntegration();

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
  const velocity = useRef({ x: 0, y: 0 }); // Start with no velocity
  const platforms = useRef<Platform[]>([]);
  const animationFrame = useRef<number | null>(null);
  const currentPlayerPos = useRef({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 100 });
  const verificationService = new XIONVerificationService();
  
  // Touch movement state
  const touchStartX = useRef(0);
  const isTouching = useRef(false);
  const movementDirection = useRef(0); // -1 for left, 1 for right, 0 for none

  // Initialize platforms
  const initializePlatforms = () => {
    platforms.current = [];
    // Add initial platform under player
    platforms.current.push({
      x: SCREEN_WIDTH / 2 - PLATFORM_WIDTH / 2,
      y: SCREEN_HEIGHT - 100, // Position platform exactly under player
      width: PLATFORM_WIDTH,
      height: PLATFORM_HEIGHT,
    });

    // Add random platforms
    for (let i = 0; i < 15; i++) {
      platforms.current.push({
        x: Math.random() * (SCREEN_WIDTH - PLATFORM_WIDTH),
        y: SCREEN_HEIGHT - 150 - i * 100, // Closer spacing for easier gameplay
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
      onPanResponderGrant: (_, gestureState) => {
        touchStartX.current = gestureState.x0;
        isTouching.current = true;
        movementDirection.current = 0;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gameState.isPlaying && isTouching.current) {
          const deltaX = gestureState.moveX - touchStartX.current;
          if (Math.abs(deltaX) > 10) { // Smaller dead zone for more responsive movement
            movementDirection.current = deltaX > 0 ? 1 : -1;
          }
        }
      },
      onPanResponderRelease: () => {
        isTouching.current = false;
        movementDirection.current = 0;
      },
    })
  ).current;

  // Game loop
  const gameLoop = () => {
    if (!gameState.isPlaying) return;

    // Apply gravity
    velocity.current.y += GRAVITY;

    // Handle horizontal movement based on touch
    if (movementDirection.current !== 0) {
      velocity.current.x = movementDirection.current * MOVEMENT_SPEED;
    } else {
      // Gradually slow down horizontal movement
      velocity.current.x *= 0.8;
    }

    // Update player position
    let newX = currentPlayerPos.current.x + velocity.current.x;
    let newY = currentPlayerPos.current.y + velocity.current.y;

    // Screen wrapping for x-axis
    if (newX < -PLAYER_SIZE / 2) newX = SCREEN_WIDTH + PLAYER_SIZE / 2;
    if (newX > SCREEN_WIDTH + PLAYER_SIZE / 2) newX = -PLAYER_SIZE / 2;

    // Check platform collisions
    let onPlatform = false;
    platforms.current.forEach((platform) => {
      if (
        newY + PLAYER_SIZE > platform.y &&
        newY + PLAYER_SIZE < platform.y + platform.height + 5 &&
        newX + PLAYER_SIZE / 2 > platform.x &&
        newX - PLAYER_SIZE / 2 < platform.x + platform.width &&
        velocity.current.y > 0
      ) {
        newY = platform.y - PLAYER_SIZE;
        velocity.current.y = JUMP_FORCE; // Always jump when hitting platform
        onPlatform = true;
      }
    });

    // Update score based on height
    const currentHeight = Math.floor((SCREEN_HEIGHT - newY) / 10);
    if (currentHeight > gameState.score) {
      setGameState(prev => ({ ...prev, score: currentHeight }));
      gameVerification.updateMaxHeight(currentHeight);
    }

    // Game over condition
    if (newY > SCREEN_HEIGHT + 100) {
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
      platforms.current = platforms.current.filter(p => p.y < SCREEN_HEIGHT + 100);
      while (platforms.current.length < 15) {
        const lastPlatform = platforms.current[platforms.current.length - 1];
        platforms.current.push({
          x: Math.random() * (SCREEN_WIDTH - PLATFORM_WIDTH),
          y: lastPlatform ? lastPlatform.y - 100 : SCREEN_HEIGHT - 150, // Match the spacing
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
      velocity.current = { x: 0, y: JUMP_FORCE }; // Reset velocity
      currentPlayerPos.current = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 100 };
      playerPos.setValue({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 100 });
      
      // Reset touch state
      isTouching.current = false;
      movementDirection.current = 0;
      
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

        // Generate real zkTLS proof for game session using Reclaim Protocol
        try {
          const providerIds = getProviderIds();
          const gameSessionData = {
            sessionId: finalSession.sessionId,
            petIds: selectedPets.map(p => p.id),
            maxHeight: finalSession.maxHeight,
            finalScore: finalScore,
            swapCount: finalSession.petSwaps.length,
            playerAddress: account?.bech32Address,
            providerId: providerIds.gameSession
          };
          
          const proof = await generateGameProof(gameSessionData);
          console.log('🎮 Generated real zkTLS proof for game session:', proof.id);
          if ('reclaim_proof' in proof && proof.reclaim_proof) {
            console.log('✅ Using genuine Reclaim Protocol game proof');
          }
        } catch (proofError) {
          console.warn('zkTLS game proof generation failed:', proofError);
        }

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
    <ThemedView style={styles.container} {...panResponder.panHandlers}>
      <ThemedText style={styles.score}>Score: {gameState.score}</ThemedText>
      <ThemedText style={styles.highScore}>High Score: {gameState.highScore}</ThemedText>

      <Animated.View
        style={[styles.player, playerPos.getLayout()]}
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

      {/* Game instructions overlay */}
      {gameState.isPlaying && (
        <View style={styles.instructionsOverlay}>
          <ThemedText style={styles.instructionsText}>
            Touch and drag left/right to move
          </ThemedText>
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
  instructionsOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 40,
  },
  instructionsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
