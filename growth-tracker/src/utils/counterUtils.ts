// Counter goal utilities
import {
  CounterState,
  CounterPeriod,
  CounterLogEntry,
  GrowthState,
  POINTS_CONFIG,
} from '../models/types';
import { v4 as uuidv4 } from 'uuid';
import { addWaterPoints } from './growthUtils';

/**
 * Create initial counter state
 */
export function createInitialCounterState(
  targetCount: number,
  period: CounterPeriod
): CounterState {
  return {
    targetCount,
    period,
    currentCount: 0,
    periodStartedAt: getPeriodStartTime(period, Date.now()),
    history: [],
    completedPeriods: 0,
  };
}

/**
 * Get the start of the current period (day or week)
 */
export function getPeriodStartTime(period: CounterPeriod, timestamp: number): number {
  const date = new Date(timestamp);
  
  if (period === 'daily') {
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  } else {
    // Weekly - start on Monday
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }
}

/**
 * Check if we're in a new period
 */
export function isNewPeriod(
  period: CounterPeriod,
  periodStartedAt: number,
  now: number = Date.now()
): boolean {
  const currentPeriodStart = getPeriodStartTime(period, now);
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
  now: number = Date.now()
): { counterState: CounterState; growth: GrowthState; periodCompleted: boolean } {
  if (!isNewPeriod(counterState.period, counterState.periodStartedAt, now)) {
    return { counterState, growth, periodCompleted: false };
  }

  // Check if the previous period hit the target
  const hitTarget = counterState.currentCount >= counterState.targetCount;
  const bonusPoints = hitTarget ? POINTS_CONFIG.counterTargetBonus : 0;
  const newGrowth = bonusPoints > 0 ? addWaterPoints(growth, bonusPoints) : growth;

  const newCounterState: CounterState = {
    ...counterState,
    currentCount: 0,
    periodStartedAt: getPeriodStartTime(counterState.period, now),
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
  note?: string
): { counterState: CounterState; growth: GrowthState; logEntry: CounterLogEntry } {
  const now = Date.now();
  
  // First check if period needs reset
  const { counterState: resetState, growth: resetGrowth } = checkAndResetPeriod(
    counterState,
    growth,
    now
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
