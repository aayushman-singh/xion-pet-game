import { reclaimZkTLS } from './reclaimZkTLS';

/**
 * Real Dave (Reclaim Protocol) zkTLS integration for XION
 * Provides genuine zkTLS proof generation using Reclaim Protocol
 */
export class DaveXionClient {
  private zkTLSService: typeof reclaimZkTLS;

  constructor() {
    this.zkTLSService = reclaimZkTLS;
  }

  /**
   * Generate real zkTLS proof for pet care activities
   * Uses Reclaim Protocol for genuine zkTLS functionality
   */
  async generatePetCareProof(activityData: {
    petId: string;
    activityType: string;
    timestamp: number;
    happiness: number;
    playerAddress?: string;
    providerId?: string;
  }) {
    return await this.zkTLSService.generatePetCareProof({
      ...activityData,
      playerAddress: activityData.playerAddress || 'unknown'
    }, activityData.providerId);
  }

  /**
   * Generate real zkTLS proof for game sessions
   * Uses Reclaim Protocol for genuine game verification
   */
  async generateGameSessionProof(sessionData: {
    sessionId: string;
    petIds: string[];
    maxHeight: number;
    finalScore: number;
    swapCount: number;
    playerAddress?: string;
    providerId?: string;
  }) {
    return await this.zkTLSService.generateGameSessionProof({
      ...sessionData,
      playerAddress: sessionData.playerAddress || 'unknown'
    }, sessionData.providerId);
  }

  /**
   * Generate real zkTLS proof for NFT minting
   * Uses Reclaim Protocol for NFT authenticity verification
   */
  async generateNFTMintProof(nftData: {
    tokenId: string;
    owner: string;
    attributes: any[];
    rarity: string;
    creatorAddress?: string;
    providerId?: string;
  }) {
    return await this.zkTLSService.generateNFTProof({
      ...nftData,
      creatorAddress: nftData.creatorAddress || nftData.owner
    }, nftData.providerId);
  }

  /**
   * Validate existing zkTLS proofs using Reclaim Protocol
   */
  async validateProof(proof: any): Promise<boolean> {
    return await this.zkTLSService.validateProof(proof);
  }

  /**
   * Generate proof for external data verification
   * Example: Prove Twitter followers, GitHub activity, etc.
   */
  async generateExternalDataProof(dataSource: {
    platform: string;
    endpoint?: string;
    expectedValue?: string;
    userIdentifier: string;
    providerId?: string;
  }) {
    return await this.zkTLSService.generateExternalDataProof(dataSource);
  }

  /**
   * Check if Dave (Reclaim) zkTLS is ready
   */
  isReady(): boolean {
    return this.zkTLSService.isReady();
  }

  /**
   * Get client status for debugging
   */
  getStatus() {
    return this.zkTLSService.getStatus();
  }

  /**
   * Get available provider IDs for different verification types
   */
  getProviderIds() {
    return this.zkTLSService.getProviderIds();
  }
}

// Singleton instance for global use
export const daveClient = new DaveXionClient();
