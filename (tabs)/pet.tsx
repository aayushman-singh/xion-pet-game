import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Pet } from '../components/Pet';
import { PetHouse } from '../components/PetHouse';
import { Decoration } from '../components/Decoration';
import { useAbstraxionAccount } from "@burnt-labs/abstraxion-react-native";

export default function PetScreen() {
  const { data: account } = useAbstraxionAccount();
  
  // In the future, these will be fetched from the blockchain
  const [petState, setPetState] = useState({
    happiness: 100,
    energy: 100,
    hunger: 100,
  });

  // House items state (will be stored on chain later)
  const [houseItems, setHouseItems] = useState([
    {
      id: 'pet-1',
      type: 'pet',
      x: 2,
      y: 2,
      component: (
        <Pet
          name="XION Buddy"
          type="basic"
          {...petState}
          onPet={handlePet}
          onFeed={handleFeed}
          onPlay={handlePlay}
        />
      ),
    },
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
    },
  ]);

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
    setHouseItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, x, y } : item
      )
    );
  };

  return (
    <ScrollView style={styles.container}>
      <PetHouse items={houseItems} onItemMove={handleItemMove} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
