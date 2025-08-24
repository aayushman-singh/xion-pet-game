// Pet Care Timer Configuration and Utilities

export interface PetCareTimerConfig {
  degradationRate: number;      // % per interval
  degradationInterval: number;  // milliseconds between degradation
  careBoost: number;           // % increase per care action
  feedCooldown: number;        // milliseconds between feeding
  playCooldown: number;        // milliseconds between playing
  cleanCooldown?: number;      // milliseconds between cleaning
  restCooldown?: number;       // milliseconds between resting
}

export const DEFAULT_TIMER_CONFIG: PetCareTimerConfig = {
  degradationRate: 10,         // 10% per hour
  degradationInterval: 3600000, // 1 hour
  careBoost: 15,              // 15% increase per action
  feedCooldown: 3600000,      // 1 hour between feeds
  playCooldown: 1800000,      // 30 minutes between play
  cleanCooldown: 7200000,     // 2 hours between cleaning
  restCooldown: 14400000      // 4 hours between rest
};

export interface DegradationInfo {
  shouldDegrade: boolean;
  intervalsPassed: number;
  degradationAmount: number;
  timeUntilNext: number;
}

export function calculateDegradation(
  lastUpdated: number,
  config: PetCareTimerConfig
): DegradationInfo {
  const now = Date.now();
  const timeDiff = now - lastUpdated;
  const intervalsPassed = Math.floor(timeDiff / config.degradationInterval);
  
  if (intervalsPassed < 1) {
    return {
      shouldDegrade: false,
      intervalsPassed: 0,
      degradationAmount: 0,
      timeUntilNext: config.degradationInterval - timeDiff
    };
  }

  const degradationAmount = Math.min(
    intervalsPassed * config.degradationRate,
    100 // Max degradation
  );

  return {
    shouldDegrade: true,
    intervalsPassed,
    degradationAmount,
    timeUntilNext: config.degradationInterval - (timeDiff % config.degradationInterval)
  };
}

export function calculateCooldownRemaining(
  lastActionTime: number,
  cooldownDuration: number
): number {
  const now = Date.now();
  return Math.max(0, cooldownDuration - (now - lastActionTime));
}

export function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds <= 0) return "Ready now";
  
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}