/**
 * get_priority_list tool logic, kept separate from the stdio server so it can
 * be unit-tested.
 */

/**
 * Calculate priority score for a game
 */
function calculatePriority(game, weights, allGames) {
  const scores = {
    interest: (game.interestLevel || 3) * 10,
    age: Math.min(100, ((Date.now() - new Date(game.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30))),
    length: game.estimatedHours ? Math.max(0, 100 - game.estimatedHours * 2) : 50,
    metacritic: game.metacriticScore || 0,
    manual: game.manualPriority || 0,
    diversity: 0 // Simplified for MCP
  };

  let total = 0;
  for (const [key, value] of Object.entries(scores)) {
    total += (value * (weights[key] || 0)) / 100;
  }

  return Math.round(total);
}

/**
 * Rank backlog games for the get_priority_list tool.
 * @param {Object} data - Stored backlog data ({ games, settings })
 * @param {Object} args - Tool arguments ({ maxHours, limit })
 */
export function getPriorityList(data, args = {}) {
        const backlogGames = data.games.filter(g => g.status === 'backlog');
        
        // Apply max hours filter
        let filtered = backlogGames;
        if (args.maxHours) {
          filtered = backlogGames.filter(g => 
            !g.estimatedHours || g.estimatedHours <= args.maxHours
          );
        }

        // Calculate priorities
        const withPriority = filtered.map(game => ({
          game,
          priority: calculatePriority(game, data.settings.priorityWeights, data.games)
        }));

        // Sort by priority
        withPriority.sort((a, b) => b.priority - a.priority);

        // Limit results
        const limit = args.limit || 10;
        const results = withPriority.slice(0, limit);

        const formatted = results.map((item, index) => ({
          rank: index + 1,
          title: item.game.title,
          platform: item.game.platform,
          estimatedHours: item.game.estimatedHours,
          interestLevel: item.game.interestLevel,
          priority: item.priority,
          id: item.game.id
        }));
  return formatted;
}
