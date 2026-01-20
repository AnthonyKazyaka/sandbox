// Growth Tracker - Main App Entry
import 'react-native-get-random-values'; // Must be first import for uuid to work
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View, ActivityIndicator, StyleSheet } from 'react-native';
import { PaperProvider, Text } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import { AppNavigator } from './src/navigation';
import { lightTheme, darkTheme } from './src/theme';

const AppContent: React.FC = () => {
  const { state } = useApp();
  const systemColorScheme = useColorScheme();
  
  const effectiveTheme = (() => {
    if (state.settings.theme === 'system') {
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return state.settings.theme === 'dark' ? darkTheme : lightTheme;
  })();

  const isDark = effectiveTheme === darkTheme;

  // Show loading screen while data is being fetched
  if (state.isLoading) {
    return (
      <PaperProvider theme={effectiveTheme}>
        <View style={[styles.loadingContainer, { backgroundColor: effectiveTheme.colors.background }]}>
          <Text style={[styles.loadingEmoji]}>🌱</Text>
          <ActivityIndicator size="large" color={effectiveTheme.colors.primary} />
          <Text style={[styles.loadingText, { color: effectiveTheme.colors.onBackground }]}>
            Loading your garden...
          </Text>
        </View>
      </PaperProvider>
    );
  }

  // Show error screen if there was a problem
  if (state.error) {
    return (
      <PaperProvider theme={effectiveTheme}>
        <View style={[styles.loadingContainer, { backgroundColor: effectiveTheme.colors.background }]}>
          <Text style={styles.loadingEmoji}>😢</Text>
          <Text style={[styles.errorText, { color: effectiveTheme.colors.error }]}>
            {state.error}
          </Text>
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={effectiveTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingEmoji: {
    fontSize: 64,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </SafeAreaProvider>
  );
}
