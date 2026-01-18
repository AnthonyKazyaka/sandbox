// Counter utilities tests
import {
  createInitialCounterState,
  getPeriodStartTime,
  isNewPeriod,
  checkAndResetPeriod,
  incrementCounter,
  getProgressPercentage,
  formatPeriodLabel,
  getCounterStats,
} from '../src/utils/counterUtils';
import { createInitialGrowthState } from '../src/utils/growthUtils';
import { POINTS_CONFIG } from '../src/models/types';

describe('Counter Utilities', () => {
  describe('createInitialCounterState', () => {
    it('should create daily counter state', () => {
      const state = createInitialCounterState(8, 'daily');
      
      expect(state.targetCount).toBe(8);
      expect(state.period).toBe('daily');
      expect(state.currentCount).toBe(0);
      expect(state.history).toEqual([]);
      expect(state.completedPeriods).toBe(0);
    });

    it('should create weekly counter state', () => {
      const state = createInitialCounterState(3, 'weekly');
      
      expect(state.targetCount).toBe(3);
      expect(state.period).toBe('weekly');
    });
  });

  describe('getPeriodStartTime', () => {
    it('should get start of day for daily period', () => {
      const now = new Date(2024, 5, 15, 14, 30, 0).getTime(); // June 15, 2024 2:30 PM
      const start = getPeriodStartTime('daily', now);
      const startDate = new Date(start);
      
      expect(startDate.getHours()).toBe(0);
      expect(startDate.getMinutes()).toBe(0);
      expect(startDate.getSeconds()).toBe(0);
      expect(startDate.getDate()).toBe(15);
    });

    it('should get Monday for weekly period', () => {
      // Wednesday June 19, 2024
      const wednesday = new Date(2024, 5, 19, 14, 30, 0).getTime();
      const start = getPeriodStartTime('weekly', wednesday);
      const startDate = new Date(start);
      
      expect(startDate.getDay()).toBe(1); // Monday
      expect(startDate.getDate()).toBe(17); // June 17 is the Monday before
    });
  });

  describe('isNewPeriod', () => {
    it('should detect new day', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      expect(isNewPeriod('daily', yesterday.getTime())).toBe(true);
    });

    it('should not detect new period on same day', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      expect(isNewPeriod('daily', today.getTime())).toBe(false);
    });
  });

  describe('checkAndResetPeriod', () => {
    it('should not reset if same period', () => {
      const counterState = createInitialCounterState(8, 'daily');
      counterState.currentCount = 5;
      const growth = createInitialGrowthState();
      
      const result = checkAndResetPeriod(counterState, growth);
      
      expect(result.counterState.currentCount).toBe(5);
      expect(result.periodCompleted).toBe(false);
    });

    it('should reset and award bonus if target was hit', () => {
      const counterState = createInitialCounterState(8, 'daily');
      counterState.currentCount = 8;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      counterState.periodStartedAt = yesterday.getTime();
      
      const growth = createInitialGrowthState();
      const result = checkAndResetPeriod(counterState, growth);
      
      expect(result.counterState.currentCount).toBe(0);
      expect(result.counterState.completedPeriods).toBe(1);
      expect(result.growth.totalPointsEarned).toBe(POINTS_CONFIG.counterTargetBonus);
      expect(result.periodCompleted).toBe(true);
    });
  });

  describe('incrementCounter', () => {
    it('should increment count and add history', () => {
      const counterState = createInitialCounterState(8, 'daily');
      const growth = createInitialGrowthState();
      
      const result = incrementCounter(counterState, growth, 1, 'Test note');
      
      expect(result.counterState.currentCount).toBe(1);
      expect(result.counterState.history.length).toBe(1);
      expect(result.logEntry.count).toBe(1);
      expect(result.logEntry.note).toBe('Test note');
      expect(result.growth.totalPointsEarned).toBe(POINTS_CONFIG.counterIncrement);
    });

    it('should increment by custom amount', () => {
      const counterState = createInitialCounterState(8, 'daily');
      const growth = createInitialGrowthState();
      
      const result = incrementCounter(counterState, growth, 3);
      
      expect(result.counterState.currentCount).toBe(3);
      expect(result.growth.totalPointsEarned).toBe(3 * POINTS_CONFIG.counterIncrement);
    });
  });

  describe('getProgressPercentage', () => {
    it('should calculate progress correctly', () => {
      const counterState = createInitialCounterState(10, 'daily');
      counterState.currentCount = 5;
      
      expect(getProgressPercentage(counterState)).toBe(50);
    });

    it('should cap at 100%', () => {
      const counterState = createInitialCounterState(5, 'daily');
      counterState.currentCount = 10;
      
      expect(getProgressPercentage(counterState)).toBe(100);
    });

    it('should handle zero target', () => {
      const counterState = createInitialCounterState(0, 'daily');
      
      expect(getProgressPercentage(counterState)).toBe(100);
    });
  });

  describe('formatPeriodLabel', () => {
    it('should format daily label', () => {
      expect(formatPeriodLabel('daily')).toBe('Today');
    });

    it('should format weekly label', () => {
      expect(formatPeriodLabel('weekly')).toBe('This Week');
    });
  });

  describe('getCounterStats', () => {
    it('should calculate stats correctly', () => {
      const counterState = createInitialCounterState(10, 'daily');
      counterState.currentCount = 5;
      counterState.completedPeriods = 3;
      counterState.history = [
        { id: '1', timestamp: Date.now(), count: 2 },
        { id: '2', timestamp: Date.now(), count: 3 },
      ];
      
      const stats = getCounterStats(counterState);
      
      expect(stats.currentCount).toBe(5);
      expect(stats.targetCount).toBe(10);
      expect(stats.progress).toBe(50);
      expect(stats.completedPeriods).toBe(3);
      expect(stats.totalEntries).toBe(2);
    });
  });
});
