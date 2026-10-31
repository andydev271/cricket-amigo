const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// expo-sqlite's web build imports its wa-sqlite wasm — register it as an
// asset so Metro can resolve and copy it in web bundles.
config.resolver.assetExts.push("wasm");

module.exports = withNativeWind(config, { input: "./global.css" });
