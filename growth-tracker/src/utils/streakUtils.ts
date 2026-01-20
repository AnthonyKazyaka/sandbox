// Streak calculation utilities
import {
  StreakGoal,
  StreakState,
  SlipEvent,
  Milestone,
  MilestoneAchievement,
  DEFAULT_STREAK_MILESTONES,
  GrowthState,
} from '../models/types';
import { v4 as uuidv4 } from 'uuid';
import { addWaterPoints } from './growthUtils';

export interface StreakDuration {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Calculate streak duration in human-readable format
 */
export function calculateStreakDuration(startedAt: number, now: number = Date.now()): StreakDuration {
  const totalMs = Math.max(0, now - startedAt);
  
  const seconds = Math.floor((totalMs / 1000) % 60);
  const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  
  return { totalMs, days, hours, minutes, seconds };
}

/**
 * Format streak duration to human-readable string
 */
export function formatStreakDuration(duration: StreakDuration): string {
  const parts: string[] = [];
  
  if (duration.days > 0) {
    parts.push(`${duration.days}d`);
  }
  if (duration.hours > 0 || duration.days > 0) {
    parts.push(`${duration.hours}h`);
  }
  if (duration.minutes > 0 || duration.hours > 0 || duration.days > 0) {
    parts.push(`${duration.minutes}m`);
  }
  parts.push(`${duration.seconds}s`);
  
  return parts.join(' ');
}

/**
 * Get newly achieved milestones for a streak
 */
export function getNewlyAchievedMilestones(
  currentStreakMs: number,
  achievedMilestoneIds: string[],
  milestones: Omit<Milestone, 'achievedAt'>[] = DEFAULT_STREAK_MILESTONES
): Milestone[] {
  const newMilestones: Milestone[] = [];
  
  for (const milestone of milestones) {
    if (
      currentStreakMs >= milestone.durationMs &&
      !achievedMilestoneIds.includes(milestone.id)
    ) {
      newMilestones.push({
        ...milestone,
        achievedAt: Date.now(),
      });
    }
  }
  
  return newMilestones;
}

/**
 * Calculate total points from achieved milestones
 */
export function calculateMilestonePoints(
  achievedMilestoneIds: string[],
  milestones: Omit<Milestone, 'achievedAt'>[] = DEFAULT_STREAK_MILESTONES
): number {
  return milestones
    .filter((m) => achievedMilestoneIds.includes(m.id))
    .reduce((sum, m) => sum + m.points, 0);
}

/**
 * Process a slip event and update streak state
 * Milestones can be re-awarded after a slip when re-reached
 */
export function processSlip(
  streakState: StreakState,
  growth: GrowthState,
  note?: string
): { streakState: StreakState; growth: GrowthState; slipEvent: SlipEvent } {
  const now = Date.now();
  const currentStreakMs = now - streakState.startedAt;
  
  const slipEvent: SlipEvent = {
    id: uuidv4(),
    timestamp: now,
    note,
  };
  
  const newStreakState: StreakState = {
    ...streakState,
    startedAt: now,
    currentStreakMs: 0,
    bestStreakMs: Math.max(streakState.bestStreakMs, currentStreakMs),
    totalSlips: streakState.totalSlips + 1,
    lastSlipAt: now,
    slipHistory: [...streakState.slipHistory, slipEvent].slice(-100), // Keep last 100 slips
    achievedMilestones: [], // Reset current streak milestones (allows re-awarding)
    milestoneAchievements: streakState.milestoneAchievements, // Preserve lifetime achievement history
  };
  
  return {
    streakState: newStreakState,
    growth, // Growth is not affected by slips (only by earning points)
    slipEvent,
  };
}

/**
 * Update streak with current time and check for new milestones
 * Supports milestone re-awarding after slips by tracking achievements separately
 */
export function updateStreak(
  streakState: StreakState,
  growth: GrowthState,
  now: number = Date.now()
): { streakState: StreakState; growth: GrowthState; newMilestones: Milestone[] } {
  const currentStreakMs = now - streakState.startedAt;
  
  const newMilestones = getNewlyAchievedMilestones(
    currentStreakMs,
    streakState.achievedMilestones
  );
  
  const pointsEarned = newMilestones.reduce((sum, m) => sum + m.points, 0);
  const newGrowth = pointsEarned > 0 ? addWaterPoints(growth, pointsEarned) : growth;
  
  // Update milestone achievements tracking (for re-award history)
  const updatedMilestoneAchievements = { ...streakState.milestoneAchievements };
  for (const milestone of newMilestones) {
    const existing = updatedMilestoneAchievements[milestone.id];
    updatedMilestoneAchievements[milestone.id] = {
      milestoneId: milestone.id,
      timesAchieved: (existing?.timesAchieved ?? 0) + 1,
      lastAwardedAt: now,
    };
  }
  
  const newStreakState: StreakState = {
    ...streakState,
    currentStreakMs,
    achievedMilestones: [
      ...streakState.achievedMilestones,
      ...newMilestones.map((m) => m.id),
    ],
    milestoneAchievements: updatedMilestoneAchievements,
  };
  
  // Update best streak if the current streak is now the longest
  newStreakState.bestStreakMs = Math.max(streakState.bestStreakMs, currentStreakMs);
  return {
    streakState: newStreakState,
    growth: newGrowth,
    newMilestones,
  };
}

/**
 * Calculate money saved based on streak duration
 */
export function calculateMoneySaved(
  streakMs: number,
  costPerUnit?: number,
  unitsPerDay?: number
): number | null {
  if (costPerUnit === undefined || unitsPerDay === undefined) {
    return null;
  }
  
  const days = streakMs / (1000 * 60 * 60 * 24);
  return Math.floor(days * costPerUnit * unitsPerDay * 100) / 100;
}

/**
 * Calculate units avoided based on streak duration
 */
export function calculateUnitsAvoided(
  streakMs: number,
  unitsPerDay?: number
): number | null {
  if (unitsPerDay === undefined) {
    return null;
  }
  
  const days = streakMs / (1000 * 60 * 60 * 24);
  return Math.floor(days * unitsPerDay);
}

/**
 * Create initial streak state
 */
export function createInitialStreakState(
  costPerUnit?: number,
  unitsPerDay?: number
): StreakState {
  return {
    startedAt: Date.now(),
    currentStreakMs: 0,
    bestStreakMs: 0,
    totalSlips: 0,
    lastSlipAt: null,
    slipHistory: [],
    achievedMilestones: [],
    milestoneAchievements: {}, // Track lifetime achievements for re-awarding
    costPerUnit,
    unitsPerDay,
  };
}
