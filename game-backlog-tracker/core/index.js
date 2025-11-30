/**
 * Core Library Index
 * Exports all core functionality for use by web app and MCP server
 */

export { rawgApi, RAWGApi, ApiCache, RateLimiter } from './rawg-api.js';
export { storage, Storage, DEFAULT_DATA, STORAGE_VERSION } from './storage.js';
export { dataManager, DataManager, GAME_STATUS, generateId } from './data-manager.js';
export { priorityCalculator, PriorityCalculator, DEFAULT_WEIGHTS } from './priority.js';

/**
 * Version info
 */
export const CORE_VERSION = '1.0.0';
