import { BonusType, PetBonus, PET_BONUSES } from '../types/petBonuses';
import type { PetType } from '../types/pet';

export class PetBonusManager {
  private static instance: PetBonusManager;
  private activePet: PetType | null = null;
  private selectedPets: PetType[] = [];
  private activeBonus: PetBonus | null = null;
  private passiveBonuses: PetBonus[] = [];

  private constructor() {}

  static getInstance(): PetBonusManager {
    if (!PetBonusManager.instance) {
      PetBonusManager.instance = new PetBonusManager();
    }
    return PetBonusManager.instance;
  }

  setSelectedPets(pets: PetType[]): void {
    this.selectedPets = pets;
    this.updatePassiveBonuses();
  }

  setActivePet(pet: PetType): void {
    this.activePet = pet;
    this.activeBonus = PET_BONUSES[pet.type]?.activeBonus || null;
  }

  private updatePassiveBonuses(): void {
    this.passiveBonuses = this.selectedPets
      .map(pet => PET_BONUSES[pet.type]?.passiveBonus)
      .filter((bonus): bonus is PetBonus => bonus !== undefined);
  }

  getJumpModifier(): number {
    let modifier = 1.0;

    // Apply active bonus
    if (this.activeBonus?.type === BonusType.JUMP_HEIGHT) {
      modifier *= this.activeBonus.value;
    }

    // Apply passive bonuses
    this.passiveBonuses.forEach(bonus => {
      if (bonus.type === BonusType.JUMP_HEIGHT) {
        modifier *= bonus.value;
      }
    });

    return modifier;
  }

  getPlatformWidthModifier(): number {
    let modifier = 1.0;

    // Apply active bonus
    if (this.activeBonus?.type === BonusType.PLATFORM_WIDTH) {
      modifier *= this.activeBonus.value;
    }

    // Apply passive bonuses
    this.passiveBonuses.forEach(bonus => {
      if (bonus.type === BonusType.PLATFORM_WIDTH) {
        modifier *= bonus.value;
      }
    });

    return modifier;
  }

  getScoreMultiplier(): number {
    let multiplier = 1.0;

    // Apply active bonus
    if (this.activeBonus?.type === BonusType.SCORE_MULTIPLIER) {
      multiplier *= this.activeBonus.value;
    }

    // Apply passive bonuses
    this.passiveBonuses.forEach(bonus => {
      if (bonus.type === BonusType.SCORE_MULTIPLIER) {
        multiplier *= bonus.value;
      }
    });

    return multiplier;
  }

  getFallSpeedModifier(): number {
    let modifier = 1.0;

    // Apply active bonus
    if (this.activeBonus?.type === BonusType.FALL_SPEED) {
      modifier *= this.activeBonus.value;
    }

    // Apply passive bonuses
    this.passiveBonuses.forEach(bonus => {
      if (bonus.type === BonusType.FALL_SPEED) {
        modifier *= bonus.value;
      }
    });

    return modifier;
  }

  getBounceModifier(): number {
    let modifier = 1.0;

    // Apply active bonus
    if (this.activeBonus?.type === BonusType.BOUNCE_FORCE) {
      modifier *= this.activeBonus.value;
    }

    // Apply passive bonuses
    this.passiveBonuses.forEach(bonus => {
      if (bonus.type === BonusType.BOUNCE_FORCE) {
        modifier *= bonus.value;
      }
    });

    return modifier;
  }

  getActiveBonusDescription(): string | null {
    return this.activeBonus?.description || null;
  }

  getPassiveBonusDescriptions(): string[] {
    return this.passiveBonuses.map(bonus => bonus.description);
  }

  getAllActiveBonuses(): {active: PetBonus | null, passive: PetBonus[]} {
    return {
      active: this.activeBonus,
      passive: this.passiveBonuses
    };
  }
}
