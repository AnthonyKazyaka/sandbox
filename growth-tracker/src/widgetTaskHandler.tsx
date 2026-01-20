// Widget Task Handler - Handles all widget events
import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { FeaturedGoalWidget } from './widgets/FeaturedGoalWidget';
import { FocusLauncherWidget } from './widgets/FocusLauncherWidget';
import { GardenWidget } from './widgets/GardenWidget';
import { loadWidgetSnapshot } from './services/widgetSnapshotService';
import { getLightTheme, getDarkTheme } from './widgets/types';

/**
 * Main widget task handler - routes to appropriate widget renderer
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

  // Route to appropriate widget handler based on widget name
  switch (widgetInfo.widgetName) {
    case 'FeaturedGoal':
      renderFeaturedGoalWidget(props, snapshot);
      break;

    case 'FocusLauncher':
      renderFocusLauncherWidget(props, snapshot);
      break;

    case 'GardenOverview':
      renderGardenWidget(props, snapshot);
      break;

    default:
      console.log('Unknown widget:', widgetInfo.widgetName);
      renderEmptyWidget(props);
      break;
  }
}

/**
 * Render Featured Goal Widget (2x2)
 * Shows the primary goal with stats and progress
 */
function renderFeaturedGoalWidget(
  props: WidgetTaskHandlerProps,
  snapshot: NonNullable<Awaited<ReturnType<typeof loadWidgetSnapshot>>>
) {
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
        size="2x2"
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
        size="2x2"
        goalId={snapshot.featuredGoalId}
      />
    ),
  });
}

/**
 * Render Focus Launcher Widget (2x2)
 * Quick start focus sessions with one tap
 */
function renderFocusLauncherWidget(
  props: WidgetTaskHandlerProps,
  snapshot: NonNullable<Awaited<ReturnType<typeof loadWidgetSnapshot>>>
) {
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
        size="2x2"
      />
    ),
    dark: (
      <FocusLauncherWidget
        lastSessionResult={lastResult}
        todayFocusMinutes={todayMinutes}
        plantProgress={progress}
        theme={darkTheme}
        size="2x2"
      />
    ),
  });
}

/**
 * Render Garden Overview Widget (4x2)
 * Shows all goals at a glance
 */
function renderGardenWidget(
  props: WidgetTaskHandlerProps,
  snapshot: NonNullable<Awaited<ReturnType<typeof loadWidgetSnapshot>>>
) {
  const lightTheme = getLightTheme();
  const darkTheme = getDarkTheme();

  const goals = snapshot.topGoals || [];

  props.renderWidget({
    light: (
      <GardenWidget
        goals={goals}
        theme={lightTheme}
        size="4x2"
      />
    ),
    dark: (
      <GardenWidget
        goals={goals}
        theme={darkTheme}
        size="4x2"
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

  props.renderWidget({
    light: (
      <FeaturedGoalWidget
        goalName="Growth Tracker"
        primaryStat="Open app"
        stage="seed"
        progress={0}
        theme={lightTheme}
        size="2x2"
        goalId=""
      />
    ),
    dark: (
      <FeaturedGoalWidget
        goalName="Growth Tracker"
        primaryStat="Open app"
        stage="seed"
        progress={0}
        theme={darkTheme}
        size="2x2"
        goalId=""
      />
    ),
  });
}
