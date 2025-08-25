import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Pressable, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAbstraxionAccount, useAbstraxionSigningClient, useAbstraxionClient } from "@burnt-labs/abstraxion-react-native";
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { LoadingSpinner } from '@/components/LoadingSpinner';
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
  const [isCheckingPet, setIsCheckingPet] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const hasCheckedRef = useRef(false);

  // Check if user has a starter pet from on-chain storage
  useEffect(() => {
    // Reset the ref when connection state changes
    if (isConnected && !hasCheckedRef.current) {
      hasCheckedRef.current = true;
    } else if (!isConnected) {
      hasCheckedRef.current = false;
    }

    // Prevent infinite loop by checking if we've already processed this state
    if (hasCheckedRef.current && isConnected) {
      console.log('🔄 Already checked for connected state, skipping...');
      return;
    }

    console.log('🔍 useEffect triggered:', {
      hasAccount: !!account?.bech32Address,
      hasQueryClient: !!queryClient,
      isConnected,
      isInitialized,
      isCheckingPet
    });

    const checkStarterPet = async () => {
      console.log('🚀 Starting checkStarterPet');
      hasCheckedRef.current = true;
      
      if (account?.bech32Address && queryClient) {
        console.log('✅ Account and queryClient available, checking pet...');
        setIsCheckingPet(true);
        try {
          // Query the user map contract to get user's pet data
          const response = await queryClient.queryContractSmart(
            process.env.EXPO_PUBLIC_USER_MAP_CONTRACT_ADDRESS,
            { get_value_by_user: { address: account.bech32Address } }
          );
          
          console.log('📡 Contract response:', response);
          
          if (response && typeof response === 'string') {
            try {
              const userData = JSON.parse(response);
              console.log('📊 Parsed user data:', userData);
              setHasStarterPet(userData.hasStarterPet === true);
              console.log('🐱 Set hasStarterPet to:', userData.hasStarterPet === true);
            } catch (parseError) {
              console.log('❌ Parse error, setting hasStarterPet to false');
              setHasStarterPet(false);
            }
          } else {
            console.log('📭 No response, setting hasStarterPet to false');
            setHasStarterPet(false);
          }
        } catch (error) {
          console.log('🚨 Error checking pet:', error.message);
          // If user has no data stored, they haven't claimed a starter pet
          if (error.message && error.message.includes("not found") || 
              error.message && error.message.includes("No value found") ||
              error.message && error.message.includes("unknown request")) {
            console.log('👤 User not found, setting hasStarterPet to false');
            setHasStarterPet(false);
          } else {
            console.error('Error checking starter pet:', error);
            setHasStarterPet(false);
          }
        } finally {
          console.log('🏁 Finally block - setting isCheckingPet to false and isInitialized to true');
          setIsCheckingPet(false);
          setIsInitialized(true);
        }
      } else if (!isConnected) {
        console.log('🔌 Not connected, setting timeout for initialization');
        // If not connected, mark as initialized after a brief delay to show loading
        setTimeout(() => {
          console.log('⏰ Timeout completed, setting isInitialized to true');
          setIsInitialized(true);
        }, 500);
      } else {
        console.log('❓ Neither condition met, setting isInitialized to true');
        setIsInitialized(true);
      }
    };

    checkStarterPet();
  }, [account?.bech32Address, queryClient, isConnected]);

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

  // Show loading spinner until both wallet connectivity and pet status are confirmed
  console.log('🎯 Render decision:', {
    isInitialized,
    isConnected,
    hasStarterPet,
    isCheckingPet
  });

  if (!isInitialized) {
    console.log('🔄 Showing loading screen');
    return (
      <ThemedView style={styles.container}>
        <LoadingSpinner />
      </ThemedView>
    );
  }

  if (!isConnected) {
    console.log('🔌 Showing connect wallet screen');
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
             {isClaimingPet ? (
               <LoadingSpinner inline />
             ) : (
               <ThemedText style={styles.buttonText}>Claim Starter Pet</ThemedText>
             )}
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