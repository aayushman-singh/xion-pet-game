// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withLibsodiumResolver } = require("@burnt-labs/abstraxion-react-native/metro.libsodium");

const config = getDefaultConfig(__dirname);

// Ensure image file types are properly handled
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp'
];
config.resolver.unstable_enablePackageExports = false;

module.exports = withLibsodiumResolver(config);