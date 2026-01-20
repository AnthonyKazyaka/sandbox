// Widget Update Service - Utility to update widgets when app data changes
// Widget names MUST match those declared in app.config.ts: FeaturedGoal, FocusLauncher, GardenOverview
import { requestWidgetUpdate } from 'react-native-android-widget';
import { Goal, StreakGoal, FocusGoal, CounterGoal } from '../models/types';
import { generateWidgetSnapshot, saveWidgetSnapshot } from './widgetSnapshotService';

/**
 * Update all widgets with the latest goal data
 * This triggers the widgetTaskHandler which reads from the snapshot
 * Widget names must match app.config.ts: FeaturedGoal, FocusLauncher, GardenOverview
 */
export async function updateAllWidgets(goals: Goal[]): Promise<void> {
  try {
    // First, generate and save the snapshot that widgets will read
    const snapshot = await generateWidgetSnapshot(goals);
    if (snapshot) {
      await saveWidgetSnapshot(snapshot);
    }

    // Trigger widget updates - the widgetTaskHandler will render using the snapshot
    // Widget names must match exactly with app.config.ts
    await requestWidgetUpdate({
      widgetName: 'FeaturedGoal',
      renderWidget: () => null as any, // widgetTaskHandler handles rendering
      widgetNotFound: () => {
        // Widget not added to home screen, ignore
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
    console.error('Error updating widgets:', error);
  }
}

/**
 * Update a specific widget by name
 */
export async function updateWidget(widgetName: string): Promise<void> {
  try {
    await requestWidgetUpdate({
      widgetName,
      renderWidget: () => null as any,
      widgetNotFound: () => {},
    });
  } catch (error) {
    console.error(`Error updating widget ${widgetName}:`, error);
  }
}
