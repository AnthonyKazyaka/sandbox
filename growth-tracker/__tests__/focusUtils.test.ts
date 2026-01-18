// Focus utilities tests
import {
  createInitialFocusState,
  startFocusSession,
  endFocusSession,
  calculateFocusPoints,
  getSessionStats,
  formatTimerDisplay,
  getRemainingTime,
  isSessionTimeComplete,
} from '../src/utils/focusUtils';
import { createInitialGrowthState } from '../src/utils/growthUtils';
import { POINTS_CONFIG } from '../src/models/types';

describe('Focus Utilities', () => {
  describe('createInitialFocusState', () => {
    it('should create state with default duration', () => {
      const state = createInitialFocusState();
      expect(state.defaultDurationMs).toBe(25 * 60 * 1000);
      expect(state.sessions).toEqual([]);
      expect(state.totalCompletedSessions).toBe(0);
      expect(state.currentSession).toBeNull();
    });

    it('should create state with custom duration', () => {
      const state = createInitialFocusState(45 * 60 * 1000);
      expect(state.defaultDurationMs).toBe(45 * 60 * 1000);
    });
  });

  describe('calculateFocusPoints', () => {
    it('should calculate points for completed session', () => {
      const durationMs = 25 * 60 * 1000; // 25 minutes
      const points = calculateFocusPoints(durationMs, durationMs, 'completed');
      // 25 minutes + 10 bonus = 35
      expect(points).toBe(25 + POINTS_CONFIG.focusCompletionBonus);
    });

    it('should return 0 for abandoned session', () => {
      const durationMs = 15 * 60 * 1000;
      const points = calculateFocusPoints(durationMs, 25 * 60 * 1000, 'abandoned');
      expect(points).toBe(0);
    });

    it('should calculate partial points for in-progress (no bonus)', () => {
      const durationMs = 10 * 60 * 1000; // 10 minutes
      const points = calculateFocusPoints(durationMs, 25 * 60 * 1000, 'in-progress');
      expect(points).toBe(10); // No bonus
    });
  });

  describe('startFocusSession', () => {
    it('should create a new session', () => {
      const focusState = createInitialFocusState();
      const { focusState: newState, session } = startFocusSession(focusState, 'goal-1');
      
      expect(session.goalId).toBe('goal-1');
      expect(session.status).toBe('in-progress');
      expect(session.plannedDurationMs).toBe(focusState.defaultDurationMs);
      expect(newState.currentSession).not.toBeNull();
    });

    it('should use custom duration if provided', () => {
      const focusState = createInitialFocusState();
      const customDuration = 60 * 60 * 1000; // 1 hour
      const { session } = startFocusSession(focusState, 'goal-1', customDuration);
      
      expect(session.plannedDurationMs).toBe(customDuration);
    });
  });

  describe('endFocusSession', () => {
    it('should complete session and award points', () => {
      const focusState = createInitialFocusState();
      const { focusState: withSession } = startFocusSession(focusState, 'goal-1');
      const growth = createInitialGrowthState();
      
      // Simulate 25 minutes passing
      const now = Date.now() + 25 * 60 * 1000;
      const { focusState: endedState, growth: newGrowth, session } = endFocusSession(
        withSession,
        growth,
        'completed',
        now
      );
      
      expect(session?.status).toBe('completed');
      expect(session?.pointsEarned).toBeGreaterThan(0);
      expect(endedState.totalCompletedSessions).toBe(1);
      expect(endedState.currentSession).toBeNull();
      expect(newGrowth.totalPointsEarned).toBeGreaterThan(0);
    });

    it('should not award points for abandoned session', () => {
      const focusState = createInitialFocusState();
      const { focusState: withSession } = startFocusSession(focusState, 'goal-1');
      const growth = createInitialGrowthState();
      
      const now = Date.now() + 10 * 60 * 1000;
      const { session, growth: newGrowth } = endFocusSession(
        withSession,
        growth,
        'abandoned',
        now
      );
      
      expect(session?.status).toBe('abandoned');
      expect(session?.pointsEarned).toBe(0);
      expect(newGrowth.totalPointsEarned).toBe(0);
    });
  });

  describe('getSessionStats', () => {
    it('should calculate stats correctly', () => {
      const focusState = createInitialFocusState();
      focusState.sessions = [
        { id: '1', goalId: 'g1', startedAt: 0, plannedDurationMs: 25*60*1000, actualDurationMs: 25*60*1000, status: 'completed', pointsEarned: 35 },
        { id: '2', goalId: 'g1', startedAt: 0, plannedDurationMs: 25*60*1000, actualDurationMs: 25*60*1000, status: 'completed', pointsEarned: 35 },
        { id: '3', goalId: 'g1', startedAt: 0, plannedDurationMs: 25*60*1000, actualDurationMs: 10*60*1000, status: 'abandoned', pointsEarned: 0 },
      ];
      focusState.totalCompletedSessions = 2;
      focusState.totalFocusTimeMs = 50 * 60 * 1000;
      
      const stats = getSessionStats(focusState);
      
      expect(stats.totalSessions).toBe(3);
      expect(stats.completedSessions).toBe(2);
      expect(stats.abandonedSessions).toBe(1);
      expect(stats.completionRate).toBeCloseTo(2/3);
    });
  });

  describe('formatTimerDisplay', () => {
    it('should format minutes and seconds', () => {
      expect(formatTimerDisplay(5 * 60 * 1000 + 30 * 1000)).toBe('05:30');
    });

    it('should format with hours', () => {
      expect(formatTimerDisplay(90 * 60 * 1000)).toBe('01:30:00');
    });

    it('should handle zero', () => {
      expect(formatTimerDisplay(0)).toBe('00:00');
    });
  });

  describe('getRemainingTime', () => {
    it('should calculate remaining time', () => {
      const session = {
        id: '1',
        goalId: 'g1',
        startedAt: Date.now() - 10 * 60 * 1000, // 10 minutes ago
        plannedDurationMs: 25 * 60 * 1000,
        actualDurationMs: 0,
        status: 'in-progress' as const,
        pointsEarned: 0,
      };
      
      const remaining = getRemainingTime(session);
      // Should be approximately 15 minutes
      expect(remaining).toBeGreaterThan(14 * 60 * 1000);
      expect(remaining).toBeLessThan(16 * 60 * 1000);
    });
  });

  describe('isSessionTimeComplete', () => {
    it('should return true when time is up', () => {
      const session = {
        id: '1',
        goalId: 'g1',
        startedAt: Date.now() - 30 * 60 * 1000, // 30 minutes ago
        plannedDurationMs: 25 * 60 * 1000,
        actualDurationMs: 0,
        status: 'in-progress' as const,
        pointsEarned: 0,
      };
      
      expect(isSessionTimeComplete(session)).toBe(true);
    });

    it('should return false when time remains', () => {
      const session = {
        id: '1',
        goalId: 'g1',
        startedAt: Date.now() - 10 * 60 * 1000,
        plannedDurationMs: 25 * 60 * 1000,
        actualDurationMs: 0,
        status: 'in-progress' as const,
        pointsEarned: 0,
      };
      
      expect(isSessionTimeComplete(session)).toBe(false);
    });
  });
});
