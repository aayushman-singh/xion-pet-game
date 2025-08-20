import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Alert, View, Pressable, Modal, Image } from 'react-native';
import { Pet } from '@/components/Pet';
import { PetHouse } from '@/components/PetHouse';
import { Decoration } from '@/components/Decoration';
import { ThemedText } from '@/components/ThemedText';
import { useAbstraxionAccount, useAbstraxionClient } from "@burnt-labs/abstraxion-react-native";
import { canPetFly } from '@/types/pet';

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
  const [showMarketplace, setShowMarketplace] = useState(false);

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
    
    // Add user's pet if they have one (draggable version) - OUTSIDE ONLY
    if (userPetData?.starterPet) {
      items.push({
        id: 'user-pet',
        type: 'pet',
        x: 2,
        y: canPetFly(userPetData.starterPet.type) ? 2 : 4, // Flying pets can be above ground, non-flying at ground level (y=4)
        scene: 'outside', // Pet can only be outside
        category: 'decoration', // Pets are decorations
        component: (
          <Pet
            name={userPetData.starterPet.name}
            type={userPetData.starterPet.type}
            rarity={userPetData.starterPet.rarity}
            stats={petState}
            onPet={handlePet}
            onFeed={handleFeed}
            onPlay={handlePlay}
            draggable={true}
          />
        ),
      });
    }
    
    // Inside furniture - restricted above y=4
    items.push(
      {
        id: 'deco-chair',
        type: 'decoration',
        x: 4,
        y: 2,
        scene: 'inside',
        category: 'furniture',
        component: <Decoration type="chair" rarity="rare" category="furniture" />,
      },
      {
        id: 'deco-plant',
        type: 'decoration',
        x: 3,
        y: 4,
        scene: 'inside',
        category: 'decoration',
        component: <Decoration type="plant" rarity="epic" category="decoration" />,
      },
      {
        id: 'deco-table',
        type: 'decoration',
        x: 5,
        y: 5,
        scene: 'inside',
        category: 'furniture',
        component: <Decoration type="table" rarity="common" category="furniture" />,
      },
      {
        id: 'deco-sofa',
        type: 'decoration',
        x: 2,
        y: 3,
        scene: 'inside',
        category: 'furniture',
        component: <Decoration type="sofa" rarity="rare" category="furniture" />,
      },
      {
        id: 'deco-bookshelf',
        type: 'decoration',
        x: 6,
        y: 2,
        scene: 'inside',
        category: 'furniture',
        component: <Decoration type="bookshelf" rarity="epic" category="furniture" />,
      }
    );
    
    // Outside items - furniture restricted above y=4, decorations can go anywhere
    items.push(
      {
        id: 'deco-tree',
        type: 'decoration',
        x: 1,
        y: 4, // Ground level (y=4)
        scene: 'outside',
        category: 'decoration',
        component: <Decoration type="tree" rarity="common" category="decoration" />,
      },
      {
        id: 'deco-rock',
        type: 'decoration',
        x: 6,
        y: 4, // Ground level (y=4)
        scene: 'outside',
        category: 'decoration',
        component: <Decoration type="rock" rarity="common" category="decoration" />,
      },
      {
        id: 'deco-bush',
        type: 'decoration',
        x: 2,
        y: 5, // Slightly above ground
        scene: 'outside',
        category: 'decoration',
        component: <Decoration type="bush" rarity="rare" category="decoration" />,
      },
      {
        id: 'deco-bench',
        type: 'decoration',
        x: 3,
        y: 4, // Ground level (y=4)
        scene: 'outside',
        category: 'furniture',
        component: <Decoration type="bench" rarity="common" category="furniture" />,
      },
      {
        id: 'deco-fountain',
        type: 'decoration',
        x: 4,
        y: 4, // Ground level (y=4)
        scene: 'outside',
        category: 'furniture',
        component: <Decoration type="fountain" rarity="epic" category="furniture" />,
      },
      {
        id: 'deco-flower',
        type: 'decoration',
        x: 5,
        y: 3, // Can be above ground
        scene: 'outside',
        category: 'decoration',
        component: <Decoration type="flower" rarity="common" category="decoration" />,
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
    <View style={styles.container}>
      {/* Marketplace Icon - Top Right */}
      <Pressable 
        style={styles.marketplaceIcon} 
        onPress={() => setShowMarketplace(true)}
      >
        <ThemedText style={styles.marketplaceIconText}>🛒</ThemedText>
      </Pressable>

      <ScrollView style={styles.scrollContainer}>
        {/* Pet House with draggable pet */}
        <PetHouse items={getHouseItems()} onItemMove={handleItemMove} scene="inside" />
        
        {/* Pet UI Section - separate from house */}
        <View style={styles.petUISection}>
          <ThemedText style={styles.sectionTitle}>Pet Care</ThemedText>
          <Pet
            name={userPetData.starterPet.name}
            type={userPetData.starterPet.type}
            rarity={userPetData.starterPet.rarity}
            stats={petState}
            onPet={handlePet}
            onFeed={handleFeed}
            onPlay={handlePlay}
            draggable={false}
          />
        </View>
      </ScrollView>

      {/* Marketplace Modal */}
      <Modal
        visible={showMarketplace}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMarketplace(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Pressable 
              style={styles.closeButton}
              onPress={() => setShowMarketplace(false)}
            >
              <ThemedText style={styles.closeButtonText}>✕</ThemedText>
            </Pressable>
                         <Image 
               source={require('./browser.png')}
               style={styles.browserImage}
               resizeMode="contain"
             />
            <ThemedText style={styles.modalTitle}>Marketplace</ThemedText>
            <ThemedText style={styles.modalSubtitle}>
              Trade pets and decorations with other players
            </ThemedText>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollContainer: {
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
  petUISection: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  // Marketplace Icon
  marketplaceIcon: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 165, 0, 0.9)',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  marketplaceIconText: {
    fontSize: 24,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: '#FDD3E1',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#FDD3E1',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  browserImage: {
    width: '100%',
    height: '30%',
    marginTop: 0,
    marginLeft: 0,
    marginRight: 0,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});
