// App Navigator - Main navigation setup
import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
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
