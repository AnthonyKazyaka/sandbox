/**
 * Priority Algorithm
 * Calculates priority scores for games to help decide what to play next
 */

import { storage } from './storage.js';

/**
 * Game status constants (duplicated to avoid circular imports)
 */
const STATUS = {
  BACKLOG: 'backlog',
  PLAYING: 'playing',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned',
  WISHLIST: 'wishlist'
};

/**
 * Default weight configuration
 */
const DEFAULT_WEIGHTS = {
  interest: 30,      // User's personal interest level (1-5 stars)
  age: 20,           // How long game has been in backlog
  length: 15,        // Shorter games get higher priority
  diversity: 10,     // Bonus for playing different genres
  metacritic: 5,     // Critical reception
  manual: 50         // User's manual priority adjustment
};

/**
 * Priority Calculator Class
 */
class PriorityCalculator {
  constructor() {
    this.weights = null;
  }

  /**
   * Get current weights from storage or defaults
   */
  getWeights() {
    if (this.weights) return this.weights;
    
    try {
      const settings = storage.getSettings();
      this.weights = { ...DEFAULT_WEIGHTS, ...settings.priorityWeights };
    } catch {
      this.weights = DEFAULT_WEIGHTS;
    }
    
    return this.weights;
  }

  /**
   * Update weights
   */
  updateWeights(newWeights) {
    this.weights = { ...this.getWeights(), ...newWeights };
    storage.updatePriorityWeights(this.weights);
    return this.weights;
  }

  /**
   * Reset weights to defaults
   */
  resetWeights() {
    this.weights = { ...DEFAULT_WEIGHTS };
    storage.updatePriorityWeights(this.weights);
    return this.weights;
  }

  /**
   * Calculate priority score for a single game
   */
  calculateScore(game, context = {}) {
    const weights = this.getWeights();
    let score = 0;
    const breakdown = {};

    // 1. Interest Level (1-5 stars → weighted points)
    const interestScore = (game.interestLevel || 3) * (weights.interest / 5);
    score += interestScore;
    breakdown.interest = Math.round(interestScore);

    // 2. Backlog Age (older games get more points)
    const ageScore = this.calculateAgeScore(game, weights.age);
    score += ageScore;
    breakdown.age = Math.round(ageScore);

    // 3. Game Length (shorter games preferred for "quick wins")
    const lengthScore = this.calculateLengthScore(game, weights.length);
    score += lengthScore;
    breakdown.length = Math.round(lengthScore);

    // 4. Genre Diversity (bonus if different from recently played)
    const diversityScore = this.calculateDiversityScore(game, context.recentGenres, weights.diversity);
    score += diversityScore;
    breakdown.diversity = Math.round(diversityScore);

    // 5. Metacritic Score (higher rated games get small bonus)
    const metacriticScore = this.calculateMetacriticScore(game, weights.metacritic);
    score += metacriticScore;
    breakdown.metacritic = Math.round(metacriticScore);

    // 6. Manual Priority Adjustment
    const manualScore = (game.manualPriority || 0) * (weights.manual / 10);
    score += manualScore;
    breakdown.manual = Math.round(manualScore);

    return {
      total: Math.round(score),
      breakdown,
      maxPossible: this.calculateMaxScore()
    };
  }

  /**
   * Calculate age score
   * Games older in backlog get higher priority (up to a cap)
   */
  calculateAgeScore(game, maxPoints) {
    if (!game.createdAt) return maxPoints / 2;
    
    const addedDate = new Date(game.createdAt);
    const now = new Date();
    const daysSinceAdded = Math.floor((now - addedDate) / (1000 * 60 * 60 * 24));
    
    // Max bonus at 365 days (1 year)
    const ageFactor = Math.min(daysSinceAdded / 365, 1);
    return ageFactor * maxPoints;
  }

  /**
   * Calculate length score
   * Shorter games get higher priority (easier to finish)
   */
  calculateLengthScore(game, maxPoints) {
    const hours = game.estimatedHours;
    
    if (!hours || hours <= 0) {
      return maxPoints / 2; // Unknown length gets middle score
    }
    
    // Scoring tiers:
    // 0-10 hours: Full points
    // 10-30 hours: 75% points
    // 30-50 hours: 50% points
    // 50-100 hours: 25% points
    // 100+ hours: 10% points
    
    if (hours <= 10) return maxPoints;
    if (hours <= 30) return maxPoints * 0.75;
    if (hours <= 50) return maxPoints * 0.5;
    if (hours <= 100) return maxPoints * 0.25;
    return maxPoints * 0.1;
  }

  /**
   * Calculate diversity score
   * Games with genres different from recently played get bonus
   */
  calculateDiversityScore(game, recentGenres = [], maxPoints) {
    if (!game.genres || game.genres.length === 0) {
      return maxPoints / 2;
    }
    
    if (recentGenres.length === 0) {
      return maxPoints; // No recent games, full diversity bonus
    }
    
    const gameGenres = game.genres.map(g => 
      (typeof g === 'string' ? g : g.name).toLowerCase()
    );
    
    const recentSet = new Set(recentGenres.map(g => g.toLowerCase()));
    
    // Check how many genres overlap
    const overlapping = gameGenres.filter(g => recentSet.has(g)).length;
    const overlapRatio = overlapping / gameGenres.length;
    
    // Lower overlap = higher score
    return (1 - overlapRatio) * maxPoints;
  }

  /**
   * Calculate metacritic score contribution
   * Higher rated games get small bonus
   */
  calculateMetacriticScore(game, maxPoints) {
    const score = game.metacriticScore;
    
    if (!score || score <= 0) {
      return 0; // No bonus if no score
    }
    
    // Normalize 0-100 to 0-maxPoints
    return (score / 100) * maxPoints;
  }

  /**
   * Calculate maximum possible score
   */
  calculateMaxScore() {
    const weights = this.getWeights();
    return weights.interest + 
           weights.age + 
           weights.length + 
           weights.diversity + 
           weights.metacritic + 
           weights.manual;
  }

  /**
   * Get prioritized list of games
   */
  getPrioritizedList(games, options = {}) {
    const {
      limit = null,
      excludeStatus = [STATUS.COMPLETED, STATUS.ABANDONED],
      availableTime = null, // Hours available to play
      preferredGenres = [],
      recentGenres = []
    } = options;

    // Filter games
    let filteredGames = games.filter(game => {
      if (excludeStatus.includes(game.status)) return false;
      
      // If available time specified, exclude games that are too long
      if (availableTime && game.estimatedHours) {
        // Allow games up to 2x available time (can play in sessions)
        if (game.estimatedHours > availableTime * 2) return false;
      }
      
      return true;
    });

    // Calculate scores with context
    const context = { recentGenres };
    const scoredGames = filteredGames.map(game => ({
      game,
      priority: this.calculateScore(game, context)
    }));

    // Apply preferred genres boost
    if (preferredGenres.length > 0) {
      for (const item of scoredGames) {
        const gameGenres = (item.game.genres || []).map(g => 
          (typeof g === 'string' ? g : g.name).toLowerCase()
        );
        
        const hasPreferred = preferredGenres.some(pg => 
          gameGenres.includes(pg.toLowerCase())
        );
        
        if (hasPreferred) {
          item.priority.total += 20; // Bonus for preferred genres
          item.priority.breakdown.preferredGenre = 20;
        }
      }
    }

    // Sort by total score (descending)
    scoredGames.sort((a, b) => b.priority.total - a.priority.total);

    // Apply limit
    if (limit && limit > 0) {
      return scoredGames.slice(0, limit);
    }

    return scoredGames;
  }

  /**
   * Get top N games to play next
   */
  getTopPicks(games, count = 5, options = {}) {
    return this.getPrioritizedList(games, { ...options, limit: count });
  }

  /**
   * Get recommendations based on available time
   */
  getRecommendationsByTime(games, availableHours, count = 5) {
    const options = {
      availableTime: availableHours,
      limit: count
    };

    // Get recent genres from currently playing / recently completed
    const recentGames = games
      .filter(g => g.status === STATUS.PLAYING || 
                   (g.status === STATUS.COMPLETED && g.completedAt))
      .sort((a, b) => {
        const dateA = new Date(a.completedAt || a.startedAt || 0);
        const dateB = new Date(b.completedAt || b.startedAt || 0);
        return dateB - dateA;
      })
      .slice(0, 5);

    const recentGenres = [];
    for (const game of recentGames) {
      if (game.genres) {
        for (const genre of game.genres) {
          const name = typeof genre === 'string' ? genre : genre.name;
          recentGenres.push(name);
        }
      }
    }

    options.recentGenres = recentGenres;

    return this.getPrioritizedList(games, options);
  }

  /**
   * Get quick wins (short, high-interest games)
   */
  getQuickWins(games, maxHours = 15, count = 5) {
    const shortGames = games.filter(game => 
      game.status === STATUS.BACKLOG &&
      game.estimatedHours &&
      game.estimatedHours <= maxHours
    );

    // Custom scoring that heavily weights length
    const customWeights = {
      ...this.getWeights(),
      length: 50, // Double the length weight
      interest: 40
    };

    const originalWeights = this.weights;
    this.weights = customWeights;

    const results = this.getPrioritizedList(shortGames, { limit: count });

    this.weights = originalWeights;
    return results;
  }

  /**
   * Get games by mood/preference
   */
  getByMood(games, mood) {
    const moodGenres = {
      relaxing: ['puzzle', 'simulation', 'casual', 'adventure'],
      action: ['action', 'shooter', 'fighting', 'hack and slash'],
      story: ['rpg', 'adventure', 'visual novel', 'narrative'],
      competitive: ['sports', 'racing', 'fighting', 'strategy'],
      creative: ['simulation', 'sandbox', 'building', 'crafting'],
      challenging: ['souls-like', 'roguelike', 'strategy', 'puzzle'],
      social: ['mmo', 'multiplayer', 'party', 'co-op']
    };

    const preferredGenres = moodGenres[mood.toLowerCase()] || [];
    
    if (preferredGenres.length === 0) {
      return this.getTopPicks(games, 5);
    }

    return this.getPrioritizedList(games, {
      preferredGenres,
      limit: 5
    });
  }

  /**
   * Explain priority score in human-readable format
   */
  explainScore(game, priority) {
    const weights = this.getWeights();
    const explanations = [];

    // Interest
    const interestText = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
    explanations.push(
      `Interest: ${interestText[game.interestLevel - 1] || 'Medium'} (+${priority.breakdown.interest})`
    );

    // Age
    if (game.createdAt) {
      const days = Math.floor((new Date() - new Date(game.createdAt)) / (1000 * 60 * 60 * 24));
      explanations.push(`In backlog: ${days} days (+${priority.breakdown.age})`);
    }

    // Length
    if (game.estimatedHours) {
      explanations.push(`Length: ~${game.estimatedHours}h (+${priority.breakdown.length})`);
    }

    // Diversity
    if (priority.breakdown.diversity > 0) {
      explanations.push(`Genre variety bonus: +${priority.breakdown.diversity}`);
    }

    // Metacritic
    if (game.metacriticScore) {
      explanations.push(`Metacritic: ${game.metacriticScore} (+${priority.breakdown.metacritic})`);
    }

    // Manual
    if (game.manualPriority && game.manualPriority !== 0) {
      const direction = game.manualPriority > 0 ? 'boosted' : 'lowered';
      explanations.push(`Manually ${direction}: ${game.manualPriority > 0 ? '+' : ''}${priority.breakdown.manual}`);
    }

    return {
      summary: `Priority Score: ${priority.total}/${priority.maxPossible}`,
      details: explanations
    };
  }
}

// Export singleton instance
export const priorityCalculator = new PriorityCalculator();
export { PriorityCalculator, DEFAULT_WEIGHTS };
