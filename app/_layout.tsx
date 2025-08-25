import "react-native-reanimated";
import "react-native-get-random-values";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import {
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AbstraxionProvider } from "@burnt-labs/abstraxion-react-native";

import { useColorScheme } from "@/hooks/useColorScheme";

import { Buffer } from "buffer";
import { Platform } from "react-native";

// Platform-specific crypto setup
if (Platform.OS !== 'web') {
  const crypto = require("react-native-quick-crypto");
  global.crypto = crypto;
} else {
  global.crypto = (window as any).crypto;
  
  // Create a comprehensive libsodium emulation for web
  (global as any)._reactNativeLibsodium = {
    default: {
      // Password hashing functions
      crypto_pwhash: (outlen: number, passwd: Uint8Array, salt: Uint8Array, opslimit: number, memlimit: number, alg: number) => {
        // Simple emulation using Web Crypto API
        const encoder = new TextEncoder();
        const data = encoder.encode(passwd.toString() + salt.toString() + opslimit + memlimit);
        return crypto.subtle.digest('SHA-256', data).then((hash) => {
          const hashArray = new Uint8Array(hash);
          return hashArray.slice(0, outlen);
        });
      },
      
      crypto_pwhash_str: (passwd: Uint8Array, opslimit: number, memlimit: number) => {
        // Return a mock hash string that looks like a real libsodium hash
        const encoder = new TextEncoder();
        const data = encoder.encode(passwd.toString() + opslimit + memlimit);
        return crypto.subtle.digest('SHA-256', data).then((hash) => {
          const hashArray = new Uint8Array(hash);
          const base64 = btoa(String.fromCharCode(...Array.from(hashArray)));
          return `$argon2id$v=19$m=${memlimit},t=${opslimit},p=1$${base64.slice(0, 22)}$${base64.slice(22, 54)}`;
        });
      },
      
      crypto_pwhash_str_verify: (str: string, passwd: Uint8Array) => {
        // For web demo, always return true (accept any password)
        return Promise.resolve(0); // 0 means success in libsodium
      },
      
      // Generic hash function
      crypto_generichash: (outlen: number, in_: Uint8Array, key?: Uint8Array) => {
        const data = key ? new Uint8Array([...Array.from(in_), ...Array.from(key)]) : in_;
        return crypto.subtle.digest('SHA-256', data).then((hash) => {
          const hashArray = new Uint8Array(hash);
          return hashArray.slice(0, outlen);
        });
      },
      
      // Random bytes
      randombytes: (len: number) => {
        const array = new Uint8Array(len);
        crypto.getRandomValues(array);
        return array;
      },
      
      // Signing functions (mock implementations)
      crypto_sign: (m: Uint8Array, sk: Uint8Array) => {
        return Promise.resolve(new Uint8Array(64)); // Mock signature
      },
      
      crypto_sign_detached: (m: Uint8Array, sk: Uint8Array) => {
        return Promise.resolve(new Uint8Array(64)); // Mock signature
      },
      
      crypto_sign_verify_detached: (sig: Uint8Array, m: Uint8Array, pk: Uint8Array) => {
        return Promise.resolve(0); // Always verify successfully
      },
      
      // Box functions (mock implementations)
      crypto_box_keypair: () => {
        const pk = new Uint8Array(32);
        const sk = new Uint8Array(32);
        crypto.getRandomValues(pk);
        crypto.getRandomValues(sk);
        return Promise.resolve({ publicKey: pk, secretKey: sk });
      },
      
      crypto_box_easy: (m: Uint8Array, n: Uint8Array, pk: Uint8Array, sk: Uint8Array) => {
        return Promise.resolve(new Uint8Array(m.length + 16)); // Mock encrypted data
      },
      
      crypto_box_open_easy: (c: Uint8Array, n: Uint8Array, pk: Uint8Array, sk: Uint8Array) => {
        return Promise.resolve(new Uint8Array(c.length - 16)); // Mock decrypted data
      },
      
      // Secretbox functions (mock implementations)
      crypto_secretbox_easy: (m: Uint8Array, n: Uint8Array, k: Uint8Array) => {
        return Promise.resolve(new Uint8Array(m.length + 16)); // Mock encrypted data
      },
      
      crypto_secretbox_open_easy: (c: Uint8Array, n: Uint8Array, k: Uint8Array) => {
        return Promise.resolve(new Uint8Array(c.length - 16)); // Mock decrypted data
      }
    }
  };
}
global.Buffer = Buffer;

SplashScreen.preventAutoHideAsync();

const treasuryConfig = {
  treasury: process.env.EXPO_PUBLIC_TREASURY_CONTRACT_ADDRESS,
  gasPrice: "0.001uxion",
  rpcUrl: process.env.EXPO_PUBLIC_RPC_ENDPOINT,
  restUrl: process.env.EXPO_PUBLIC_REST_ENDPOINT,
  callbackUrl: "xion-pet-game://",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AbstraxionProvider config={treasuryConfig}>
        <ThemeProvider value={DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
      </AbstraxionProvider>
    </GestureHandlerRootView>
  );
}
