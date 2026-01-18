// Growth utilities tests
import {
  createInitialGrowthState,
  getPlantStage,
  getStageProgress,
  addWaterPoints,
  getPlantEmoji,
  getStageName,
  getStageColor,
  didStageAdvance,
} from '../src/utils/growthUtils';
import { GROWTH_STAGES } from '../src/models/types';

describe('Growth Utilities', () => {
  describe('createInitialGrowthState', () => {
    it('should create state at seed stage', () => {
      const state = createInitialGrowthState();
      
      expect(state.stage).toBe('seed');
      expect(state.currentPoints).toBe(0);
      expect(state.totalPointsEarned).toBe(0);
      expect(state.lastWateredAt).toBeNull();
    });
  });

  describe('getPlantStage', () => {
    it('should return seed for 0-99 points', () => {
      expect(getPlantStage(0)).toBe('seed');
      expect(getPlantStage(50)).toBe('seed');
      expect(getPlantStage(99)).toBe('seed');
    });

    it('should return sprout for 100-299 points', () => {
      expect(getPlantStage(100)).toBe('sprout');
      expect(getPlantStage(200)).toBe('sprout');
      expect(getPlantStage(299)).toBe('sprout');
    });

    it('should return plant for 300-599 points', () => {
      expect(getPlantStage(300)).toBe('plant');
      expect(getPlantStage(450)).toBe('plant');
      expect(getPlantStage(599)).toBe('plant');
    });

    it('should return bush for 600-999 points', () => {
      expect(getPlantStage(600)).toBe('bush');
      expect(getPlantStage(800)).toBe('bush');
      expect(getPlantStage(999)).toBe('bush');
    });

    it('should return tree for 1000+ points', () => {
      expect(getPlantStage(1000)).toBe('tree');
      expect(getPlantStage(5000)).toBe('tree');
    });
  });

  describe('getStageProgress', () => {
    it('should calculate progress within stage', () => {
      const state = createInitialGrowthState();
      state.totalPointsEarned = 50;
      
      const progress = getStageProgress(state);
      
      expect(progress.currentStagePoints).toBe(50);
      expect(progress.pointsToNextStage).toBe(50); // 100 - 50
      expect(progress.progressPercentage).toBe(50);
      expect(progress.nextStage).toBe('sprout');
    });

    it('should return 100% for tree stage', () => {
      const state = createInitialGrowthState();
      state.stage = 'tree';
      state.totalPointsEarned = 1500;
      
      const progress = getStageProgress(state);
      
      expect(progress.progressPercentage).toBe(100);
      expect(progress.nextStage).toBeNull();
    });
  });

  describe('addWaterPoints', () => {
    it('should add points and update stage', () => {
      const state = createInitialGrowthState();
      state.totalPointsEarned = 90;
      state.stage = 'seed';
      
      const newState = addWaterPoints(state, 20);
      
      expect(newState.totalPointsEarned).toBe(110);
      expect(newState.stage).toBe('sprout');
      expect(newState.lastWateredAt).not.toBeNull();
    });

    it('should not downgrade stage', () => {
      const state = createInitialGrowthState();
      state.stage = 'sprout';
      state.totalPointsEarned = 100;
      
      const newState = addWaterPoints(state, 5);
      
      expect(newState.stage).toBe('sprout');
    });
  });

  describe('getPlantEmoji', () => {
    it('should return correct emoji for each stage', () => {
      expect(getPlantEmoji('seed')).toBe('🌰');
      expect(getPlantEmoji('sprout')).toBe('🌱');
      expect(getPlantEmoji('plant')).toBe('🌿');
      expect(getPlantEmoji('bush')).toBe('🪴');
      expect(getPlantEmoji('tree')).toBe('🌳');
    });
  });

  describe('getStageName', () => {
    it('should return correct name for each stage', () => {
      expect(getStageName('seed')).toBe('Seed');
      expect(getStageName('sprout')).toBe('Sprout');
      expect(getStageName('plant')).toBe('Plant');
      expect(getStageName('bush')).toBe('Bush');
      expect(getStageName('tree')).toBe('Tree');
    });
  });

  describe('getStageColor', () => {
    it('should return a color string for each stage', () => {
      expect(getStageColor('seed')).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(getStageColor('tree')).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  describe('didStageAdvance', () => {
    it('should detect stage advancement', () => {
      expect(didStageAdvance('seed', 'sprout')).toBe(true);
      expect(didStageAdvance('sprout', 'plant')).toBe(true);
      expect(didStageAdvance('seed', 'tree')).toBe(true);
    });

    it('should return false for same stage', () => {
      expect(didStageAdvance('seed', 'seed')).toBe(false);
      expect(didStageAdvance('tree', 'tree')).toBe(false);
    });

    it('should return false for regression', () => {
      expect(didStageAdvance('sprout', 'seed')).toBe(false);
      expect(didStageAdvance('tree', 'bush')).toBe(false);
    });
  });
});
