import { ZkTLSProof } from '@burnt-labs/dave-sdk';

// Core zkTLS proof types
export interface VerifiableData {
  timestamp: number;
  signature: string;
  proof: ZkTLSProof;
}

// Pet care related types
export interface PetCareActivity extends VerifiableData {
  petId: string;
  activityType: 'feed' | 'play' | 'groom' | 'train';
  duration: number;
  happinessImpact: number;
}

export interface PetHappinessScore extends VerifiableData {
  petId: string;
  currentScore: number;
  lastActivity: PetCareActivity;
}

// Game related types
export interface GameScore extends VerifiableData {
  petId: string;
  score: number;
  gameType: 'doodleJump';
  metadata: {
    heightReached: number;
    powerupsCollected: number;
    timeSpent: number;
  };
}

// Achievement types
export enum AchievementType {
  // Pet care achievements
  HAPPY_PET = 'HAPPY_PET',
  CARE_STREAK = 'CARE_STREAK',
  MASTER_TRAINER = 'MASTER_TRAINER',
  
  // Game achievements
  HIGH_SCORE = 'HIGH_SCORE',
  HEIGHT_MASTER = 'HEIGHT_MASTER',
  POWERUP_COLLECTOR = 'POWERUP_COLLECTOR',
  
  // Combined achievements
  PERFECT_OWNER = 'PERFECT_OWNER',
  LEGENDARY_STATUS = 'LEGENDARY_STATUS'
}

export interface Achievement extends VerifiableData {
  id: string;
  type: AchievementType;
  name: string;
  description: string;
  petId: string;
  requirements: {
    careScore?: number;
    gameScore?: number;
    activityCount?: number;
    streakDays?: number;
  };
  progress: number; // 0-100
  dateEarned?: number;
  metadata?: Record<string, any>;
}

// Leaderboard types
export interface LeaderboardEntry extends VerifiableData {
  petId: string;
  ownerAddress: string;
  totalScore: number;
  gameHighScore: number;
  careScore: number;
  achievements: Achievement[];
}

// zkTLS verification service interface
export interface VerificationService {
  verifyPetCare(activity: PetCareActivity): Promise<ZkTLSProof>;
  verifyGameScore(score: GameScore): Promise<ZkTLSProof>;
  verifyAchievement(achievement: Achievement): Promise<ZkTLSProof>;
  verifyLeaderboardEntry(entry: LeaderboardEntry): Promise<ZkTLSProof>;
}
