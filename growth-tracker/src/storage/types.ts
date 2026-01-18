// Storage interface - abstraction layer for persistence
// This allows swapping between AsyncStorage and SQLite

import { Goal, AppSettings } from '../models/types';

export interface StorageAdapter {
  // Key-value storage
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<string[]>;
  multiGet(keys: string[]): Promise<[string, string | null][]>;
  multiSet(keyValuePairs: [string, string][]): Promise<void>;
  multiRemove(keys: string[]): Promise<void>;
  clear(): Promise<void>;
}

export interface GoalRepository {
  getAll(): Promise<Goal[]>;
  getById(id: string): Promise<Goal | null>;
  upsert(goal: Goal): Promise<void>;
  remove(id: string): Promise<void>;
  removeAll(): Promise<void>;
}

export interface SettingsRepository {
  get(): Promise<AppSettings>;
  save(settings: AppSettings): Promise<void>;
}

export interface DataExport {
  version: string;
  exportedAt: number;
  goals: Goal[];
  settings: AppSettings;
}

export interface ImportExportService {
  exportAll(): Promise<DataExport>;
  importAll(data: DataExport): Promise<void>;
}
