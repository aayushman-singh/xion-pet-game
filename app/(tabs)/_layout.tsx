import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { useAbstraxionAccount } from "@burnt-labs/abstraxion-react-native";

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { isConnected } = useAbstraxionAccount();

  // Redirect to home if not connected
  useEffect(() => {
    if (!isConnected) {
      router.replace('/');
    }
  }, [isConnected, router]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="pet"
        options={{
          title: 'My Pet',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="heart.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="play"
        options={{
          title: 'Play',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gamecontroller.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="nft"
        options={{
          title: 'Mint',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.circle.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
