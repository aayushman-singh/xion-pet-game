import React, { useEffect, useState } from 'react';
import { StyleSheet, Pressable, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAbstraxionAccount, useAbstraxionSigningClient, useAbstraxionClient } from "@burnt-labs/abstraxion-react-native";
import { ThemedView } from '@/components/ThemedView';
import { XionDemoStatus } from '@/components/XionDemoStatus';
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
  const { data: account, login, logout, isConnected } = useAbstraxionAccount();
  const { client: signingClient } = useAbstraxionSigningClient();
  const { client: queryClient } = useAbstraxionClient();
  const [hasStarterPet, setHasStarterPet] = useState(false);
  const [isClaimingPet, setIsClaimingPet] = useState(false);

  // Check if user has a starter pet from on-chain storage
  useEffect(() => {
    const checkStarterPet = async () => {
      if (account?.bech32Address && queryClient) {
        try {
          // Query the user map contract to get user's pet data
          const response = await queryClient.queryContractSmart(
            process.env.EXPO_PUBLIC_USER_MAP_CONTRACT_ADDRESS,
            { get_value_by_user: { address: account.bech32Address } }
          );
          
          if (response && typeof response === 'string') {
            try {
              const userData = JSON.parse(response);
              setHasStarterPet(userData.hasStarterPet === true);
            } catch (parseError) {
              // If response is not valid JSON or doesn't have pet data, user hasn't claimed
              setHasStarterPet(false);
            }
          } else {
            setHasStarterPet(false);
          }
        } catch (error) {
          // If user has no data stored, they haven't claimed a starter pet
          if (error.message && error.message.includes("not found") || 
              error.message && error.message.includes("No value found") ||
              error.message && error.message.includes("unknown request")) {
            setHasStarterPet(false);
          } else {
            console.error('Error checking starter pet:', error);
            setHasStarterPet(false);
          }
        }
      }
    };

    checkStarterPet();
  }, [account, queryClient]);

  const handleClaimStarterPet = async () => {
    if (!account?.bech32Address || !signingClient) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    setIsClaimingPet(true);
    try {
      // Create user data structure to store on-chain
      const userData = {
        hasStarterPet: true,
        starterPet: {
          id: STARTER_PET.id,
          name: STARTER_PET.name,
          type: 'cat',
          rarity: 'common',
          stats: STARTER_PET.baseStats,
          claimedAt: new Date().toISOString(),
        },
        // Future fields for pet collection, house data, etc.
        pets: [STARTER_PET.id],
        houseData: null,
        lastUpdated: new Date().toISOString(),
      };

      // Store user data on-chain using the user map contract
      const msg = {
        update: {
          value: JSON.stringify(userData)
        }
      };

      const result = await signingClient.execute(
        account.bech32Address,
        process.env.EXPO_PUBLIC_USER_MAP_CONTRACT_ADDRESS,
        msg,
        'auto'
      );

      if (result) {
        setHasStarterPet(true);
        Alert.alert(
          'Success!', 
          'Your starter cat has been claimed and stored on the blockchain!',
          [{ text: 'OK', onPress: () => router.push('/pet') }]
        );
      }
    } catch (error) {
      console.error('Error claiming starter pet:', error);
      Alert.alert(
        'Error', 
        'Failed to claim starter pet. Please check your network connection and try again.'
      );
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
          Connect your wallet to start your pet adventure and unlock all features
        </ThemedText>
        <ThemedText style={styles.featuresText}>
          • Claim your starter pet{'\n'}
          • Build your pet house{'\n'}
          • Mint new pets as NFTs{'\n'}
          • Explore other players' pets
        </ThemedText>
        <Pressable style={styles.connectButton} onPress={login}>
          <ThemedText style={styles.buttonText}>Connect Wallet to Start</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <XionDemoStatus />
      <Pressable 
        style={styles.logoutButtonTop}
        onPress={logout}
      >
        <ThemedText style={styles.logoutButtonText}>Disconnect</ThemedText>
      </Pressable>
      
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
    marginBottom: 20,
  },
  featuresText: {
    fontSize: 14,
    textAlign: 'left',
    opacity: 0.7,
    marginBottom: 30,
    lineHeight: 20,
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
  logoutButtonTop: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#f44336',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 15,
    zIndex: 1000,
  },
  logoutButton: {
    backgroundColor: '#f44336',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});