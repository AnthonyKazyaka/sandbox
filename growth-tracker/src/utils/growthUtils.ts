// Plant growth utilities
import { GrowthState, PlantStage, GROWTH_STAGES } from '../models/types';

/**
 * Create initial growth state
 */
export function createInitialGrowthState(): GrowthState {
  return {
    stage: 'seed',
    currentPoints: 0,
    totalPointsEarned: 0,
    lastWateredAt: null,
  };
}

/**
 * Get current plant stage based on total points
 */
export function getPlantStage(totalPoints: number): PlantStage {
  if (totalPoints >= GROWTH_STAGES.tree.minPoints) return 'tree';
  if (totalPoints >= GROWTH_STAGES.bush.minPoints) return 'bush';
  if (totalPoints >= GROWTH_STAGES.plant.minPoints) return 'plant';
  if (totalPoints >= GROWTH_STAGES.sprout.minPoints) return 'sprout';
  return 'seed';
}

/**
 * Get points needed for current stage
 */
export function getStageProgress(growthState: GrowthState): {
  currentStagePoints: number;
  pointsToNextStage: number;
  progressPercentage: number;
  nextStage: PlantStage | null;
} {
  const { totalPointsEarned, stage } = growthState;
  const currentStageConfig = GROWTH_STAGES[stage];
  
  // If we're at max stage (tree), show 100% progress
  if (stage === 'tree') {
    return {
      currentStagePoints: totalPointsEarned - currentStageConfig.minPoints,
      pointsToNextStage: 0,
      progressPercentage: 100,
      nextStage: null,
    };
  }

  const stages: PlantStage[] = ['seed', 'sprout', 'plant', 'bush', 'tree'];
  const currentStageIndex = stages.indexOf(stage);
  const nextStage = stages[currentStageIndex + 1];
  const nextStageConfig = GROWTH_STAGES[nextStage];

  const pointsInCurrentStage = totalPointsEarned - currentStageConfig.minPoints;
  const totalPointsNeededForStage = nextStageConfig.minPoints - currentStageConfig.minPoints;
  const progressPercentage = (pointsInCurrentStage / totalPointsNeededForStage) * 100;

  return {
    currentStagePoints: pointsInCurrentStage,
    pointsToNextStage: nextStageConfig.minPoints - totalPointsEarned,
    progressPercentage: Math.min(100, progressPercentage),
    nextStage,
  };
}

/**
 * Add water points to a plant and update growth state
 */
export function addWaterPoints(growthState: GrowthState, points: number): GrowthState {
  const newTotalPoints = growthState.totalPointsEarned + points;
  const newStage = getPlantStage(newTotalPoints);

  return {
    stage: newStage,
    currentPoints: growthState.currentPoints + points,
    totalPointsEarned: newTotalPoints,
    lastWateredAt: Date.now(),
  };
}

/**
 * Get emoji representation of plant stage
 */
export function getPlantEmoji(stage: PlantStage): string {
  const emojis: Record<PlantStage, string> = {
    seed: '🌰',
    sprout: '🌱',
    plant: '🌿',
    bush: '🪴',
    tree: '🌳',
  };
  return emojis[stage];
}

/**
 * Get stage display name
 */
export function getStageName(stage: PlantStage): string {
  const names: Record<PlantStage, string> = {
    seed: 'Seed',
    sprout: 'Sprout',
    plant: 'Plant',
    bush: 'Bush',
    tree: 'Tree',
  };
  return names[stage];
}

/**
 * Get color for plant stage
 */
export function getStageColor(stage: PlantStage): string {
  const colors: Record<PlantStage, string> = {
    seed: '#8B4513', // Brown
    sprout: '#90EE90', // Light green
    plant: '#32CD32', // Lime green
    bush: '#228B22', // Forest green
    tree: '#006400', // Dark green
  };
  return colors[stage];
}

/**
 * Check if stage just advanced
 */
export function didStageAdvance(oldStage: PlantStage, newStage: PlantStage): boolean {
  const stages: PlantStage[] = ['seed', 'sprout', 'plant', 'bush', 'tree'];
  return stages.indexOf(newStage) > stages.indexOf(oldStage);
}
