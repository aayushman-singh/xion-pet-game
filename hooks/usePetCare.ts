import { useState, useEffect, useCallback } from 'react';
import { PetCareService } from '../services/petCare';
import type { PetStatus, CareAction } from '../types/pet';
import { DEFAULT_TIMER_CONFIG, type PetCareTimerConfig } from '../types/petCareTimers';

export function usePetCare(initialStatus?: PetStatus | null, config?: PetCareTimerConfig) {
  const [status, setStatus] = useState<PetStatus | null>(initialStatus || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedCooldown, setFeedCooldown] = useState(0);
  const [playCooldown, setPlayCooldown] = useState(0);

  const timerConfig = config || DEFAULT_TIMER_CONFIG;
  const petCareService = new PetCareService(timerConfig);

  // Update cooldowns
  const updateCooldowns = useCallback(async () => {
    if (!status) return;
    const feedTime = await petCareService.getTimeUntilNextAction(status, 'feed');
    const playTime = await petCareService.getTimeUntilNextAction(status, 'play');
    setFeedCooldown(feedTime);
    setPlayCooldown(playTime);
  }, [status]);

  // Update status with degradation
  const updateStatus = useCallback(async () => {
    if (!status) return;
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
    if (!status) return;
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

  // Set up periodic status updates using the config's degradation interval
  useEffect(() => {
    const statusInterval = setInterval(updateStatus, timerConfig.degradationInterval);
    const cooldownInterval = setInterval(updateCooldowns, 1000); // Update cooldowns every second

    return () => {
      clearInterval(statusInterval);
      clearInterval(cooldownInterval);
    };
  }, [updateStatus, updateCooldowns, timerConfig.degradationInterval]);

  return {
    status,
    isLoading,
    error,
    feedCooldown,
    playCooldown,
    performAction,
    getStatusDescription: () => status ? petCareService.getStatusDescription(status) : 'Unknown',
  };
}
