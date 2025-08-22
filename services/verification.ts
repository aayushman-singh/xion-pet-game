import { DaveClient } from '@burnt-labs/dave-sdk';
import type {
  PetCareActivity,
  GameScore,
  Achievement,
  LeaderboardEntry,
  VerificationService,
  ZkTLSProof
} from '../types/achievements';

export class XIONVerificationService implements VerificationService {
  private client: DaveClient;

  constructor() {
    this.client = new DaveClient({
      rpcEndpoint: process.env.EXPO_PUBLIC_RPC_ENDPOINT || "https://rpc.xion-testnet-2.burnt.com:443",
      restEndpoint: process.env.EXPO_PUBLIC_REST_ENDPOINT || "https://api.xion-testnet-2.burnt.com",
    });
  }

  private async generateProof(data: any, type: string): Promise<ZkTLSProof> {
    try {
      // Using Dave SDK to generate zkTLS proof
      const proof = await this.client.generateProof({
        type,
        data: {
          ...data,
          timestamp: Date.now(),
        }
      });

      return proof;
    } catch (error) {
      console.error(`Failed to generate proof for ${type}:`, error);
      throw new Error(`Verification failed for ${type}`);
    }
  }

  async verifyPetCare(activity: PetCareActivity): Promise<ZkTLSProof> {
    return this.generateProof(activity, 'pet_care');
  }

  async verifyGameScore(score: GameScore): Promise<ZkTLSProof> {
    return this.generateProof(score, 'game_score');
  }

  async verifyAchievement(achievement: Achievement): Promise<ZkTLSProof> {
    // For achievements, we need to verify the underlying activities first
    const verifiedData = {
      ...achievement,
      type: achievement.type,
      requirements: achievement.requirements,
      progress: achievement.progress
    };
    
    return this.generateProof(verifiedData, 'achievement');
  }

  async verifyLeaderboardEntry(entry: LeaderboardEntry): Promise<ZkTLSProof> {
    // For leaderboard entries, we verify the composite score calculation
    const verifiedData = {
      petId: entry.petId,
      ownerAddress: entry.ownerAddress,
      totalScore: entry.totalScore,
      gameHighScore: entry.gameHighScore,
      careScore: entry.careScore,
      achievementCount: entry.achievements.length
    };
    
    return this.generateProof(verifiedData, 'leaderboard');
  }

  // Helper method to verify a batch of activities
  async verifyActivityBatch(activities: PetCareActivity[]): Promise<ZkTLSProof[]> {
    return Promise.all(activities.map(activity => this.verifyPetCare(activity)));
  }

  // Helper method to calculate and verify happiness score
  async calculateHappinessScore(petId: string, activities: PetCareActivity[]): Promise<number> {
    // Implement happiness score calculation algorithm
    const recentActivities = activities.filter(a => 
      Date.now() - a.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
    );
    
    const baseScore = recentActivities.reduce((score, activity) => 
      score + activity.happinessImpact, 0
    );
    
    // Normalize score between 0-100
    return Math.min(Math.max(baseScore, 0), 100);
  }
}
