// Counter goal utilities
import {
  CounterState,
  CounterPeriod,
  CounterLogEntry,
  GrowthState,
  WeekStart,
  POINTS_CONFIG,
} from '../models/types';
import { v4 as uuidv4 } from 'uuid';
import { addWaterPoints } from './growthUtils';

/**
 * Create initial counter state
 */
export function createInitialCounterState(
  targetCount: number,
  period: CounterPeriod,
  weekStart: WeekStart = 'monday'
): CounterState {
  return {
    targetCount,
    period,
    currentCount: 0,
    periodStartedAt: getPeriodStartTime(period, Date.now(), weekStart),
    history: [],
    completedPeriods: 0,
  };
}

/**
 * Get the start of the current period (day or week)
 * Supports configurable week start day (Monday or Sunday)
 * All calculations use local timezone by default
 */
export function getPeriodStartTime(
  period: CounterPeriod, 
  timestamp: number,
  weekStart: WeekStart = 'monday',
  timezone?: string
): number {
  // If timezone is provided, we'd need to use a library like luxon
  // For MVP, we use device local time
  const date = new Date(timestamp);
  
  if (period === 'daily') {
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  } else {
    // Weekly - configurable start day
    const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    let diff: number;
    
    if (weekStart === 'monday') {
      // Monday = 1, so we need to go back to the previous Monday
      diff = date.getDate() - day + (day === 0 ? -6 : 1);
    } else {
      // Sunday = 0, so we need to go back to the previous Sunday
      diff = date.getDate() - day;
    }
    
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }
}

/**
 * Generate a stable period key for storage/comparison
 * Format: YYYY-MM-DD for daily, YYYY-Www for weekly
 */
export function getPeriodKey(
  period: CounterPeriod,
  timestamp: number,
  weekStart: WeekStart = 'monday'
): string {
  const periodStart = getPeriodStartTime(period, timestamp, weekStart);
  const date = new Date(periodStart);
  
  if (period === 'daily') {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  } else {
    // Calculate ISO week number
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`; // YYYY-Www
  }
}

/**
 * Check if we're in a new period
 */
export function isNewPeriod(
  period: CounterPeriod,
  periodStartedAt: number,
  now: number = Date.now(),
  weekStart: WeekStart = 'monday'
): boolean {
  const currentPeriodStart = getPeriodStartTime(period, now, weekStart);
  return currentPeriodStart > periodStartedAt;
}

/**
 * Get period end time
 */
export function getPeriodEndTime(period: CounterPeriod, periodStartedAt: number): number {
  const startDate = new Date(periodStartedAt);
  
  if (period === 'daily') {
    startDate.setDate(startDate.getDate() + 1);
  } else {
    startDate.setDate(startDate.getDate() + 7);
  }
  
  return startDate.getTime();
}

/**
 * Reset counter for new period if needed
 */
export function checkAndResetPeriod(
  counterState: CounterState,
  growth: GrowthState,
  now: number = Date.now(),
  weekStart: WeekStart = 'monday'
): { counterState: CounterState; growth: GrowthState; periodCompleted: boolean } {
  if (!isNewPeriod(counterState.period, counterState.periodStartedAt, now, weekStart)) {
    return { counterState, growth, periodCompleted: false };
  }

  // Check if the previous period hit the target
  const hitTarget = counterState.currentCount >= counterState.targetCount;
  const bonusPoints = hitTarget ? POINTS_CONFIG.counterTargetBonus : 0;
  const newGrowth = bonusPoints > 0 ? addWaterPoints(growth, bonusPoints) : growth;

  const newCounterState: CounterState = {
    ...counterState,
    currentCount: 0,
    periodStartedAt: getPeriodStartTime(counterState.period, now, weekStart),
    completedPeriods: hitTarget
      ? counterState.completedPeriods + 1
      : counterState.completedPeriods,
  };

  return {
    counterState: newCounterState,
    growth: newGrowth,
    periodCompleted: hitTarget,
  };
}

/**
 * Increment counter
 */
export function incrementCounter(
  counterState: CounterState,
  growth: GrowthState,
  count: number = 1,
  note?: string,
  weekStart: WeekStart = 'monday'
): { counterState: CounterState; growth: GrowthState; logEntry: CounterLogEntry } {
  const now = Date.now();
  
  // First check if period needs reset
  const { counterState: resetState, growth: resetGrowth } = checkAndResetPeriod(
    counterState,
    growth,
    now,
    weekStart
  );

  const logEntry: CounterLogEntry = {
    id: uuidv4(),
    timestamp: now,
    count,
    note,
  };

  const pointsEarned = count * POINTS_CONFIG.counterIncrement;
  const newGrowth = addWaterPoints(resetGrowth, pointsEarned);

  const newCounterState: CounterState = {
    ...resetState,
    currentCount: resetState.currentCount + count,
    history: [...resetState.history, logEntry].slice(-500), // Keep last 500 entries
  };

  return {
    counterState: newCounterState,
    growth: newGrowth,
    logEntry,
  };
}

/**
 * Get progress percentage towards target
 */
export function getProgressPercentage(counterState: CounterState): number {
  if (counterState.targetCount === 0) return 100;
  return Math.min(100, (counterState.currentCount / counterState.targetCount) * 100);
}

/**
 * Get history entries for current period
 */
export function getCurrentPeriodHistory(counterState: CounterState): CounterLogEntry[] {
  return counterState.history.filter(
    (entry) => entry.timestamp >= counterState.periodStartedAt
  );
}

/**
 * Format period label
 */
export function formatPeriodLabel(period: CounterPeriod): string {
  return period === 'daily' ? 'Today' : 'This Week';
}

/**
 * Get time remaining in period
 */
export function getTimeRemainingInPeriod(
  period: CounterPeriod,
  periodStartedAt: number,
  now: number = Date.now()
): number {
  const endTime = getPeriodEndTime(period, periodStartedAt);
  return Math.max(0, endTime - now);
}

/**
 * Get counter statistics
 */
export function getCounterStats(counterState: CounterState): {
  currentCount: number;
  targetCount: number;
  progress: number;
  completedPeriods: number;
  totalEntries: number;
  averagePerPeriod: number;
} {
  const totalEntries = counterState.history.length;
  const periodsTracked = Math.max(1, counterState.completedPeriods + 1);
  
  return {
    currentCount: counterState.currentCount,
    targetCount: counterState.targetCount,
    progress: getProgressPercentage(counterState),
    completedPeriods: counterState.completedPeriods,
    totalEntries,
    averagePerPeriod: totalEntries / periodsTracked,
  };
}
