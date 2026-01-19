// Widget Task Handler - Handles all widget events
import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { FeaturedGoalWidget } from './widgets/FeaturedGoalWidget';
import { FocusLauncherWidget } from './widgets/FocusLauncherWidget';
import { GardenWidget } from './widgets/GardenWidget';
import { loadWidgetSnapshot } from './services/widgetSnapshotService';
import { getLightTheme, getDarkTheme } from './widgets/types';

/**
 * Get theme configuration
 */
function getLightTheme() {
  return {
    background: '#FFFFFF',
    text: '#1C1B1F',
    textSecondary: '#49454F',
    accent: '#65A30D',
    surfaceVariant: '#E7E0EC',
  };
}

function getDarkTheme() {
  return {
    background: '#1C1B1F',
    text: '#E6E1E5',
    textSecondary: '#CAC4D0',
    accent: '#84CC16',
    surfaceVariant: '#49454F',
  };
}

/**
 * Main widget task handler
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, widgetAction } = props;
  console.log('Widget Task Handler:', { 
    widgetName: widgetInfo.widgetName, 
    action: widgetAction,
    size: `${widgetInfo.width}x${widgetInfo.height}`
  });

  // Load widget snapshot data
  const snapshot = await loadWidgetSnapshot();
  
  if (!snapshot) {
    // No data yet - render empty state
    renderEmptyWidget(props);
    return;
  }

  // Route to appropriate widget handler
  switch (widgetInfo.widgetName) {
    case 'FeaturedGoal2x1':
      renderFeaturedGoalWidget(props, snapshot, '2x1');
      break;

    case 'FeaturedGoal2x2':
      renderFeaturedGoalWidget(props, snapshot, '2x2');
      break;

    case 'FocusLauncher2x2':
      renderFocusLauncherWidget(props, snapshot, '2x2');
   Render Featured Goal Widget
 */
function renderFeaturedGoalWidget(
  props: WidgetTaskHandlerProps,
  snapshot: Awaited<ReturnType<typeof loadWidgetSnapshot>>,
  size: '2x1' | '2x2'
) {
  if (!snapshot) return;

  const lightTheme = getLightTheme();
  const darkTheme = getDarkTheme();

  props.renderWidget({
    light: (
      <FeaturedGoalWidget
        goalName={snapshot.title}
        primaryStat={snapshot.primaryText}
        stage={snapshot.stage}
        progress={snapshot.progress0to1}
        theme={lightTheme}
        size={size}
        goalId={snapshot.featuredGoalId}
      />
    ),
    dark: (
      <FeaturedGoalWidget
        goalName={snapshot.title}
        primaryStat={snapshot.primaryText}
        stage={snapshot.stage}
        progress={snapshot.progress0to1}
        theme={darkTheme}
        size={size}
        goalId={snapshot.featuredGoalId}
      />
    ),
  });
}

/**
 * Render Focus Launcher Widget
 */
function renderFocusLauncherWidget(
  props: WidgetTaskHandlerProps,
  snapshot: Awaited<ReturnType<typeof loadWidgetSnapshot>>,
  size: '2x2' | '4x2'
) {
  if (!snapshot) return;

  const lightTheme = getLightTheme();
  const darkTheme = getDarkTheme();

  const lastResult = snapshot.lastSessionResult || null;
  const todayMinutes = snapshot.todayFocusMinutes || 0;
  const progress = snapshot.progress0to1;

  props.renderWidget({
    light: (
      <FocusLauncherWidget
        lastSessionResult={lastResult}
        todayFocusMinutes={todayMinutes}
        plantProgress={progress}
        theme={lightTheme}
        size={size}
      />
    ),
    dark: (
      <FocusLauncherWidget
        lastSessionResult={lastResult}
        todayFocusMinutes={todayMinutes}
        plantProgress={progress}
        theme={darkTheme}
        size={size}
      />
    ),
  });
}

/**
 * Render Garden Widget
 */
function renderGardenWidget(
  props: WidgetTaskHandlerProps,
  snapshot: Awaited<ReturnType<typeof loadWidgetSnapshot>>,
  size: '4x2' | '4x4'
) {
  if (!snapshot || !snapshot.topGoals) return;

  const lightTheme = getLightTheme();
  const darkTheme = getDarkTheme();

  props.renderWidget({
    light: (
      <GardenWidget
        goals={snapshot.topGoals}
        theme={lightTheme}
        size={size}
      />
    ),
    dark: (
      <GardenWidget
        goals={snapshot.topGoals}
        theme={darkTheme}
        size={size}
      />
    ),
  });
}

/**
 * Render empty widget when no data available
 */
function renderEmptyWidget(props: WidgetTaskHandlerProps) {
  const lightTheme = getLightTheme();
  const darkTheme = getDarkTheme();

  // Render a simple "No goals yet" message using FeaturedGoalWidget
  props.renderWidget({
    light: (
      <FeaturedGoalWidget
        goalName="No goals yet"
        primaryStat="Create a goal"
        stage="seed"
        progress={0}
        theme={lightTheme}
        size="2x2"
        goalId=""
      />
    ),
    dark: (
      <FeaturedGoalWidget
        goalName="No goals yet"
        primaryStat="Create a goal"
        stage="seed"
        progress={0}
        theme={darkTheme}
        size="2x2"
        goalId=""
      />
    ),
  });       activeStreaks={quickStats.activeStreaks}
          totalPoints={quickStats.totalPoints}
          bestPlantStage={quickStats.bestPlantStage}
          theme="dark"
        />
      ),
    });
  };

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
    case 'WIDGET_CLICK':
      renderWidget();
      break;

    case 'WIDGET_DELETED':
      // Nothing to clean up
      break;
  }
}
