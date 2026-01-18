// Theme configuration for the app
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

const customColors = {
  primary: '#4CAF50', // Green for growth
  secondary: '#81C784',
  tertiary: '#A5D6A7',
  accent: '#FFC107', // Yellow for achievements
  background: '#F5F5F5',
  surface: '#FFFFFF',
  error: '#F44336',
  success: '#4CAF50',
  warning: '#FF9800',
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...customColors,
    onPrimary: '#FFFFFF',
    onSecondary: '#000000',
    onBackground: '#1A1A1A',
    onSurface: '#1A1A1A',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#81C784',
    secondary: '#A5D6A7',
    tertiary: '#C8E6C9',
    accent: '#FFD54F',
    background: '#121212',
    surface: '#1E1E1E',
    onPrimary: '#000000',
    onSecondary: '#000000',
    onBackground: '#FFFFFF',
    onSurface: '#FFFFFF',
    error: '#EF5350',
    success: '#66BB6A',
    warning: '#FFA726',
  },
};

export type AppTheme = typeof lightTheme;
