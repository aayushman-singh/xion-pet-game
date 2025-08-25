import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 * Force light mode only for now
 */
export function useColorScheme() {
  // Force light mode only
  return 'light' as const;
}
