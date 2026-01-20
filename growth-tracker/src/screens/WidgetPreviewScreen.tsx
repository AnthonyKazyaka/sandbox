// Widget Preview Screen - For development/testing of widgets
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { WidgetPreview } from 'react-native-android-widget';
import { FeaturedGoalWidget } from '../widgets/FeaturedGoalWidget';
import { FocusLauncherWidget } from '../widgets/FocusLauncherWidget';
import { GardenWidget } from '../widgets/GardenWidget';
import { getLightTheme, getDarkTheme, WidgetTheme } from '../widgets/types';
import { useApp } from '../context/AppContext';
import { Goal, StreakGoal, FocusGoal, CounterGoal } from '../models/types';
import { calculateStreakDuration, formatStreakDuration } from '../utils/streakUtils';
import { getStageProgress } from '../utils/growthUtils';

// Generate widget snapshot data from goals (matches widgetTaskHandler logic)
function generatePreviewData(goals: Goal[]) {
  if (goals.length === 0) {
    return {
      title: 'No Goals',
      primaryText: 'Create a goal',
      stage: 'seed',
      progress: 0,
      goalId: '',
      topGoals: [],
      todayFocusMinutes: 0,
      lastSessionResult: null as 'success' | 'cancelled' | null,
    };
  }

  const featuredGoal = goals[0];
  let primaryText = '';

  if (featuredGoal.type === 'streak') {
    const streakGoal = featuredGoal as StreakGoal;
    const duration = calculateStreakDuration(streakGoal.streakState.startedAt);
    primaryText = formatStreakDuration(duration);
  } else if (featuredGoal.type === 'focus') {
    const focusGoal = featuredGoal as FocusGoal;
    primaryText = `${focusGoal.focusState.totalCompletedSessions} sessions`;
  } else if (featuredGoal.type === 'counter') {
    const counterGoal = featuredGoal as CounterGoal;
    primaryText = `${counterGoal.counterState.currentCount} / ${counterGoal.counterState.targetCount}`;
  }

  const progressInfo = getStageProgress(featuredGoal.growth);
  const progress = progressInfo.progressPercentage / 100;

  const topGoals = goals.slice(0, 8).map((goal) => {
    const goalProgress = getStageProgress(goal.growth);
    return {
      id: goal.id,
      title: goal.name,
      stage: goal.growth.stage,
      progress: goalProgress.progressPercentage / 100,
    };
  });

  // Get focus stats
  const focusGoals = goals.filter((g) => g.type === 'focus') as FocusGoal[];
  const todayFocusMinutes = focusGoals.reduce((sum, g) => {
    return sum + Math.floor(g.focusState.totalFocusTimeMs / (1000 * 60));
  }, 0);

  return {
    title: featuredGoal.name,
    primaryText,
    stage: featuredGoal.growth.stage,
    progress,
    goalId: featuredGoal.id,
    topGoals,
    todayFocusMinutes,
    lastSessionResult: null as 'success' | 'cancelled' | null,
  };
}

// Widget types that match app.config.ts
type WidgetType = 'featured' | 'focus' | 'garden';
type ThemeType = 'light' | 'dark';

export function WidgetPreviewScreen() {
  const { state } = useApp();
  const [selectedWidget, setSelectedWidget] = useState<WidgetType>('featured');
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>('light');

  const activeGoals = state.goals.filter((g) => !g.isArchived);
  const previewData = generatePreviewData(activeGoals);
  
  const theme: WidgetTheme = selectedTheme === 'light' ? getLightTheme() : getDarkTheme();

  const renderWidget = () => {
    switch (selectedWidget) {
      case 'featured':
        return (
          <FeaturedGoalWidget
            goalName={previewData.title}
            primaryStat={previewData.primaryText}
            stage={previewData.stage}
            progress={previewData.progress}
            theme={theme}
            size="2x2"
            goalId={previewData.goalId}
          />
        );
      case 'focus':
        return (
          <FocusLauncherWidget
            lastSessionResult={previewData.lastSessionResult}
            todayFocusMinutes={previewData.todayFocusMinutes}
            plantProgress={previewData.progress}
            theme={theme}
            size="2x2"
          />
        );
      case 'garden':
        return (
          <GardenWidget
            goals={previewData.topGoals}
            theme={theme}
            size="4x2"
          />
        );
    }
  };

  const getWidgetDimensions = () => {
    switch (selectedWidget) {
      case 'featured':
        return { width: 180, height: 180 };
      case 'focus':
        return { width: 180, height: 180 };
      case 'garden':
        return { width: 320, height: 180 };
    }
  };

  const getWidgetDescription = () => {
    switch (selectedWidget) {
      case 'featured':
        return 'FeaturedGoal (2x2) - Shows your primary goal';
      case 'focus':
        return 'FocusLauncher (2x2) - Quick start focus sessions';
      case 'garden':
        return 'GardenOverview (4x2) - See all your goals';
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
          {(['featured', 'focus', 'garden'] as WidgetType[]).map((type) => (
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
          {(['light', 'dark'] as ThemeType[]).map((themeOption) => (
            <TouchableOpacity
              key={themeOption}
              style={[
                styles.selectorButton,
                selectedTheme === themeOption && styles.selectorButtonActive,
              ]}
              onPress={() => setSelectedTheme(themeOption)}
            >
              <Text
                style={[
                  styles.selectorButtonText,
                  selectedTheme === themeOption && styles.selectorButtonTextActive,
                ]}
              >
                {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
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
        <Text style={styles.infoText}>{getWidgetDescription()}</Text>
        <Text style={styles.infoText}>Size: {dimensions.width}x{dimensions.height}dp</Text>
        <Text style={styles.infoText}>Goals available: {activeGoals.length}</Text>
        {selectedWidget === 'featured' && (
          <Text style={styles.infoText}>
            Featured goal: {previewData.title}
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
