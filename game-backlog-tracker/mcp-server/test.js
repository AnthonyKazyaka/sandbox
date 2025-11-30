#!/usr/bin/env node

/**
 * Test script for Game Backlog MCP Server
 * Sends MCP requests via stdio and validates responses
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverPath = join(__dirname, 'index.js');

/**
 * Send JSON-RPC request to MCP server
 */
function sendRequest(server, request) {
  return new Promise((resolve, reject) => {
    let response = '';
    let timeoutId;

    const onData = (data) => {
      response += data.toString();
      
      // Try to parse complete JSON-RPC response
      try {
        const lines = response.split('\n').filter(l => l.trim());
        for (const line of lines) {
          const parsed = JSON.parse(line);
          if (parsed.id === request.id) {
            clearTimeout(timeoutId);
            server.stdout.off('data', onData);
            resolve(parsed);
            return;
          }
        }
      } catch (e) {
        // Not yet a complete response
      }
    };

    server.stdout.on('data', onData);
    
    timeoutId = setTimeout(() => {
      server.stdout.off('data', onData);
      reject(new Error('Request timeout'));
    }, 5000);

    server.stdin.write(JSON.stringify(request) + '\n');
  });
}

/**
 * Run tests
 */
async function runTests() {
  console.log('🚀 Starting MCP Server tests...\n');

  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'inherit']
  });

  try {
    // Test 1: Initialize
    console.log('Test 1: Initialize connection');
    const initResponse = await sendRequest(server, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    });
    console.log('✅ Server initialized');
    console.log(`   Server: ${initResponse.result.serverInfo.name} v${initResponse.result.serverInfo.version}\n`);

    // Test 2: List tools
    console.log('Test 2: List available tools');
    const toolsResponse = await sendRequest(server, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    });
    console.log(`✅ Found ${toolsResponse.result.tools.length} tools:`);
    toolsResponse.result.tools.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });
    console.log();

    // Test 3: Add a game
    console.log('Test 3: Add a game');
    const addResponse = await sendRequest(server, {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'add_game',
        arguments: {
          title: 'Elden Ring',
          platform: 'PC',
          status: 'backlog',
          estimatedHours: 60,
          interestLevel: 5,
          genres: ['Action', 'RPG'],
          notes: 'Test game from MCP server'
        }
      }
    });
    console.log('✅ Game added:', addResponse.result.content[0].text);
    console.log();

    // Test 4: List games
    console.log('Test 4: List backlog games');
    const listResponse = await sendRequest(server, {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'list_games',
        arguments: {
          status: 'backlog',
          limit: 5
        }
      }
    });
    const games = JSON.parse(listResponse.result.content[0].text);
    console.log(`✅ Found ${games.length} games in backlog`);
    games.forEach(game => {
      console.log(`   - ${game.title} (${game.platform}) - ${game.interestLevel}⭐`);
    });
    console.log();

    // Test 5: Get priority list
    console.log('Test 5: Get priority recommendations');
    const priorityResponse = await sendRequest(server, {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'get_priority_list',
        arguments: {
          limit: 3
        }
      }
    });
    const priorityGames = JSON.parse(priorityResponse.result.content[0].text);
    console.log(`✅ Top ${priorityGames.length} priority games:`);
    priorityGames.forEach(item => {
      console.log(`   #${item.rank}. ${item.title} (Score: ${item.priority})`);
    });
    console.log();

    // Test 6: Get statistics
    console.log('Test 6: Get statistics');
    const statsResponse = await sendRequest(server, {
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: {
        name: 'get_statistics',
        arguments: {}
      }
    });
    const stats = JSON.parse(statsResponse.result.content[0].text);
    console.log('✅ Statistics:');
    console.log(`   Total games: ${stats.totalGames}`);
    console.log(`   Backlog: ${stats.byStatus.backlog}`);
    console.log(`   Completed: ${stats.byStatus.completed}`);
    console.log(`   Completion rate: ${stats.completionRate}%`);
    console.log();

    // Test 7: List resources
    console.log('Test 7: List available resources');
    const resourcesResponse = await sendRequest(server, {
      jsonrpc: '2.0',
      id: 7,
      method: 'resources/list',
      params: {}
    });
    console.log(`✅ Found ${resourcesResponse.result.resources.length} resources:`);
    resourcesResponse.result.resources.forEach(resource => {
      console.log(`   - ${resource.name}: ${resource.uri}`);
    });
    console.log();

    console.log('🎉 All tests passed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    server.kill();
  }
}

runTests().catch(console.error);
