// Ohne diese Datei loest Metro das "exports"-Feld von firebase/auth (>=10.1.0)
// falsch auf - getReactNativePersistence ist dann zur Laufzeit undefined und
// die App stuerzt ab, noch bevor irgendetwas gerendert wird (bekanntes
// Firebase-JS-SDK + Expo/Metro-Problem).
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
