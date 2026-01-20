import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';
import type { WidgetSnapshot } from './widgetSnapshot';
import type { Goal, StreakGoal, FocusGoal, CounterGoal } from '../models/types';
import { calculateStreakDuration, formatStreakDuration } from '../utils/streakUtils';
import { getStageProgress } from '../utils/growthUtils';

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
    const duration = calculateStreakDuration(streakGoal.streakState.startedAt);
    primaryText = formatStreakDuration(duration);
    goalType = 'streak';
  } else if (featuredGoal.type === 'focus') {
    const focusGoal = featuredGoal as FocusGoal;
    primaryText = `${focusGoal.focusState.totalCompletedSessions} sessions`;
    goalType = 'focus';
  } else if (featuredGoal.type === 'counter') {
    const counterGoal = featuredGoal as CounterGoal;
    primaryText = `${counterGoal.counterState.currentCount} / ${counterGoal.counterState.targetCount}`;
    goalType = 'counter';
  }

  // Calculate progress (0 to 1) based on growth state
  const progressInfo = getStageProgress(featuredGoal.growth);
  const progress = progressInfo.progressPercentage / 100;

  // Top goals for garden widget
  const topGoals = goals.slice(0, 8).map((goal) => {
    const goalProgress = getStageProgress(goal.growth);
    return {
      id: goal.id,
      title: goal.name,
      stage: goal.growth.stage,
      progress: goalProgress.progressPercentage / 100,
    };
  });

  const snapshot: WidgetSnapshot = {
    updatedAt: Date.now(),
    featuredGoalId: featuredGoal.id,
    title: featuredGoal.name,
    primaryText,
    stage: featuredGoal.growth.stage,
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
    // Update the 3 primary widgets
    await requestWidgetUpdate({
      widgetName: 'FeaturedGoal',
      renderWidget: () => null as any, // Handler will render
      widgetNotFound: () => {
        // Widget not added to home screen - ignore
      },
    });
    await requestWidgetUpdate({
      widgetName: 'FocusLauncher',
      renderWidget: () => null as any,
      widgetNotFound: () => {},
    });
    await requestWidgetUpdate({
      widgetName: 'GardenOverview',
      renderWidget: () => null as any,
      widgetNotFound: () => {},
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
