import React, { useEffect, useState } from 'react';
import { StyleSheet, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAbstraxionAccount, useAbstraxionSigningClient } from "@burnt-labs/abstraxion-react-native";
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Pet } from '@/components/Pet';
import { PetType, PetStats } from '@/types/pet';

const STARTER_PET: PetType = {
  id: 'starter-cat',
  name: 'Starter Cat',
  emoji: '🐱',
  basePrice: '0',
  description: 'Your first pet companion',
  baseStats: {
    happiness: 100,
    energy: 100,
    hunger: 100,
    strength: 5,
    agility: 6,
    intelligence: 6,
  },
};

export default function HomeScreen() {
  const router = useRouter();
  const { data: account, login, isConnected } = useAbstraxionAccount();
  const { client: signingClient } = useAbstraxionSigningClient();
  const [hasStarterPet, setHasStarterPet] = useState(false);
  const [isClaimingPet, setIsClaimingPet] = useState(false);

  // Check if user has a starter pet
  useEffect(() => {
    const checkStarterPet = async () => {
      if (account?.bech32Address && signingClient) {
        try {
          // TODO: Replace with actual contract query
          // const response = await signingClient.queryContractSmart(
          //   process.env.EXPO_PUBLIC_PET_NFT_CONTRACT_ADDRESS,
          //   { get_user_pets: { owner: account.bech32Address } }
          // );
          // setHasStarterPet(response.pets.length > 0);
          setHasStarterPet(false); // For now, always show claim option
        } catch (error) {
          console.error('Error checking starter pet:', error);
        }
      }
    };

    checkStarterPet();
  }, [account, signingClient]);

  const handleClaimStarterPet = async () => {
    if (!account?.bech32Address || !signingClient) {
      return;
    }

    setIsClaimingPet(true);
    try {
      // TODO: Replace with actual contract call
      // const mintMsg = {
      //   mint_starter_pet: {
      //     owner: account.bech32Address,
      //     pet_type: STARTER_PET.id,
      //   },
      // };
      // await signingClient.execute(
      //   account.bech32Address,
      //   process.env.EXPO_PUBLIC_PET_NFT_CONTRACT_ADDRESS,
      //   mintMsg,
      //   'auto'
      // );
      
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHasStarterPet(true);
      router.push('/pet');
    } catch (error) {
      console.error('Error claiming starter pet:', error);
    } finally {
      setIsClaimingPet(false);
    }
  };

  if (!isConnected) {
    return (
      <ThemedView style={styles.container}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.logo}
        />
        <ThemedText style={styles.title}>Welcome to XION Pet Game!</ThemedText>
        <ThemedText style={styles.description}>
          Connect your wallet to start your pet adventure
        </ThemedText>
        <Pressable style={styles.connectButton} onPress={login}>
          <ThemedText style={styles.buttonText}>Connect Wallet</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Welcome to XION Pet Game!</ThemedText>
      
      {!hasStarterPet ? (
        <>
          <ThemedText style={styles.description}>
            Claim your starter pet to begin your adventure!
          </ThemedText>
          <ThemedView style={styles.previewContainer}>
            <Pet
              name={STARTER_PET.name}
              type={STARTER_PET.id}
              rarity="common"
              stats={STARTER_PET.baseStats}
            />
          </ThemedView>
          <Pressable 
            style={[styles.claimButton, isClaimingPet && styles.buttonDisabled]}
            onPress={handleClaimStarterPet}
            disabled={isClaimingPet}
          >
            <ThemedText style={styles.buttonText}>
              {isClaimingPet ? 'Claiming...' : 'Claim Starter Pet'}
            </ThemedText>
          </Pressable>
        </>
      ) : (
        <>
          <ThemedText style={styles.description}>
            Visit your pet in the Pet tab or mint new pets in the Mint tab!
          </ThemedText>
          <ThemedView style={styles.buttonContainer}>
            <Pressable 
              style={styles.navButton}
              onPress={() => router.push('/pet')}
            >
              <ThemedText style={styles.buttonText}>Visit Pet</ThemedText>
            </Pressable>
            <Pressable 
              style={styles.navButton}
              onPress={() => router.push('/nft')}
            >
              <ThemedText style={styles.buttonText}>Mint New Pet</ThemedText>
            </Pressable>
          </ThemedView>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    borderRadius: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 30,
  },
  previewContainer: {
    marginVertical: 20,
    padding: 20,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 20,
  },
  connectButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 20,
  },
  claimButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  navButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});