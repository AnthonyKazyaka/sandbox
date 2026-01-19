import type { ConfigContext, ExpoConfig } from 'expo/config';
import type { WithAndroidWidgetsParams } from 'react-native-android-widget';

const widgetConfig: WithAndroidWidgetsParams = {
  widgets: [
    {
      name: 'FeaturedGoal2x1',
      label: 'Featured Goal (Small)',
      minWidth: '180dp',
      minHeight: '80dp',
      targetCellWidth: 2,
      targetCellHeight: 1,
      description: 'Quick view of your featured growth goal',
      updatePeriodMillis: 1800000, // 30 minutes
    },
    {
      name: 'FeaturedGoal2x2',
      label: 'Featured Goal',
      minWidth: '180dp',
      minHeight: '180dp',
      targetCellWidth: 2,
      targetCellHeight: 2,
      description: 'Detailed view of your featured growth goal',
      updatePeriodMillis: 1800000,
    },
    {
      name: 'FocusLauncher2x2',
      label: 'Focus Launcher',
      minWidth: '180dp',
      minHeight: '180dp',
      targetCellWidth: 2,
      targetCellHeight: 2,
      description: 'Start a focus session quickly',
      updatePeriodMillis: 1800000,
    },
    {
      name: 'FocusLauncher4x2',
      label: 'Focus Launcher (Wide)',
      minWidth: '320dp',
      minHeight: '180dp',
      targetCellWidth: 4,
      targetCellHeight: 2,
      description: 'Focus launcher with preset durations',
      updatePeriodMillis: 1800000,
    },
    {
      name: 'Garden4x2',
      label: 'Garden Overview',
      minWidth: '320dp',
      minHeight: '180dp',
      targetCellWidth: 4,
      targetCellHeight: 2,
      description: 'Overview of all your growth goals',
      updatePeriodMillis: 1800000,
    },
    {
      name: 'Garden4x4',
      label: 'Garden (Large)',
      minWidth: '320dp',
      minHeight: '320dp',
      targetCellWidth: 4,
      targetCellHeight: 4,
      description: 'Detailed view of all your goals',
      updatePeriodMillis: 1800000,
    },
  ],
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Growth Tracker',
  slug: 'growth-tracker',
  version: '1.0.0',
  scheme: 'growthtracker', // CRITICAL for deep linking
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.growthtracker.app',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: 'com.growthtracker.app',
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'growthtracker',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-dev-client', // Required for development builds
    ['react-native-android-widget', widgetConfig],
  ],
});
