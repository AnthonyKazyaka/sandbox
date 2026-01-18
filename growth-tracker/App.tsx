// Growth Tracker - Main App Entry
import 'react-native-get-random-values'; // Must be first import for uuid to work
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
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

  return (
    <PaperProvider theme={effectiveTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </PaperProvider>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </SafeAreaProvider>
  );
}
