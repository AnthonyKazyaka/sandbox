/**
 * get_priority_list tool logic, kept separate from the stdio server so it can
 * be unit-tested. Scoring is delegated to the same PriorityCalculator the web
 * "Play Next" view uses, so both rank games identically.
 */

import { PriorityCalculator } from '../core/priority.js';

/**
 * Rank backlog games for the get_priority_list tool.
 * @param {Object} data - Stored backlog data ({ games, settings })
 * @param {Object} args - Tool arguments ({ maxHours, limit })
 * @returns {Array} Ranked rows for the tool response
 */
export function getPriorityList(data, args = {}) {
  let games = data.games.filter(g => g.status === 'backlog');

  // Hard cap on length; games with unknown length are kept
  if (args.maxHours) {
    games = games.filter(g => !g.estimatedHours || g.estimatedHours <= args.maxHours);
  }

  const calculator = new PriorityCalculator(data.settings?.priorityWeights);
  const ranked = calculator.getPrioritizedList(games, { limit: args.limit || 10 });

  return ranked.map((item, index) => ({
    rank: index + 1,
    title: item.game.title,
    platform: item.game.platform,
    estimatedHours: item.game.estimatedHours,
    interestLevel: item.game.interestLevel,
    priority: item.priority.total,
    breakdown: item.priority.breakdown,
    id: item.game.id
  }));
}
