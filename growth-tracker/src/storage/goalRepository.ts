// Goal Repository implementation
import { Goal } from '../models/types';
import { StorageAdapter, GoalRepository } from './types';
import { asyncStorageAdapter } from './asyncStorageAdapter';

const GOAL_PREFIX = '@growth_tracker/goal/';
const GOALS_INDEX_KEY = '@growth_tracker/goals_index';

export class GoalRepositoryImpl implements GoalRepository {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter = asyncStorageAdapter) {
    this.storage = storage;
  }

  private getGoalKey(id: string): string {
    return `${GOAL_PREFIX}${id}`;
  }

  async getAll(): Promise<Goal[]> {
    try {
      const indexJson = await this.storage.getItem(GOALS_INDEX_KEY);
      if (!indexJson) return [];

      const goalIds: string[] = JSON.parse(indexJson);
      if (goalIds.length === 0) return [];

      const keys = goalIds.map((id) => this.getGoalKey(id));
      const results = await this.storage.multiGet(keys);

      const goals: Goal[] = [];
      for (const [, value] of results) {
        if (value) {
          try {
            const goal = JSON.parse(value) as Goal;
            goals.push(goal);
          } catch (e) {
            console.error('Failed to parse goal:', e);
          }
        }
      }

      return goals.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Error fetching all goals:', error);
      return [];
    }
  }

  async getById(id: string): Promise<Goal | null> {
    try {
      const json = await this.storage.getItem(this.getGoalKey(id));
      if (!json) return null;
      return JSON.parse(json) as Goal;
    } catch (error) {
      console.error(`Error fetching goal ${id}:`, error);
      return null;
    }
  }

  async upsert(goal: Goal): Promise<void> {
    try {
      // Update the goal
      await this.storage.setItem(this.getGoalKey(goal.id), JSON.stringify(goal));

      // Update the index
      const indexJson = await this.storage.getItem(GOALS_INDEX_KEY);
      const goalIds: string[] = indexJson ? JSON.parse(indexJson) : [];

      if (!goalIds.includes(goal.id)) {
        goalIds.push(goal.id);
        await this.storage.setItem(GOALS_INDEX_KEY, JSON.stringify(goalIds));
      }
    } catch (error) {
      console.error(`Error upserting goal ${goal.id}:`, error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Remove the goal
      await this.storage.removeItem(this.getGoalKey(id));

      // Update the index
      const indexJson = await this.storage.getItem(GOALS_INDEX_KEY);
      if (indexJson) {
        const goalIds: string[] = JSON.parse(indexJson);
        const filteredIds = goalIds.filter((gid) => gid !== id);
        await this.storage.setItem(GOALS_INDEX_KEY, JSON.stringify(filteredIds));
      }
    } catch (error) {
      console.error(`Error removing goal ${id}:`, error);
      throw error;
    }
  }

  async removeAll(): Promise<void> {
    try {
      const indexJson = await this.storage.getItem(GOALS_INDEX_KEY);
      if (indexJson) {
        const goalIds: string[] = JSON.parse(indexJson);
        const keys = goalIds.map((id) => this.getGoalKey(id));
        await this.storage.multiRemove(keys);
      }
      await this.storage.removeItem(GOALS_INDEX_KEY);
    } catch (error) {
      console.error('Error removing all goals:', error);
      throw error;
    }
  }
}

// Singleton instance
export const goalRepository = new GoalRepositoryImpl();
