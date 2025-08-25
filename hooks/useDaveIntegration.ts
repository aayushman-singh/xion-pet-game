import { useState, useCallback, useEffect } from 'react';
import { daveClient } from '../services/daveXionClient';

/**
 * Bare minimum React hook for Dave XION SDK integration
 * Provides essential zkTLS functionality for hackathon demo
 */
export function useDaveIntegration() {
  const [isReady, setIsReady] = useState(false);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [lastProof, setLastProof] = useState<any>(null);

  useEffect(() => {
    // Check if Dave client is ready
    const checkReady = () => {
      setIsReady(daveClient.isReady());
    };

    checkReady();
    const interval = setInterval(checkReady, 1000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Generate real zkTLS proof for pet care activity
   * Uses Reclaim Protocol for genuine verification
   */
  const generatePetCareProof = useCallback(async (
    petId: string, 
    activityType: string, 
    happiness: number, 
    playerAddress?: string,
    providerId?: string
  ) => {
    setIsGeneratingProof(true);
    try {
      const proof = await daveClient.generatePetCareProof({
        petId,
        activityType,
        timestamp: Date.now(),
        happiness,
        playerAddress,
        providerId
      });
      
      setLastProof(proof);
      console.log('✅ Real zkTLS pet care proof generated:', proof.id);
      return proof;
    } catch (error) {
      console.error('❌ Failed to generate pet care proof:', error);
      throw error;
    } finally {
      setIsGeneratingProof(false);
    }
  }, []);

  /**
   * Generate proof for game session
   * Required for achievement validation
   */
  const generateGameProof = useCallback(async (sessionData: {
    sessionId: string;
    petIds: string[];
    maxHeight: number;
    finalScore: number;
    swapCount: number;
    playerAddress?: string;
    providerId?: string;
  }) => {
    setIsGeneratingProof(true);
    try {
      const proof = await daveClient.generateGameSessionProof(sessionData);
      
      setLastProof(proof);
      console.log('✅ Real zkTLS game session proof generated:', proof.id);
      return proof;
    } catch (error) {
      console.error('❌ Failed to generate game proof:', error);
      throw error;
    } finally {
      setIsGeneratingProof(false);
    }
  }, []);

  /**
   * Generate proof for NFT minting
   * Shows zkTLS in NFT creation process
   */
  const generateNFTProof = useCallback(async (nftData: {
    tokenId: string;
    owner: string;
    attributes: any[];
    rarity: string;
    providerId?: string;
  }) => {
    setIsGeneratingProof(true);
    try {
      const proof = await daveClient.generateNFTMintProof(nftData);
      
      setLastProof(proof);
      console.log('✅ NFT mint proof generated:', proof.id);
      return proof;
    } catch (error) {
      console.error('❌ Failed to generate NFT proof:', error);
      throw error;
    } finally {
      setIsGeneratingProof(false);
    }
  }, []);

  /**
   * Validate any zkTLS proof
   */
  const validateProof = useCallback(async (proof: any): Promise<boolean> => {
    try {
      const isValid = await daveClient.validateProof(proof);
      console.log(`🔍 Proof validation result: ${isValid ? 'VALID' : 'INVALID'}`);
      return isValid;
    } catch (error) {
      console.error('❌ Proof validation failed:', error);
      return false;
    }
  }, []);

  /**
   * Generate proof for external data verification
   * Real zkTLS integration with social platforms, APIs, etc.
   */
  const generateExternalDataProof = useCallback(async (dataSource: {
    platform: string;
    endpoint?: string;
    expectedValue?: string;
    userIdentifier: string;
    providerId?: string;
  }) => {
    setIsGeneratingProof(true);
    try {
      const proof = await daveClient.generateExternalDataProof(dataSource);
      
      setLastProof(proof);
      console.log(`✅ Real zkTLS external data proof generated for ${dataSource.platform}:`, proof.id);
      return proof;
    } catch (error) {
      console.error(`❌ Failed to generate ${dataSource.platform} proof:`, error);
      throw error;
    } finally {
      setIsGeneratingProof(false);
    }
  }, []);

  /**
   * Get client status for debugging
   */
  const getStatus = useCallback(() => {
    return daveClient.getStatus();
  }, []);

  /**
   * Get available provider IDs for different verification types
   */
  const getProviderIds = useCallback(() => {
    return daveClient.getProviderIds();
  }, []);

  return {
    // Status
    isReady,
    isGeneratingProof,
    lastProof,

    // Core functions for real zkTLS integration
    generatePetCareProof,
    generateGameProof,
    generateNFTProof,
    generateExternalDataProof,
    validateProof,
    getStatus,
    getProviderIds
  };
}
