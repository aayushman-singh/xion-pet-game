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
const GRAVITY = 0.8; // Normal gravity for natural falling
const JUMP_FORCE = -18; // Strong jump when hitting platforms
const PLATFORM_HEIGHT = 15;
const PLATFORM_WIDTH = 60;
const PLAYER_SIZE = 50;

// Debug logging utility
const DEBUG_LOG = (category: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const logMessage = `[${timestamp}] [${category}] ${message}`;
  if (data) {
    console.log(logMessage, data);
  } else {
    console.log(logMessage);
  }
};

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
  const [isOnPlatform, setIsOnPlatform] = useState(false);
  
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
    DEBUG_LOG('INIT', 'Initializing platforms');
    
    platforms.current = [];
    // Add initial platform under player
    const initialPlatform = {
      x: SCREEN_WIDTH / 2 - PLATFORM_WIDTH / 2,
      y: SCREEN_HEIGHT - 50,
      width: PLATFORM_WIDTH,
      height: PLATFORM_HEIGHT,
    };
    platforms.current.push(initialPlatform);
    
    DEBUG_LOG('INIT', 'Initial platform created', {
      position: { x: initialPlatform.x, y: initialPlatform.y },
      size: { width: initialPlatform.width, height: initialPlatform.height }
    });

    // Add platforms with optimal spacing for platform-based jumping
    for (let i = 0; i < 20; i++) {
      const platform = {
        x: Math.random() * (SCREEN_WIDTH - PLATFORM_WIDTH),
        y: SCREEN_HEIGHT - 120 - i * 70, // Optimal spacing for platform jumping
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
      };
      platforms.current.push(platform);
      
      DEBUG_LOG('INIT', `Platform ${i + 1} created`, {
        position: { x: platform.x, y: platform.y },
        index: i + 1
      });
    }
    
    DEBUG_LOG('INIT', 'Platform initialization complete', {
      totalPlatforms: platforms.current.length,
      screenDimensions: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT }
    });
  };

  // Pan responder for player movement - now works anywhere on screen
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        DEBUG_LOG('PAN', 'onStartShouldSetPanResponder called');
        return true;
      },
      onMoveShouldSetPanResponder: () => {
        DEBUG_LOG('PAN', 'onMoveShouldSetPanResponder called');
        return true;
      },
      onPanResponderGrant: (_, gestureState) => {
        DEBUG_LOG('PAN', 'onPanResponderGrant called', {
          startX: gestureState.x0,
          startY: gestureState.y0,
          currentPos: { ...currentPlayerPos.current }
        });
        if (gameState.isPlaying) {
          DEBUG_LOG('INPUT', 'Pan gesture started', {
            startX: gestureState.x0,
            startY: gestureState.y0,
            currentPos: { ...currentPlayerPos.current }
          });
        }
      },
      onPanResponderMove: (_, gestureState) => {
        DEBUG_LOG('PAN', 'onPanResponderMove called', {
          dx: gestureState.dx,
          dy: gestureState.dy,
          vx: gestureState.vx,
          vy: gestureState.vy
        });
        
        if (gameState.isPlaying) {
          // Debug: Log user input
          DEBUG_LOG('INPUT', 'Pan gesture detected', {
            dx: gestureState.dx,
            dy: gestureState.dy,
            vx: gestureState.vx,
            vy: gestureState.vy,
            currentPos: { ...currentPlayerPos.current }
          });

          // Use delta-based movement for more responsive control
          const moveSpeed = 2.0; // Responsive movement speed
          const newX = currentPlayerPos.current.x + (gestureState.dx * moveSpeed);
          
          // Keep player within screen bounds
          const clampedX = Math.max(PLAYER_SIZE / 2, Math.min(SCREEN_WIDTH - PLAYER_SIZE / 2, newX));
          
          // Debug: Log movement calculation
          DEBUG_LOG('MOVEMENT', 'Player movement calculated', {
            oldX: currentPlayerPos.current.x,
            newX: newX,
            clampedX: clampedX,
            moveSpeed: moveSpeed,
            gestureDx: gestureState.dx
          });
          
          currentPlayerPos.current.x = clampedX;
          playerPos.setValue({
            x: clampedX,
            y: currentPlayerPos.current.y,
          });
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        DEBUG_LOG('PAN', 'onPanResponderRelease called', {
          finalDx: gestureState.dx,
          finalDy: gestureState.dy
        });
        
        if (gameState.isPlaying) {
          DEBUG_LOG('INPUT', 'Pan gesture released', {
            finalDx: gestureState.dx,
            finalDy: gestureState.dy,
            finalPos: { ...currentPlayerPos.current }
          });
        }
      },
      onPanResponderTerminate: () => {
        DEBUG_LOG('PAN', 'onPanResponderTerminate called');
      },
    })
  ).current;

  // Game loop
  const gameLoop = () => {
    if (!gameState.isPlaying) return;

    // Debug: Log frame start
    DEBUG_LOG('PHYSICS', 'Game loop frame start', {
      currentPos: { ...currentPlayerPos.current },
      currentVelocity: { ...velocity.current },
      platformCount: platforms.current.length
    });

    // Apply gravity
    const oldVelocityY = velocity.current.y;
    velocity.current.y += GRAVITY;
    
    // Debug: Log gravity application
    DEBUG_LOG('PHYSICS', 'Gravity applied', {
      oldVelocityY: oldVelocityY,
      newVelocityY: velocity.current.y,
      gravity: GRAVITY
    });

    // Update player position
    let newX = currentPlayerPos.current.x;
    let newY = currentPlayerPos.current.y + velocity.current.y;

    // Screen wrapping for x-axis
    if (newX < 0) {
      DEBUG_LOG('BOUNDS', 'Player wrapped left to right', { oldX: newX, newX: SCREEN_WIDTH });
      newX = SCREEN_WIDTH;
    }
    if (newX > SCREEN_WIDTH) {
      DEBUG_LOG('BOUNDS', 'Player wrapped right to left', { oldX: newX, newX: 0 });
      newX = 0;
    }

    // Check platform collisions
    let onPlatform = false;
    let collisionDetails: any[] = [];
    
    platforms.current.forEach((platform, index) => {
      const collisionCheck = {
        platformIndex: index,
        platformPos: { x: platform.x, y: platform.y },
        playerPos: { x: newX, y: newY },
        playerBottom: newY + PLAYER_SIZE,
        platformTop: platform.y,
        platformBottom: platform.y + platform.height,
        playerLeft: newX - PLAYER_SIZE / 2,
        playerRight: newX + PLAYER_SIZE / 2,
        platformLeft: platform.x,
        platformRight: platform.x + platform.width,
        velocityY: velocity.current.y,
        wouldCollide: false
      };

      if (
        newY + PLAYER_SIZE > platform.y &&
        newY + PLAYER_SIZE < platform.y + platform.height &&
        newX > platform.x - PLAYER_SIZE / 2 &&
        newX < platform.x + platform.width + PLAYER_SIZE / 2 &&
        velocity.current.y > 0
      ) {
        collisionCheck.wouldCollide = true;
        collisionDetails.push(collisionCheck);
        
        const oldY = newY;
        newY = platform.y - PLAYER_SIZE;
        const oldVelocityY = velocity.current.y;
        velocity.current.y = JUMP_FORCE; // Boost jump when hitting platform
        onPlatform = true;
        
        // Debug: Log platform collision
        DEBUG_LOG('COLLISION', 'Platform collision detected', {
          platformIndex: index,
          platformPos: { x: platform.x, y: platform.y },
          oldPlayerY: oldY,
          newPlayerY: newY,
          oldVelocityY: oldVelocityY,
          newVelocityY: velocity.current.y,
          jumpForce: JUMP_FORCE
        });
      }
    });

    // Debug: Log collision summary if any occurred
    if (collisionDetails.length > 0) {
      DEBUG_LOG('COLLISION', 'Collision summary', {
        totalCollisions: collisionDetails.length,
        collisions: collisionDetails
      });
    }

    // Update platform state for debugging
    setIsOnPlatform(onPlatform);

    // Debug: Log platform state
    DEBUG_LOG('PLATFORM', 'Platform contact state updated', {
      onPlatform: onPlatform,
      playerY: newY,
      velocityY: velocity.current.y
    });

    // No constant jumping - sprite only jumps when hitting platforms

    // Update score and verify height reached
    const currentHeight = Math.floor((SCREEN_HEIGHT - newY) / 10);
    if (currentHeight > gameState.score) {
      const oldScore = gameState.score;
      setGameState(prev => ({ ...prev, score: currentHeight }));
      gameVerification.updateMaxHeight(currentHeight);
      
      // Debug: Log score update
      DEBUG_LOG('SCORE', 'Score increased', {
        oldScore: oldScore,
        newScore: currentHeight,
        playerY: newY,
        screenHeight: SCREEN_HEIGHT
      });
    }

    // Game over condition
    if (newY > SCREEN_HEIGHT) {
      DEBUG_LOG('GAME_OVER', 'Player fell below screen', {
        playerY: newY,
        screenHeight: SCREEN_HEIGHT,
        finalScore: currentHeight
      });
      endGame();
      return;
    }

    // Camera follow (move platforms down)
    if (newY < SCREEN_HEIGHT / 2) {
      const diff = SCREEN_HEIGHT / 2 - newY;
      const oldY = newY;
      newY = SCREEN_HEIGHT / 2;
      
      // Debug: Log camera movement
      DEBUG_LOG('CAMERA', 'Camera following player', {
        oldPlayerY: oldY,
        newPlayerY: newY,
        cameraDiff: diff,
        screenHalf: SCREEN_HEIGHT / 2
      });
      
      const oldPlatforms = [...platforms.current];
      platforms.current = platforms.current.map(platform => ({
        ...platform,
        y: platform.y + diff,
      }));

      // Remove platforms that are off screen and add new ones
      const removedCount = platforms.current.length;
      platforms.current = platforms.current.filter(p => p.y < SCREEN_HEIGHT);
      const remainingCount = platforms.current.length;
      
      // Debug: Log platform cleanup
      DEBUG_LOG('PLATFORM', 'Platforms cleaned up', {
        removedCount: removedCount - remainingCount,
        remainingCount: remainingCount
      });
      
      while (platforms.current.length < 20) {
        const newPlatform = {
          x: Math.random() * (SCREEN_WIDTH - PLATFORM_WIDTH),
          y: platforms.current[platforms.current.length - 1].y - 70, // Optimal spacing for platform jumping
          width: PLATFORM_WIDTH,
          height: PLATFORM_HEIGHT,
        };
        platforms.current.push(newPlatform);
        
        // Debug: Log new platform creation
        DEBUG_LOG('PLATFORM', 'New platform created', {
          position: { x: newPlatform.x, y: newPlatform.y },
          platformIndex: platforms.current.length - 1
        });
      }
    }

    // Debug: Log final position update
    DEBUG_LOG('POSITION', 'Player position updated', {
      oldPos: { ...currentPlayerPos.current },
      newPos: { x: newX, y: newY },
      velocity: { ...velocity.current }
    });

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
      DEBUG_LOG('PET_SWAP', 'Pet swap initiated', {
        fromPet: activePet?.name,
        toPet: pet.name,
        currentPosition: { ...currentPlayerPos.current },
        currentHeight: Math.floor((SCREEN_HEIGHT - currentPlayerPos.current.y) / 10)
      });
      
      try {
        const currentHeight = Math.floor((SCREEN_HEIGHT - currentPlayerPos.current.y) / 10);
        const swapAction = await gameVerification.swapActivePet(pet.id, currentHeight);
        DEBUG_LOG('PET_SWAP', 'Pet swap verified successfully', {
          swapAction: swapAction,
          newActivePet: pet.name,
          currentHeight: currentHeight
        });
        setActivePet(pet);
        // Here we'll add pet-specific bonuses later
      } catch (error) {
        DEBUG_LOG('ERROR', 'Failed to verify pet swap', { 
          error: error instanceof Error ? error.message : String(error),
          attemptedPet: pet.name
        });
        console.error('Failed to verify pet swap:', error);
      }
    }
  };

  const startGame = async () => {
    if (!activePet || selectedPets.length === 0) return;
    
    DEBUG_LOG('GAME', 'Starting game', {
      activePet: activePet?.name,
      selectedPetsCount: selectedPets.length,
      selectedPets: selectedPets.map(p => ({ id: p.id, name: p.name }))
    });
    
    try {
      // Start new game session with zkTLS verification
      const session = await gameVerification.startGameSession(selectedPets);
      currentSession.current = session;
      DEBUG_LOG('GAME', 'Game session started successfully', {
        sessionId: session.sessionId,
        startTime: session.startTime,
        selectedPets: session.selectedPets
      });

      initializePlatforms();
      setGameState({
        score: 0,
        highScore: gameState.highScore,
        isPlaying: true,
        gameOver: false,
      });
      
      // Start with no initial velocity - sprite will fall immediately due to gravity
      const initialVelocity = { x: 0, y: 0 };
      const initialPosition = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 100 };
      
      velocity.current = initialVelocity;
      currentPlayerPos.current = initialPosition;
      playerPos.setValue(initialPosition);
      
      DEBUG_LOG('GAME', 'Game state initialized', {
        initialPosition: initialPosition,
        initialVelocity: initialVelocity,
        gameState: { score: 0, isPlaying: true, gameOver: false }
      });
      
      animationFrame.current = requestAnimationFrame(gameLoop);
      DEBUG_LOG('GAME', 'Game loop started');
    } catch (error) {
      DEBUG_LOG('ERROR', 'Failed to start game session', { error: error instanceof Error ? error.message : String(error) });
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
    DEBUG_LOG('GAME', 'Ending game', {
      finalScore: gameState.score,
      currentPosition: { ...currentPlayerPos.current },
      currentVelocity: { ...velocity.current },
      platformCount: platforms.current.length
    });
    
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
      DEBUG_LOG('GAME', 'Game loop cancelled');
    }
    
    const finalScore = gameState.score;
    const oldHighScore = gameState.highScore;
    const newHighScore = Math.max(oldHighScore, finalScore);
    
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      gameOver: true,
      highScore: newHighScore,
    }));

    DEBUG_LOG('GAME', 'Game state updated', {
      finalScore: finalScore,
      oldHighScore: oldHighScore,
      newHighScore: newHighScore,
      isNewRecord: newHighScore > oldHighScore
    });

    // Verify and record the score
    if (account?.bech32Address && currentSession.current) {
      try {
        // End game session with verification
        const finalSession = await gameVerification.endGameSession(finalScore);
        DEBUG_LOG('GAME', 'Game session ended successfully', {
          sessionId: finalSession.sessionId,
          endTime: finalSession.endTime,
          finalScore: finalSession.finalScore
        });

        // Verify final score
        const verifiedScore = await gameVerification.verifyGameScore(finalScore, finalSession);
        DEBUG_LOG('GAME', 'Score verification completed', {
          originalScore: finalScore,
          verifiedScore: verifiedScore
        });

        // Reset session
        currentSession.current = null;
        DEBUG_LOG('GAME', 'Session reset completed');

      } catch (error) {
        DEBUG_LOG('ERROR', 'Failed to verify game session', { 
          error: error instanceof Error ? error.message : String(error),
          finalScore: finalScore,
          sessionId: currentSession.current?.sessionId
        });
        console.error('Failed to verify game session:', error);
        Alert.alert(
          'Warning',
          'Failed to verify game session. Your score might not be recorded.',
          [{ text: 'OK' }]
        );
      }
    } else {
      DEBUG_LOG('GAME', 'Game ended without verification', {
        hasAccount: !!account?.bech32Address,
        hasSession: !!currentSession.current,
        finalScore: finalScore
      });
    }
  };

  useEffect(() => {
    DEBUG_LOG('LIFECYCLE', 'PlayScreen mounted');
    
    return () => {
      DEBUG_LOG('LIFECYCLE', 'PlayScreen unmounting');
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
        DEBUG_LOG('LIFECYCLE', 'Animation frame cancelled on unmount');
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
    <ThemedView 
      style={styles.container} 
      {...panResponder.panHandlers}
    >
      <ThemedText style={styles.score}>Score: {gameState.score}</ThemedText>
      <ThemedText style={styles.highScore}>High Score: {gameState.highScore}</ThemedText>
      {gameState.isPlaying && (
        <View style={styles.debugContainer}>
          <ThemedText style={styles.debugInfo}>
            Platform: {isOnPlatform ? 'Yes' : 'No'} | Vel: {Math.round(velocity.current.y)}
          </ThemedText>
          <ThemedText style={styles.debugInfo}>
            Pos: ({Math.round(currentPlayerPos.current.x)}, {Math.round(currentPlayerPos.current.y)})
          </ThemedText>
          <ThemedText style={styles.debugInfo}>
            Platforms: {platforms.current.length} | Score: {gameState.score}
          </ThemedText>
        </View>
      )}

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
          
          <ThemedText style={styles.instructions}>
            🎮 Drag anywhere on screen to move left/right{'\n'}
            🦘 Your pet jumps when landing on platforms!
          </ThemedText>
          
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

      {/* Show instructions during gameplay */}
      {gameState.isPlaying && (
        <View style={styles.gameInstructions}>
          <ThemedText style={styles.gameInstructionText}>
            ← Drag anywhere to move →
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
    // Add subtle pattern to indicate draggable area
    position: 'relative',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  platform: {
    position: 'absolute',
    backgroundColor: '#2196F3',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#1976D2',
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
  debugContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  debugInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  instructions: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
    lineHeight: 24,
  },
  gameInstructions: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  gameInstructionText: {
    fontSize: 20,
    color: '#333',
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    fontWeight: 'bold',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
});
