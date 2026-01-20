import type { ConfigContext, ExpoConfig } from 'expo/config';
import type { WithAndroidWidgetsParams } from 'react-native-android-widget';

const widgetConfig: WithAndroidWidgetsParams = {
  widgets: [
    {
      name: 'FeaturedGoal',
      label: 'Featured Goal',
      minWidth: '180dp',
      minHeight: '180dp',
      targetCellWidth: 2,
      targetCellHeight: 2,
      description: 'View your primary growth goal with stats and progress',
      updatePeriodMillis: 1800000, // 30 minutes
    },
    {
      name: 'FocusLauncher',
      label: 'Focus Timer',
      minWidth: '180dp',
      minHeight: '180dp',
      targetCellWidth: 2,
      targetCellHeight: 2,
      description: 'Start a focus session with one tap',
      updatePeriodMillis: 1800000,
    },
    {
      name: 'GardenOverview',
      label: 'Garden Overview',
      minWidth: '320dp',
      minHeight: '180dp',
      targetCellWidth: 4,
      targetCellHeight: 2,
      description: 'See all your growth goals at a glance',
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
