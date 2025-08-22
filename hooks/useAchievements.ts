import { useState, useEffect, useCallback } from 'react';
import { AchievementVerification } from '../services/achievementVerification';
import { ACHIEVEMENTS, UserAchievement } from '../types/achievements';
import type { PetStatus } from '../types/pet';
import type { GameSession } from '../types/achievements';

interface AchievementData {
  petStatus?: PetStatus;
  gameSession?: GameSession;
  petCount?: number;
  careStreak?: number;
}

export function useAchievements() {
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const achievementVerification = AchievementVerification.getInstance();

  const checkAchievements = useCallback(async (data: AchievementData) => {
    setIsLoading(true);
    setError(null);
    try {
      const verifiedAchievements = await achievementVerification.verifyAllAchievements(
        ACHIEVEMENTS,
        data
      );
      
      setAchievements(verifiedAchievements);

      // Find newly completed achievements
      const newCompletions = verifiedAchievements.filter(
        achievement => achievement.isCompleted && 
        !achievements.find(a => a.id === achievement.id)?.isCompleted
      );

      // Notify about new achievements
      if (newCompletions.length > 0) {
        // You can implement your notification system here
        console.log('New achievements unlocked:', newCompletions);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify achievements');
      console.error('Achievement verification error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [achievements]);

  const getAchievementsByCategory = useCallback((category: string) => {
    return achievements.filter(achievement => achievement.category === category);
  }, [achievements]);

  const getCompletedAchievements = useCallback(() => {
    return achievements.filter(achievement => achievement.isCompleted);
  }, [achievements]);

  const getProgress = useCallback((achievementId: string) => {
    const achievement = achievements.find(a => a.id === achievementId);
    return achievement?.progress || 0;
  }, [achievements]);

  return {
    achievements,
    isLoading,
    error,
    checkAchievements,
    getAchievementsByCategory,
    getCompletedAchievements,
    getProgress,
  };
}
