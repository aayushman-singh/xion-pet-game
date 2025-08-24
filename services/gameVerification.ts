import { DaveClient, ZkTLSProof, VerifiableData, GameScore, PetCareActivity } from '../types/zkTLS';
import type { Pet } from '../types/pet';

interface PetSwapAction extends VerifiableData {
  petId: string;
  timestamp: number;
  previousPetId: string | null;
  swapHeight: number; // Height at which swap occurred
}

interface GameSession extends VerifiableData {
  sessionId: string;
  startTime: number;
  endTime: number;
  selectedPets: string[];
  petSwaps: PetSwapAction[];
  maxHeight: number;
  finalScore: number;
}

export class GameVerificationService {
  private client: DaveClient;
  private currentSession: GameSession | null = null;

  constructor() {
    this.client = new DaveClient({
      rpcEndpoint: process.env.EXPO_PUBLIC_RPC_ENDPOINT || "https://rpc.xion-testnet-2.burnt.com:443",
      restEndpoint: process.env.EXPO_PUBLIC_REST_ENDPOINT || "https://api.xion-testnet-2.burnt.com",
    });
  }

  private async generateProof(data: any, type: string): Promise<ZkTLSProof> {
    try {
      return await this.client.generateProof({
        type,
        data: {
          ...data,
          timestamp: Date.now(),
        }
      });
    } catch (error) {
      console.error(`Failed to generate proof for ${type}:`, error);
      throw new Error(`Verification failed for ${type}`);
    }
  }

  async startGameSession(selectedPets: Pet[]): Promise<GameSession> {
    const sessionId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: GameSession = {
      sessionId,
      startTime: Date.now(),
      endTime: 0,
      selectedPets: selectedPets.map(p => p.id),
      petSwaps: [],
      maxHeight: 0,
      finalScore: 0,
      timestamp: Date.now(),
      signature: '',
      proof: {
        id: `temp_${Date.now()}`,
        type: 'game_session_start',
        timestamp: Date.now(),
        verified: false
      }
    };

    // Generate proof for session start
    const proof = await this.generateProof({
      sessionId,
      selectedPets: session.selectedPets,
      startTime: session.startTime
    }, 'game_session_start');

    this.currentSession = {
      ...session,
      proof
    };

    return this.currentSession;
  }

  async swapActivePet(petId: string, currentHeight: number): Promise<PetSwapAction> {
    if (!this.currentSession) {
      throw new Error('No active game session');
    }

    const previousPetId = this.currentSession.petSwaps.length > 0
      ? this.currentSession.petSwaps[this.currentSession.petSwaps.length - 1].petId
      : this.currentSession.selectedPets[0];

    const swapAction: PetSwapAction = {
      petId,
      timestamp: Date.now(),
      previousPetId,
      swapHeight: currentHeight,
      signature: '',
      proof: {
        id: `swap_${Date.now()}`,
        type: 'pet_swap',
        timestamp: Date.now(),
        verified: false
      }
    };

    // Generate proof for the swap
    const proof = await this.generateProof({
      ...swapAction,
      sessionId: this.currentSession.sessionId
    }, 'pet_swap');

    const verifiedSwap = {
      ...swapAction,
      proof
    };

    // Add to session
    this.currentSession.petSwaps.push(verifiedSwap);
    
    return verifiedSwap;
  }

  updateMaxHeight(height: number): void {
    if (this.currentSession) {
      this.currentSession.maxHeight = Math.max(this.currentSession.maxHeight, height);
    }
  }

  async endGameSession(finalScore: number): Promise<GameSession> {
    if (!this.currentSession) {
      throw new Error('No active game session');
    }

    const endTime = Date.now();
    const sessionData = {
      ...this.currentSession,
      endTime,
      finalScore,
    };

    // Generate final session proof
    const proof = await this.generateProof({
      sessionId: sessionData.sessionId,
      startTime: sessionData.startTime,
      endTime,
      finalScore,
      maxHeight: sessionData.maxHeight,
      petSwaps: sessionData.petSwaps.map(swap => ({
        petId: swap.petId,
        timestamp: swap.timestamp,
        height: swap.swapHeight
      })),
      selectedPets: sessionData.selectedPets
    }, 'game_session_end');

    const finalSession = {
      ...sessionData,
      proof
    };

    // Reset current session
    this.currentSession = null;

    return finalSession;
  }

  async verifyGameScore(score: number, session: GameSession): Promise<GameScore> {
    const gameScore: GameScore = {
      score,
      timestamp: Date.now(),
      verified: false
    };

    // Generate final score proof
    const proof = await this.generateProof({
      ...gameScore,
      sessionId: session.sessionId,
      sessionProof: session.proof,
      petSwaps: session.petSwaps.length
    }, 'game_score');

    return {
      ...gameScore,
      verified: true
    };
  }
}
