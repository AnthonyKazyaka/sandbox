// Item 2 — auto-shooter movement/combat must be frame-rate independent and playable.
// Evidence comes from running the real script.js in a deterministic sandbox
// (seeded Math.random, manual clock driving requestAnimationFrame at 60 fps).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowserSandbox } from '../helpers/fake-dom.js';

function boot(seed = 7) {
  const sb = createBrowserSandbox({
    seed,
    elements: { gameCanvas: { tag: 'canvas', width: 1200, height: 800 } },
  });
  sb.load('auto-shooter/script.js');
  sb.eval('globalThis.__game = new Game()');
  return { sb, game: sb.context.__game };
}

const panelOpen = sb => sb.element('upgradePanel').style.display === 'block';

// Plays like a user who always takes the first upgrade offered.
function play(sb, seconds) {
  for (let i = 0; i < Math.round(seconds * 60); i++) {
    sb.frame();
    if (panelOpen(sb)) {
      const first = sb.element('upgradeOptions').children[0];
      first?.onclick?.();
    }
  }
}

test('first frame does not teleport the player (no huge initial delta time)', () => {
  const { sb, game } = boot();
  sb.frame();
  sb.frame();
  const { x, y } = game.player.position;
  assert.ok(Math.abs(x - 600) < 20 && Math.abs(y - 400) < 20, `player at ${x.toFixed(1)},${y.toFixed(1)}; expected near centre`);
});

test('a bullet can reach the player\'s firing range before it expires', () => {
  const { sb, game } = boot();
  const bullet = sb.eval(`new Bullet(0, 0, new Vector2(1, 0), __game.player.bulletSpeed, 10)`);
  while (bullet.update(1 / 60)) { /* fly */ }
  assert.ok(bullet.position.x >= game.player.range, `bullet travelled ${bullet.position.x.toFixed(1)}px, range is ${game.player.range}px`);
});

test('movement speed is independent of frame rate', () => {
  const run = fps => {
    const { sb, game } = boot();
    sb.frame();
    const enemy = sb.eval(`new Enemy(100, 400, 'basic')`);
    const target = { position: sb.eval('new Vector2(1100, 400)') };
    for (let i = 0; i < fps; i++) enemy.update(1 / fps, target);
    return enemy.position.x - 100;
  };
  const at30 = run(30), at144 = run(144);
  assert.ok(Math.abs(at30 - at144) < 1e-6, `30fps moved ${at30}, 144fps moved ${at144}`);
  assert.ok(at30 >= 60, `a basic enemy should cover a visible distance per second (moved ${at30.toFixed(2)}px)`);
});

test('returning from a background tab does not make enemies jump', () => {
  const { sb, game } = boot();
  play(sb, 4);
  assert.ok(game.enemies.length > 0, 'enemies have spawned');
  const before = game.enemies.map(e => ({ e, x: e.position.x, y: e.position.y }));
  sb.advance(5000); // tab hidden: no animation frames for 5 s
  sb.frame();
  for (const { e, x, y } of before) {
    if (!game.enemies.includes(e)) continue;
    const moved = Math.hypot(e.position.x - x, e.position.y - y);
    assert.ok(moved <= e.maxSpeed * 0.05 + 1e-6, `enemy moved ${moved.toFixed(1)}px in one frame`);
  }
});

test('the game is winnable: the auto-player clears waves', () => {
  const { sb, game } = boot();
  play(sb, 90);
  assert.ok(game.wave >= 3, `reached wave ${game.wave} after 90 s`);
  assert.ok(game.running, 'player survived');
});

test('the world pauses while the upgrade panel is open', () => {
  const { sb, game } = boot();
  play(sb, 4);
  game.upgradePoints = 1;
  game.showUpgradePanel();
  const snapshot = game.enemies.map(e => [e.position.x, e.position.y]);
  const health = game.player.health;
  for (let i = 0; i < 120; i++) sb.frame();
  assert.deepEqual(game.enemies.map(e => [e.position.x, e.position.y]), snapshot);
  assert.equal(game.player.health, health);
});

test('HUD shows the real max health after a Health Boost', () => {
  const { sb, game } = boot();
  sb.frame();
  game.upgradePoints = 2;
  const boost = game.generateUpgradeOptions().find(o => o.name === 'Health Boost');
  game.selectUpgrade(boost);
  sb.frame();
  assert.equal(sb.element('maxHealth').textContent, String(game.player.maxHealth));
  assert.equal(game.player.maxHealth, 125);
});

test('after game over the player can restart without reloading', () => {
  const { sb, game } = boot();
  play(sb, 2);
  game.player.health = 0;
  game.gameOver();
  sb.element('restartBtn').click();
  sb.frame();
  assert.equal(game.running, true);
  assert.equal(game.wave, 1);
  assert.equal(game.player.health, game.player.maxHealth);
});
