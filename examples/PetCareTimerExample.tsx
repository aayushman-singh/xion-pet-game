// Example of how to use the new pet care timer system
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Pet } from '../components/Pet';
import { PetCareSettings } from '../components/PetCareSettings';
import { TIMER_CONFIGS, type PetCareTimerConfig } from '../types/petCareTimers';
import { PetRarity } from '../types/pet';

export function PetCareTimerExample() {
  const [timerConfig, setTimerConfig] = useState<PetCareTimerConfig>(TIMER_CONFIGS.BALANCED);
  const [showSettings, setShowSettings] = useState(false);

  // Example pet status with current timestamp
  const examplePetStatus = {
    petId: 'example-pet-1',
    happiness: 75,
    energy: 80,
    hunger: 60,
    cleanliness: 90,
    careStreak: 3,
    owner: 'example-owner',
    lastFed: Date.now() - (5 * 60 * 1000), // Fed 5 minutes ago
    lastPlayed: Date.now() - (10 * 60 * 1000), // Played 10 minutes ago
    lastUpdated: Date.now() - (2 * 60 * 1000), // Updated 2 minutes ago
    timestamp: Date.now(),
    signature: 'example-signature',
    proof: null,
  };

  if (showSettings) {
    return (
      <PetCareSettings
        currentConfig={timerConfig}
        onConfigChange={(newConfig) => {
          setTimerConfig(newConfig);
          setShowSettings(false);
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* 
        Pet component now accepts the timer configuration through the usePetCare hook
        The timer config is passed through the Pet component's internal usePetCare usage
      */}
      <Pet
        name="Demo Pet"
        type="cat"
        rarity={PetRarity.RARE}
        status={examplePetStatus}
        onPet={() => console.log('Pet petted!')}
        onFeed={() => console.log('Pet fed!')}
        onPlay={() => console.log('Pet played with!')}
      />
      
      {/* You would add a settings button somewhere in your UI */}
      {/* 
      <Pressable 
        style={styles.settingsButton}
        onPress={() => setShowSettings(true)}
      >
        <ThemedText>⚙️ Timer Settings</ThemedText>
      </Pressable>
      */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
});

// Usage Notes:
/*

1. TIMER CONFIGURATIONS AVAILABLE:
   - DEVELOPMENT: 30s cooldowns, 5min degradation (for testing)
   - ACTIVE: 5min cooldowns, 30min degradation (active users)
   - BALANCED: 15min cooldowns, 2hr degradation (most users) 
   - CASUAL: 1hr cooldowns, 6hr degradation (casual users)
   - ORIGINAL: 1hr cooldowns, 1hr degradation (original system)

2. TO USE DIFFERENT TIMER CONFIG:
   - Pass the config to usePetCare hook: usePetCare(status, TIMER_CONFIGS.ACTIVE)
   - Or modify DEFAULT_TIMER_CONFIG in petCareTimers.ts

3. TIMER BENEFITS:
   - More engaging for active users (shorter cooldowns)
   - Better time formatting (shows hours, minutes, seconds)
   - Configurable update intervals (less battery usage for casual modes)
   - Separate feed/play cooldowns (more realistic)

4. INTEGRATING INTO YOUR APP:
   - Add PetCareSettings component to your settings screen
   - Store user's timer preference in AsyncStorage or user profile
   - Pass the selected config to Pet components

*/
