import { ZkTLSProof } from '@burnt-labs/dave-sdk';

export enum AchievementCategory {
  PET_CARE = 'PET_CARE',
  GAME_SCORE = 'GAME_SCORE',
  COLLECTION = 'COLLECTION',
  SPECIAL = 'SPECIAL'
}

export enum AchievementTrigger {
  // Pet Care Triggers
  HAPPINESS_THRESHOLD = 'HAPPINESS_THRESHOLD',
  CARE_STREAK = 'CARE_STREAK',
  TOTAL_CARE_ACTIONS = 'TOTAL_CARE_ACTIONS',
  
  // Game Score Triggers
  HEIGHT_REACHED = 'HEIGHT_REACHED',
  TOTAL_SCORE = 'TOTAL_SCORE',
  PET_SWAPS = 'PET_SWAPS',
  GAMES_PLAYED = 'GAMES_PLAYED',
  
  // Collection Triggers
  PETS_OWNED = 'PETS_OWNED',
  RARITY_COLLECTION = 'RARITY_COLLECTION',
  
  // Special Triggers
  COMBINED_SCORE = 'COMBINED_SCORE',  // Game score + pet happiness
  MULTI_PET_MASTER = 'MULTI_PET_MASTER'  // High scores with different pets
}

export interface AchievementRequirement {
  trigger: AchievementTrigger;
  threshold: number;
  additionalParams?: Record<string, any>;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  requirements: AchievementRequirement[];
  reward?: {
    type: string;
    value: number | string;
  };
  icon?: string;
}

export interface UserAchievement extends Achievement {
  progress: number;
  isCompleted: boolean;
  completedAt?: number;
  proof?: ZkTLSProof;
}

// Achievement definitions
export const ACHIEVEMENTS: Achievement[] = [
  // Pet Care Achievements
  {
    id: 'happy_pet_master',
    title: 'Happy Pet Master',
    description: 'Maintain 90% happiness for 24 hours',
    category: AchievementCategory.PET_CARE,
    requirements: [{
      trigger: AchievementTrigger.HAPPINESS_THRESHOLD,
      threshold: 90,
      additionalParams: { duration: 86400000 } // 24 hours in ms
    }]
  },
  {
    id: 'care_streak_champion',
    title: 'Care Streak Champion',
    description: 'Maintain a care streak for 7 days',
    category: AchievementCategory.PET_CARE,
    requirements: [{
      trigger: AchievementTrigger.CARE_STREAK,
      threshold: 7
    }]
  },
  
  // Game Score Achievements
  {
    id: 'height_master',
    title: 'Height Master',
    description: 'Reach a height of 1000 in a single game',
    category: AchievementCategory.GAME_SCORE,
    requirements: [{
      trigger: AchievementTrigger.HEIGHT_REACHED,
      threshold: 1000
    }]
  },
  {
    id: 'swap_master',
    title: 'Swap Master',
    description: 'Perform 10 pet swaps in a single game',
    category: AchievementCategory.GAME_SCORE,
    requirements: [{
      trigger: AchievementTrigger.PET_SWAPS,
      threshold: 10
    }]
  },
  
  // Collection Achievements
  {
    id: 'pet_collector',
    title: 'Pet Collector',
    description: 'Own 5 different pets',
    category: AchievementCategory.COLLECTION,
    requirements: [{
      trigger: AchievementTrigger.PETS_OWNED,
      threshold: 5
    }]
  },
  
  // Special Achievements
  {
    id: 'perfect_harmony',
    title: 'Perfect Harmony',
    description: 'Achieve 90% happiness and 1000+ game score',
    category: AchievementCategory.SPECIAL,
    requirements: [
      {
        trigger: AchievementTrigger.HAPPINESS_THRESHOLD,
        threshold: 90
      },
      {
        trigger: AchievementTrigger.TOTAL_SCORE,
        threshold: 1000
      }
    ]
  }
];