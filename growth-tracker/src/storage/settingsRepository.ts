// Settings Repository implementation
import { AppSettings } from '../models/types';
import { StorageAdapter, SettingsRepository } from './types';
import { asyncStorageAdapter } from './asyncStorageAdapter';

const SETTINGS_KEY = '@growth_tracker/settings';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  hapticFeedback: true,
  notificationsEnabled: false,
  weekStart: 'monday',
  timezone: undefined, // Use device timezone by default
};

export class SettingsRepositoryImpl implements SettingsRepository {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter = asyncStorageAdapter) {
    this.storage = storage;
  }

  async get(): Promise<AppSettings> {
    try {
      const json = await this.storage.getItem(SETTINGS_KEY);
      if (!json) return { ...DEFAULT_SETTINGS };
      
      const savedSettings = JSON.parse(json) as Partial<AppSettings>;
      return { ...DEFAULT_SETTINGS, ...savedSettings };
    } catch (error) {
      console.error('Error fetching settings:', error);
      return { ...DEFAULT_SETTINGS };
    }
  }

  async save(settings: AppSettings): Promise<void> {
    try {
      await this.storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }
}

// Singleton instance
export const settingsRepository = new SettingsRepositoryImpl();
