// App Context - Global state management
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Goal, AppSettings, StreakGoal, FocusGoal, CounterGoal } from '../models/types';
import { goalRepository, settingsRepository } from '../storage';
import { createInitialGrowthState } from '../utils/growthUtils';
import { createInitialStreakState, processSlip, updateStreak } from '../utils/streakUtils';
import { createInitialFocusState, startFocusSession, endFocusSession } from '../utils/focusUtils';
import { createInitialCounterState, incrementCounter, checkAndResetPeriod } from '../utils/counterUtils';
import { v4 as uuidv4 } from 'uuid';

// State type
interface AppState {
  goals: Goal[];
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;
}

// Action types
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_GOALS'; payload: Goal[] }
  | { type: 'SET_SETTINGS'; payload: AppSettings }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_GOAL'; payload: Goal }
  | { type: 'REMOVE_GOAL'; payload: string };

// Initial state
const initialState: AppState = {
  goals: [],
  settings: {
    theme: 'system',
    hapticFeedback: true,
    notificationsEnabled: false,
  },
  isLoading: true,
  error: null,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_GOALS':
      return { ...state, goals: action.payload };
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'ADD_GOAL':
      return { ...state, goals: [action.payload, ...state.goals] };
    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload.id ? action.payload : g
        ),
      };
    case 'REMOVE_GOAL':
      return {
        ...state,
        goals: state.goals.filter((g) => g.id !== action.payload),
      };
    default:
      return state;
  }
}

// Context type
interface AppContextType {
  state: AppState;
  // Goal operations
  createStreakGoal: (name: string, description?: string, costPerUnit?: number, unitsPerDay?: number) => Promise<StreakGoal>;
  createFocusGoal: (name: string, description?: string, defaultDurationMs?: number) => Promise<FocusGoal>;
  createCounterGoal: (name: string, description?: string, targetCount?: number, period?: 'daily' | 'weekly') => Promise<CounterGoal>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  // Streak operations
  recordSlip: (goalId: string, note?: string) => Promise<void>;
  refreshStreak: (goalId: string) => Promise<void>;
  // Focus operations
  startFocus: (goalId: string, durationMs?: number) => Promise<void>;
  endFocus: (goalId: string, completed: boolean) => Promise<void>;
  // Counter operations
  incrementGoalCounter: (goalId: string, count?: number, note?: string) => Promise<void>;
  // Settings operations
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  // Data operations
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const [goals, settings] = await Promise.all([
          goalRepository.getAll(),
          settingsRepository.get(),
        ]);
        dispatch({ type: 'SET_GOALS', payload: goals });
        dispatch({ type: 'SET_SETTINGS', payload: settings });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load data' });
        console.error('Failed to load data:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    loadData();
  }, []);

  const refreshData = useCallback(async () => {
    const goals = await goalRepository.getAll();
    dispatch({ type: 'SET_GOALS', payload: goals });
  }, []);

  // Create streak goal
  const createStreakGoal = useCallback(async (
    name: string,
    description?: string,
    costPerUnit?: number,
    unitsPerDay?: number
  ): Promise<StreakGoal> => {
    const now = Date.now();
    const goal: StreakGoal = {
      id: uuidv4(),
      type: 'streak',
      name,
      description,
      createdAt: now,
      updatedAt: now,
      growth: createInitialGrowthState(),
      isArchived: false,
      streakState: createInitialStreakState(costPerUnit, unitsPerDay),
    };
    await goalRepository.upsert(goal);
    dispatch({ type: 'ADD_GOAL', payload: goal });
    return goal;
  }, []);

  // Create focus goal
  const createFocusGoal = useCallback(async (
    name: string,
    description?: string,
    defaultDurationMs: number = 25 * 60 * 1000
  ): Promise<FocusGoal> => {
    const now = Date.now();
    const goal: FocusGoal = {
      id: uuidv4(),
      type: 'focus',
      name,
      description,
      createdAt: now,
      updatedAt: now,
      growth: createInitialGrowthState(),
      isArchived: false,
      focusState: createInitialFocusState(defaultDurationMs),
    };
    await goalRepository.upsert(goal);
    dispatch({ type: 'ADD_GOAL', payload: goal });
    return goal;
  }, []);

  // Create counter goal
  const createCounterGoal = useCallback(async (
    name: string,
    description?: string,
    targetCount: number = 1,
    period: 'daily' | 'weekly' = 'daily'
  ): Promise<CounterGoal> => {
    const now = Date.now();
    const goal: CounterGoal = {
      id: uuidv4(),
      type: 'counter',
      name,
      description,
      createdAt: now,
      updatedAt: now,
      growth: createInitialGrowthState(),
      isArchived: false,
      counterState: createInitialCounterState(targetCount, period),
    };
    await goalRepository.upsert(goal);
    dispatch({ type: 'ADD_GOAL', payload: goal });
    return goal;
  }, []);

  // Update goal
  const updateGoal = useCallback(async (goal: Goal) => {
    const updated = { ...goal, updatedAt: Date.now() };
    await goalRepository.upsert(updated);
    dispatch({ type: 'UPDATE_GOAL', payload: updated });
  }, []);

  // Delete goal
  const deleteGoal = useCallback(async (id: string) => {
    await goalRepository.remove(id);
    dispatch({ type: 'REMOVE_GOAL', payload: id });
  }, []);

  // Record slip for streak goal
  const recordSlip = useCallback(async (goalId: string, note?: string) => {
    const goal = state.goals.find((g) => g.id === goalId);
    if (!goal || goal.type !== 'streak') return;

    const { streakState, growth } = processSlip(goal.streakState, goal.growth, note);
    const updated: StreakGoal = {
      ...goal,
      streakState,
      growth,
      updatedAt: Date.now(),
    };
    await goalRepository.upsert(updated);
    dispatch({ type: 'UPDATE_GOAL', payload: updated });
  }, [state.goals]);

  // Refresh streak (check for new milestones)
  const refreshStreak = useCallback(async (goalId: string) => {
    const goal = state.goals.find((g) => g.id === goalId);
    if (!goal || goal.type !== 'streak') return;

    const { streakState, growth } = updateStreak(goal.streakState, goal.growth);
    const updated: StreakGoal = {
      ...goal,
      streakState,
      growth,
      updatedAt: Date.now(),
    };
    await goalRepository.upsert(updated);
    dispatch({ type: 'UPDATE_GOAL', payload: updated });
  }, [state.goals]);

  // Start focus session
  const startFocus = useCallback(async (goalId: string, durationMs?: number) => {
    const goal = state.goals.find((g) => g.id === goalId);
    if (!goal || goal.type !== 'focus') return;

    const { focusState } = startFocusSession(goal.focusState, goalId, durationMs);
    const updated: FocusGoal = {
      ...goal,
      focusState,
      updatedAt: Date.now(),
    };
    await goalRepository.upsert(updated);
    dispatch({ type: 'UPDATE_GOAL', payload: updated });
  }, [state.goals]);

  // End focus session
  const endFocus = useCallback(async (goalId: string, completed: boolean) => {
    const goal = state.goals.find((g) => g.id === goalId);
    if (!goal || goal.type !== 'focus') return;

    const { focusState, growth } = endFocusSession(
      goal.focusState,
      goal.growth,
      completed ? 'completed' : 'abandoned'
    );
    const updated: FocusGoal = {
      ...goal,
      focusState,
      growth,
      updatedAt: Date.now(),
    };
    await goalRepository.upsert(updated);
    dispatch({ type: 'UPDATE_GOAL', payload: updated });
  }, [state.goals]);

  // Increment counter
  const incrementGoalCounter = useCallback(async (goalId: string, count: number = 1, note?: string) => {
    const goal = state.goals.find((g) => g.id === goalId);
    if (!goal || goal.type !== 'counter') return;

    // First check for period reset
    const { counterState: resetState, growth: resetGrowth } = checkAndResetPeriod(
      goal.counterState,
      goal.growth
    );
    
    const { counterState, growth } = incrementCounter(
      resetState,
      resetGrowth,
      count,
      note
    );
    
    const updated: CounterGoal = {
      ...goal,
      counterState,
      growth,
      updatedAt: Date.now(),
    };
    await goalRepository.upsert(updated);
    dispatch({ type: 'UPDATE_GOAL', payload: updated });
  }, [state.goals]);

  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    const updated = { ...state.settings, ...newSettings };
    await settingsRepository.save(updated);
    dispatch({ type: 'SET_SETTINGS', payload: updated });
  }, [state.settings]);

  const contextValue: AppContextType = {
    state,
    createStreakGoal,
    createFocusGoal,
    createCounterGoal,
    updateGoal,
    deleteGoal,
    recordSlip,
    refreshStreak,
    startFocus,
    endFocus,
    incrementGoalCounter,
    updateSettings,
    refreshData,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
