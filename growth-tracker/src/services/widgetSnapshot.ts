/**
 * Widget Snapshot - Cached data for widget rendering
 * Stored in AsyncStorage and read by widget task handler
 */
export interface WidgetSnapshot {
  updatedAt: number; // Unix timestamp
  featuredGoalId: string;
  title: string;
  primaryText: string; // e.g., "3d 4h", "125 days", "45 completed"
  stage: string; // PlantStage enum value
  progress0to1: number; // 0.0 to 1.0
  goalType: 'streak' | 'focus' | 'counter';
  
  // Optional: for multi-goal widgets
  topGoals?: Array<{
    id: string;
    title: string;
    stage: string;
    progress: number;
  }>;
  
  // Optional: for focus widget
  lastSessionResult?: 'success' | 'cancelled' | null;
  todayFocusMinutes?: number;
}

export const WIDGET_SNAPSHOT_KEY = '@growth_tracker/widget_snapshot';
