// Widget Types for Growth Tracker
import { PlantStage, GoalType } from '../models/types';
import type { ColorProp } from 'react-native-android-widget';

export interface WidgetGoalData {
  id: string;
  name: string;
  type: GoalType;
  plantStage: PlantStage;
  totalPoints: number;
  // Streak-specific
  streakDays?: number;
  streakHours?: number;
  streakMinutes?: number;
  // Focus-specific
  totalFocusMinutes?: number;
  sessionsCompleted?: number;
  // Counter-specific
  currentCount?: number;
  targetCount?: number;
  period?: 'daily' | 'weekly';
}

export interface WidgetTheme {
  background: ColorProp;
  surface: ColorProp;
  surfaceVariant: ColorProp;
  text: ColorProp;
  textSecondary: ColorProp;
  accent: ColorProp;
  success: ColorProp;
  warning: ColorProp;
}

export const lightTheme: WidgetTheme = {
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceVariant: '#E8E8E8',
  text: '#1A1A1A',
  textSecondary: '#666666',
  accent: '#4CAF50',
  success: '#4CAF50',
  warning: '#FF9800',
};

export const darkTheme: WidgetTheme = {
  background: '#1A1A1A',
  surface: '#2D2D2D',
  surfaceVariant: '#3D3D3D',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  accent: '#81C784',
  success: '#81C784',
  warning: '#FFB74D',
};

// Plant emoji for each stage
export const PLANT_EMOJI: Record<PlantStage, string> = {
  seed: '🌱',
  sprout: '🌿',
  plant: '🪴',
  bush: '🌳',
  tree: '🌲',
};

// Goal type icons
export const GOAL_TYPE_ICON: Record<GoalType, string> = {
  streak: '⏱️',
  focus: '🎯',
  counter: '📊',
};

// Theme getter functions for widget task handler
export function getLightTheme(): WidgetTheme {
  return lightTheme;
}

export function getDarkTheme(): WidgetTheme {
  return darkTheme;
}
