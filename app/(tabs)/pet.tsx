import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Alert, View, Pressable, Modal, Image, Platform } from 'react-native';
import { Pet } from '@/components/Pet';
import { PetHouse } from '@/components/PetHouse';
import { Decoration } from '@/components/Decoration';
import { ThemedText } from '@/components/ThemedText';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAbstraxionAccount, useAbstraxionClient, useAbstraxionSigningClient } from "@burnt-labs/abstraxion-react-native";
import { canPetFly } from '@/types/pet';

export default function PetScreen() {
  const { data: account, isConnected } = useAbstraxionAccount();
  const { client: queryClient } = useAbstraxionClient();
  const { client: signingClient } = useAbstraxionSigningClient();
  
  // Web mock: Pretend user is connected and has a pet
  const isWebMock = Platform.OS === 'web';
  
  const [petState, setPetState] = useState({
    happiness: 100,
    energy: 100,
    lastFed: Date.now(),
    lastPlayed: Date.now(),
    lastUpdated: Date.now(),
    timestamp: Date.now(),
    signature: '',
    proof: null,
  });

  const [userPetData, setUserPetData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [activeTab, setActiveTab] = useState<'mint' | 'trade'>('mint');
  const [isMinting, setIsMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState<string>('');
  const [availableNFTs, setAvailableNFTs] = useState<any[]>([]);
  const [userBalance, setUserBalance] = useState<string>('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Load user pet data from on-chain storage
  useEffect(() => {
    const loadUserPetData = async () => {
      console.log('🐾 [PET TAB] Starting to load user pet data...');
      console.log('🐾 [PET TAB] isWebMock:', isWebMock);
      console.log('🐾 [PET TAB] isConnected:', isConnected);
      console.log('🐾 [PET TAB] account:', account);
      console.log('🐾 [PET TAB] queryClient:', queryClient);
      
      // Web mock: Set mock pet data
      if (isWebMock) {
        console.log('🐾 [PET TAB] Using web mock data');
        const mockPetData = {
          hasStarterPet: true,
          starterPet: {
            id: 'starter-cat',
            name: 'Starter Cat',
            type: 'cat',
            rarity: 'common',
            stats: {
              happiness: 85,
              energy: 90,
              hunger: 75,
              strength: 5,
              agility: 6,
              intelligence: 6,
              lastFed: Date.now() - 3600000, // 1 hour ago
              lastPlayed: Date.now() - 7200000, // 2 hours ago
              lastUpdated: Date.now(),
            },
            claimedAt: new Date().toISOString(),
          },
          pets: ['starter-cat'],
          houseData: null,
          lastUpdated: new Date().toISOString(),
        };
        console.log('🐾 [PET TAB] Mock pet data set:', mockPetData);
        setUserPetData(mockPetData);
        setPetState({
          happiness: mockPetData.starterPet.stats.happiness,
          energy: mockPetData.starterPet.stats.energy,
          lastFed: mockPetData.starterPet.stats.lastFed,
          lastPlayed: mockPetData.starterPet.stats.lastPlayed,
          lastUpdated: mockPetData.starterPet.stats.lastUpdated,
          timestamp: Date.now(),
          signature: '',
          proof: null,
        });
        setIsLoading(false);
        return;
      }

      if ((Platform.OS === 'web' ? { bech32Address: 'web-demo-address' } : account)?.bech32Address && queryClient) {
        try {
          const contractAddress = process.env.EXPO_PUBLIC_USER_MAP_CONTRACT_ADDRESS;
          console.log('🐾 [PET TAB] Contract address from env:', contractAddress);
          if (!contractAddress) {
            console.error('🐾 [PET TAB] ❌ EXPO_PUBLIC_USER_MAP_CONTRACT_ADDRESS not configured');
            return;
          }
          
          const userAddress = (Platform.OS === 'web' ? { bech32Address: 'web-demo-address' } : account).bech32Address;
          console.log('🐾 [PET TAB] Querying contract for user:', userAddress);
          console.log('🐾 [PET TAB] Query message:', { get_value_by_user: { address: userAddress } });
          
          const response = await queryClient.queryContractSmart(
            contractAddress,
            { get_value_by_user: { address: userAddress } }
          );
          
          console.log('🐾 [PET TAB] Contract response:', response);
          
          if (response && typeof response === 'string') {
            try {
              const userData = JSON.parse(response);
              console.log('🐾 [PET TAB] ✅ Parsed user data:', userData);
              setUserPetData(userData);
              
              // Update pet state with stored data
              if (userData.starterPet?.stats) {
                setPetState({
                  happiness: userData.starterPet.stats.happiness || 100,
                  energy: userData.starterPet.stats.energy || 100,
                  lastFed: userData.starterPet.stats.lastFed || Date.now(),
                  lastPlayed: userData.starterPet.stats.lastPlayed || Date.now(),
                  lastUpdated: userData.starterPet.stats.lastUpdated || Date.now(),
                  timestamp: Date.now(),
                  signature: '',
                  proof: null,
                });
              }
            } catch (parseError) {
              console.error('Error parsing user data:', parseError);
            }
          }
        } catch (error: any) {
          console.log('🐾 [PET TAB] ⚠️ Contract query error:', error);
          if (error?.message && error.message.includes("No value found")) {
            console.log('🐾 [PET TAB] No pet data found for user');
            Alert.alert(
              'No Pet Found', 
              'You need to claim a starter pet first. Go to the Home tab to get started!'
            );
          } else {
            console.error('🐾 [PET TAB] ❌ Error loading user pet data:', error);
          }
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadUserPetData();
  }, [account, queryClient]);

  // Load user balance
  useEffect(() => {
    const loadBalance = async () => {
      // Web mock: Set mock balance
      if (isWebMock) {
        setUserBalance('1000');
        setIsLoadingBalance(false);
        return;
      }

      if (!(Platform.OS === 'web' ? { bech32Address: 'web-demo-address' } : account)?.bech32Address || !queryClient) {
        setUserBalance('0');
        setIsLoadingBalance(false);
        return;
      }
      
      setIsLoadingBalance(true);
      try {
        // Query user's XION balance
        const balance = await queryClient.getBalance((Platform.OS === 'web' ? { bech32Address: 'web-demo-address' } : account).bech32Address, 'uxion');
        if (balance && balance.amount) {
          setUserBalance(balance.amount);
        } else {
          setUserBalance('0');
        }
      } catch (error) {
        console.error('Error loading balance:', error);
        setUserBalance('0');
      } finally {
        setIsLoadingBalance(false);
      }
    };

    loadBalance();
  }, [account?.bech32Address, queryClient]);

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
        type: 'pet' as const,
        x: 2,
        y: canPetFly(userPetData.starterPet.type) ? 2 : 6, // Flying pets can be above ground, non-flying at ground level (y=6)
        scene: 'outside' as const, // Pet can only be outside
        category: 'decoration' as const, // Pets are decorations
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
        type: 'decoration' as const,
        x: 4,
        y: 2,
        scene: 'inside' as const,
        category: 'furniture' as const,
        component: <Decoration type="chair" rarity="rare" category="furniture" />,
      },
      {
        id: 'deco-plant',
        type: 'decoration' as const,
        x: 3,
        y: 4,
        scene: 'inside' as const,
        category: 'decoration' as const,
        component: <Decoration type="plant" rarity="epic" category="decoration" />,
      },
      {
        id: 'deco-table',
        type: 'decoration' as const,
        x: 5,
        y: 5,
        scene: 'inside' as const,
        category: 'furniture' as const,
        component: <Decoration type="table" rarity="common" category="furniture" />,
      },
      {
        id: 'deco-sofa',
        type: 'decoration' as const,
        x: 2,
        y: 3,
        scene: 'inside' as const,
        category: 'furniture' as const,
        component: <Decoration type="sofa" rarity="rare" category="furniture" />,
      },
      {
        id: 'deco-bookshelf',
        type: 'decoration' as const,
        x: 6,
        y: 2,
        scene: 'inside' as const,
        category: 'furniture' as const,
        component: <Decoration type="bookshelf" rarity="epic" category="furniture" />,
      }
    );
    
    // Outside items - furniture restricted above y=4, decorations can go anywhere
    items.push(
      {
        id: 'deco-tree',
        type: 'decoration' as const,
                 x: 1,
         y: 6, // Ground level (y=6)
         scene: 'outside' as const,
        category: 'decoration' as const,
        component: <Decoration type="tree" rarity="common" category="decoration" />,
      },
      {
        id: 'deco-rock',
        type: 'decoration' as const,
                 x: 6,
         y: 6, // Ground level (y=6)
         scene: 'outside' as const,
        category: 'decoration' as const,
        component: <Decoration type="rock" rarity="common" category="decoration" />,
      },
      {
        id: 'deco-bush',
        type: 'decoration' as const,
                 x: 2,
         y: 7, // Slightly above ground (y=7)
         scene: 'outside' as const,
        category: 'decoration' as const,
        component: <Decoration type="bush" rarity="rare" category="decoration" />,
      },
      {
        id: 'deco-bench',
        type: 'decoration' as const,
                 x: 3,
         y: 6, // Ground level (y=6)
         scene: 'outside' as const,
        category: 'furniture' as const,
        component: <Decoration type="bench" rarity="common" category="furniture" />,
      },
      {
        id: 'deco-fountain',
        type: 'decoration' as const,
                 x: 4,
         y: 6, // Ground level (y=6)
         scene: 'outside' as const,
        category: 'furniture' as const,
        component: <Decoration type="fountain" rarity="epic" category="furniture" />,
      },
      {
        id: 'deco-flower',
        type: 'decoration' as const,
                 x: 5,
         y: 5, // Can be above ground (y=5)
         scene: 'outside' as const,
        category: 'decoration' as const,
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
      energy: Math.min(100, prev.energy + 20),
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

    // Check if user has enough balance
    const requiredAmount = getMintPrice(type);
    const currentBalance = parseInt(userBalance) / 1000000; // Convert uxion to XION
    
    if (currentBalance < requiredAmount) {
      Alert.alert('Insufficient Balance', `You need ${requiredAmount} XION to mint this NFT. Current balance: ${currentBalance.toFixed(2)} XION`);
      return;
    }

    setIsMinting(true);
    setMintStatus('Minting NFT...');

    try {
      const contractAddress = process.env.EXPO_PUBLIC_PET_NFT_CONTRACT_ADDRESS;
      if (!contractAddress) {
        // For hackathon demo - simulate successful minting
        setMintStatus('Demo: NFT would be minted! 🎉');
        setTimeout(() => {
          Alert.alert(
            'Demo Mode', 
            'This is a demo! In production, you would need to deploy an NFT contract and add EXPO_PUBLIC_PET_NFT_CONTRACT_ADDRESS to your .env.local file.',
            [{ text: 'OK' }]
          );
        }, 1000);
        return;
      }

      const nftData = generateNFTData(type);
      
      // Mint NFT with payment
      const msg = {
        mint: {
          token_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          owner: (Platform.OS === 'web' ? { bech32Address: 'web-demo-address' } : account).bech32Address,
          token_uri: JSON.stringify(nftData),
          extension: {
            name: nftData.name,
            description: nftData.description,
            image: nftData.image,
            attributes: nftData.attributes
          }
        }
      };

      // Convert XION to uxion (1 XION = 1,000,000 uxion)
      const uxionAmount = Math.floor(requiredAmount * 1000000);
      
      const result = await signingClient.execute(
        (Platform.OS === 'web' ? { bech32Address: 'web-demo-address' } : account).bech32Address,
        contractAddress,
        msg,
        'auto',
        undefined,
        [{ amount: uxionAmount.toString(), denom: 'uxion' }] // Payment
      );

      setMintStatus('NFT minted successfully! 🎉');
      loadAvailableNFTs();
      
             // Refresh balance
       if (queryClient) {
         const newBalance = await queryClient.getBalance(account.bech32Address, 'uxion');
         setUserBalance(newBalance.amount || '0');
       }
      
    } catch (error) {
      console.error('Mint error:', error);
      setMintStatus('Failed to mint NFT. Please try again.');
    } finally {
      setIsMinting(false);
      setTimeout(() => setMintStatus(''), 3000);
    }
  };

  const getMintPrice = (type: 'pet' | 'furniture' | 'decoration'): number => {
    switch (type) {
      case 'pet': return 0.5; // 0.5 XION - affordable for hackathon
      case 'furniture': return 0.3; // 0.3 XION - cheap furniture
      case 'decoration': return 0.2; // 0.2 XION - very cheap decorations
      default: return 0.3;
    }
  };

  const generateNFTData = (type: 'pet' | 'furniture' | 'decoration') => {
    const petTypes = [
      'cat', 'dog', 'bird', 'dragon', 'unicorn', 'phoenix', 'pegasus', 
      'eagle', 'owl', 'bat', 'butterfly', 'bee', 'rabbit', 'fox', 'wolf'
    ];
    const furnitureTypes = [
      'chair', 'table', 'sofa', 'bookshelf', 'lamp', 'bed', 'desk', 
      'cabinet', 'mirror', 'rug', 'curtain', 'vase', 'clock', 'painting'
    ];
    const decorationTypes = [
      'plant', 'flower', 'tree', 'rock', 'fountain', 'statue', 'bush',
      'crystal', 'gem', 'orb', 'candle', 'book', 'scroll', 'trophy'
    ];
    
    const rarities = ['common', 'rare', 'epic', 'legendary', 'mythical'];
    const rarity = rarities[Math.floor(Math.random() * rarities.length)];
    
    let name, description, image, typeValue;
    
    switch (type) {
      case 'pet':
        typeValue = petTypes[Math.floor(Math.random() * petTypes.length)];
        name = `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} ${typeValue.charAt(0).toUpperCase() + typeValue.slice(1)}`;
        description = `A ${rarity} ${typeValue} pet with unique abilities and personality`;
        image = `https://api.example.com/pets/${typeValue}.png`;
        break;
      case 'furniture':
        typeValue = furnitureTypes[Math.floor(Math.random() * furnitureTypes.length)];
        name = `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} ${typeValue.charAt(0).toUpperCase() + typeValue.slice(1)}`;
        description = `A ${rarity} piece of furniture that adds comfort and style to your house`;
        image = `https://api.example.com/furniture/${typeValue}.png`;
        break;
      case 'decoration':
        typeValue = decorationTypes[Math.floor(Math.random() * decorationTypes.length)];
        name = `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} ${typeValue.charAt(0).toUpperCase() + typeValue.slice(1)}`;
        description = `A ${rarity} decoration that beautifies your space with magical properties`;
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
        { trait_type: 'Created', value: new Date().toISOString() },
        { trait_type: 'Category', value: type }
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
        // For hackathon demo - simulate successful purchase
        Alert.alert(
          'Demo Mode', 
          'This is a demo! In production, you would need to deploy an NFT contract and add EXPO_PUBLIC_PET_NFT_CONTRACT_ADDRESS to your .env.local file.',
          [{ text: 'OK' }]
        );
        return;
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

  if (!(Platform.OS === 'web' ? true : isConnected)) {
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
      <View style={styles.container}>
        <LoadingSpinner />
      </View>
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
        onPress={() => {
          console.log('Marketplace button pressed, current state:', showMarketplace);
          setShowMarketplace(true);
          console.log('Marketplace state set to true');
        }}
      >
        <ThemedText style={styles.marketplaceIconText}>🛒</ThemedText>
      </Pressable>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
      >
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
         onShow={() => console.log('Modal shown, showMarketplace:', showMarketplace)}
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
                       <ThemedText style={styles.mintPrice}>0.5 XION</ThemedText>
                       {isMinting && <LoadingSpinner inline />}
                     </Pressable>
                     <Pressable 
                       style={[styles.mintCard, isMinting && styles.disabledCard]}
                       onPress={() => !isMinting && mintNFT('furniture')}
                       disabled={isMinting}
                     >
                       <ThemedText style={styles.mintEmoji}>🪑</ThemedText>
                       <ThemedText style={styles.mintTitle}>Furniture NFT</ThemedText>
                       <ThemedText style={styles.mintPrice}>0.3 XION</ThemedText>
                       {isMinting && <LoadingSpinner inline />}
                     </Pressable>
                     <Pressable 
                       style={[styles.mintCard, isMinting && styles.disabledCard]}
                       onPress={() => !isMinting && mintNFT('decoration')}
                       disabled={isMinting}
                     >
                       <ThemedText style={styles.mintEmoji}>🌿</ThemedText>
                       <ThemedText style={styles.mintTitle}>Decoration NFT</ThemedText>
                       <ThemedText style={styles.mintPrice}>0.2 XION</ThemedText>
                       {isMinting && <LoadingSpinner inline />}
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
               
               {/* User Balance Display - Bottom Right */}
               <View style={styles.balanceContainerBottom}>
                 <ThemedText style={styles.balanceLabelBottom}>Balance:</ThemedText>
                 <View style={styles.balanceAmountContainer}>
                   {isLoadingBalance ? (
                     <LoadingSpinner inline />
                   ) : (
                     <ThemedText style={styles.balanceAmountBottom}>{`${parseInt(userBalance) / 1000000} XION`}</ThemedText>
                   )}
                 </View>
               </View>
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
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContentContainer: {
    alignItems: 'center',
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
    color: '#333333',
    paddingHorizontal: 20,
  },
  petUISection: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333333',
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
  mintLoadingText: {
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
  // Balance Display Styles
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E8F0',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#4A5568',
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 16,
    color: '#2D3748',
    fontWeight: 'bold',
  },
  // Bottom Right Balance Display Styles
  balanceContainerBottom: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceLabelBottom: {
    fontSize: 12,
    color: '#4A5568',
    fontWeight: '500',
    textAlign: 'center',
  },
  balanceAmountBottom: {
    fontSize: 14,
    color: '#2D3748',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  balanceAmountContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
