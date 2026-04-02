module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|@react-navigation|react-native-screens|react-native-gesture-handler|react-native-safe-area-context)/)',
  ],
};
