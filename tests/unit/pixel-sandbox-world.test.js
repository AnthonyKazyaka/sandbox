// Item 7 — SANDBOX³ simulation: dirty-flag correctness, occlusion rules, shuffle.
// Source of truth: pixel-sandbox/world.js (the same module index.html imports).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../helpers/fake-dom.js';

Math.random = mulberry32(42);
const { World, MAT, GRID, isOccluded, _shuf } = await import('../../pixel-sandbox/world.js');

function scene() {
  const w = new World();
  for (let x = 8; x < 12; x++) for (let z = 8; z < 12; z++) w.set(x, 12, z, MAT.SAND);
  for (let x = 16; x < 20; x++) for (let z = 16; z < 20; z++) w.set(x, 6, z, MAT.WATER);
  w.set(4, 3, 4, MAT.LAVA); w.set(5, 3, 4, MAT.WATER);
  for (let x = 20; x < 24; x++) w.set(x, 1, 5, MAT.OIL);
  w.set(20, 2, 5, MAT.FIRE);
  w.setSpout(25, 20, 25, MAT.SAND, 3);
  return w;
}

const snapshot = w => Buffer.concat([Buffer.from(w.cells), Buffer.from(w.variant)]);

test('dirty is set exactly when a step changes what is rendered', () => {
  const w = scene();
  let changedSteps = 0, idleSteps = 0;
  for (let i = 0; i < 400; i++) {
    if (i === 200) {
      // Liquids and gases keep wandering forever by design; remove them and the
      // spout so the remaining sand/stone can settle into a static world.
      for (let c = 0; c < w.cells.length; c++) if (w.cells[c] > MAT.SAND) w.cells[c] = MAT.EMPTY;
      w.spouts.clear();
      for (let c = 0; c < w.cells.length; c++) if (w.cells[c]) w.active.add(c);
    }
    const before = snapshot(w);
    w.dirty = false;
    w.step();
    const changed = !before.equals(snapshot(w));
    changed ? changedSteps++ : idleSteps++;
    assert.equal(w.dirty, changed, `step ${i}: dirty=${w.dirty} but changed=${changed}`);
  }
  assert.ok(changedSteps > 50 && idleSteps > 50, `exercised both cases (changed ${changedSteps}, idle ${idleSteps})`);
});

test('a settled world costs nothing to step: active set drains to empty', () => {
  const w = new World();
  for (let x = 0; x < 6; x++) w.set(x, 5, 3, MAT.SAND);
  for (let i = 0; i < 200; i++) w.step();
  assert.equal(w.active.size, 0, 'no cells (including the stone floor) are re-simulated when nothing can move');
});

test('occlusion culling only hides voxels that are really invisible', () => {
  const at = (w, x, y, z) => isOccluded(w.cells, x, y, z);
  const surround = (w, mat) => {
    for (const [dx, dy, dz] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]) w.set(10 + dx, 10 + dy, 10 + dz, mat);
  };
  let w = new World(); w.set(10, 10, 10, MAT.STONE); surround(w, MAT.STONE);
  assert.equal(at(w, 10, 10, 10), true, 'stone inside stone is hidden');
  w = new World(); w.set(10, 10, 10, MAT.SAND); surround(w, MAT.WATER);
  assert.equal(at(w, 10, 10, 10), false, 'sand under water stays visible (water is translucent)');
  w = new World(); w.set(10, 10, 10, MAT.STONE); surround(w, MAT.STEAM);
  assert.equal(at(w, 10, 10, 10), false, 'stone inside steam stays visible');
  w = new World(); w.set(10, 10, 10, MAT.WATER); surround(w, MAT.WATER);
  assert.equal(at(w, 10, 10, 10), true, 'interior water merges with surrounding water');
  w = new World(); w.set(0, 0, 0, MAT.STONE);
  assert.equal(at(w, 0, 0, 0), false, 'edge voxels are never culled');
});

test('_shuf is an unbiased Fisher–Yates shuffle', () => {
  const N = 40000;
  const counts = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
  for (let i = 0; i < N; i++) _shuf([0, 1, 2, 3]).forEach((v, pos) => counts[v][pos]++);
  for (let v = 0; v < 4; v++) for (let pos = 0; pos < 4; pos++) {
    const p = counts[v][pos] / N;
    assert.ok(Math.abs(p - 0.25) < 0.02, `P(value ${v} at position ${pos}) = ${p.toFixed(3)}, expected 0.25`);
  }
});

test('GRID sanity', () => { assert.equal(GRID, 32); });
