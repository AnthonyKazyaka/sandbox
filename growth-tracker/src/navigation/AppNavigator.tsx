// App Navigator - Main navigation setup
import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import {
  DashboardScreen,
  GoalDetailScreen,
  CreateGoalScreen,
  EditGoalScreen,
  SettingsScreen,
  WidgetPreviewScreen,
} from '../screens';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Deep linking configuration for widget click actions
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    'growthtracker://',
    Linking.createURL('/'),
  ],
  config: {
    screens: {
      Main: '',
      GoalDetail: {
        path: 'goal/:goalId',
        parse: {
          goalId: (goalId: string) => goalId,
        },
      },
      // Handle focus/start by navigating to Main (dashboard) which shows focus goals
      // The FocusLauncherWidget will link here, and users can tap on focus goals
      CreateGoal: 'create',
      EditGoal: {
        path: 'edit/:goalId',
        parse: {
          goalId: (goalId: string) => goalId,
        },
      },
      Settings: 'settings',
      WidgetPreview: 'widget-preview',
    },
  },
  // Handle unmatched deep links gracefully
  getStateFromPath: (path, options) => {
    // Handle focus/start deep link by redirecting to dashboard
    if (path.startsWith('focus/start') || path.startsWith('/focus/start')) {
      return {
        routes: [{ name: 'Main' }],
      };
    }
    // Use default handling for other paths
    return undefined;
  },
};

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        initialRouteName="Main"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Main" component={DashboardScreen} />
        <Stack.Screen name="GoalDetail" component={GoalDetailScreen} />
        <Stack.Screen
          name="CreateGoal"
          component={CreateGoalScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="EditGoal" component={EditGoalScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        {Platform.OS === 'android' && (
          <Stack.Screen 
            name="WidgetPreview" 
            component={WidgetPreviewScreen}
            options={{
              headerShown: true,
              headerTitle: 'Widget Preview',
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
