import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';
import type { WidgetSnapshot } from './widgetSnapshot';
import type { Goal, StreakGoal, FocusGoal, CounterGoal } from '../models/types';
import { calculateStreakDuration } from '../utils/streakUtils';
import { calculateProgress } from '../utils/growthUtils';

export const WIDGET_SNAPSHOT_KEY = '@growth_tracker/widget_snapshot';

/**
 * Generate widget snapshot from goals
 */
export async function generateWidgetSnapshot(goals: Goal[]): Promise<WidgetSnapshot | null> {
  if (goals.length === 0) return null;

  // Pick the "best" goal for featured widget (most recent activity)
  const featuredGoal = goals[0]; // You can customize this logic

  let primaryText = '';
  let goalType: 'streak' | 'focus' | 'counter' = 'streak';

  if (featuredGoal.type === 'streak') {
    const streakGoal = featuredGoal as StreakGoal;
    const duration = calculateStreakDuration(streakGoal);
    primaryText = formatDuration(duration);
    goalType = 'streak';
  } else if (featuredGoal.type === 'focus') {
    const focusGoal = featuredGoal as FocusGoal;
    primaryText = `${focusGoal.sessionsCompleted} sessions`;
    goalType = 'focus';
  } else if (featuredGoal.type === 'counter') {
    const counterGoal = featuredGoal as CounterGoal;
    primaryText = `${counterGoal.currentCount} / ${counterGoal.targetCount}`;
    goalType = 'counter';
  }

  const progress = calculateProgress(featuredGoal);

  // Top goals for garden widget
  const topGoals = goals.slice(0, 8).map((goal) => ({
    id: goal.id,
    title: goal.title,
    stage: goal.plantStage,
    progress: calculateProgress(goal),
  }));

  const snapshot: WidgetSnapshot = {
    updatedAt: Date.now(),
    featuredGoalId: featuredGoal.id,
    title: featuredGoal.title,
    primaryText,
    stage: featuredGoal.plantStage,
    progress0to1: progress,
    goalType,
    topGoals,
  };

  return snapshot;
}

/**
 * Save widget snapshot to storage
 */
export async function saveWidgetSnapshot(snapshot: WidgetSnapshot): Promise<void> {
  try {
    await AsyncStorage.setItem(WIDGET_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.error('Failed to save widget snapshot:', error);
  }
}

/**
 * Load widget snapshot from storage
 */
export async function loadWidgetSnapshot(): Promise<WidgetSnapshot | null> {
  try {
    const json = await AsyncStorage.getItem(WIDGET_SNAPSHOT_KEY);
    if (!json) return null;
    return JSON.parse(json) as WidgetSnapshot;
  } catch (error) {
    console.error('Failed to load widget snapshot:', error);
    return null;
  }
}

/**
 * Update all widgets after snapshot changes
 */
export async function updateAllWidgets(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    await requestWidgetUpdate({
      widgetName: 'FeaturedGoal2x1',
      renderWidget: () => <></>, // Handler will render
      widgetNotFound: () => {
        // Widget not added to home screen
      },
    });
    await requestWidgetUpdate({
      widgetName: 'FeaturedGoal2x2',
      renderWidget: () => <></>,
    });
    await requestWidgetUpdate({
      widgetName: 'FocusLauncher2x2',
      renderWidget: () => <></>,
    });
    await requestWidgetUpdate({
      widgetName: 'FocusLauncher4x2',
      renderWidget: () => <></>,
    });
    await requestWidgetUpdate({
      widgetName: 'Garden4x2',
      renderWidget: () => <></>,
    });
    await requestWidgetUpdate({
      widgetName: 'Garden4x4',
      renderWidget: () => <></>,
    });
  } catch (error) {
    console.error('Failed to update widgets:', error);
  }
}

/**
 * Trigger widget update after app events
 */
export async function refreshWidgetsFromGoals(goals: Goal[]): Promise<void> {
  const snapshot = await generateWidgetSnapshot(goals);
  if (snapshot) {
    await saveWidgetSnapshot(snapshot);
    await updateAllWidgets();
  }
}

// Helper: Format duration for display
function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  } else if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
}
