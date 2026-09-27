// SANDBOX³ desktop controls and rendering, driven with real Playwright
// keyboard/mouse input. Only pointer lock itself is emulated (automated
// Chromium never grants it); see emulatePointerLock in helpers/browser.js.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startStaticServer } from '../helpers/static-server.js';
import { launchBrowser, newContext, trackErrors, emulatePointerLock } from '../helpers/browser.js';

let server, browser;
before(async () => { server = await startStaticServer(); browser = await launchBrowser(); });
after(async () => { await browser?.close(); await server?.close(); });

const CANVAS_SPOT = [300, 650]; // on the canvas, away from the centre prompt and the HUD panels

async function openGame({ initScript } = {}) {
  const context = await newContext(browser, { viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const errors = trackErrors(page);
  await emulatePointerLock(page);
  if (initScript) await page.addInitScript(initScript);
  await page.goto(server.url('pixel-sandbox/'));
  await page.waitForFunction(() => window.sandbox?.world);
  return { context, page, errors };
}

const enter = page => page.mouse.click(...CANVAS_SPOT);
const camera = page => page.evaluate(() => window.sandbox.voxelRenderer.camera.position.toArray());
const frames = (page, n = 3) => page.evaluate(n => new Promise(r => { const f = () => (--n ? requestAnimationFrame(f) : r()); requestAnimationFrame(f); }), n);
const aimAt = (page, x, y, z) => page.evaluate(([x, y, z]) => {
  const { fly, voxelRenderer: vr } = window.sandbox;
  const c = vr.camera.position;
  const d = { x: x - c.x, y: y - c.y, z: z - c.z };
  fly.yaw = Math.atan2(-d.x, -d.z);
  fly.pitch = Math.asin(d.y / Math.hypot(d.x, d.y, d.z));
}, [x, y, z]);
const freezePhysics = page => page.evaluate(() => { window.sandbox.world.step = () => {}; });
const cell = (page, x, y, z) => page.evaluate(([x, y, z]) => window.sandbox.world.get(x, y, z), [x, y, z]);
const hold = async (page, keys, ms) => {
  for (const k of keys) await page.keyboard.down(k);
  await page.waitForTimeout(ms);
  for (const k of [...keys].reverse()) await page.keyboard.up(k);
};

// ---------------------------------------------------------------- 1. colours
test('every material has a full-size per-voxel colour buffer', async () => {
  const { context, page } = await openGame();
  const r = await page.evaluate(() => {
    const vr = window.sandbox.voxelRenderer;
    return {
      voxels: Object.values(vr.meshes).map(m => m.instanceColor?.count ?? 0),
      cones: vr.spoutVis.cones.instanceColor?.count ?? 0,
      rings: vr.spoutVis.rings.instanceColor?.count ?? 0,
    };
  });
  assert.deepEqual(r.voxels, Array(8).fill(32 ** 3), 'one colour slot per possible voxel');
  assert.equal(r.cones, 2048);
  assert.equal(r.rings, 2048);
  await context.close();
});

test('stone renders grey with per-voxel shading, sand renders yellow (pixel readback)', async () => {
  const { context, page } = await openGame();
  const r = await page.evaluate(() => {
    const { voxelRenderer: vr, world } = window.sandbox;
    for (let x = 6; x < 10; x++) world.set(x, 1, 10, 2); // sand strip
    vr.renderer.setAnimationLoop(null);
    vr.rebuild();
    vr.renderer.render(vr.scene, vr.camera);
    const gl = vr.renderer.getContext();
    const px = (x, y, z) => {
      const v = vr.camera.position.clone().set(x, y, z).project(vr.camera);
      const out = new Uint8Array(4);
      gl.readPixels(Math.round((v.x + 1) / 2 * gl.drawingBufferWidth), Math.round((v.y + 1) / 2 * gl.drawingBufferHeight), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, out);
      return Array.from(out.slice(0, 3));
    };
    const floor = []; for (let x = 8; x < 24; x++) floor.push(px(x + 0.5, 1, 16.5)); // top faces of floor voxels
    return { floor, sand: [6, 7, 8, 9].map(x => px(x + 0.5, 2, 10.5)) };
  });
  for (const [R, G, B] of r.floor) {
    assert.ok(Math.max(R, G, B) >= 70 && Math.max(R, G, B) <= 200, `floor pixel ${[R, G, B]} is neither black nor blown out`);
    assert.ok(Math.abs(R - G) <= 20 && B >= G - 5, `floor pixel ${[R, G, B]} is grey/blue-grey like #7a7a8a`);
  }
  assert.ok(new Set(r.floor.map(String)).size >= 2, 'floor voxels use more than one shade');
  for (const [R, G, B] of r.sand) assert.ok(R > B + 40 && G > B + 20, `sand pixel ${[R, G, B]} is yellow`);
  await context.close();
});

// ---------------------------------------------------------------- 2. prompt
test('clicking the "Click to enter" prompt captures the mouse', async () => {
  const { context, page } = await openGame();
  const box = await page.locator('#prompt').boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  assert.equal(await page.evaluate(() => window.sandbox.fly.locked), true);
  await context.close();
});

// ---------------------------------------------------------------- key map
test('Space/E fly up, Q/C fly down, Tab cycles the tool mode', async () => {
  const { context, page } = await openGame();
  await enter(page);
  await page.evaluate(() => window.sandbox.voxelRenderer.renderer.setAnimationLoop(null));
  for (const [key, dir] of [['Space', 1], ['KeyE', 1], ['KeyQ', -1], ['KeyC', -1]]) {
    const y0 = (await camera(page))[1];
    await page.keyboard.down(key);
    await page.evaluate(() => { for (let i = 0; i < 10; i++) window.sandbox.fly.update(0.05); }); // 0.5 s of flight
    await page.keyboard.up(key);
    const dy = (await camera(page))[1] - y0;
    assert.ok(Math.abs(dy - dir * 5) < 1e-6, `${key} moved ${dy.toFixed(2)} vertically (expected ${dir * 5})`);
  }
  assert.equal(await page.evaluate(() => window.sandbox.state.mode), 'POUR', 'E no longer switches the tool');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => window.sandbox.state.mode), 'SPOUT');
  assert.equal(await page.evaluate(() => document.activeElement === document.body), true, 'Tab did not move keyboard focus');
  await context.close();
});

// ---------------------------------------------------------------- 4. stuck keys
test('held keys are released when the window loses focus or the mouse is released', async () => {
  const { context, page } = await openGame();
  await enter(page);
  await page.keyboard.down('KeyW');
  await page.evaluate(() => window.dispatchEvent(new Event('blur'))); // alt-tab: keyup goes elsewhere
  assert.equal(await page.evaluate(() => !!window.sandbox.fly.keys.KeyW), false, 'blur clears held keys');
  await page.keyboard.up('KeyW');

  await page.keyboard.down('KeyW');
  await page.keyboard.press('Escape');               // release the mouse while W is down
  await page.evaluate(() => { window.__w = window.sandbox.fly.keys.KeyW; });
  await enter(page);                                 // come back in; no new keydown
  const a = await camera(page); await page.waitForTimeout(300); const b = await camera(page);
  assert.equal(await page.evaluate(() => !!window.__w), false, 'unlocking clears held keys');
  assert.deepEqual(b, a, 'camera does not drift after re-entering');
  await page.keyboard.up('KeyW');
  await context.close();
});

// ---------------------------------------------------------------- 5. bounds
test('flight is kept within one world-width of the grid', async () => {
  const { context, page } = await openGame();
  await enter(page);
  // Real key presses, but time is advanced deterministically (20 s of flight
  // per direction) so the result doesn't depend on how fast the browser runs.
  const fly = async keys => {
    for (const k of keys) await page.keyboard.down(k);
    await page.evaluate(() => {
      const app = window.sandbox;
      app.voxelRenderer.renderer.setAnimationLoop(null);
      for (let i = 0; i < 400; i++) app.fly.update(0.05);
    });
    for (const k of [...keys].reverse()) await page.keyboard.up(k);
  };
  await fly(['ShiftLeft', 'KeyS']);
  await fly(['ShiftLeft', 'Space']);
  await fly(['ShiftLeft', 'KeyA']);
  const [x, y, z] = await camera(page);
  for (const v of [x, y, z]) assert.ok(v >= -32 && v <= 64, `camera at ${[x, y, z].map(n => n.toFixed(1))}`);
  await context.close();
});

// ---------------------------------------------------------------- 3. LMB uses the tool
test('left-click uses the current tool: pour, spout (one per click), erase', async () => {
  const { context, page } = await openGame();
  await enter(page);
  await freezePhysics(page);
  await aimAt(page, 16.5, 1, 16.5);
  await frames(page);
  await page.mouse.down(); await page.waitForTimeout(20); await page.mouse.up();
  assert.notEqual(await cell(page, 16, 1, 16), 0, 'POUR: placed on the floor');

  await page.keyboard.press('Tab'); // SPOUT
  await aimAt(page, 5.5, 1, 5.5);
  await frames(page);
  const s0 = await page.evaluate(() => window.sandbox.world.spouts.size);
  await page.mouse.down(); await page.waitForTimeout(300); await page.mouse.up();
  assert.equal(await page.evaluate(() => window.sandbox.world.spouts.size) - s0, 1, 'SPOUT: exactly one spout per click');

  await page.keyboard.press('Tab'); // ERASE
  await page.evaluate(() => { const w = window.sandbox.world; for (let y = 1; y <= 4; y++) w.set(10, y, 20, 1); });
  await aimAt(page, 10.5, 3.5, 21);
  await frames(page);
  await page.mouse.down(); await page.waitForTimeout(50); await page.mouse.up();
  assert.equal(await cell(page, 10, 3, 20), 0, 'ERASE: left-click erased the block');
  await context.close();
});

// ---------------------------------------------------------------- 6. target marker + crosshair
test('a marker shows where the tool will act, and the crosshair stays visible on light blocks', async () => {
  const { context, page } = await openGame();
  await enter(page);
  const marker = () => page.evaluate(() => {
    const m = window.sandbox.voxelRenderer.targetMarker;
    return m ? { visible: m.visible, at: m.position.toArray() } : null;
  });
  await aimAt(page, 16.5, 1, 16.5);
  await frames(page);
  assert.deepEqual(await marker(), { visible: true, at: [16.5, 1.5, 16.5] }, 'POUR: the empty cell on the floor');
  await page.evaluate(() => { const w = window.sandbox.world; for (let y = 1; y <= 4; y++) w.set(10, y, 20, 1); });
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); // ERASE
  await aimAt(page, 10.5, 3.5, 21);
  await frames(page);
  assert.deepEqual(await marker(), { visible: true, at: [10.5, 3.5, 20.5] }, 'ERASE: the block itself');
  await page.keyboard.press('Escape');
  await frames(page);
  assert.equal((await marker()).visible, false, 'hidden when the mouse is released');
  assert.equal(await page.$eval('#xhair', el => getComputedStyle(el).mixBlendMode), 'difference');
  await context.close();
});

// ---------------------------------------------------------------- 8. mid-air placement
test('with nothing in the way, pouring happens in mid-air at REACH distance', async () => {
  const { context, page } = await openGame();
  await enter(page);
  await freezePhysics(page);
  const target = await page.evaluate(() => {
    const { fly, voxelRenderer: vr } = window.sandbox;
    vr.camera.position.set(16.5, 10.5, 16.5);
    fly.reach = 8;
    fly.yaw = 0.3; fly.pitch = 0.5; // looking up and ahead: no surface inside the grid
    const d = fly.lookDir();
    const p = vr.camera.position.clone().addScaledVector(d, 8);
    return [Math.floor(p.x), Math.floor(p.y), Math.floor(p.z)];
  });
  await frames(page);
  const m = await page.evaluate(() => window.sandbox.voxelRenderer.targetMarker?.position.toArray());
  assert.deepEqual(m, target.map(v => v + 0.5), 'marker shows the mid-air cell');
  await page.mouse.down(); await page.waitForTimeout(20); await page.mouse.up();
  assert.notEqual(await cell(page, ...target), 0, `placed at ${target}`);
  await context.close();
});

// ---------------------------------------------------------------- 7. keyboard layouts
test('number keys follow the physical key, and hints show the user\'s keyboard layout', async () => {
  const azerty = { KeyW: 'z', KeyA: 'q', KeyS: 's', KeyD: 'd', KeyQ: 'a', KeyE: 'e', KeyC: 'c' };
  const { context, page } = await openGame({
    initScript: `Object.defineProperty(navigator, 'keyboard', { configurable: true, value: { getLayoutMap: async () => new Map(Object.entries(${JSON.stringify(azerty)})) } });`,
  });
  await enter(page);
  await page.evaluate(() => {
    window.sandbox.state.matIndex = 2;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '&', code: 'Digit1', bubbles: true })); // AZERTY "1"
  });
  assert.equal(await page.evaluate(() => window.sandbox.state.matIndex), 0, 'Digit1 selects the first material');
  await page.waitForFunction(() => document.getElementById('hints').textContent.includes('Z Q S D'));
  const hints = await page.textContent('#hints');
  assert.match(hints, /Z Q S D/);
  assert.match(hints, /SPC\/E/);
  assert.match(hints, /A\/C/, 'down keys shown as the AZERTY labels of KeyQ/KeyC');
  await context.close();
});

test('controls boot without page errors', async () => {
  const { context, page, errors } = await openGame();
  await enter(page);
  await hold(page, ['KeyW'], 200);
  await page.mouse.down(); await page.mouse.up();
  await page.keyboard.press('Tab');
  assert.deepEqual(errors, []);
  await context.close();
});
