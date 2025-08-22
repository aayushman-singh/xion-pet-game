export interface PetBonus {
  type: BonusType;
  value: number;
  description: string;
}

export enum BonusType {
  JUMP_HEIGHT = 'JUMP_HEIGHT',         // Increases jump force
  PLATFORM_WIDTH = 'PLATFORM_WIDTH',   // Makes platforms wider
  SCORE_MULTIPLIER = 'SCORE_MULTIPLIER', // Multiplies score gained
  FALL_SPEED = 'FALL_SPEED',          // Reduces falling speed
  BOUNCE_FORCE = 'BOUNCE_FORCE',      // Increases bounce on platforms
}

export interface PetBonusConfig {
  [key: string]: {  // key is pet type (e.g., 'cat', 'dog', etc.)
    activeBonus: PetBonus;
    passiveBonus?: PetBonus;
  };
}

// Define bonuses for each pet type
export const PET_BONUSES: PetBonusConfig = {
  cat: {
    activeBonus: {
      type: BonusType.JUMP_HEIGHT,
      value: 1.5, // 50% higher jumps
      description: "Enhanced jumping ability"
    },
    passiveBonus: {
      type: BonusType.FALL_SPEED,
      value: 0.8, // 20% slower falling
      description: "Graceful falling"
    }
  },
  dog: {
    activeBonus: {
      type: BonusType.BOUNCE_FORCE,
      value: 1.3, // 30% higher bounce
      description: "Powerful bouncing"
    },
    passiveBonus: {
      type: BonusType.PLATFORM_WIDTH,
      value: 1.2, // 20% wider platforms
      description: "Stable footing"
    }
  },
  rabbit: {
    activeBonus: {
      type: BonusType.SCORE_MULTIPLIER,
      value: 1.5, // 50% more points
      description: "Score boost"
    },
    passiveBonus: {
      type: BonusType.JUMP_HEIGHT,
      value: 1.2, // 20% higher jumps
      description: "Natural jumper"
    }
  },
  bird: {
    activeBonus: {
      type: BonusType.FALL_SPEED,
      value: 0.5, // 50% slower falling
      description: "Gliding ability"
    }
  },
  fox: {
    activeBonus: {
      type: BonusType.SCORE_MULTIPLIER,
      value: 2.0, // Double points
      description: "Clever scoring"
    }
  }
};
