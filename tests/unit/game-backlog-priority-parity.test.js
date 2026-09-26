// Item 8 — the MCP server must rank games exactly like the web "Play Next" view.
// Source of truth: core/priority.js (PriorityCalculator), which the web UI uses.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installLocalStorage } from '../helpers/local-storage.js';

installLocalStorage();

const { PriorityCalculator, DEFAULT_WEIGHTS } = await import('../../game-backlog-tracker/core/priority.js');
const { getPriorityList } = await import('../../game-backlog-tracker/mcp-server/priority-tool.js');

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 0, 1);
const ago = days => new Date(NOW - days * DAY).toISOString();

// Fixture chosen so the two historical formulas disagree: the old MCP formula
// scored length as 100 - 2h and ignored diversity.
const games = [
  { id: 'a', title: 'Short & loved', status: 'backlog', interestLevel: 5, estimatedHours: 8, createdAt: ago(30), genres: ['Puzzle'] },
  { id: 'b', title: 'Old epic', status: 'backlog', interestLevel: 4, estimatedHours: 120, createdAt: ago(900), metacriticScore: 95, genres: ['RPG'] },
  { id: 'c', title: 'Boosted', status: 'backlog', interestLevel: 2, estimatedHours: 20, createdAt: ago(10), manualPriority: 3, genres: ['Action'] },
  { id: 'd', title: 'Unknown length', status: 'backlog', interestLevel: 3, createdAt: ago(200), genres: ['Adventure'] },
  { id: 'e', title: 'Currently playing', status: 'playing', interestLevel: 5, estimatedHours: 10, createdAt: ago(5), genres: ['RPG'] },
  { id: 'f', title: 'Done', status: 'completed', interestLevel: 5, estimatedHours: 5, createdAt: ago(50), genres: ['Puzzle'] },
];
const weights = { ...DEFAULT_WEIGHTS, metacritic: 20 };
const data = { games, settings: { priorityWeights: weights } };

function withFixedNow(fn) {
  const RealDate = Date;
  globalThis.Date = class extends RealDate {
    constructor(...a) { super(...(a.length ? a : [NOW])); }
    static now() { return NOW; }
  };
  try { return fn(); } finally { globalThis.Date = RealDate; }
}

test('MCP get_priority_list order and scores match the web calculator (backlog only)', () => {
  withFixedNow(() => {
    const web = new PriorityCalculator(weights)
      .getPrioritizedList(games)
      .filter(item => item.game.status === 'backlog');
    const mcp = getPriorityList(data, {});
    assert.deepEqual(mcp.map(r => r.id), web.map(i => i.game.id));
    assert.deepEqual(mcp.map(r => r.priority), web.map(i => i.priority.total));
    assert.deepEqual(mcp.map(r => r.rank), web.map((_, i) => i + 1));
  });
});

test('MCP maxHours and limit filters still apply', () => {
  withFixedNow(() => {
    const mcp = getPriorityList(data, { maxHours: 20, limit: 2 });
    assert.equal(mcp.length, 2);
    for (const row of mcp) assert.ok(row.estimatedHours == null || row.estimatedHours <= 20);
  });
});

test('PriorityCalculator accepts explicit weights without touching storage', () => {
  const calc = new PriorityCalculator({ interest: 0 });
  assert.equal(calc.getWeights().interest, 0);
  assert.equal(calc.getWeights().manual, DEFAULT_WEIGHTS.manual);
});
