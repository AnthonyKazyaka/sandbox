// Core type definitions for Growth Tracker

export type GoalType = 'streak' | 'focus' | 'counter';

export type PlantStage = 'seed' | 'sprout' | 'plant' | 'bush' | 'tree';

export interface GrowthState {
  stage: PlantStage;
  currentPoints: number;
  totalPointsEarned: number;
  lastWateredAt: number | null;
}

// Milestone definitions for streak goals
export interface Milestone {
  id: string;
  name: string;
  durationMs: number;
  points: number;
  achievedAt?: number;
}

// Streak/Abstinence goal specific types
export interface SlipEvent {
  id: string;
  timestamp: number;
  note?: string;
}

export interface StreakState {
  startedAt: number;
  currentStreakMs: number;
  bestStreakMs: number;
  totalSlips: number;
  lastSlipAt: number | null;
  slipHistory: SlipEvent[];
  achievedMilestones: string[]; // Milestone IDs
  // Optional tracking stats
  costPerUnit?: number;
  unitsPerDay?: number;
}

// Focus Session goal specific types
export type FocusSessionStatus = 'completed' | 'abandoned' | 'in-progress';

export interface FocusSession {
  id: string;
  goalId: string;
  startedAt: number;
  plannedDurationMs: number;
  actualDurationMs: number;
  status: FocusSessionStatus;
  endedAt?: number;
  pointsEarned: number;
}

export interface FocusState {
  defaultDurationMs: number;
  sessions: FocusSession[];
  totalCompletedSessions: number;
  totalFocusTimeMs: number;
  currentSession: FocusSession | null;
}

// Counter goal specific types
export type CounterPeriod = 'daily' | 'weekly';

export interface CounterLogEntry {
  id: string;
  timestamp: number;
  count: number;
  note?: string;
}

export interface CounterState {
  targetCount: number;
  period: CounterPeriod;
  currentCount: number;
  periodStartedAt: number;
  history: CounterLogEntry[];
  completedPeriods: number;
}

// Base Goal interface
interface BaseGoal {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  growth: GrowthState;
  isArchived: boolean;
  color?: string;
  icon?: string;
}

// Discriminated union for Goal types
export interface StreakGoal extends BaseGoal {
  type: 'streak';
  streakState: StreakState;
}

export interface FocusGoal extends BaseGoal {
  type: 'focus';
  focusState: FocusState;
}

export interface CounterGoal extends BaseGoal {
  type: 'counter';
  counterState: CounterState;
}

export type Goal = StreakGoal | FocusGoal | CounterGoal;

// App settings
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  hapticFeedback: boolean;
  notificationsEnabled: boolean;
}

// Event types for goal updates
export type GoalEvent =
  | { type: 'slip'; goalId: string; timestamp: number; note?: string }
  | { type: 'focus_start'; goalId: string; timestamp: number; plannedDurationMs: number }
  | { type: 'focus_end'; goalId: string; timestamp: number; status: FocusSessionStatus }
  | { type: 'counter_increment'; goalId: string; timestamp: number; count?: number }
  | { type: 'milestone_achieved'; goalId: string; milestoneId: string; timestamp: number }
  | { type: 'water_plant'; goalId: string; points: number; timestamp: number };

// Growth stage thresholds
export const GROWTH_STAGES: Record<PlantStage, { minPoints: number; maxPoints: number }> = {
  seed: { minPoints: 0, maxPoints: 99 },
  sprout: { minPoints: 100, maxPoints: 299 },
  plant: { minPoints: 300, maxPoints: 599 },
  bush: { minPoints: 600, maxPoints: 999 },
  tree: { minPoints: 1000, maxPoints: Infinity },
};

// Default milestones for streak goals
export const DEFAULT_STREAK_MILESTONES: Omit<Milestone, 'achievedAt'>[] = [
  { id: '1h', name: '1 Hour', durationMs: 60 * 60 * 1000, points: 5 },
  { id: '6h', name: '6 Hours', durationMs: 6 * 60 * 60 * 1000, points: 10 },
  { id: '1d', name: '1 Day', durationMs: 24 * 60 * 60 * 1000, points: 25 },
  { id: '3d', name: '3 Days', durationMs: 3 * 24 * 60 * 60 * 1000, points: 50 },
  { id: '1w', name: '1 Week', durationMs: 7 * 24 * 60 * 60 * 1000, points: 100 },
  { id: '2w', name: '2 Weeks', durationMs: 14 * 24 * 60 * 60 * 1000, points: 150 },
  { id: '1m', name: '1 Month', durationMs: 30 * 24 * 60 * 60 * 1000, points: 250 },
  { id: '2m', name: '2 Months', durationMs: 60 * 24 * 60 * 60 * 1000, points: 400 },
  { id: '100d', name: '100 Days', durationMs: 100 * 24 * 60 * 60 * 1000, points: 500 },
  { id: '6m', name: '6 Months', durationMs: 180 * 24 * 60 * 60 * 1000, points: 750 },
  { id: '1y', name: '1 Year', durationMs: 365 * 24 * 60 * 60 * 1000, points: 1000 },
];

// Points configuration
export const POINTS_CONFIG = {
  focusPerMinute: 1,
  focusCompletionBonus: 10,
  counterIncrement: 5,
  counterTargetBonus: 25,
};
