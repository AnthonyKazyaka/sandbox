// Seed Data - Sample goals for demo/testing
import { Goal, StreakGoal, FocusGoal, CounterGoal, GrowthState } from '../models/types';
import { goalRepository } from '../storage';

const createGrowthState = (totalPoints: number): GrowthState => {
  let stage: GrowthState['stage'] = 'seed';
  if (totalPoints >= 1000) stage = 'tree';
  else if (totalPoints >= 600) stage = 'bush';
  else if (totalPoints >= 300) stage = 'plant';
  else if (totalPoints >= 100) stage = 'sprout';
  
  return {
    stage,
    currentPoints: totalPoints,
    totalPointsEarned: totalPoints,
    lastWateredAt: Date.now() - 1000 * 60 * 60, // 1 hour ago
  };
};

export const sampleGoals: Goal[] = [
  // Streak Goal - Quit Smoking (7 days in)
  {
    id: 'sample-streak-1',
    type: 'streak',
    name: 'Quit Smoking',
    description: 'Track my journey to becoming smoke-free',
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
    updatedAt: Date.now(),
    growth: createGrowthState(175), // 1d + 3d + 1w milestones
    isArchived: false,
    color: '#4CAF50',
    streakState: {
      startedAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
      currentStreakMs: 7 * 24 * 60 * 60 * 1000,
      bestStreakMs: 7 * 24 * 60 * 60 * 1000,
      totalSlips: 0,
      lastSlipAt: null,
      slipHistory: [],
      achievedMilestones: ['1h', '6h', '1d', '3d', '1w'],
      costPerUnit: 0.50,
      unitsPerDay: 20,
    },
  } as StreakGoal,

  // Streak Goal - No Social Media (3 days in, with 1 slip)
  {
    id: 'sample-streak-2',
    type: 'streak',
    name: 'Social Media Detox',
    description: 'Stay off social media for mental clarity',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
    growth: createGrowthState(75), // Some milestones
    isArchived: false,
    streakState: {
      startedAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
      currentStreakMs: 3 * 24 * 60 * 60 * 1000,
      bestStreakMs: 4 * 24 * 60 * 60 * 1000, // Best was 4 days
      totalSlips: 1,
      lastSlipAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      slipHistory: [
        {
          id: 'slip-1',
          timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
          note: 'Checked Instagram out of habit',
        },
      ],
      achievedMilestones: ['1h', '6h', '1d', '3d'],
    },
  } as StreakGoal,

  // Focus Goal - Deep Work
  {
    id: 'sample-focus-1',
    type: 'focus',
    name: 'Deep Work',
    description: 'Focused work sessions without distractions',
    createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
    growth: createGrowthState(320), // Plant stage
    isArchived: false,
    focusState: {
      defaultDurationMs: 45 * 60 * 1000, // 45 minutes
      sessions: [
        {
          id: 'session-1',
          goalId: 'sample-focus-1',
          startedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
          plannedDurationMs: 45 * 60 * 1000,
          actualDurationMs: 45 * 60 * 1000,
          status: 'completed',
          endedAt: Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000,
          pointsEarned: 55, // 45 + 10 bonus
        },
        {
          id: 'session-2',
          goalId: 'sample-focus-1',
          startedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
          plannedDurationMs: 25 * 60 * 1000,
          actualDurationMs: 25 * 60 * 1000,
          status: 'completed',
          endedAt: Date.now() - 1 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000,
          pointsEarned: 35,
        },
        {
          id: 'session-3',
          goalId: 'sample-focus-1',
          startedAt: Date.now() - 12 * 60 * 60 * 1000,
          plannedDurationMs: 45 * 60 * 1000,
          actualDurationMs: 15 * 60 * 1000,
          status: 'abandoned',
          endedAt: Date.now() - 12 * 60 * 60 * 1000 + 15 * 60 * 1000,
          pointsEarned: 0,
        },
      ],
      totalCompletedSessions: 2,
      totalFocusTimeMs: 70 * 60 * 1000, // 70 minutes
      currentSession: null,
    },
  } as FocusGoal,

  // Focus Goal - Meditation
  {
    id: 'sample-focus-2',
    type: 'focus',
    name: 'Meditation',
    description: 'Daily mindfulness practice',
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
    growth: createGrowthState(150), // Sprout stage
    isArchived: false,
    focusState: {
      defaultDurationMs: 15 * 60 * 1000, // 15 minutes
      sessions: [
        {
          id: 'meditation-1',
          goalId: 'sample-focus-2',
          startedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
          plannedDurationMs: 15 * 60 * 1000,
          actualDurationMs: 15 * 60 * 1000,
          status: 'completed',
          endedAt: Date.now() - 1 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000,
          pointsEarned: 25,
        },
      ],
      totalCompletedSessions: 6,
      totalFocusTimeMs: 90 * 60 * 1000,
      currentSession: null,
    },
  } as FocusGoal,

  // Counter Goal - Exercise
  {
    id: 'sample-counter-1',
    type: 'counter',
    name: 'Exercise',
    description: 'Work out 3 times per week',
    createdAt: Date.now() - 21 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
    growth: createGrowthState(250), // Near plant stage
    isArchived: false,
    counterState: {
      targetCount: 3,
      period: 'weekly',
      currentCount: 2,
      periodStartedAt: (() => {
        // Get Monday of current week
        const date = new Date();
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        date.setDate(diff);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })(),
      history: [
        {
          id: 'exercise-1',
          timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
          count: 1,
          note: 'Morning run',
        },
        {
          id: 'exercise-2',
          timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
          count: 1,
          note: 'Weight training',
        },
      ],
      completedPeriods: 2,
    },
  } as CounterGoal,

  // Counter Goal - Water Intake
  {
    id: 'sample-counter-2',
    type: 'counter',
    name: 'Drink Water',
    description: 'Drink 8 glasses of water daily',
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
    growth: createGrowthState(180), // Sprout stage
    isArchived: false,
    counterState: {
      targetCount: 8,
      period: 'daily',
      currentCount: 5,
      periodStartedAt: (() => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })(),
      history: [
        { id: 'water-1', timestamp: Date.now() - 8 * 60 * 60 * 1000, count: 1 },
        { id: 'water-2', timestamp: Date.now() - 6 * 60 * 60 * 1000, count: 1 },
        { id: 'water-3', timestamp: Date.now() - 4 * 60 * 60 * 1000, count: 1 },
        { id: 'water-4', timestamp: Date.now() - 2 * 60 * 60 * 1000, count: 1 },
        { id: 'water-5', timestamp: Date.now() - 1 * 60 * 60 * 1000, count: 1 },
      ],
      completedPeriods: 7,
    },
  } as CounterGoal,
];

/**
 * Load sample seed data into the app storage
 */
export async function loadSeedData(): Promise<void> {
  console.log('Loading seed data...');
  
  for (const goal of sampleGoals) {
    await goalRepository.upsert(goal);
  }
  
  console.log(`Loaded ${sampleGoals.length} sample goals`);
}

/**
 * Clear all data and reload seed data (for development/testing)
 */
export async function resetToSeedData(): Promise<void> {
  console.log('Resetting to seed data...');
  
  await goalRepository.removeAll();
  await loadSeedData();
  
  console.log('Reset complete');
}
