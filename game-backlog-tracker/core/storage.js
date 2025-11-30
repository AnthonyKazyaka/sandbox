/**
 * Storage Layer
 * Handles all data persistence using localStorage
 * Supports JSON import/export for backup and data portability
 */

const STORAGE_KEY = 'gameBacklogTracker';
const STORAGE_VERSION = 1;

/**
 * Default data structure
 */
const DEFAULT_DATA = {
  version: STORAGE_VERSION,
  games: [],
  settings: {
    theme: 'dark',
    defaultView: 'backlog',
    priorityWeights: {
      interest: 30,
      age: 20,
      length: 15,
      diversity: 10,
      metacritic: 5,
      manual: 50
    },
    showCompletedInPriority: false,
    defaultPlatform: null
  },
  stats: {
    totalAdded: 0,
    totalCompleted: 0,
    totalAbandoned: 0,
    createdAt: null,
    lastModified: null
  }
};

/**
 * Storage class for managing application data
 */
class Storage {
  constructor(storageKey = STORAGE_KEY) {
    this.storageKey = storageKey;
    this.listeners = new Set();
    this.data = null;
  }

  /**
   * Initialize storage - load from localStorage or create default
   */
  initialize() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        this.data = this.migrate(parsed);
      } else {
        this.data = this.createDefault();
        this.save();
      }
      
      return this.data;
    } catch (error) {
      console.error('Storage initialization failed:', error);
      this.data = this.createDefault();
      return this.data;
    }
  }

  /**
   * Create default data structure
   */
  createDefault() {
    return {
      ...JSON.parse(JSON.stringify(DEFAULT_DATA)),
      stats: {
        ...DEFAULT_DATA.stats,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    };
  }

  /**
   * Migrate data from older versions
   */
  migrate(data) {
    // Version 0 -> 1: Add stats if missing
    if (!data.version || data.version < 1) {
      data.version = 1;
      data.stats = data.stats || {
        totalAdded: data.games?.length || 0,
        totalCompleted: data.games?.filter(g => g.status === 'completed').length || 0,
        totalAbandoned: data.games?.filter(g => g.status === 'abandoned').length || 0,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
    }
    
    // Add settings defaults if missing
    data.settings = {
      ...DEFAULT_DATA.settings,
      ...data.settings
    };
    
    return data;
  }

  /**
   * Save data to localStorage
   */
  save() {
    try {
      this.data.stats.lastModified = new Date().toISOString();
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      this.notifyListeners('save', this.data);
      return true;
    } catch (error) {
      console.error('Storage save failed:', error);
      
      // Check if storage is full
      if (error.name === 'QuotaExceededError') {
        throw new Error('Storage is full. Please export and clear old data.');
      }
      
      return false;
    }
  }

  /**
   * Get all data
   */
  getData() {
    if (!this.data) {
      this.initialize();
    }
    return this.data;
  }

  // ===================
  // GAMES OPERATIONS
  // ===================

  /**
   * Get all games
   */
  getGames() {
    return this.getData().games;
  }

  /**
   * Get game by ID
   */
  getGameById(id) {
    return this.getGames().find(g => g.id === id);
  }

  /**
   * Get games by status
   */
  getGamesByStatus(status) {
    return this.getGames().filter(g => g.status === status);
  }

  /**
   * Add a new game
   */
  addGame(game) {
    const games = this.getGames();
    games.push(game);
    this.data.stats.totalAdded++;
    this.save();
    this.notifyListeners('gameAdded', game);
    return game;
  }

  /**
   * Update a game
   */
  updateGame(id, updates) {
    const games = this.getGames();
    const index = games.findIndex(g => g.id === id);
    
    if (index === -1) {
      throw new Error(`Game not found: ${id}`);
    }
    
    const oldGame = games[index];
    const updatedGame = {
      ...oldGame,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Track status changes
    if (updates.status && updates.status !== oldGame.status) {
      if (updates.status === 'completed') {
        this.data.stats.totalCompleted++;
        updatedGame.completedAt = new Date().toISOString();
      } else if (updates.status === 'abandoned') {
        this.data.stats.totalAbandoned++;
        updatedGame.abandonedAt = new Date().toISOString();
      }
    }
    
    games[index] = updatedGame;
    this.save();
    this.notifyListeners('gameUpdated', updatedGame);
    return updatedGame;
  }

  /**
   * Delete a game
   */
  deleteGame(id) {
    const games = this.getGames();
    const index = games.findIndex(g => g.id === id);
    
    if (index === -1) {
      throw new Error(`Game not found: ${id}`);
    }
    
    const deleted = games.splice(index, 1)[0];
    this.save();
    this.notifyListeners('gameDeleted', deleted);
    return deleted;
  }

  /**
   * Bulk update games
   */
  bulkUpdateGames(updates) {
    // updates is array of { id, changes }
    const games = this.getGames();
    const results = [];
    
    for (const { id, changes } of updates) {
      const index = games.findIndex(g => g.id === id);
      if (index !== -1) {
        games[index] = { ...games[index], ...changes, updatedAt: new Date().toISOString() };
        results.push(games[index]);
      }
    }
    
    this.save();
    this.notifyListeners('bulkUpdate', results);
    return results;
  }

  // ===================
  // SETTINGS OPERATIONS
  // ===================

  /**
   * Get all settings
   */
  getSettings() {
    return this.getData().settings;
  }

  /**
   * Update settings
   */
  updateSettings(updates) {
    this.data.settings = {
      ...this.data.settings,
      ...updates
    };
    this.save();
    this.notifyListeners('settingsUpdated', this.data.settings);
    return this.data.settings;
  }

  /**
   * Get priority weights
   */
  getPriorityWeights() {
    return this.getSettings().priorityWeights;
  }

  /**
   * Update priority weights
   */
  updatePriorityWeights(weights) {
    this.data.settings.priorityWeights = {
      ...this.data.settings.priorityWeights,
      ...weights
    };
    this.save();
    return this.data.settings.priorityWeights;
  }

  // ===================
  // STATS OPERATIONS
  // ===================

  /**
   * Get statistics
   */
  getStats() {
    const games = this.getGames();
    const baseStats = this.getData().stats;
    
    // Calculate derived stats
    const byStatus = {
      backlog: 0,
      playing: 0,
      completed: 0,
      abandoned: 0,
      wishlist: 0
    };
    
    let totalEstimatedHours = 0;
    let totalActualHours = 0;
    const genreCounts = {};
    const platformCounts = {};
    
    for (const game of games) {
      byStatus[game.status] = (byStatus[game.status] || 0) + 1;
      
      if (game.estimatedHours) {
        totalEstimatedHours += game.estimatedHours;
      }
      if (game.actualHours) {
        totalActualHours += game.actualHours;
      }
      
      // Count genres
      if (Array.isArray(game.genres)) {
        for (const genre of game.genres) {
          const name = typeof genre === 'string' ? genre : genre.name;
          genreCounts[name] = (genreCounts[name] || 0) + 1;
        }
      }
      
      // Count platforms
      if (game.platform) {
        platformCounts[game.platform] = (platformCounts[game.platform] || 0) + 1;
      }
    }
    
    return {
      ...baseStats,
      totalGames: games.length,
      byStatus,
      totalEstimatedHours,
      totalActualHours,
      completionRate: games.length > 0 
        ? Math.round((byStatus.completed / games.length) * 100) 
        : 0,
      genreDistribution: genreCounts,
      platformDistribution: platformCounts,
      averageRating: this.calculateAverageRating(games),
      averageMetacritic: this.calculateAverageMetacritic(games)
    };
  }

  calculateAverageRating(games) {
    const rated = games.filter(g => g.userRating > 0);
    if (rated.length === 0) return 0;
    return Math.round((rated.reduce((sum, g) => sum + g.userRating, 0) / rated.length) * 10) / 10;
  }

  calculateAverageMetacritic(games) {
    const withScore = games.filter(g => g.metacriticScore > 0);
    if (withScore.length === 0) return 0;
    return Math.round(withScore.reduce((sum, g) => sum + g.metacriticScore, 0) / withScore.length);
  }

  // ===================
  // IMPORT/EXPORT
  // ===================

  /**
   * Export all data as JSON string
   */
  exportData() {
    return JSON.stringify(this.getData(), null, 2);
  }

  /**
   * Export data as downloadable file
   */
  exportToFile(filename = 'game-backlog-export.json') {
    const data = this.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Import data from JSON string
   */
  importData(jsonString, options = { merge: false }) {
    try {
      const imported = JSON.parse(jsonString);
      
      // Validate structure
      if (!imported.games || !Array.isArray(imported.games)) {
        throw new Error('Invalid data structure: games array missing');
      }
      
      if (options.merge) {
        // Merge with existing data
        const existing = this.getData();
        const existingIds = new Set(existing.games.map(g => g.id));
        
        for (const game of imported.games) {
          if (!existingIds.has(game.id)) {
            existing.games.push(game);
          }
        }
        
        this.data = existing;
      } else {
        // Replace all data
        this.data = this.migrate(imported);
      }
      
      this.save();
      this.notifyListeners('dataImported', this.data);
      return { success: true, gamesCount: this.data.games.length };
    } catch (error) {
      console.error('Import failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Import data from file input
   */
  async importFromFile(file, options = { merge: false }) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = this.importData(e.target.result, options);
        resolve(result);
      };
      reader.onerror = () => {
        resolve({ success: false, error: 'Failed to read file' });
      };
      reader.readAsText(file);
    });
  }

  // ===================
  // RESET & CLEAR
  // ===================

  /**
   * Clear all data and reset to default
   */
  reset() {
    this.data = this.createDefault();
    this.save();
    this.notifyListeners('reset', this.data);
    return this.data;
  }

  /**
   * Clear only games, keep settings
   */
  clearGames() {
    this.data.games = [];
    this.save();
    this.notifyListeners('gamesCleared', null);
    return this.data;
  }

  // ===================
  // EVENT LISTENERS
  // ===================

  /**
   * Subscribe to storage changes
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event, data) {
    for (const callback of this.listeners) {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Storage listener error:', error);
      }
    }
  }

  // ===================
  // STORAGE INFO
  // ===================

  /**
   * Get storage usage information
   */
  getStorageInfo() {
    const data = localStorage.getItem(this.storageKey) || '';
    const sizeBytes = new Blob([data]).size;
    const sizeMB = sizeBytes / (1024 * 1024);
    
    // Estimate available space (localStorage typically has 5MB limit)
    const estimatedLimit = 5;
    const usedPercent = (sizeMB / estimatedLimit) * 100;
    
    return {
      sizeBytes,
      sizeMB: sizeMB.toFixed(2),
      estimatedLimitMB: estimatedLimit,
      usedPercent: usedPercent.toFixed(1),
      gamesCount: this.getGames().length
    };
  }
}

// Export singleton instance
export const storage = new Storage();
export { Storage, DEFAULT_DATA, STORAGE_VERSION };
