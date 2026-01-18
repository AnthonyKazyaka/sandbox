// Focus session utilities
import {
  FocusState,
  FocusSession,
  FocusSessionStatus,
  GrowthState,
  POINTS_CONFIG,
} from '../models/types';
import { v4 as uuidv4 } from 'uuid';
import { addWaterPoints } from './growthUtils';

/**
 * Create initial focus state
 */
export function createInitialFocusState(defaultDurationMs: number = 25 * 60 * 1000): FocusState {
  return {
    defaultDurationMs,
    sessions: [],
    totalCompletedSessions: 0,
    totalFocusTimeMs: 0,
    currentSession: null,
  };
}

/**
 * Start a new focus session
 */
export function startFocusSession(
  focusState: FocusState,
  goalId: string,
  plannedDurationMs?: number
): { focusState: FocusState; session: FocusSession } {
  const now = Date.now();
  const session: FocusSession = {
    id: uuidv4(),
    goalId,
    startedAt: now,
    plannedDurationMs: plannedDurationMs ?? focusState.defaultDurationMs,
    actualDurationMs: 0,
    status: 'in-progress',
    pointsEarned: 0,
  };

  return {
    focusState: {
      ...focusState,
      currentSession: session,
    },
    session,
  };
}

/**
 * Calculate points for a focus session
 */
export function calculateFocusPoints(
  actualDurationMs: number,
  plannedDurationMs: number,
  status: FocusSessionStatus
): number {
  if (status === 'abandoned') {
    return 0;
  }

  const minutesCompleted = Math.floor(actualDurationMs / (60 * 1000));
  const basePoints = minutesCompleted * POINTS_CONFIG.focusPerMinute;
  
  // Bonus for completing the full session
  const completionBonus = status === 'completed' ? POINTS_CONFIG.focusCompletionBonus : 0;
  
  return basePoints + completionBonus;
}

/**
 * End a focus session
 */
export function endFocusSession(
  focusState: FocusState,
  growth: GrowthState,
  status: FocusSessionStatus,
  now: number = Date.now()
): { focusState: FocusState; growth: GrowthState; session: FocusSession | null } {
  if (!focusState.currentSession) {
    return { focusState, growth, session: null };
  }

  const actualDurationMs = now - focusState.currentSession.startedAt;
  const pointsEarned = calculateFocusPoints(
    actualDurationMs,
    focusState.currentSession.plannedDurationMs,
    status
  );

  const completedSession: FocusSession = {
    ...focusState.currentSession,
    actualDurationMs,
    status,
    endedAt: now,
    pointsEarned,
  };

  const newGrowth = pointsEarned > 0 ? addWaterPoints(growth, pointsEarned) : growth;

  const newFocusState: FocusState = {
    ...focusState,
    sessions: [...focusState.sessions, completedSession].slice(-100), // Keep last 100 sessions
    totalCompletedSessions:
      status === 'completed'
        ? focusState.totalCompletedSessions + 1
        : focusState.totalCompletedSessions,
    totalFocusTimeMs:
      status === 'completed'
        ? focusState.totalFocusTimeMs + actualDurationMs
        : focusState.totalFocusTimeMs,
    currentSession: null,
  };

  return {
    focusState: newFocusState,
    growth: newGrowth,
    session: completedSession,
  };
}

/**
 * Get session statistics
 */
export function getSessionStats(focusState: FocusState): {
  totalSessions: number;
  completedSessions: number;
  abandonedSessions: number;
  totalFocusTimeMs: number;
  averageSessionMs: number;
  completionRate: number;
} {
  const completedSessions = focusState.sessions.filter((s) => s.status === 'completed');
  const abandonedSessions = focusState.sessions.filter((s) => s.status === 'abandoned');

  return {
    totalSessions: focusState.sessions.length,
    completedSessions: completedSessions.length,
    abandonedSessions: abandonedSessions.length,
    totalFocusTimeMs: focusState.totalFocusTimeMs,
    averageSessionMs:
      completedSessions.length > 0
        ? focusState.totalFocusTimeMs / completedSessions.length
        : 0,
    completionRate:
      focusState.sessions.length > 0
        ? completedSessions.length / focusState.sessions.length
        : 0,
  };
}

/**
 * Format milliseconds to timer display (MM:SS or HH:MM:SS)
 */
export function formatTimerDisplay(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate remaining time in session
 */
export function getRemainingTime(session: FocusSession, now: number = Date.now()): number {
  const elapsed = now - session.startedAt;
  return Math.max(0, session.plannedDurationMs - elapsed);
}

/**
 * Check if session is complete (time elapsed)
 */
export function isSessionTimeComplete(session: FocusSession, now: number = Date.now()): boolean {
  return getRemainingTime(session, now) <= 0;
}
