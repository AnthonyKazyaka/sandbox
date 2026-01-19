// Widget Preview Screen - For development/testing of widgets
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { WidgetPreview } from 'react-native-android-widget';
import { GoalOverviewWidget } from '../widgets/GoalOverviewWidget';
import { StreakWidget } from '../widgets/StreakWidget';
import { QuickStatsWidget } from '../widgets/QuickStatsWidget';
import { WidgetGoalData } from '../widgets/types';
import { useApp } from '../context/AppContext';
import { Goal, StreakGoal, FocusGoal, CounterGoal } from '../models/types';
import { calculateStreakDuration } from '../utils/streakUtils';

// Convert Goal to WidgetGoalData
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

type WidgetType = 'overview' | 'streak' | 'stats';
type ThemeType = 'light' | 'dark';

export function WidgetPreviewScreen() {
  const { state } = useApp();
  const [selectedWidget, setSelectedWidget] = useState<WidgetType>('overview');
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>('light');

  const activeGoals = state.goals.filter((g) => !g.isArchived);
  const widgetGoals = activeGoals.map(goalToWidgetData);
  const firstStreakGoal = widgetGoals.find((g) => g.type === 'streak');

  const quickStats = {
    totalGoals: activeGoals.length,
    activeStreaks: activeGoals.filter((g) => g.type === 'streak').length,
    totalPoints: activeGoals.reduce((sum, g) => sum + g.growth.totalPointsEarned, 0),
    bestPlantStage: activeGoals.reduce((best, g) => {
      const stages = ['seed', 'sprout', 'plant', 'bush', 'tree'];
      return stages.indexOf(g.growth.stage) > stages.indexOf(best) ? g.growth.stage : best;
    }, 'seed' as string),
  };

  const renderWidget = () => {
    switch (selectedWidget) {
      case 'overview':
        return <GoalOverviewWidget goals={widgetGoals} theme={selectedTheme} />;
      case 'streak':
        return <StreakWidget goal={firstStreakGoal} theme={selectedTheme} />;
      case 'stats':
        return (
          <QuickStatsWidget
            totalGoals={quickStats.totalGoals}
            activeStreaks={quickStats.activeStreaks}
            totalPoints={quickStats.totalPoints}
            bestPlantStage={quickStats.bestPlantStage}
            theme={selectedTheme}
          />
        );
    }
  };

  const getWidgetDimensions = () => {
    switch (selectedWidget) {
      case 'overview':
        return { width: 320, height: 120 };
      case 'streak':
        return { width: 180, height: 180 };
      case 'stats':
        return { width: 320, height: 80 };
    }
  };

  const dimensions = getWidgetDimensions();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Widget Preview</Text>
      <Text style={styles.subtitle}>Preview how your widgets will look on the home screen</Text>

      {/* Widget Type Selector */}
      <View style={styles.selectorContainer}>
        <Text style={styles.selectorLabel}>Widget Type:</Text>
        <View style={styles.buttonGroup}>
          {(['overview', 'streak', 'stats'] as WidgetType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.selectorButton,
                selectedWidget === type && styles.selectorButtonActive,
              ]}
              onPress={() => setSelectedWidget(type)}
            >
              <Text
                style={[
                  styles.selectorButtonText,
                  selectedWidget === type && styles.selectorButtonTextActive,
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Theme Selector */}
      <View style={styles.selectorContainer}>
        <Text style={styles.selectorLabel}>Theme:</Text>
        <View style={styles.buttonGroup}>
          {(['light', 'dark'] as ThemeType[]).map((theme) => (
            <TouchableOpacity
              key={theme}
              style={[
                styles.selectorButton,
                selectedTheme === theme && styles.selectorButtonActive,
              ]}
              onPress={() => setSelectedTheme(theme)}
            >
              <Text
                style={[
                  styles.selectorButtonText,
                  selectedTheme === theme && styles.selectorButtonTextActive,
                ]}
              >
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Widget Preview */}
      <View style={[styles.previewContainer, selectedTheme === 'dark' && styles.previewContainerDark]}>
        <WidgetPreview
          renderWidget={renderWidget}
          width={dimensions.width}
          height={dimensions.height}
          onClick={({ clickAction, clickActionData }) => {
            console.log('Widget clicked:', clickAction, clickActionData);
          }}
        />
      </View>

      {/* Widget Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Widget Info</Text>
        <Text style={styles.infoText}>Size: {dimensions.width}x{dimensions.height}dp</Text>
        <Text style={styles.infoText}>Goals shown: {widgetGoals.length}</Text>
        {selectedWidget === 'streak' && (
          <Text style={styles.infoText}>
            Streak goal: {firstStreakGoal?.name || 'None'}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 24,
  },
  selectorContainer: {
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  selectorButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectorButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  selectorButtonText: {
    fontSize: 14,
    color: '#666666',
  },
  selectorButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#E8E8E8',
    borderRadius: 16,
    marginBottom: 16,
  },
  previewContainerDark: {
    backgroundColor: '#333333',
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
});
