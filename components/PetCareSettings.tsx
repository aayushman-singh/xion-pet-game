import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Pressable } from 'react-native';
import { TIMER_CONFIGS, formatTimeRemaining, type PetCareTimerConfig } from '../types/petCareTimers';

interface PetCareSettingsProps {
  currentConfig: PetCareTimerConfig;
  onConfigChange: (config: PetCareTimerConfig) => void;
}

export function PetCareSettings({ currentConfig, onConfigChange }: PetCareSettingsProps) {
  const [selectedConfig, setSelectedConfig] = useState(currentConfig.name);

  const handleConfigSelect = (configName: keyof typeof TIMER_CONFIGS) => {
    const config = TIMER_CONFIGS[configName];
    setSelectedConfig(config.name);
    
    Alert.alert(
      'Change Timer Settings?',
      `Switch to ${config.name} mode?\n\n${config.description}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => onConfigChange(config)
        }
      ]
    );
  };

  const renderConfigOption = (configKey: keyof typeof TIMER_CONFIGS) => {
    const config = TIMER_CONFIGS[configKey];
    const isSelected = selectedConfig === config.name;
    
    return (
      <Pressable
        key={configKey}
        style={[styles.configOption, isSelected && styles.selectedOption]}
        onPress={() => handleConfigSelect(configKey)}
      >
        <View style={styles.configHeader}>
          <ThemedText style={[styles.configName, isSelected && styles.selectedText]}>
            {config.name}
          </ThemedText>
          {isSelected && <ThemedText style={styles.selectedIndicator}>✓</ThemedText>}
        </View>
        
        <ThemedText style={styles.configDescription}>
          {config.description}
        </ThemedText>
        
        <View style={styles.configDetails}>
          <ThemedText style={styles.detailText}>
            Feed cooldown: {formatTimeRemaining(config.feedCooldown)}
          </ThemedText>
          <ThemedText style={styles.detailText}>
            Play cooldown: {formatTimeRemaining(config.playCooldown)}
          </ThemedText>
          <ThemedText style={styles.detailText}>
            Happiness decay: {config.degradationRate}% every {formatTimeRemaining(config.degradationInterval)}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Pet Care Timer Settings</ThemedText>
      <ThemedText style={styles.subtitle}>
        Choose how often your pet needs care and how long cooldowns last
      </ThemedText>
      
      <View style={styles.configList}>
        {Object.keys(TIMER_CONFIGS).map((key) => 
          renderConfigOption(key as keyof typeof TIMER_CONFIGS)
        )}
      </View>
      
      <View style={styles.infoBox}>
        <ThemedText style={styles.infoTitle}>ℹ️ Timer Explanation</ThemedText>
        <ThemedText style={styles.infoText}>
          • <ThemedText style={styles.bold}>Feed/Play Cooldown:</ThemedText> How long you must wait between actions
        </ThemedText>
        <ThemedText style={styles.infoText}>
          • <ThemedText style={styles.bold}>Happiness Decay:</ThemedText> How much happiness decreases over time
        </ThemedText>
        <ThemedText style={styles.infoText}>
          • <ThemedText style={styles.bold}>Care Boost:</ThemedText> How much happiness increases when you feed/play
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  configList: {
    gap: 12,
    marginBottom: 24,
  },
  configOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e5e5',
    backgroundColor: '#f9f9f9',
  },
  selectedOption: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  configHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  configName: {
    fontSize: 18,
    fontWeight: '600',
  },
  selectedText: {
    color: '#007AFF',
  },
  selectedIndicator: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  configDescription: {
    fontSize: 14,
    marginBottom: 12,
    opacity: 0.8,
  },
  configDetails: {
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    opacity: 0.7,
  },
  infoBox: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.8,
  },
  bold: {
    fontWeight: '600',
  },
});
