/**
 * Data Manager
 * High-level API for managing game backlog data
 * Combines storage operations with RAWG API enrichment
 */

import { storage } from './storage.js';
import { rawgApi } from './rawg-api.js';

/**
 * Game status options
 */
export const GAME_STATUS = {
  BACKLOG: 'backlog',
  PLAYING: 'playing',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned',
  WISHLIST: 'wishlist'
};

/**
 * Generate unique ID
 */
export function generateId() {
  return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Data Manager Class
 */
class DataManager {
  constructor() {
    this.storage = storage;
    this.api = rawgApi;
    this.initialized = false;
  }

  /**
   * Initialize the data manager
   */
  initialize() {
    if (this.initialized) return;
    this.storage.initialize();
    this.initialized = true;
    return this.getStats();
  }

  // ===================
  // GAME CRUD OPERATIONS
  // ===================

  /**
   * Create a new game entry
   * @param {Object} gameData - Game data
   * @param {boolean} enrichFromApi - Whether to fetch additional data from RAWG
   */
  async createGame(gameData, enrichFromApi = false) {
    // Validate required fields
    if (!gameData.title) {
      throw new Error('Game title is required');
    }

    // Create game object with defaults
    const game = {
      id: generateId(),
      title: gameData.title,
      platform: gameData.platform || 'PC',
      status: gameData.status || GAME_STATUS.BACKLOG,
      genres: gameData.genres || [],
      releaseYear: gameData.releaseYear || null,
      estimatedHours: gameData.estimatedHours || null,
      actualHours: 0,
      coverImage: gameData.coverImage || null,
      userRating: gameData.userRating || 0,
      metacriticScore: gameData.metacriticScore || null,
      interestLevel: gameData.interestLevel || 3,
      manualPriority: gameData.manualPriority || 0,
      purchaseDate: gameData.purchaseDate || null,
      pricePaid: gameData.pricePaid || null,
      startedAt: null,
      completedAt: null,
      abandonedAt: null,
      notes: gameData.notes || '',
      tags: gameData.tags || [],
      rawgId: gameData.rawgId || null,
      rawgSlug: gameData.rawgSlug || null,
      dataSource: gameData.rawgId ? 'rawg' : 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Enrich from RAWG if requested and we have a title
    if (enrichFromApi && !gameData.rawgId) {
      try {
        const enriched = await this.enrichGameFromSearch(game.title);
        if (enriched) {
          Object.assign(game, enriched);
        }
      } catch (error) {
        console.warn('Failed to enrich game from API:', error);
      }
    }

    return this.storage.addGame(game);
  }

  /**
   * Create game from RAWG search result
   */
  async createGameFromRawg(rawgId, additionalData = {}) {
    try {
      const rawgData = await this.api.getGameById(rawgId);
      
      const game = {
        id: generateId(),
        title: rawgData.title,
        platform: additionalData.platform || rawgData.platforms[0]?.name || 'PC',
        status: additionalData.status || GAME_STATUS.BACKLOG,
        genres: rawgData.genres.map(g => typeof g === 'string' ? g : g.name),
        releaseYear: rawgData.releaseYear,
        estimatedHours: rawgData.estimatedHours,
        actualHours: 0,
        coverImage: rawgData.coverImage,
        userRating: additionalData.userRating || 0,
        metacriticScore: rawgData.metacriticScore,
        interestLevel: additionalData.interestLevel || 3,
        manualPriority: 0,
        purchaseDate: additionalData.purchaseDate || null,
        pricePaid: additionalData.pricePaid || null,
        startedAt: null,
        completedAt: null,
        abandonedAt: null,
        notes: additionalData.notes || '',
        tags: rawgData.tags || [],
        rawgId: rawgData.rawgId,
        rawgSlug: rawgData.rawgSlug,
        description: rawgData.description,
        developers: rawgData.developers,
        publishers: rawgData.publishers,
        dataSource: 'rawg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return this.storage.addGame(game);
    } catch (error) {
      throw new Error(`Failed to create game from RAWG: ${error.message}`);
    }
  }

  /**
   * Enrich game data by searching RAWG
   */
  async enrichGameFromSearch(title) {
    const results = await this.api.searchGames(title, { pageSize: 1 });
    
    if (results.results.length === 0) {
      return null;
    }

    const match = results.results[0];
    
    // Only use if title is reasonably similar
    if (!this.isTitleSimilar(title, match.title)) {
      return null;
    }

    return {
      rawgId: match.rawgId,
      rawgSlug: match.rawgSlug,
      coverImage: match.coverImage,
      metacriticScore: match.metacriticScore,
      estimatedHours: match.estimatedHours,
      releaseYear: match.releaseYear,
      genres: match.genres,
      dataSource: 'rawg'
    };
  }

  /**
   * Check if two titles are similar enough
   */
  isTitleSimilar(title1, title2) {
    const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const n1 = normalize(title1);
    const n2 = normalize(title2);
    
    // Check if one contains the other
    if (n1.includes(n2) || n2.includes(n1)) {
      return true;
    }
    
    // Simple similarity check (at least 70% of shorter string matches)
    const shorter = n1.length < n2.length ? n1 : n2;
    const longer = n1.length < n2.length ? n2 : n1;
    
    let matches = 0;
    for (const char of shorter) {
      if (longer.includes(char)) {
        matches++;
      }
    }
    
    return matches / shorter.length >= 0.7;
  }

  /**
   * Get a game by ID
   */
  getGame(id) {
    return this.storage.getGameById(id);
  }

  /**
   * Get all games
   */
  getAllGames() {
    return this.storage.getGames();
  }

  /**
   * Get games by status
   */
  getGamesByStatus(status) {
    return this.storage.getGamesByStatus(status);
  }

  /**
   * Get backlog games
   */
  getBacklog() {
    return this.getGamesByStatus(GAME_STATUS.BACKLOG);
  }

  /**
   * Get currently playing games
   */
  getCurrentlyPlaying() {
    return this.getGamesByStatus(GAME_STATUS.PLAYING);
  }

  /**
   * Get completed games
   */
  getCompleted() {
    return this.getGamesByStatus(GAME_STATUS.COMPLETED);
  }

  /**
   * Get wishlist games
   */
  getWishlist() {
    return this.getGamesByStatus(GAME_STATUS.WISHLIST);
  }

  /**
   * Update a game
   */
  updateGame(id, updates) {
    return this.storage.updateGame(id, updates);
  }

  /**
   * Delete a game
   */
  deleteGame(id) {
    return this.storage.deleteGame(id);
  }

  // ===================
  // STATUS TRANSITIONS
  // ===================

  /**
   * Start playing a game
   */
  startPlaying(id) {
    return this.storage.updateGame(id, {
      status: GAME_STATUS.PLAYING,
      startedAt: new Date().toISOString()
    });
  }

  /**
   * Mark a game as completed
   */
  completeGame(id, finalRating = null, notes = null) {
    const updates = {
      status: GAME_STATUS.COMPLETED,
      completedAt: new Date().toISOString()
    };
    
    if (finalRating !== null) {
      updates.userRating = finalRating;
    }
    if (notes !== null) {
      updates.notes = notes;
    }
    
    return this.storage.updateGame(id, updates);
  }

  /**
   * Abandon a game
   */
  abandonGame(id, reason = '') {
    return this.storage.updateGame(id, {
      status: GAME_STATUS.ABANDONED,
      abandonedAt: new Date().toISOString(),
      notes: reason ? `Abandoned: ${reason}` : undefined
    });
  }

  /**
   * Move game back to backlog
   */
  moveToBacklog(id) {
    return this.storage.updateGame(id, {
      status: GAME_STATUS.BACKLOG,
      startedAt: null
    });
  }

  /**
   * Move game to wishlist
   */
  moveToWishlist(id) {
    return this.storage.updateGame(id, {
      status: GAME_STATUS.WISHLIST
    });
  }

  /**
   * Log play time
   */
  logPlayTime(id, hours) {
    const game = this.getGame(id);
    if (!game) throw new Error(`Game not found: ${id}`);
    
    return this.storage.updateGame(id, {
      actualHours: (game.actualHours || 0) + hours
    });
  }

  // ===================
  // SEARCH & FILTER
  // ===================

  /**
   * Search games in backlog
   */
  searchGames(query, options = {}) {
    const games = this.getAllGames();
    const q = query.toLowerCase();
    
    let results = games.filter(game => {
      const matchesQuery = 
        game.title.toLowerCase().includes(q) ||
        game.notes?.toLowerCase().includes(q) ||
        game.tags?.some(t => t.toLowerCase().includes(q)) ||
        game.genres?.some(g => {
          const name = typeof g === 'string' ? g : g.name;
          return name.toLowerCase().includes(q);
        });
      
      return matchesQuery;
    });

    // Apply filters
    if (options.status) {
      results = results.filter(g => g.status === options.status);
    }
    if (options.platform) {
      results = results.filter(g => g.platform === options.platform);
    }
    if (options.genre) {
      results = results.filter(g => 
        g.genres?.some(genre => {
          const name = typeof genre === 'string' ? genre : genre.name;
          return name.toLowerCase() === options.genre.toLowerCase();
        })
      );
    }
    if (options.minRating) {
      results = results.filter(g => g.userRating >= options.minRating);
    }

    // Apply sorting
    if (options.sortBy) {
      results.sort((a, b) => {
        let aVal = a[options.sortBy];
        let bVal = b[options.sortBy];
        
        if (options.sortBy === 'title') {
          return options.sortOrder === 'desc' 
            ? bVal.localeCompare(aVal)
            : aVal.localeCompare(bVal);
        }
        
        aVal = aVal || 0;
        bVal = bVal || 0;
        
        return options.sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      });
    }

    return results;
  }

  /**
   * Get unique platforms from collection
   */
  getUniquePlatforms() {
    const games = this.getAllGames();
    const platforms = new Set(games.map(g => g.platform).filter(Boolean));
    return Array.from(platforms).sort();
  }

  /**
   * Get unique genres from collection
   */
  getUniqueGenres() {
    const games = this.getAllGames();
    const genres = new Set();
    
    for (const game of games) {
      if (game.genres) {
        for (const genre of game.genres) {
          const name = typeof genre === 'string' ? genre : genre.name;
          genres.add(name);
        }
      }
    }
    
    return Array.from(genres).sort();
  }

  // ===================
  // RAWG API INTEGRATION
  // ===================

  /**
   * Search RAWG for games
   */
  async searchRawg(query, options = {}) {
    return this.api.searchGames(query, options);
  }

  /**
   * Get game details from RAWG
   */
  async getRawgGameDetails(gameId) {
    return this.api.getGameById(gameId);
  }

  /**
   * Refresh game data from RAWG
   */
  async refreshFromRawg(id) {
    const game = this.getGame(id);
    if (!game || !game.rawgId) {
      throw new Error('Game not found or has no RAWG ID');
    }

    const rawgData = await this.api.getGameById(game.rawgId);
    
    return this.storage.updateGame(id, {
      coverImage: rawgData.coverImage,
      metacriticScore: rawgData.metacriticScore,
      estimatedHours: rawgData.estimatedHours,
      releaseYear: rawgData.releaseYear,
      genres: rawgData.genres.map(g => typeof g === 'string' ? g : g.name),
      dataSource: 'rawg'
    });
  }

  // ===================
  // STATS & ANALYTICS
  // ===================

  /**
   * Get overall statistics
   */
  getStats() {
    return this.storage.getStats();
  }

  /**
   * Get settings
   */
  getSettings() {
    return this.storage.getSettings();
  }

  /**
   * Update settings
   */
  updateSettings(updates) {
    return this.storage.updateSettings(updates);
  }

  // ===================
  // IMPORT/EXPORT
  // ===================

  /**
   * Export all data
   */
  exportData() {
    return this.storage.exportData();
  }

  /**
   * Export to file
   */
  exportToFile(filename) {
    return this.storage.exportToFile(filename);
  }

  /**
   * Import data
   */
  importData(jsonString, options) {
    return this.storage.importData(jsonString, options);
  }

  /**
   * Import from file
   */
  importFromFile(file, options) {
    return this.storage.importFromFile(file, options);
  }

  /**
   * Reset all data
   */
  reset() {
    return this.storage.reset();
  }

  // ===================
  // SUBSCRIPTIONS
  // ===================

  /**
   * Subscribe to data changes
   */
  subscribe(callback) {
    return this.storage.subscribe(callback);
  }
}

// Export singleton instance
export const dataManager = new DataManager();
export { DataManager };
