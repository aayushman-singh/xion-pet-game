import { ZkTLSManager } from './zkTLSManager';
import type {
  Achievement,
  UserAchievement,
  AchievementTrigger,
  AchievementRequirement
} from '../types/achievements';
import type { PetStatus } from '../types/pet';
import type { GameSession } from '../types/achievements';

export class AchievementVerification {
  private static instance: AchievementVerification;
  private zkTLSManager: ZkTLSManager;

  private constructor() {
    this.zkTLSManager = ZkTLSManager.getInstance();
  }

  static getInstance(): AchievementVerification {
    if (!AchievementVerification.instance) {
      AchievementVerification.instance = new AchievementVerification();
    }
    return AchievementVerification.instance;
  }

  private async verifyRequirement(
    requirement: AchievementRequirement,
    data: {
      petStatus?: PetStatus;
      gameSession?: GameSession;
      petCount?: number;
      careStreak?: number;
    }
  ): Promise<boolean> {
    switch (requirement.trigger) {
      case AchievementTrigger.HAPPINESS_THRESHOLD:
        return this.verifyHappinessThreshold(
          requirement.threshold,
          data.petStatus!,
          requirement.additionalParams?.duration
        );
      
      case AchievementTrigger.HEIGHT_REACHED:
        return this.verifyHeightReached(
          requirement.threshold,
          data.gameSession!
        );
      
      case AchievementTrigger.PET_SWAPS:
        return this.verifyPetSwaps(
          requirement.threshold,
          data.gameSession!
        );
      
      case AchievementTrigger.PETS_OWNED:
        return this.verifyPetsOwned(
          requirement.threshold,
          data.petCount!
        );
      
      case AchievementTrigger.CARE_STREAK:
        return this.verifyCareStreak(
          requirement.threshold,
          data.careStreak!
        );
      
      default:
        return false;
    }
  }

  private async verifyHappinessThreshold(
    threshold: number,
    status: PetStatus,
    duration?: number
  ): Promise<boolean> {
    const proof = await this.zkTLSManager.verifyPetStatus(status);
    return status.happiness >= threshold && (!duration || Date.now() - status.timestamp <= duration);
  }

  private async verifyHeightReached(
    threshold: number,
    session: GameSession
  ): Promise<boolean> {
    const proof = await this.zkTLSManager.verifyGameSession(session);
    return session.maxHeight >= threshold;
  }

  private async verifyPetSwaps(
    threshold: number,
    session: GameSession
  ): Promise<boolean> {
    const proof = await this.zkTLSManager.verifyGameSession(session);
    return session.petSwaps.length >= threshold;
  }

  private async verifyPetsOwned(
    threshold: number,
    petCount: number
  ): Promise<boolean> {
    // This will be verified through NFT ownership once contracts are implemented
    return petCount >= threshold;
  }

  private async verifyCareStreak(
    threshold: number,
    streak: number
  ): Promise<boolean> {
    // This will need to verify through historical pet care data
    return streak >= threshold;
  }

  async checkAchievement(
    achievement: Achievement,
    data: {
      petStatus?: PetStatus;
      gameSession?: GameSession;
      petCount?: number;
      careStreak?: number;
    }
  ): Promise<UserAchievement> {
    try {
      // Verify all requirements
      const requirementResults = await Promise.all(
        achievement.requirements.map(req => this.verifyRequirement(req, data))
      );

      const isCompleted = requirementResults.every(result => result);
      
      if (isCompleted) {
        // Generate composite proof for achievement completion
        const proof = await this.zkTLSManager.verifyAchievement(
          achievement.id,
          achievement.category,
          achievement.requirements,
          [] // Add relevant proofs from data
        );

        // Submit achievement proof to contract
        const txHash = await this.zkTLSManager.submitAchievementProof(
          achievement.id,
          proof,
          data
        );

        if (txHash) {
          console.log(`Achievement ${achievement.id} submitted to contract: ${txHash}`);
        }

        return {
          ...achievement,
          progress: 100,
          isCompleted: true,
          completedAt: Date.now(),
          proof
        };
      }

      // Calculate progress (simplified version)
      const progress = (requirementResults.filter(r => r).length / requirementResults.length) * 100;

      return {
        ...achievement,
        progress,
        isCompleted: false
      };

    } catch (error) {
      console.error(`Failed to verify achievement ${achievement.id}:`, error);
      return {
        ...achievement,
        progress: 0,
        isCompleted: false
      };
    }
  }

  async verifyAllAchievements(
    achievements: Achievement[],
    data: {
      petStatus?: PetStatus;
      gameSession?: GameSession;
      petCount?: number;
      careStreak?: number;
    }
  ): Promise<UserAchievement[]> {
    return Promise.all(
      achievements.map(achievement => this.checkAchievement(achievement, data))
    );
  }
}
