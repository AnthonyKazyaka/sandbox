// AsyncStorage adapter implementation
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageAdapter } from './types';

export class AsyncStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    return AsyncStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    return AsyncStorage.removeItem(key);
  }

  async getAllKeys(): Promise<string[]> {
    const keys = await AsyncStorage.getAllKeys();
    return [...keys];
  }

  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    const results = await AsyncStorage.multiGet(keys);
    return results.map(([key, value]) => [key, value]);
  }

  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    return AsyncStorage.multiSet(keyValuePairs);
  }

  async multiRemove(keys: string[]): Promise<void> {
    return AsyncStorage.multiRemove(keys);
  }

  async clear(): Promise<void> {
    return AsyncStorage.clear();
  }
}

// Singleton instance
export const asyncStorageAdapter = new AsyncStorageAdapter();
