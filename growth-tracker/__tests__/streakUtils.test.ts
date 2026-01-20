// Streak utilities tests
import {
  calculateStreakDuration,
  formatStreakDuration,
  getNewlyAchievedMilestones,
  calculateMilestonePoints,
  processSlip,
  calculateMoneySaved,
  calculateUnitsAvoided,
  createInitialStreakState,
  updateStreak,
} from '../src/utils/streakUtils';
import { createInitialGrowthState } from '../src/utils/growthUtils';
import { DEFAULT_STREAK_MILESTONES } from '../src/models/types';

describe('Streak Utilities', () => {
  describe('calculateStreakDuration', () => {
    it('should calculate duration correctly', () => {
      const now = Date.now();
      const startedAt = now - (2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000 + 15 * 60 * 1000 + 30 * 1000);
      // 2 days, 3 hours, 15 minutes, 30 seconds ago
      
      const duration = calculateStreakDuration(startedAt, now);
      
      expect(duration.days).toBe(2);
      expect(duration.hours).toBe(3);
      expect(duration.minutes).toBe(15);
      expect(duration.seconds).toBe(30);
    });

    it('should handle zero duration', () => {
      const now = Date.now();
      const duration = calculateStreakDuration(now, now);
      
      expect(duration.totalMs).toBe(0);
      expect(duration.days).toBe(0);
      expect(duration.hours).toBe(0);
      expect(duration.minutes).toBe(0);
      expect(duration.seconds).toBe(0);
    });

    it('should handle future start time gracefully', () => {
      const now = Date.now();
      const futureTime = now + 1000;
      const duration = calculateStreakDuration(futureTime, now);
      
      expect(duration.totalMs).toBe(0);
    });
  });

  describe('formatStreakDuration', () => {
    it('should format duration with days', () => {
      const duration = { totalMs: 0, days: 5, hours: 3, minutes: 20, seconds: 15 };
      expect(formatStreakDuration(duration)).toBe('5d 3h 20m 15s');
    });

    it('should format duration without days', () => {
      const duration = { totalMs: 0, days: 0, hours: 3, minutes: 20, seconds: 15 };
      expect(formatStreakDuration(duration)).toBe('3h 20m 15s');
    });

    it('should format short duration', () => {
      const duration = { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 45 };
      expect(formatStreakDuration(duration)).toBe('45s');
    });
  });

  describe('getNewlyAchievedMilestones', () => {
    it('should return milestones for first day', () => {
      const oneDay = 24 * 60 * 60 * 1000;
      const achieved = getNewlyAchievedMilestones(oneDay + 1000, []);
      
      expect(achieved.length).toBe(3); // 1h, 6h, 1d
      expect(achieved.map(m => m.id)).toContain('1d');
    });

    it('should not return already achieved milestones', () => {
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      const achieved = getNewlyAchievedMilestones(oneWeek + 1000, ['1h', '6h', '1d', '3d']);
      
      expect(achieved.length).toBe(1); // Only 1w
      expect(achieved[0].id).toBe('1w');
    });

    it('should return empty array if no new milestones', () => {
      const achieved = getNewlyAchievedMilestones(1000, []); // 1 second
      expect(achieved.length).toBe(0);
    });
  });

  describe('calculateMilestonePoints', () => {
    it('should sum points for achieved milestones', () => {
      const points = calculateMilestonePoints(['1h', '6h', '1d']);
      // 5 + 10 + 25 = 40
      expect(points).toBe(40);
    });

    it('should return 0 for no milestones', () => {
      const points = calculateMilestonePoints([]);
      expect(points).toBe(0);
    });
  });

  describe('processSlip', () => {
    it('should reset streak and record slip', () => {
      const streakState = createInitialStreakState();
      streakState.startedAt = Date.now() - 3 * 24 * 60 * 60 * 1000; // 3 days ago
      streakState.achievedMilestones = ['1h', '6h', '1d', '3d'];
      
      const growth = createInitialGrowthState();
      const note = 'Test slip';
      
      const result = processSlip(streakState, growth, note);
      
      expect(result.streakState.totalSlips).toBe(1);
      expect(result.streakState.achievedMilestones).toEqual([]);
      expect(result.streakState.lastSlipAt).not.toBeNull();
      expect(result.slipEvent.note).toBe(note);
      expect(result.streakState.bestStreakMs).toBeGreaterThan(0);
    });

    it('should preserve best streak', () => {
      const streakState = createInitialStreakState();
      streakState.bestStreakMs = 7 * 24 * 60 * 60 * 1000; // 7 days
      streakState.startedAt = Date.now() - 2 * 24 * 60 * 60 * 1000; // 2 days
      
      const growth = createInitialGrowthState();
      const result = processSlip(streakState, growth);
      
      expect(result.streakState.bestStreakMs).toBe(7 * 24 * 60 * 60 * 1000);
    });
  });

  describe('calculateMoneySaved', () => {
    it('should calculate money saved correctly', () => {
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      const saved = calculateMoneySaved(oneWeek, 0.50, 20);
      // 7 days * $0.50 * 20 = $70
      expect(saved).toBe(70);
    });

    it('should return null if cost not provided', () => {
      const saved = calculateMoneySaved(1000, undefined, 20);
      expect(saved).toBeNull();
    });

    it('should return null if units per day not provided', () => {
      const saved = calculateMoneySaved(1000, 0.50, undefined);
      expect(saved).toBeNull();
    });
  });

  describe('calculateUnitsAvoided', () => {
    it('should calculate units avoided correctly', () => {
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      const avoided = calculateUnitsAvoided(oneWeek, 20);
      // 7 days * 20 = 140
      expect(avoided).toBe(140);
    });

    it('should return null if units per day not provided', () => {
      const avoided = calculateUnitsAvoided(1000, undefined);
      expect(avoided).toBeNull();
    });
  });

  describe('updateStreak', () => {
    it('should update bestStreakMs when current streak exceeds previous best', () => {
      const now = Date.now();
      const streakState = createInitialStreakState();
      // Set a previous best of 1 day
      streakState.bestStreakMs = 24 * 60 * 60 * 1000;
      // Start streak 3 days ago so current > best
      streakState.startedAt = now - 3 * 24 * 60 * 60 * 1000;

      const growth = createInitialGrowthState();

      const result = updateStreak(streakState, growth, now);

      expect(result.streakState.currentStreakMs).toBeGreaterThan(streakState.bestStreakMs);
      expect(result.streakState.bestStreakMs).toBeGreaterThanOrEqual(streakState.bestStreakMs);
      expect(result.streakState.bestStreakMs).toBeGreaterThan(0);
    });

    it('should track milestone achievements with timesAchieved', () => {
      const now = Date.now();
      const streakState = createInitialStreakState();
      // Start 1 day + 1 hour ago to hit 1h, 6h, and 1d milestones
      streakState.startedAt = now - (25 * 60 * 60 * 1000);
      const growth = createInitialGrowthState();

      const result = updateStreak(streakState, growth, now);

      // Should have achieved 1h, 6h, 1d milestones
      expect(result.newMilestones.length).toBe(3);
      expect(result.streakState.milestoneAchievements['1h'].timesAchieved).toBe(1);
      expect(result.streakState.milestoneAchievements['6h'].timesAchieved).toBe(1);
      expect(result.streakState.milestoneAchievements['1d'].timesAchieved).toBe(1);
    });
  });

  describe('milestone re-awarding after slip', () => {
    it('should allow re-awarding milestones after a slip', () => {
      const now = Date.now();
      const streakState = createInitialStreakState();
      const growth = createInitialGrowthState();
      
      // First streak: achieve 1h, 6h, 1d milestones
      streakState.startedAt = now - (25 * 60 * 60 * 1000);
      const firstUpdate = updateStreak(streakState, growth, now);
      
      expect(firstUpdate.streakState.achievedMilestones).toContain('1h');
      expect(firstUpdate.streakState.achievedMilestones).toContain('1d');
      expect(firstUpdate.streakState.milestoneAchievements['1d'].timesAchieved).toBe(1);
      
      // Record a slip - resets current streak milestones but preserves achievement history
      const { streakState: slippedState, growth: slippedGrowth } = processSlip(
        firstUpdate.streakState,
        firstUpdate.growth
      );
      
      expect(slippedState.achievedMilestones).toEqual([]); // Current streak milestones reset
      expect(slippedState.milestoneAchievements['1d'].timesAchieved).toBe(1); // History preserved
      
      // Second streak: achieve 1d again
      const newNow = now + (25 * 60 * 60 * 1000); // 25 hours after slip
      const secondUpdate = updateStreak(slippedState, slippedGrowth, newNow);
      
      // Should have re-awarded the milestones
      expect(secondUpdate.newMilestones.length).toBe(3);
      expect(secondUpdate.streakState.milestoneAchievements['1d'].timesAchieved).toBe(2); // Achieved twice
    });

    it('should track lastAwardedAt for milestones', () => {
      const now = Date.now();
      const streakState = createInitialStreakState();
      streakState.startedAt = now - (2 * 60 * 60 * 1000); // 2 hours ago
      const growth = createInitialGrowthState();

      const result = updateStreak(streakState, growth, now);

      expect(result.streakState.milestoneAchievements['1h'].lastAwardedAt).toBe(now);
    });

    it('should preserve milestoneAchievements across multiple slips', () => {
      const now = Date.now();
      let streakState = createInitialStreakState();
      let growth = createInitialGrowthState();
      
      // First streak
      streakState.startedAt = now - (2 * 60 * 60 * 1000);
      const first = updateStreak(streakState, growth, now);
      expect(first.streakState.milestoneAchievements['1h'].timesAchieved).toBe(1);
      
      // First slip
      const slip1 = processSlip(first.streakState, first.growth);
      
      // Second streak
      const second = updateStreak(slip1.streakState, slip1.growth, now + 2 * 60 * 60 * 1000);
      expect(second.streakState.milestoneAchievements['1h'].timesAchieved).toBe(2);
      
      // Second slip
      const slip2 = processSlip(second.streakState, second.growth);
      
      // Third streak
      const third = updateStreak(slip2.streakState, slip2.growth, now + 4 * 60 * 60 * 1000);
      expect(third.streakState.milestoneAchievements['1h'].timesAchieved).toBe(3);
    });
  });
});
