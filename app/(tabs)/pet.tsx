import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { Pet } from '@/components/Pet';
import { PetHouse } from '@/components/PetHouse';
import { Decoration } from '@/components/Decoration';
import { ThemedText } from '@/components/ThemedText';
import { useAbstraxionAccount, useAbstraxionClient } from "@burnt-labs/abstraxion-react-native";

export default function PetScreen() {
  const { data: account, isConnected } = useAbstraxionAccount();
  const { client: queryClient } = useAbstraxionClient();
  
  const [petState, setPetState] = useState({
    happiness: 100,
    energy: 100,
    hunger: 100,
    strength: 7,
    agility: 7,
    intelligence: 6,
  });

  const [userPetData, setUserPetData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user pet data from on-chain storage
  useEffect(() => {
    const loadUserPetData = async () => {
      if (account?.bech32Address && queryClient) {
        try {
          const response = await queryClient.queryContractSmart(
            process.env.EXPO_PUBLIC_USER_MAP_CONTRACT_ADDRESS,
            { get_value_by_user: { address: account.bech32Address } }
          );
          
          if (response && typeof response === 'string') {
            try {
              const userData = JSON.parse(response);
              setUserPetData(userData);
              
              // Update pet state with stored data
              if (userData.starterPet?.stats) {
                setPetState(userData.starterPet.stats);
              }
            } catch (parseError) {
              console.error('Error parsing user data:', parseError);
            }
          }
        } catch (error) {
          if (error.message && error.message.includes("No value found")) {
            Alert.alert(
              'No Pet Found', 
              'You need to claim a starter pet first. Go to the Home tab to get started!'
            );
          } else {
            console.error('Error loading user pet data:', error);
          }
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadUserPetData();
  }, [account, queryClient]);

  // Create house items based on user data
  const getHouseItems = () => {
    const items = [];
    
    // Add user's pet if they have one
    if (userPetData?.starterPet) {
      items.push({
        id: 'user-pet',
        type: 'pet',
        x: 2,
        y: 2,
        component: (
          <Pet
            name={userPetData.starterPet.name}
            type={userPetData.starterPet.type}
            rarity={userPetData.starterPet.rarity}
            stats={petState}
            onPet={handlePet}
            onFeed={handleFeed}
            onPlay={handlePlay}
          />
        ),
      });
    }
    
    // Add some default decorations
    items.push(
      {
        id: 'deco-1',
        type: 'decoration',
        x: 4,
        y: 2,
        component: <Decoration type="chair" rarity="rare" />,
      },
      {
        id: 'deco-2',
        type: 'decoration',
        x: 3,
        y: 4,
        component: <Decoration type="plant" rarity="epic" />,
      }
    );
    
    return items;
  };

  const handlePet = () => {
    setPetState(prev => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 10),
    }));
  };

  const handleFeed = () => {
    setPetState(prev => ({
      ...prev,
      hunger: Math.min(100, prev.hunger + 20),
    }));
  };

  const handlePlay = () => {
    setPetState(prev => ({
      ...prev,
      energy: Math.max(0, prev.energy - 10),
      happiness: Math.min(100, prev.happiness + 15),
    }));
  };

  const handleItemMove = (id: string, x: number, y: number) => {
    // TODO: Update house layout on-chain
    console.log(`Moved item ${id} to position (${x}, ${y})`);
    // For now, just log the movement
    // In the future, this will update the house layout on-chain
  };

  if (!isConnected) {
    return (
      <ScrollView style={styles.container}>
        <ThemedText style={styles.noPetText}>
          Please connect your wallet to view your pet.
        </ThemedText>
      </ScrollView>
    );
  }

  if (isLoading) {
    return (
      <ScrollView style={styles.container}>
        <ThemedText style={styles.loadingText}>Loading your pet...</ThemedText>
      </ScrollView>
    );
  }

  if (!userPetData?.starterPet) {
    return (
      <ScrollView style={styles.container}>
        <ThemedText style={styles.noPetText}>
          You don't have a pet yet. Go to the Home tab to claim your starter pet!
        </ThemedText>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <PetHouse items={getHouseItems()} onItemMove={handleItemMove} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  noPetText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    opacity: 0.7,
  },
});
