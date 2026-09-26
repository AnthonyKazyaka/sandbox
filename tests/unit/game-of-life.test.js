// Item 10 — Game of Life loop control, click mapping and HUD.
// Runs the real script.js with a manual clock so timer behaviour is exact.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowserSandbox } from '../helpers/fake-dom.js';

function boot() {
  const sb = createBrowserSandbox({
    elements: { gameCanvas: { tag: 'canvas', width: 600, height: 400 } },
  });
  sb.load('game-of-life-ancestry/script.js');
  sb.eval(`globalThis.__g = new GameOfLife('gameCanvas', 60, 40)`);
  return { sb, g: sb.context.__g };
}

test('Stop then Start within one tick does not create a second update loop', () => {
  const { sb, g } = boot();
  sb.element('startBtn').click();
  sb.advance(50);
  sb.element('stopBtn').click();
  sb.element('startBtn').click();
  sb.advance(2000);
  assert.equal(sb.pendingTimers(), 1, 'exactly one pending tick');
  // 1 immediate step on the first Start, 1 on the second Start, then one per 200 ms.
  assert.equal(g.generation, 12);
});

test('Stop halts the simulation completely', () => {
  const { sb, g } = boot();
  sb.element('startBtn').click();
  sb.advance(1000);
  sb.element('stopBtn').click();
  const gen = g.generation;
  sb.advance(2000);
  assert.equal(g.generation, gen);
  assert.equal(sb.pendingTimers(), 0);
});

test('clicks map to the right cell when the canvas is scaled by CSS', () => {
  const { sb, g } = boot();
  const canvas = sb.element('gameCanvas');
  canvas.rect = { left: 10, top: 20, width: 300, height: 200 }; // displayed at 50%
  canvas.dispatch('click', { clientX: 10 + 155, clientY: 20 + 105 });
  assert.equal(g.grid[31][21].alive, true, 'intrinsic (310,210) is cell (31,21)');
});

test('generation counter is shown and speed can be changed', () => {
  const { sb, g } = boot();
  const speed = sb.element('speedRange');
  speed.value = '100';
  speed.dispatch('input');
  sb.element('startBtn').click();
  sb.advance(1000);
  assert.equal(g.generation, 11);
  assert.equal(sb.element('generation').textContent, '11');
});
