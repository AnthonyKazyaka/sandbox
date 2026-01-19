// Widget Update Service - Utility to update widgets when app data changes
import { requestWidgetUpdate } from 'react-native-android-widget';
import { Goal, StreakGoal, FocusGoal, CounterGoal, PlantStage } from '../models/types';
import { GoalOverviewWidget } from '../widgets/GoalOverviewWidget';
import { StreakWidget } from '../widgets/StreakWidget';
import { QuickStatsWidget } from '../widgets/QuickStatsWidget';
import { WidgetGoalData } from '../widgets/types';
import { calculateStreakDuration } from '../utils/streakUtils';
import React from 'react';

/**
 * Convert Goal to WidgetGoalData
 */
function goalToWidgetData(goal: Goal): WidgetGoalData {
  const baseData: WidgetGoalData = {
    id: goal.id,
    name: goal.name,
    type: goal.type,
    plantStage: goal.growth.stage,
    totalPoints: goal.growth.totalPointsEarned,
  };

  if (goal.type === 'streak') {
    const streakGoal = goal as StreakGoal;
    const duration = calculateStreakDuration(streakGoal.streakState.startedAt);
    return {
      ...baseData,
      streakDays: duration.days,
      streakHours: duration.hours,
      streakMinutes: duration.minutes,
    };
  } else if (goal.type === 'focus') {
    const focusGoal = goal as FocusGoal;
    return {
      ...baseData,
      totalFocusMinutes: Math.floor(focusGoal.focusState.totalFocusTimeMs / (1000 * 60)),
      sessionsCompleted: focusGoal.focusState.totalCompletedSessions,
    };
  } else if (goal.type === 'counter') {
    const counterGoal = goal as CounterGoal;
    return {
      ...baseData,
      currentCount: counterGoal.counterState.currentCount,
      targetCount: counterGoal.counterState.targetCount,
      period: counterGoal.counterState.period,
    };
  }

  return baseData;
}

/**
 * Get widget data for quick stats
 */
function getQuickStats(goals: Goal[]): {
  totalGoals: number;
  activeStreaks: number;
  totalPoints: number;
  bestPlantStage: PlantStage;
} {
  const streakGoals = goals.filter((g) => g.type === 'streak');
  const totalPoints = goals.reduce((sum, g) => sum + g.growth.totalPointsEarned, 0);
  
  const stageOrder: PlantStage[] = ['seed', 'sprout', 'plant', 'bush', 'tree'];
  let bestStageIndex = 0;
  goals.forEach((g) => {
    const idx = stageOrder.indexOf(g.growth.stage);
    if (idx > bestStageIndex) bestStageIndex = idx;
  });

  return {
    totalGoals: goals.length,
    activeStreaks: streakGoals.length,
    totalPoints,
    bestPlantStage: stageOrder[bestStageIndex],
  };
}

/**
 * Update all widgets with the latest goal data
 * Call this whenever goals are updated in the app
 */
export async function updateAllWidgets(goals: Goal[]): Promise<void> {
  const activeGoals = goals.filter((g) => !g.isArchived);
  const widgetGoals = activeGoals.map(goalToWidgetData);
  const quickStats = getQuickStats(activeGoals);

  try {
    // Update Goal Overview Widget
    await requestWidgetUpdate({
      widgetName: 'GoalOverview',
      renderWidget: () => ({
        light: <GoalOverviewWidget goals={widgetGoals} theme="light" />,
        dark: <GoalOverviewWidget goals={widgetGoals} theme="dark" />,
      }),
      widgetNotFound: () => {
        // Widget not added to home screen, ignore
      },
    });

    // Update Streak Widget
    const firstStreakGoal = widgetGoals.find((g) => g.type === 'streak');
    await requestWidgetUpdate({
      widgetName: 'StreakWidget',
      renderWidget: () => ({
        light: <StreakWidget goal={firstStreakGoal} theme="light" />,
        dark: <StreakWidget goal={firstStreakGoal} theme="dark" />,
      }),
      widgetNotFound: () => {
        // Widget not added to home screen, ignore
      },
    });

    // Update Quick Stats Widget
    await requestWidgetUpdate({
      widgetName: 'QuickStats',
      renderWidget: () => ({
        light: (
          <QuickStatsWidget
            totalGoals={quickStats.totalGoals}
            activeStreaks={quickStats.activeStreaks}
            totalPoints={quickStats.totalPoints}
            bestPlantStage={quickStats.bestPlantStage}
            theme="light"
          />
        ),
        dark: (
          <QuickStatsWidget
            totalGoals={quickStats.totalGoals}
            activeStreaks={quickStats.activeStreaks}
            totalPoints={quickStats.totalPoints}
            bestPlantStage={quickStats.bestPlantStage}
            theme="dark"
          />
        ),
      }),
      widgetNotFound: () => {
        // Widget not added to home screen, ignore
      },
    });
  } catch (error) {
    console.error('Error updating widgets:', error);
  }
}

/**
 * Update a specific streak widget with goal data
 */
export async function updateStreakWidget(goal?: Goal): Promise<void> {
  const widgetGoal = goal ? goalToWidgetData(goal) : undefined;

  try {
    await requestWidgetUpdate({
      widgetName: 'StreakWidget',
      renderWidget: () => ({
        light: <StreakWidget goal={widgetGoal} theme="light" />,
        dark: <StreakWidget goal={widgetGoal} theme="dark" />,
      }),
      widgetNotFound: () => {
        // Widget not added to home screen, ignore
      },
    });
  } catch (error) {
    console.error('Error updating streak widget:', error);
  }
}
