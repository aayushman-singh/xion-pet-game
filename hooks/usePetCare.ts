import { useState, useEffect, useCallback } from 'react';
import { PetCareService } from '../services/petCare';
import type { PetStatus, CareAction } from '../types/pet';

export function usePetCare(initialStatus: PetStatus) {
  const [status, setStatus] = useState<PetStatus>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedCooldown, setFeedCooldown] = useState(0);
  const [playCooldown, setPlayCooldown] = useState(0);

  const petCareService = new PetCareService();

  // Update cooldowns
  const updateCooldowns = useCallback(async () => {
    const feedTime = await petCareService.getTimeUntilNextAction(status, 'feed');
    const playTime = await petCareService.getTimeUntilNextAction(status, 'play');
    setFeedCooldown(feedTime);
    setPlayCooldown(playTime);
  }, [status]);

  // Update status with degradation
  const updateStatus = useCallback(async () => {
    try {
      const newStatus = await petCareService.calculateCurrentStatus(status);
      setStatus(newStatus);
      updateCooldowns();
    } catch (err) {
      setError('Failed to update pet status');
      console.error(err);
    }
  }, [status]);

  // Perform care action (feed/play)
  const performAction = async (action: CareAction) => {
    setIsLoading(true);
    setError(null);
    try {
      const { newStatus } = await petCareService.performCareAction(status, action);
      setStatus(newStatus);
      updateCooldowns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform action');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up periodic status updates
  useEffect(() => {
    const statusInterval = setInterval(updateStatus, 60000); // Check every minute
    const cooldownInterval = setInterval(updateCooldowns, 1000); // Update cooldowns every second

    return () => {
      clearInterval(statusInterval);
      clearInterval(cooldownInterval);
    };
  }, [updateStatus, updateCooldowns]);

  return {
    status,
    isLoading,
    error,
    feedCooldown,
    playCooldown,
    performAction,
    getStatusDescription: () => petCareService.getStatusDescription(status),
  };
}
