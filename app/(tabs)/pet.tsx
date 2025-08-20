import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Alert, View, Pressable, Modal, Image } from 'react-native';
import { Pet } from '@/components/Pet';
import { PetHouse } from '@/components/PetHouse';
import { Decoration } from '@/components/Decoration';
import { ThemedText } from '@/components/ThemedText';
import { useAbstraxionAccount, useAbstraxionClient, useAbstraxionSigningClient } from "@burnt-labs/abstraxion-react-native";
import { canPetFly } from '@/types/pet';

export default function PetScreen() {
  const { data: account, isConnected } = useAbstraxionAccount();
  const { client: queryClient } = useAbstraxionClient();
  const { client: signingClient } = useAbstraxionSigningClient();
  
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
  const [activeTab, setActiveTab] = useState<'mint' | 'trade'>('mint');
  const [isMinting, setIsMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState<string>('');
  const [availableNFTs, setAvailableNFTs] = useState<any[]>([]);

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

  // Load available NFTs when marketplace opens
  useEffect(() => {
    if (showMarketplace && activeTab === 'trade') {
      loadAvailableNFTs();
    }
  }, [showMarketplace, activeTab]);

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
        component: <Decoration type="tree" rarity="common" category="furniture" />,
      },
      {
        id: 'deco-rock',
        type: 'decoration',
        x: 6,
        y: 4, // Ground level (y=4)
        scene: 'outside',
        category: 'decoration',
        component: <Decoration type="rock" rarity="common" category="furniture" />,
      },
      {
        id: 'deco-bush',
        type: 'decoration',
        x: 2,
        y: 5, // Slightly above ground
        scene: 'outside',
        category: 'decoration',
        component: <Decoration type="bush" rarity="rare" category="furniture" />,
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

  // NFT Minting Functions
  const mintNFT = async (type: 'pet' | 'furniture' | 'decoration') => {
    if (!signingClient || !account?.bech32Address) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    setIsMinting(true);
    setMintStatus('Preparing transaction...');

    try {
      const contractAddress = process.env.EXPO_PUBLIC_PET_NFT_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error('NFT contract address not configured');
      }

      // Generate random NFT data based on type
      const nftData = generateNFTData(type);
      
      const msg = {
        mint_nft: {
          owner: account.bech32Address,
          token_id: `${type}_${Date.now()}`,
          token_uri: JSON.stringify(nftData),
          extension: {
            name: nftData.name,
            description: nftData.description,
            image: nftData.image,
            attributes: nftData.attributes
          }
        }
      };

      setMintStatus('Signing transaction...');
      
      const result = await signingClient.execute(
        account.bech32Address,
        contractAddress,
        msg,
        'auto'
      );

      setMintStatus('Transaction successful! 🎉');
      Alert.alert('Success', `NFT ${nftData.name} minted successfully!`);
      
      // Refresh available NFTs
      loadAvailableNFTs();
      
    } catch (error) {
      console.error('Minting error:', error);
      setMintStatus('Transaction failed');
      Alert.alert('Error', 'Failed to mint NFT. Please try again.');
    } finally {
      setIsMinting(false);
      setTimeout(() => setMintStatus(''), 3000);
    }
  };

  const generateNFTData = (type: 'pet' | 'furniture' | 'decoration') => {
    const petTypes = ['cat', 'dog', 'bird', 'dragon', 'unicorn'];
    const furnitureTypes = ['chair', 'table', 'sofa', 'bookshelf', 'lamp'];
    const decorationTypes = ['plant', 'flower', 'tree', 'rock', 'fountain'];
    
    const rarities = ['common', 'rare', 'epic', 'legendary'];
    const rarity = rarities[Math.floor(Math.random() * rarities.length)];
    
    let name, description, image, typeValue;
    
    switch (type) {
      case 'pet':
        typeValue = petTypes[Math.floor(Math.random() * petTypes.length)];
        name = `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} ${typeValue.charAt(0).toUpperCase() + typeValue.slice(1)}`;
        description = `A ${rarity} ${typeValue} pet with unique abilities`;
        image = `https://api.example.com/pets/${typeValue}.png`;
        break;
      case 'furniture':
        typeValue = furnitureTypes[Math.floor(Math.random() * furnitureTypes.length)];
        name = `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} ${typeValue.charAt(0).toUpperCase() + typeValue.slice(1)}`;
        description = `A ${rarity} piece of furniture for your house`;
        image = `https://api.example.com/furniture/${typeValue}.png`;
        break;
      case 'decoration':
        typeValue = decorationTypes[Math.floor(Math.random() * decorationTypes.length)];
        name = `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} ${typeValue.charAt(0).toUpperCase() + typeValue.slice(1)}`;
        description = `A ${rarity} decoration to beautify your space`;
        image = `https://api.example.com/decorations/${typeValue}.png`;
        break;
    }

    return {
      name,
      description,
      image,
      type,
      rarity,
      attributes: [
        { trait_type: 'Type', value: typeValue },
        { trait_type: 'Rarity', value: rarity },
        { trait_type: 'Created', value: new Date().toISOString() }
      ]
    };
  };

  const loadAvailableNFTs = async () => {
    if (!queryClient) return;
    
    try {
      const contractAddress = process.env.EXPO_PUBLIC_PET_NFT_CONTRACT_ADDRESS;
      if (!contractAddress) return;

      // Query all NFTs (this would need to be implemented in your contract)
      const response = await queryClient.queryContractSmart(contractAddress, {
        all_tokens: {}
      });

      setAvailableNFTs(response.tokens || []);
    } catch (error) {
      console.error('Error loading NFTs:', error);
      // For demo purposes, show some mock NFTs
      setAvailableNFTs([
        {
          id: '1',
          name: 'Rare Cat',
          owner: 'Player123',
          price: '200',
          type: 'pet',
          rarity: 'rare'
        },
        {
          id: '2', 
          name: 'Epic Chair',
          owner: 'Player456',
          price: '150',
          type: 'furniture',
          rarity: 'epic'
        }
      ]);
    }
  };

  const buyNFT = async (nftId: string, price: string) => {
    if (!signingClient || !account?.bech32Address) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    try {
      const contractAddress = process.env.EXPO_PUBLIC_PET_NFT_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error('NFT contract address not configured');
      }

      const msg = {
        transfer_nft: {
          recipient: account.bech32Address,
          token_id: nftId
        }
      };

      const result = await signingClient.execute(
        account.bech32Address,
        contractAddress,
        msg,
        'auto'
      );

      Alert.alert('Success', 'NFT purchased successfully! 🎉');
      loadAvailableNFTs();
      
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'Failed to purchase NFT. Please try again.');
    }
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
             {/* Background Image */}
             <Image 
               source={require('./browser.png')}
               style={styles.browserImage}
               resizeMode="contain"
             />
             
             <Pressable 
               style={styles.closeButton}
               onPress={() => setShowMarketplace(false)}
             >
               <ThemedText style={styles.closeButtonText}>✕</ThemedText>
             </Pressable>
             
             {/* Tab Navigation */}
             <View style={styles.tabContainer}>
               <Pressable 
                 style={[styles.tab, activeTab === 'mint' && styles.activeTab]}
                 onPress={() => setActiveTab('mint')}
               >
                 <ThemedText style={[styles.tabText, activeTab === 'mint' && styles.activeTabText]}>
                   🎨 Mint NFT
                 </ThemedText>
               </Pressable>
               <Pressable 
                 style={[styles.tab, activeTab === 'trade' && styles.activeTab]}
                 onPress={() => setActiveTab('trade')}
               >
                 <ThemedText style={[styles.tabText, activeTab === 'trade' && styles.activeTabText]}>
                   💰 Trade
                 </ThemedText>
               </Pressable>
             </View>

             {/* Tab Content */}
             {activeTab === 'mint' ? (
                 <View style={styles.tabContent}>
                   <ThemedText style={styles.sectionTitle}>Mint New NFTs</ThemedText>
                   
                   {mintStatus && (
                     <View style={styles.statusContainer}>
                       <ThemedText style={styles.statusText}>{mintStatus}</ThemedText>
                     </View>
                   )}
                   
                   <View style={styles.mintGrid}>
                     <Pressable 
                       style={[styles.mintCard, isMinting && styles.disabledCard]}
                       onPress={() => !isMinting && mintNFT('pet')}
                       disabled={isMinting}
                     >
                       <ThemedText style={styles.mintEmoji}>🐱</ThemedText>
                       <ThemedText style={styles.mintTitle}>Pet NFT</ThemedText>
                       <ThemedText style={styles.mintPrice}>100 XION</ThemedText>
                       {isMinting && <ThemedText style={styles.loadingText}>⏳</ThemedText>}
                     </Pressable>
                     <Pressable 
                       style={[styles.mintCard, isMinting && styles.disabledCard]}
                       onPress={() => !isMinting && mintNFT('furniture')}
                       disabled={isMinting}
                     >
                       <ThemedText style={styles.mintEmoji}>🪑</ThemedText>
                       <ThemedText style={styles.mintTitle}>Furniture NFT</ThemedText>
                       <ThemedText style={styles.mintPrice}>50 XION</ThemedText>
                       {isMinting && <ThemedText style={styles.loadingText}>⏳</ThemedText>}
                     </Pressable>
                     <Pressable 
                       style={[styles.mintCard, isMinting && styles.disabledCard]}
                       onPress={() => !isMinting && mintNFT('decoration')}
                       disabled={isMinting}
                     >
                       <ThemedText style={styles.mintEmoji}>🌿</ThemedText>
                       <ThemedText style={styles.mintTitle}>Decoration NFT</ThemedText>
                       <ThemedText style={styles.mintPrice}>30 XION</ThemedText>
                       {isMinting && <ThemedText style={styles.loadingText}>⏳</ThemedText>}
                     </Pressable>
                   </View>
                 </View>
                            ) : (
                 <View style={styles.tabContent}>
                   <ThemedText style={styles.sectionTitle}>Trade NFTs</ThemedText>
                   <View style={styles.tradeList}>
                     {availableNFTs.length > 0 ? (
                       availableNFTs.map((nft, index) => (
                         <Pressable 
                           key={nft.id || index}
                           style={styles.tradeItem}
                           onPress={() => buyNFT(nft.id, nft.price)}
                         >
                           <ThemedText style={styles.tradeEmoji}>
                             {nft.type === 'pet' ? '🐱' : nft.type === 'furniture' ? '🪑' : '🌿'}
                           </ThemedText>
                           <View style={styles.tradeInfo}>
                             <ThemedText style={styles.tradeName}>{nft.name}</ThemedText>
                             <ThemedText style={styles.tradeOwner}>by {nft.owner}</ThemedText>
                             <ThemedText style={styles.tradeRarity}>{nft.rarity}</ThemedText>
                           </View>
                           <View style={styles.priceContainer}>
                             <ThemedText style={styles.tradePrice}>{nft.price} XION</ThemedText>
                             <ThemedText style={styles.buyButton}>Buy</ThemedText>
                           </View>
                         </Pressable>
                       ))
                     ) : (
                       <View style={styles.emptyState}>
                         <ThemedText style={styles.emptyEmoji}>🛍️</ThemedText>
                         <ThemedText style={styles.emptyText}>No NFTs available for trade</ThemedText>
                         <ThemedText style={styles.emptySubtext}>Check back later!</ThemedText>
                       </View>
                     )}
                   </View>
                 </View>
               )}
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
    top: 10,
    right: 20,
    width: 40,
    height: 20,
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
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8E8F0',
    borderRadius: 25,
    padding: 4,
    marginHorizontal: 20,
    marginTop: -200,
    marginBottom: 20,
    zIndex: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 21,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#E8B4CB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9B6B8A',
  },
  activeTabText: {
    color: '#6B4E5A',
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#6B4E5A',
  },
  // Mint Tab Styles
  mintGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  mintCard: {
    width: '30%',
    backgroundColor: '#F0F8FF',
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#E6F3FF',
  },
  mintEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  mintTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#4A6FA5',
    marginBottom: 4,
  },
  mintPrice: {
    fontSize: 12,
    color: '#7B9BC2',
    fontWeight: '500',
  },
  // Trade Tab Styles
  tradeList: {
    gap: 12,
  },
  tradeItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FFE6E6',
  },
  tradeEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  tradeInfo: {
    flex: 1,
  },
  tradeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5A5A',
    marginBottom: 2,
  },
  tradeOwner: {
    fontSize: 12,
    color: '#B8A9A9',
  },
  tradePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D4A574',
  },
  // Additional Styles
  statusContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  statusText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  disabledCard: {
    opacity: 0.6,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 4,
  },
  tradeRarity: {
    fontSize: 10,
    color: '#9B6B8A',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  buyButton: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B4E5A',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9B6B8A',
  },
});
