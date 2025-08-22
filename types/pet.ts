import { VerifiableData } from './achievements';

export interface PetStatus extends VerifiableData {
  happiness: number;  // 0-100
  energy: number;     // 0-100
  lastFed: number;    // timestamp
  lastPlayed: number; // timestamp
  lastUpdated: number; // timestamp for degradation calculation
}

export interface PetCareConfig {
  degradationRate: number;     // percentage per hour (e.g., 10)
  degradationInterval: number; // in milliseconds (1 hour = 3600000)
  careBoost: number;          // percentage increase per action (e.g., 10)
  careCooldown: number;       // in milliseconds (1 hour = 3600000)
}

export interface CareAction {
  type: 'feed' | 'play';
  timestamp: number;
  petId: string;
}