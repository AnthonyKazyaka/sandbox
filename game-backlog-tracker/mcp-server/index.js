#!/usr/bin/env node

/**
 * Game Backlog MCP Server
 * Provides AI assistants with tools to manage game backlogs
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

/**
 * Storage path for game backlog data
 */
const STORAGE_PATH = join(homedir(), '.game-backlog-tracker.json');

/**
 * Load game backlog data
 */
async function loadData() {
  try {
    const content = await readFile(STORAGE_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // Return default structure if file doesn't exist
    return {
      version: 1,
      games: [],
      settings: {
        theme: 'dark',
        priorityWeights: {
          interest: 30,
          age: 20,
          length: 15,
          diversity: 10,
          metacritic: 5,
          manual: 50
        }
      },
      stats: {
        totalAdded: 0,
        totalCompleted: 0,
        totalAbandoned: 0,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    };
  }
}

/**
 * Save game backlog data
 */
async function saveData(data) {
  data.stats.lastModified = new Date().toISOString();
  await writeFile(STORAGE_PATH, JSON.stringify(data, null, 2));
}

/**
 * Generate unique ID
 */
function generateId() {
  return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

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
 * Get statistics from game data
 */
function getStatistics(data) {
  const byStatus = {
    backlog: 0,
    playing: 0,
    completed: 0,
    abandoned: 0,
    wishlist: 0
  };

  const platforms = {};
  const genres = {};
  let totalHours = 0;

  for (const game of data.games) {
    byStatus[game.status] = (byStatus[game.status] || 0) + 1;
    
    if (game.platform) {
      platforms[game.platform] = (platforms[game.platform] || 0) + 1;
    }
    
    if (game.genres) {
      for (const genre of game.genres) {
        const name = typeof genre === 'string' ? genre : genre.name;
        genres[name] = (genres[name] || 0) + 1;
      }
    }
    
    if (game.estimatedHours) {
      totalHours += game.estimatedHours;
    }
  }

  return {
    totalGames: data.games.length,
    byStatus,
    platforms,
    genres,
    totalEstimatedHours: totalHours,
    completionRate: data.games.length > 0
      ? Math.round((byStatus.completed / data.games.length) * 100)
      : 0
  };
}

/**
 * Initialize MCP Server
 */
const server = new Server(
  {
    name: 'game-backlog-tracker',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_games',
        description: 'List all games in the backlog with optional filtering by status (backlog, playing, completed, wishlist, abandoned)',
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              description: 'Filter by game status',
              enum: ['backlog', 'playing', 'completed', 'wishlist', 'abandoned']
            },
            platform: {
              type: 'string',
              description: 'Filter by platform'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of games to return'
            }
          }
        }
      },
      {
        name: 'add_game',
        description: 'Add a new game to the backlog',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Game title'
            },
            platform: {
              type: 'string',
              description: 'Gaming platform (PC, PlayStation 5, Xbox Series X|S, Nintendo Switch, etc.)',
              default: 'PC'
            },
            status: {
              type: 'string',
              description: 'Game status',
              enum: ['backlog', 'playing', 'completed', 'wishlist', 'abandoned'],
              default: 'backlog'
            },
            estimatedHours: {
              type: 'number',
              description: 'Estimated hours to complete'
            },
            releaseYear: {
              type: 'number',
              description: 'Release year'
            },
            interestLevel: {
              type: 'number',
              description: 'Interest level (1-5)',
              minimum: 1,
              maximum: 5,
              default: 3
            },
            genres: {
              type: 'array',
              items: { type: 'string' },
              description: 'Game genres'
            },
            notes: {
              type: 'string',
              description: 'Additional notes'
            }
          },
          required: ['title']
        }
      },
      {
        name: 'update_game',
        description: 'Update an existing game',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Game ID'
            },
            status: {
              type: 'string',
              enum: ['backlog', 'playing', 'completed', 'wishlist', 'abandoned']
            },
            userRating: {
              type: 'number',
              minimum: 0,
              maximum: 5
            },
            actualHours: {
              type: 'number'
            },
            notes: {
              type: 'string'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'delete_game',
        description: 'Delete a game from the backlog',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Game ID'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'start_playing',
        description: 'Move a game from backlog to currently playing',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Game ID'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'complete_game',
        description: 'Mark a game as completed',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Game ID'
            },
            userRating: {
              type: 'number',
              description: 'Final rating (1-5)',
              minimum: 1,
              maximum: 5
            },
            actualHours: {
              type: 'number',
              description: 'Actual hours played'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'get_priority_list',
        description: 'Get prioritized list of games to play next based on interest, length, and other factors',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of games to return',
              default: 10
            },
            maxHours: {
              type: 'number',
              description: 'Filter games by maximum estimated hours'
            }
          }
        }
      },
      {
        name: 'get_statistics',
        description: 'Get overall statistics about the game backlog',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'search_games',
        description: 'Search for games by title or notes',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query'
            }
          },
          required: ['query']
        }
      }
    ]
  };
});

/**
 * List available resources
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'backlog://games/all',
        name: 'All Games',
        description: 'Complete list of all games in the backlog',
        mimeType: 'application/json'
      },
      {
        uri: 'backlog://games/backlog',
        name: 'Backlog Games',
        description: 'Games in backlog status',
        mimeType: 'application/json'
      },
      {
        uri: 'backlog://games/playing',
        name: 'Currently Playing',
        description: 'Games currently being played',
        mimeType: 'application/json'
      },
      {
        uri: 'backlog://statistics',
        name: 'Statistics',
        description: 'Overall backlog statistics',
        mimeType: 'application/json'
      }
    ]
  };
});

/**
 * Read resource content
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const data = await loadData();
  const uri = request.params.uri;

  if (uri === 'backlog://games/all') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(data.games, null, 2)
        }
      ]
    };
  }

  if (uri.startsWith('backlog://games/')) {
    const status = uri.split('/')[2];
    const filtered = data.games.filter(g => g.status === status);
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(filtered, null, 2)
        }
      ]
    };
  }

  if (uri === 'backlog://statistics') {
    const stats = getStatistics(data);
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(stats, null, 2)
        }
      ]
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const data = await loadData();

    switch (name) {
      case 'list_games': {
        let games = data.games;

        if (args.status) {
          games = games.filter(g => g.status === args.status);
        }

        if (args.platform) {
          games = games.filter(g => g.platform === args.platform);
        }

        if (args.limit) {
          games = games.slice(0, args.limit);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(games, null, 2)
            }
          ]
        };
      }

      case 'add_game': {
        const game = {
          id: generateId(),
          title: args.title,
          platform: args.platform || 'PC',
          status: args.status || 'backlog',
          genres: args.genres || [],
          releaseYear: args.releaseYear || null,
          estimatedHours: args.estimatedHours || null,
          actualHours: 0,
          coverImage: null,
          userRating: 0,
          metacriticScore: null,
          interestLevel: args.interestLevel || 3,
          manualPriority: 0,
          notes: args.notes || '',
          tags: [],
          rawgId: null,
          dataSource: 'manual',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        data.games.push(game);
        data.stats.totalAdded++;
        await saveData(data);

        return {
          content: [
            {
              type: 'text',
              text: `Game "${args.title}" added successfully with ID: ${game.id}`
            }
          ]
        };
      }

      case 'update_game': {
        const gameIndex = data.games.findIndex(g => g.id === args.id);
        if (gameIndex === -1) {
          throw new Error(`Game not found: ${args.id}`);
        }

        const game = data.games[gameIndex];
        
        if (args.status) game.status = args.status;
        if (args.userRating !== undefined) game.userRating = args.userRating;
        if (args.actualHours !== undefined) game.actualHours = args.actualHours;
        if (args.notes !== undefined) game.notes = args.notes;
        
        game.updatedAt = new Date().toISOString();

        if (args.status === 'completed' && game.status !== 'completed') {
          data.stats.totalCompleted++;
          game.completedAt = new Date().toISOString();
        }

        await saveData(data);

        return {
          content: [
            {
              type: 'text',
              text: `Game "${game.title}" updated successfully`
            }
          ]
        };
      }

      case 'delete_game': {
        const gameIndex = data.games.findIndex(g => g.id === args.id);
        if (gameIndex === -1) {
          throw new Error(`Game not found: ${args.id}`);
        }

        const game = data.games.splice(gameIndex, 1)[0];
        await saveData(data);

        return {
          content: [
            {
              type: 'text',
              text: `Game "${game.title}" deleted successfully`
            }
          ]
        };
      }

      case 'start_playing': {
        const game = data.games.find(g => g.id === args.id);
        if (!game) {
          throw new Error(`Game not found: ${args.id}`);
        }

        game.status = 'playing';
        game.startedAt = new Date().toISOString();
        game.updatedAt = new Date().toISOString();

        await saveData(data);

        return {
          content: [
            {
              type: 'text',
              text: `Started playing "${game.title}"!`
            }
          ]
        };
      }

      case 'complete_game': {
        const game = data.games.find(g => g.id === args.id);
        if (!game) {
          throw new Error(`Game not found: ${args.id}`);
        }

        game.status = 'completed';
        game.completedAt = new Date().toISOString();
        game.updatedAt = new Date().toISOString();

        if (args.userRating) {
          game.userRating = args.userRating;
        }
        if (args.actualHours) {
          game.actualHours = args.actualHours;
        }

        data.stats.totalCompleted++;
        await saveData(data);

        return {
          content: [
            {
              type: 'text',
              text: `Congratulations on completing "${game.title}"!`
            }
          ]
        };
      }

      case 'get_priority_list': {
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

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(formatted, null, 2)
            }
          ]
        };
      }

      case 'get_statistics': {
        const stats = getStatistics(data);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(stats, null, 2)
            }
          ]
        };
      }

      case 'search_games': {
        const query = args.query.toLowerCase();
        const results = data.games.filter(game => 
          game.title.toLowerCase().includes(query) ||
          game.notes?.toLowerCase().includes(query) ||
          game.genres?.some(g => {
            const name = typeof g === 'string' ? g : g.name;
            return name.toLowerCase().includes(query);
          })
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Game Backlog MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
