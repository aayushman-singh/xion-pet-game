import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
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

const GRAVITY = 0.8; // Normal gravity for natural falling
const JUMP_FORCE = -18; // Strong jump when hitting platforms
const PLATFORM_HEIGHT = 15;
const PLATFORM_WIDTH = 60;
const PLAYER_SIZE = 50; // Visual container size
const PLAYER_HITBOX_WIDTH = 30; // Actual collision width (narrower than visual)
const PLAYER_HITBOX_HEIGHT = 20; // Actual collision height (just the feet area)
const PLAYER_FEET_OFFSET = 20; // Offset from bottom of sprite to feet center (increased to move hitbox up)

// Debug logging utility - simplified to reduce memory allocations
const DEBUG_LOG = (category: string, message: string, data?: any) => {
  // Only log in development and limit frequency to prevent memory issues
  if (__DEV__) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`[${timestamp}] [${category}] ${message}`, data || '');
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
  
  // Use a ref to track the current game state for the game loop
  const currentGameState = useRef<GameState>({
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
  
  // Frame rate limiting to prevent memory issues
  const lastFrameTime = useRef(0);
  const TARGET_FPS = 60;
  const FRAME_INTERVAL = 1000 / TARGET_FPS;

     // Initialize platforms
   const initializePlatforms = () => {
     platforms.current = [];
     // Add initial platform under player
     const initialPlatform = {
       x: SCREEN_WIDTH / 2 - PLATFORM_WIDTH / 2,
       y: SCREEN_HEIGHT - 100, // Adjust to match new starting height
       width: PLATFORM_WIDTH,
       height: PLATFORM_HEIGHT,
     };
     platforms.current.push(initialPlatform);

     // Add platforms with optimal spacing for platform-based jumping
     for (let i = 0; i < 20; i++) {
       const platform = {
         x: Math.random() * (SCREEN_WIDTH - PLATFORM_WIDTH),
         y: SCREEN_HEIGHT - 120 - i * 70, // Optimal spacing for platform jumping
         width: PLATFORM_WIDTH,
         height: PLATFORM_HEIGHT,
       };
       platforms.current.push(platform);
     }
   };

  // Track gesture start position for proper movement calculation
  const gestureStartX = useRef(0);

     // Pan responder for player movement - now works anywhere on screen
   const panResponder = useRef(
     PanResponder.create({
       onStartShouldSetPanResponder: () => {
         return currentGameState.current.isPlaying; // Only respond when game is playing
       },
       onMoveShouldSetPanResponder: () => {
         return currentGameState.current.isPlaying;
       },
       onPanResponderGrant: (_, gestureState) => {
         if (currentGameState.current.isPlaying) {
           // Store the starting X position of the sprite when gesture begins
           gestureStartX.current = currentPlayerPos.current.x;
         }
       },
               onPanResponderMove: (_, gestureState) => {
          if (currentGameState.current.isPlaying) {
            // Use velocity for smooth movement
            const moveSpeed = 8.0; // Increased from 2.0 for more responsive movement
            const deltaX = gestureState.vx * moveSpeed; // Use velocity for smooth movement
            
            const oldX = currentPlayerPos.current.x;
            const newX = oldX + deltaX;
            
            // Keep player within screen bounds using feet hitbox
            const clampedX = Math.max(PLAYER_HITBOX_WIDTH / 2, Math.min(SCREEN_WIDTH - PLAYER_HITBOX_WIDTH / 2, newX));
            
            // Always update position if there's movement
            if (Math.abs(deltaX) > 0.1) { // Small threshold to avoid jitter
              currentPlayerPos.current.x = clampedX;
              playerPos.setValue({
                x: clampedX,
                y: currentPlayerPos.current.y,
              });
            }
          }
        },
       onPanResponderRelease: () => {
         // Gesture released - no action needed
       },
       onPanResponderTerminate: () => {
         // Gesture terminated - no action needed
       },
     })
   ).current;

  // Game loop with frame rate limiting
  const gameLoop = () => {
    if (!currentGameState.current.isPlaying) {
      return;

    }

    const currentTime = Date.now();
    const deltaTime = currentTime - lastFrameTime.current;
    
    // Frame rate limiting to prevent excessive memory usage
    if (deltaTime < FRAME_INTERVAL) {
      animationFrame.current = requestAnimationFrame(gameLoop);
      return;
    }
    
    lastFrameTime.current = currentTime;


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

         // Screen wrapping for x-axis - use feet hitbox for more accurate bounds
     const feetLeft = (newX + 30) - PLAYER_HITBOX_WIDTH / 2; // Match the collision detection offset
     const feetRight = (newX + 30) + PLAYER_HITBOX_WIDTH / 2;
     
     if (feetLeft < 0) {
       newX = SCREEN_WIDTH - PLAYER_HITBOX_WIDTH / 2 - 30; // Adjust for offset
     }
     if (feetRight > SCREEN_WIDTH) {
       newX = PLAYER_HITBOX_WIDTH / 2 - 30; // Adjust for offset
     }

         // Check platform collisions
     let onPlatform = false;
     
           platforms.current.forEach((platform, index) => {
       // Calculate precise hitbox for feet collision - match the visual debug box
       const feetCenterX = newX + 30; // Add the same offset as the visual debug box
       const feetCenterY = newY + PLAYER_SIZE - PLAYER_FEET_OFFSET;
       const feetLeft = feetCenterX - PLAYER_HITBOX_WIDTH / 2;
       const feetRight = feetCenterX + PLAYER_HITBOX_WIDTH / 2;
       const feetTop = feetCenterY - PLAYER_HITBOX_HEIGHT / 2;
       const feetBottom = feetCenterY + PLAYER_HITBOX_HEIGHT / 2;
      
             // Check if feet hitbox intersects with platform
       if (
         feetBottom > platform.y &&
         feetTop < platform.y + platform.height &&
         feetRight > platform.x &&
         feetLeft < platform.x + platform.width &&
         velocity.current.y > 0
       ) {
         // Position sprite so feet are exactly on platform
         newY = platform.y - PLAYER_SIZE + PLAYER_FEET_OFFSET;
         velocity.current.y = JUMP_FORCE; // Boost jump when hitting platform
         onPlatform = true;
       }
    });


         // Update platform state for debugging
     setIsOnPlatform(onPlatform);

    // No constant jumping - sprite only jumps when hitting platforms

         // Update score and verify height reached
     const currentHeight = Math.floor((SCREEN_HEIGHT - newY) / 10);
     if (currentHeight > currentGameState.current.score) {
       const updatedState = { ...currentGameState.current, score: currentHeight };
       setGameState(updatedState);
       currentGameState.current = updatedState;
       gameVerification.updateMaxHeight(currentHeight);
     }

         // Game over condition - check if sprite has fallen below the screen
     if (newY > SCREEN_HEIGHT + PLAYER_SIZE) {
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
       
       while (platforms.current.length < 20) {
         const newPlatform = {
           x: Math.random() * (SCREEN_WIDTH - PLATFORM_WIDTH),
           y: platforms.current[platforms.current.length - 1].y - 70, // Optimal spacing for platform jumping
           width: PLATFORM_WIDTH,
           height: PLATFORM_HEIGHT,
         };
         platforms.current.push(newPlatform);
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
         await gameVerification.swapActivePet(pet.id, currentHeight);
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

       initializePlatforms();
       const newGameState = {
         score: 0,
         highScore: gameState.highScore,
         isPlaying: true,
         gameOver: false,
       };
       setGameState(newGameState);
       currentGameState.current = newGameState;
       
       // Start with small downward velocity to ensure immediate falling
       const initialVelocity = { x: 0, y: 1 }; // Start with slight downward velocity
       const initialPosition = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 150 }; // Start higher
       
       velocity.current = initialVelocity;
       currentPlayerPos.current = initialPosition;
       playerPos.setValue(initialPosition);
       
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

     const resetGame = () => {
     if (animationFrame.current) {
       cancelAnimationFrame(animationFrame.current);
       animationFrame.current = null;
     }
     
     // Reset all game state
     const resetState = {
       score: 0,
       highScore: gameState.highScore,
       isPlaying: false,
       gameOver: false,
     };
     setGameState(resetState);
     currentGameState.current = resetState;
     
     // Reset physics state
     velocity.current = { x: 0, y: 0 };
     currentPlayerPos.current = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 150 };
     playerPos.setValue({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 150 });
     
     // Clear platforms
     platforms.current = [];
     
     // Reset session
     currentSession.current = null;
   };

     const endGame = async () => {
     if (animationFrame.current) {
       cancelAnimationFrame(animationFrame.current);
       animationFrame.current = null;
     }
     
     const finalScore = gameState.score;
     const oldHighScore = gameState.highScore;
     const newHighScore = Math.max(oldHighScore, finalScore);
     
     const endState = {
       score: finalScore,
       isPlaying: false,
       gameOver: true,
       highScore: newHighScore,
     };
     setGameState(endState);
     currentGameState.current = endState;

     // Verify and record the score
     if (account?.bech32Address && currentSession.current) {
       try {
         // End game session with verification
         await gameVerification.endGameSession(finalScore);

         // Verify final score
         await gameVerification.verifyGameScore(finalScore, currentSession.current);

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
           <ThemedText style={styles.debugInfo}>
             Height: {Math.floor((SCREEN_HEIGHT - currentPlayerPos.current.y) / 10)} | Raw Y: {Math.round(currentPlayerPos.current.y)}
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
         <View key={`platform-${index}`}>
           {/* Actual platform (blue) */}
           <View
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
           
           {/* Debug platform hitbox (green) - only show when game is playing */}
           {gameState.isPlaying && (
             <View
               style={[
                 styles.debugPlatformHitbox,
                 {
                   left: platform.x,
                   top: platform.y,
                   width: platform.width,
                   height: platform.height,
                 },
               ]}
             />
           )}
         </View>
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
            <View>
              <ThemedText style={styles.gameOver}>Game Over!</ThemedText>
              <ThemedText style={styles.finalScore}>Final Score: {gameState.score}</ThemedText>
              {gameState.score === gameState.highScore && gameState.score > 0 && (
                <ThemedText style={styles.newRecord}>🎉 New High Score! 🎉</ThemedText>
              )}
              
              <Pressable
                style={[styles.replayButton]}
                onPress={resetGame}
              >
                <ThemedText style={styles.replayButtonText}>
                  🔄 Play Again
                </ThemedText>
              </Pressable>
            </View>
          )}
          
          {!gameState.gameOver && (
            <View>
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
      
                 {/* Debug hitbox overlay - only show when game is playing */}
           {gameState.isPlaying && (
             <View style={[
               styles.debugHitbox,
               {
                 left: currentPlayerPos.current.x - PLAYER_HITBOX_WIDTH / 2 + 30, // Move right by 2px
                 top: currentPlayerPos.current.y + PLAYER_SIZE - PLAYER_FEET_OFFSET - PLAYER_HITBOX_HEIGHT / 2 + 5, // Move up by 5px
                 width: PLAYER_HITBOX_WIDTH,
                 height: PLAYER_HITBOX_HEIGHT,
               }
             ]} />
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
    marginBottom: 10,
    color: '#ff4444',
  },
  finalScore: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  newRecord: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#ff9500',
    textAlign: 'center',
  },
  replayButton: {
    backgroundColor: '#ff9500',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  replayButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
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
     debugHitbox: {
     position: 'absolute',
     backgroundColor: 'rgba(255, 0, 0, 0.3)',
     borderWidth: 2,
     borderColor: 'rgba(255, 0, 0, 0.8)',
     borderRadius: 2,
     zIndex: 10,
   },
   debugPlatformHitbox: {
     position: 'absolute',
     backgroundColor: 'rgba(0, 255, 0, 0.2)',
     borderWidth: 1,
     borderColor: 'rgba(0, 255, 0, 0.8)',
     borderRadius: 1,
     zIndex: 9,
   },
});
