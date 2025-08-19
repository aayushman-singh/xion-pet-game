export type PetRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythical';

export interface PetStats {
  happiness: number;
  energy: number;
  hunger: number;
  strength: number;
  agility: number;
  intelligence: number;
}

export interface PetType {
  id: string;
  name: string;
  emoji: string;
  basePrice: string;
  baseStats: PetStats;
  description: string;
}

export interface Pet {
  id: string;
  type: PetType;
  rarity: PetRarity;
  stats: PetStats;
  level: number;
  experience: number;
  name: string;
  mintedAt: number;
  owner: string;
}

export const RARITY_COLORS = {
  common: '#B0B0B0',    // Gray
  rare: '#4169E1',      // Royal Blue
  epic: '#9400D3',      // Purple
  legendary: '#FFD700',  // Gold
  mythical: '#FF1493',  // Deep Pink
};

export const RARITY_MULTIPLIERS = {
  common: 1,
  rare: 1.5,
  epic: 2,
  legendary: 2.5,
  mythical: 3,
};

export const RARITY_CHANCES = {
  common: 60,    // 60%
  rare: 25,      // 25%
  epic: 10,      // 10%
  legendary: 4,  // 4%
  mythical: 1,   // 1%
};
