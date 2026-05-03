const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// Firebase JS SDK v10 compatibility:
// - Add 'cjs' so Metro can bundle Firebase's CommonJS files
// - Disable package exports resolution which conflicts with Firebase's dual CJS/ESM structure
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
