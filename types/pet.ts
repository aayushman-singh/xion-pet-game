import { VerifiableData } from './zkTLS';

export interface Pet {
  id: string;
  name: string;
  emoji: string;
  basePrice: string;
  description: string;
  baseStats: PetStats;
  rarity?: PetRarity;
  image?: string;
  type?: string; // Pet type for sprite rendering
  owned?: boolean; // Whether the user owns this pet
}

export interface PetStats {
  happiness: number;
  energy: number;
  hunger: number;
  strength: number;
  agility: number;
  intelligence: number;
}

export enum PetRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

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

// Utility function to determine if a pet can fly
export function canPetFly(petType: string): boolean {
  const flyingPets = ['bird', 'dragon', 'phoenix', 'bat', 'owl', 'eagle'];
  return flyingPets.includes(petType.toLowerCase());
}