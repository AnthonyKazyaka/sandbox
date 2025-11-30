/**
 * RAWG API Wrapper
 * Handles all communication with the RAWG Video Games Database API
 * https://rawg.io/apidocs
 */

import { CONFIG } from '../js/config.js';

/**
 * API Response Cache
 * Caches responses in localStorage to minimize API calls
 */
class ApiCache {
  constructor(cacheName = 'rawgApiCache', maxAge = CONFIG.cache.maxAge) {
    this.cacheName = cacheName;
    this.maxAge = maxAge;
  }

  /**
   * Generate cache key from URL using simple hash
   */
  getKey(url) {
    // Simple hash function to create a unique key
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `cache_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Store data in cache
   */
  set(url, data) {
    try {
      const cache = this.getCache();
      const key = this.getKey(url);
      cache[key] = {
        data,
        timestamp: Date.now(),
        url
      };
      
      // Check cache size before saving
      const cacheStr = JSON.stringify(cache);
      const sizeMB = new Blob([cacheStr]).size / (1024 * 1024);
      
      if (sizeMB > CONFIG.cache.maxSizeMB) {
        this.pruneOldest(cache);
      }
      
      localStorage.setItem(this.cacheName, JSON.stringify(cache));
    } catch (error) {
      console.warn('Cache set failed:', error);
    }
  }

  /**
   * Get data from cache
   */
  get(url) {
    try {
      const cache = this.getCache();
      const key = this.getKey(url);
      const item = cache[key];
      
      if (!item) return null;
      
      // Check if expired
      if (Date.now() - item.timestamp > this.maxAge) {
        delete cache[key];
        localStorage.setItem(this.cacheName, JSON.stringify(cache));
        return null;
      }
      
      return item.data;
    } catch (error) {
      console.warn('Cache get failed:', error);
      return null;
    }
  }

  /**
   * Get full cache object
   */
  getCache() {
    try {
      return JSON.parse(localStorage.getItem(this.cacheName) || '{}');
    } catch {
      return {};
    }
  }

  /**
   * Remove oldest entries to free space
   */
  pruneOldest(cache) {
    const entries = Object.entries(cache);
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 25%
    const toRemove = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      delete cache[entries[i][0]];
    }
  }

  /**
   * Clear entire cache
   */
  clear() {
    localStorage.removeItem(this.cacheName);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const cache = this.getCache();
    const entries = Object.values(cache);
    const cacheStr = JSON.stringify(cache);
    
    return {
      entries: entries.length,
      sizeMB: (new Blob([cacheStr]).size / (1024 * 1024)).toFixed(2),
      oldestAge: entries.length > 0 
        ? Math.round((Date.now() - Math.min(...entries.map(e => e.timestamp))) / (1000 * 60 * 60))
        : 0
    };
  }
}

/**
 * Rate Limiter
 * Ensures we don't exceed API rate limits
 */
class RateLimiter {
  constructor(requestsPerSecond = CONFIG.rawg.rateLimit.requestsPerSecond) {
    this.minInterval = 1000 / requestsPerSecond;
    this.lastRequest = 0;
  }

  async wait() {
    const now = Date.now();
    const elapsed = now - this.lastRequest;
    
    if (elapsed < this.minInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minInterval - elapsed));
    }
    
    this.lastRequest = Date.now();
  }
}

/**
 * Main RAWG API Class
 */
class RAWGApi {
  constructor() {
    this.apiKey = CONFIG.rawg.apiKey;
    this.baseUrl = CONFIG.rawg.baseUrl;
    this.cache = new ApiCache();
    this.rateLimiter = new RateLimiter();
  }

  /**
   * Make API request with caching and rate limiting
   */
  async request(endpoint, params = {}) {
    const url = this.buildUrl(endpoint, params);
    
    // Check cache first
    const cached = this.cache.get(url);
    if (cached) {
      return { ...cached, fromCache: true };
    }
    
    // Rate limit
    await this.rateLimiter.wait();
    
    // Make request with retry logic
    let lastError;
    for (let attempt = 1; attempt <= CONFIG.api.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.api.timeout);
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Cache successful response
        this.cache.set(url, data);
        
        return { ...data, fromCache: false };
      } catch (error) {
        lastError = error;
        if (attempt < CONFIG.api.retryAttempts) {
          await new Promise(r => setTimeout(r, CONFIG.api.retryDelay * attempt));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Build URL with query parameters
   */
  buildUrl(endpoint, params) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set('key', this.apiKey);
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    }
    
    return url.toString();
  }

  /**
   * Search for games by query
   * @param {string} query - Search term
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchGames(query, options = {}) {
    const {
      pageSize = 10,
      page = 1,
      platforms = null,
      genres = null,
      ordering = '-rating'
    } = options;

    const params = {
      search: query,
      page_size: pageSize,
      page,
      ordering
    };

    if (platforms) params.platforms = platforms;
    if (genres) params.genres = genres;

    const response = await this.request('/games', params);
    
    return {
      count: response.count,
      next: response.next,
      previous: response.previous,
      results: response.results.map(game => this.transformGameSummary(game)),
      fromCache: response.fromCache
    };
  }

  /**
   * Get detailed game information by ID
   * @param {number} gameId - RAWG game ID
   * @returns {Promise<Object>} Game details
   */
  async getGameById(gameId) {
    const response = await this.request(`/games/${gameId}`);
    return {
      ...this.transformGameDetails(response),
      fromCache: response.fromCache
    };
  }

  /**
   * Get detailed game information by slug
   * @param {string} slug - RAWG game slug
   * @returns {Promise<Object>} Game details
   */
  async getGameBySlug(slug) {
    const response = await this.request(`/games/${slug}`);
    return {
      ...this.transformGameDetails(response),
      fromCache: response.fromCache
    };
  }

  /**
   * Get game screenshots
   * @param {number} gameId - RAWG game ID
   * @returns {Promise<Array>} Screenshots
   */
  async getGameScreenshots(gameId) {
    const response = await this.request(`/games/${gameId}/screenshots`);
    return response.results.map(s => ({
      id: s.id,
      image: s.image,
      width: s.width,
      height: s.height
    }));
  }

  /**
   * Get list of platforms
   * @returns {Promise<Array>} Platforms
   */
  async getPlatforms() {
    const response = await this.request('/platforms', { page_size: 50 });
    return response.results.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      gamesCount: p.games_count
    }));
  }

  /**
   * Get list of genres
   * @returns {Promise<Array>} Genres
   */
  async getGenres() {
    const response = await this.request('/genres', { page_size: 50 });
    return response.results.map(g => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      gamesCount: g.games_count
    }));
  }

  /**
   * Transform RAWG game summary to our format
   */
  transformGameSummary(rawgGame) {
    return {
      rawgId: rawgGame.id,
      rawgSlug: rawgGame.slug,
      title: rawgGame.name,
      released: rawgGame.released,
      releaseYear: rawgGame.released ? new Date(rawgGame.released).getFullYear() : null,
      coverImage: rawgGame.background_image,
      metacriticScore: rawgGame.metacritic,
      rating: rawgGame.rating ? Math.round(rawgGame.rating) : null,
      ratingsCount: rawgGame.ratings_count,
      estimatedHours: rawgGame.playtime || null,
      platforms: rawgGame.platforms?.map(p => p.platform.name) || [],
      genres: rawgGame.genres?.map(g => g.name) || [],
      esrbRating: rawgGame.esrb_rating?.name || null
    };
  }

  /**
   * Transform RAWG game details to our format
   */
  transformGameDetails(rawgGame) {
    return {
      rawgId: rawgGame.id,
      rawgSlug: rawgGame.slug,
      title: rawgGame.name,
      description: rawgGame.description_raw || '',
      released: rawgGame.released,
      releaseYear: rawgGame.released ? new Date(rawgGame.released).getFullYear() : null,
      coverImage: rawgGame.background_image,
      metacriticScore: rawgGame.metacritic,
      metacriticUrl: rawgGame.metacritic_url,
      rating: rawgGame.rating ? Math.round(rawgGame.rating) : null,
      ratingsCount: rawgGame.ratings_count,
      estimatedHours: rawgGame.playtime || null,
      platforms: rawgGame.platforms?.map(p => ({
        id: p.platform.id,
        name: p.platform.name,
        slug: p.platform.slug
      })) || [],
      genres: rawgGame.genres?.map(g => ({
        id: g.id,
        name: g.name,
        slug: g.slug
      })) || [],
      developers: rawgGame.developers?.map(d => d.name) || [],
      publishers: rawgGame.publishers?.map(p => p.name) || [],
      esrbRating: rawgGame.esrb_rating?.name || null,
      website: rawgGame.website,
      redditUrl: rawgGame.reddit_url,
      tags: rawgGame.tags?.slice(0, 10).map(t => t.name) || []
    };
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Clear API cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
export const rawgApi = new RAWGApi();
export { RAWGApi, ApiCache, RateLimiter };
