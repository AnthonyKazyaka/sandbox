// Items 4 and 7 — SANDBOX³ in Chromium (three.js served locally, WebXR mocked).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startStaticServer } from '../helpers/static-server.js';
import { launchBrowser, newContext, trackErrors } from '../helpers/browser.js';

let server, browser;
before(async () => { server = await startStaticServer(); browser = await launchBrowser(); });
after(async () => { await browser?.close(); await server?.close(); });

// Minimal WebXR surface: immersive-vr is "supported" and requestSession
// resolves to an EventTarget standing in for an XRSession.
function mockWebXR() {
  const session = new EventTarget();
  session.end = async () => session.dispatchEvent(new Event('end'));
  window.__xrSession = session;
  Object.defineProperty(navigator, 'xr', {
    configurable: true,
    value: { isSessionSupported: async () => true, requestSession: async () => session },
  });
}

async function openSandbox({ xr = false } = {}) {
  const context = await newContext(browser);
  const page = await context.newPage();
  const errors = trackErrors(page);
  if (xr) await page.addInitScript(mockWebXR);
  await page.goto(server.url('pixel-sandbox/'));
  await page.waitForFunction(() => window.sandbox?.world);
  return { context, page, errors };
}

test('boots without errors', async () => {
  const { context, page, errors } = await openSandbox();
  await page.waitForTimeout(300);
  assert.deepEqual(errors, []);
  await context.close();
});

test('entering and leaving VR updates the button and mode indicator without errors', async () => {
  const { context, page, errors } = await openSandbox({ xr: true });
  const btn = page.locator('#vr-btn');
  await page.waitForFunction(() => document.getElementById('vr-btn').textContent === 'Enter VR');
  // three.js needs a real XR runtime for setSession; stub just that call.
  await page.evaluate(() => { window.sandbox.voxelRenderer.renderer.xr.setSession = async () => {}; });
  await btn.click();
  await page.waitForFunction(() => document.getElementById('vr-btn').textContent !== 'Enter VR');
  assert.equal(await btn.textContent(), 'Exit VR');
  assert.equal(await page.textContent('#s-mode'), 'VR');
  await page.evaluate(() => window.__xrSession.end());
  await page.waitForFunction(() => document.getElementById('vr-btn').textContent === 'Enter VR');
  assert.equal(await page.textContent('#s-mode'), 'DESKTOP');
  assert.deepEqual(errors, []);
  await context.close();
});

test('an idle world triggers no voxel rebuilds', async () => {
  const { context, page } = await openSandbox();
  const rebuilds = await page.evaluate(async () => {
    const r = window.sandbox.voxelRenderer;
    const w = window.sandbox.world;
    await new Promise(res => setTimeout(res, 500)); // let the initial floor settle
    let count = 0;
    const orig = r.rebuild.bind(r);
    r.rebuild = () => { if (w.dirty) count++; orig(); };
    await new Promise(res => setTimeout(res, 1500));
    return count;
  });
  assert.equal(rebuilds, 0);
  await context.close();
});

test('CELLS stat matches the world after changes', async () => {
  const { context, page } = await openSandbox();
  const r = await page.evaluate(async () => {
    const w = window.sandbox.world;
    for (let x = 5; x < 10; x++) w.set(x, 1, 5, 1 /* STONE */);
    await new Promise(res => setTimeout(res, 800));
    return { shown: document.getElementById('s-cells').textContent.replace(/,/g, ''), actual: w.cells.reduce((n, c) => n + (c ? 1 : 0), 0) };
  });
  assert.equal(Number(r.shown), r.actual);
  await context.close();
});

// ============================================================================
// VR controls, driven deterministically. The animation loop is stopped and
// VRPlacer.update(dt) is called frame by frame with a stubbed XR session:
// head pose, two controllers (connected RIGHT first, as some runtimes do) and
// xr-standard gamepads. Everything else is the real app code.
// ============================================================================
async function openVR(options = {}) {
  const { context, page, errors } = await openSandbox();
  await page.evaluate(({ head = [0.3, 1.6, 0.2] }) => {
    const app = window.sandbox;
    const vr = app.voxelRenderer;
    const xr = vr.renderer.xr;
    vr.renderer.setAnimationLoop(null);
    const V = vr.camera.position.constructor;

    const headCam = vr.camera.clone();
    headCam.position.set(...head);
    headCam.rotation.set(0, 0, 0);
    headCam.updateMatrixWorld(true);

    const gamepad = () => ({ axes: [0, 0, 0, 0], buttons: Array.from({ length: 6 }, () => ({ pressed: false, value: 0 })) });
    const sources = [{ handedness: 'right', gamepad: gamepad() }, { handedness: 'left', gamepad: gamepad() }];
    const session = { inputSources: sources, end: async () => {} };
    xr.isPresenting = true;
    xr.getSession = () => session;
    xr.getCamera = () => headCam;
    vr.setupVR();
    vr.controllers.forEach((c, i) => c.dispatchEvent({ type: 'connected', data: sources[i] }));

    const [rightCtrl, leftCtrl] = vr.controllers; // input-source order, not handedness
    // XR controller spaces have matrixAutoUpdate = false (the runtime writes the
    // matrix and decomposes it), so compose the matrix like three.js does.
    const place = (ctrl, x, y, z) => { ctrl.position.set(x, y, z); ctrl.rotation.set(0, 0, 0); ctrl.updateMatrix(); ctrl.updateMatrixWorld(true); };
    place(rightCtrl, 0.25, 1.2, -0.3);
    place(leftCtrl, -0.25, 1.2, -0.3);

    const sg = vr.sceneGroup;
    const toLocal = p => sg.worldToLocal(new V(...p));
    window.__vr = {
      V, vr, sg, xr, headCam, sources, rightCtrl, leftCtrl, place,
      pad: hand => sources.find(s => s.handedness === hand).gamepad,
      frames(n, dt = 1 / 72) { for (let i = 0; i < n; i++) { app.vrPlacer.update(dt); sg.updateMatrixWorld(true); } },
      headLocal() { sg.updateMatrixWorld(true); return toLocal(headCam.position.toArray()); },
      snapRight() { this.pad('right').axes[2] = 1; this.frames(1); this.pad('right').axes[2] = 0; this.frames(1); },
    };
    window.__vr.frames(3); // head pose becomes available after the first frames
  }, options);
  return { context, page, errors };
}

test('VR: entering VR puts a tabletop-sized world in front of the player', async () => {
  const { context, page } = await openVR();
  const r = await page.evaluate(() => {
    const { V, sg, headCam } = window.__vr;
    const centre = sg.localToWorld(new V(16, 0, 16));
    const corners = [[0, 0], [32, 0], [0, 32], [32, 32]].map(([x, z]) => sg.localToWorld(new V(x, 0, z)));
    return {
      ahead: headCam.position.z - centre.z, sideways: centre.x - headCam.position.x, floorY: centre.y,
      size: 32 * sg.scale.x, allInFront: corners.every(c => c.z < headCam.position.z),
    };
  });
  assert.ok(r.ahead > 0.6 && r.ahead < 2, `world centre is ${r.ahead.toFixed(2)} m ahead`);
  assert.ok(Math.abs(r.sideways) < 0.3, `world centre is ${r.sideways.toFixed(2)} m to the side`);
  assert.ok(r.floorY > 0.5 && r.floorY < 1.3, `world floor at ${r.floorY.toFixed(2)} m (head at 1.6)`);
  assert.ok(r.size > 1 && r.size < 2.5, `world is ${r.size.toFixed(2)} m wide`);
  assert.ok(r.allInFront, 'no part of the world is behind the player');
  await context.close();
});

for (const turns of [0, 1, 2, 4]) {
  test(`VR: pushing the stick forward moves toward where the left controller points (after ${turns} snap turn(s))`, async () => {
    const { context, page } = await openVR();
    const r = await page.evaluate(turns => {
      const v = window.__vr;
      for (let i = 0; i < turns; i++) v.snapRight();
      const before = v.headLocal();
      // Direction the left controller points (-Z in world), expressed in world-voxel coordinates
      const aim = v.sg.worldToLocal(v.headCam.position.clone().add(new v.V(0, 0, -1))).sub(before).normalize();
      v.pad('left').axes[3] = -1; // xr-standard: pushed forward = -1
      v.frames(72);                // one second at 72 Hz
      const moved = v.headLocal().sub(before);
      return { dot: moved.clone().normalize().dot(aim), voxels: moved.length() };
    }, turns);
    assert.ok(r.dot > 0.99, `moved along the aim direction (cos = ${r.dot.toFixed(3)})`);
    assert.ok(Math.abs(r.voxels - 3.2) < 0.05, `moved ${r.voxels.toFixed(2)} voxels in 1 s`);
    await context.close();
  });
}

test('VR: movement speed does not depend on the headset refresh rate', async () => {
  const { context, page } = await openVR();
  const r = await page.evaluate(() => {
    const v = window.__vr;
    const run = hz => {
      const before = v.headLocal();
      v.pad('left').axes[3] = -1;
      v.frames(hz, 1 / hz);
      v.pad('left').axes[3] = 0;
      return v.headLocal().sub(before).length();
    };
    return { at72: run(72), at120: run(120) };
  });
  assert.ok(Math.abs(r.at72 - r.at120) < 0.01, `72 Hz: ${r.at72.toFixed(2)}, 120 Hz: ${r.at120.toFixed(2)} voxels`);
  await context.close();
});

test('VR: turning pivots around the player\'s head', async () => {
  const { context, page } = await openVR({ head: [0.6, 1.6, 0.9] }); // player has walked away from the room origin
  const r = await page.evaluate(() => {
    const v = window.__vr;
    const before = v.headLocal();
    v.snapRight();
    const after = v.headLocal();
    return { dx: after.x - before.x, dz: after.z - before.z };
  });
  assert.ok(Math.hypot(r.dx, r.dz) < 1e-6, `head drifted ${Math.hypot(r.dx, r.dz).toFixed(3)} voxels`);
  await context.close();
});

test('VR: two-hand scaling scales around the point between the hands', async () => {
  const { context, page } = await openVR();
  const r = await page.evaluate(() => {
    const v = window.__vr;
    const mid = [0, 1.2, -0.35];
    v.place(v.leftCtrl, -0.25, 1.2, -0.3); v.place(v.rightCtrl, 0.25, 1.2, -0.3);
    v.pad('left').buttons[1].pressed = true; v.pad('right').buttons[1].pressed = true;
    const scale0 = v.sg.scale.x;
    const midLocal0 = v.sg.worldToLocal(new v.V(...mid));
    v.frames(1);
    v.place(v.leftCtrl, -0.5, 1.2, -0.3); v.place(v.rightCtrl, 0.5, 1.2, -0.3); // hands twice as far apart
    v.frames(1);
    const midLocal1 = v.sg.worldToLocal(new v.V(...mid));
    return { ratio: v.sg.scale.x / scale0, drift: midLocal1.distanceTo(midLocal0) };
  });
  assert.ok(Math.abs(r.ratio - 2) < 1e-6, `scale ratio ${r.ratio}`);
  assert.ok(r.drift < 1e-6, `point between the hands drifted ${r.drift.toFixed(3)} voxels`);
  await context.close();
});

test('VR: pouring and the wrist panel follow handedness, not connection order', async () => {
  const { context, page } = await openVR();
  const r = await page.evaluate(() => {
    const v = window.__vr;
    const world = window.sandbox.world;
    // Aim the right hand at voxel (10,5,10) and the left hand at voxel (20,5,20)
    const aimAt = (ctrl, x, y, z) => {
      const t = v.sg.localToWorld(new v.V(x + 0.5, y + 0.5, z + 0.5));
      const reach = window.sandbox.state.vrPlacementReach;
      v.place(ctrl, t.x, t.y, t.z + reach + 0.05); // tip is 5 cm ahead, aim point `reach` further
    };
    aimAt(v.rightCtrl, 10, 5, 10);
    aimAt(v.leftCtrl, 20, 5, 20);
    v.pad('right').buttons[0].value = 1;
    v.frames(1);
    return {
      right: world.get(10, 5, 10), left: world.get(20, 5, 20),
      wristOnLeft: window.sandbox.vrPlacer._wristUI?.parent === v.leftCtrl,
    };
  });
  assert.notEqual(r.right, 0, 'material placed where the RIGHT hand aims');
  assert.equal(r.left, 0, 'nothing placed where the left hand aims');
  assert.equal(r.wristOnLeft, true, 'wrist panel is on the left hand');
  await context.close();
});

test('VR: leaving VR restores the desktop view of the world', async () => {
  const { context, page } = await openVR();
  const r = await page.evaluate(() => {
    const v = window.__vr;
    v.snapRight();
    v.xr.isPresenting = false;
    v.frames(1);
    return { pos: v.sg.position.toArray(), quat: v.sg.quaternion.toArray(), scale: v.sg.scale.toArray() };
  });
  assert.deepEqual(r, { pos: [0, 0, 0], quat: [0, 0, 0, 1], scale: [1, 1, 1] });
  await context.close();
});

test('VR: pour rate does not depend on the headset refresh rate', async () => {
  const { context, page } = await openVR();
  const r = await page.evaluate(() => {
    const v = window.__vr;
    const world = window.sandbox.world;
    const t = v.sg.localToWorld(new v.V(12.5, 8.5, 12.5));
    v.place(v.rightCtrl, t.x, t.y, t.z + window.sandbox.state.vrPlacementReach + 0.05);
    const run = hz => {
      let stamps = 0;
      const set = world.set.bind(world);
      world.set = (...a) => { stamps++; set(...a); };
      v.pad('right').buttons[0].value = 1;
      for (let i = 0; i < hz; i++) { v.frames(1, 1 / hz); world.cells[world.idx(12, 8, 12)] = 0; } // keep the target free
      v.pad('right').buttons[0].value = 0;
      world.set = set;
      return stamps;
    };
    return { at72: run(72), at120: run(120) };
  });
  assert.ok(Math.abs(r.at72 - r.at120) <= 1, `pours per second: 72 Hz ${r.at72}, 120 Hz ${r.at120}`);
  assert.ok(Math.abs(r.at72 - 30) <= 1, `~30 pours per second while the trigger is held (got ${r.at72})`);
  await context.close();
});

// ============================================================================
// Desktop controls (pointer lock emulated by setting fly.locked).
// ============================================================================
async function openDesktop() {
  const { context, page, errors } = await openSandbox();
  await page.evaluate(() => {
    const app = window.sandbox;
    app.voxelRenderer.renderer.setAnimationLoop(null);
    app.fly.locked = true;
    // Look from the start camera at the middle of the floor
    const p = app.voxelRenderer.camera.position;
    const d = { x: 16.5 - p.x, y: 1 - p.y, z: 16.5 - p.z }; // top surface of floor voxel (16,0,16)
    const len = Math.hypot(d.x, d.y, d.z);
    app.fly.yaw = Math.atan2(-d.x, -d.z);
    app.fly.pitch = Math.asin(d.y / len);
  });
  return { context, page, errors };
}

test('desktop: pouring works from the starting viewpoint', async () => {
  const { context, page } = await openDesktop();
  const placed = await page.evaluate(() => {
    const { desktopPlacer, world } = window.sandbox;
    desktopPlacer.placing = true;
    desktopPlacer.update(1 / 60);
    return world.get(16, 1, 16);
  });
  assert.notEqual(placed, 0, 'a voxel was placed on the floor that the crosshair points at');
  await context.close();
});

test('desktop: one scroll step changes reach once, and in SPOUT mode changes only the rate', async () => {
  const { context, page } = await openDesktop();
  const r = await page.evaluate(() => {
    const { fly, state } = window.sandbox;
    fly.reach = 30;
    document.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));
    const pourReach = fly.reach;
    state.modeIndex = 1; // SPOUT
    const rate0 = state.pendingRate;
    document.dispatchEvent(new WheelEvent('wheel', { deltaY: -100 }));
    return { pourReach, spoutReach: fly.reach, rateDelta: state.pendingRate - rate0 };
  });
  assert.equal(r.pourReach, 33, 'reach += 0.03 * deltaY');
  assert.equal(r.spoutReach, 33, 'SPOUT mode scroll leaves reach alone');
  assert.equal(r.rateDelta, 1);
  await context.close();
});

test('desktop: pour rate does not depend on the monitor refresh rate', async () => {
  const { context, page } = await openDesktop();
  const r = await page.evaluate(() => {
    const { desktopPlacer, world } = window.sandbox;
    const run = hz => {
      let stamps = 0;
      const set = world.set.bind(world);
      world.set = (...a) => { stamps++; set(...a); };
      desktopPlacer.placing = true;
      for (let i = 0; i < hz; i++) { desktopPlacer.update(1 / hz); world.cells[world.idx(16, 1, 16)] = 0; }
      desktopPlacer.placing = false;
      world.set = set;
      return stamps;
    };
    return { at60: run(60), at144: run(144) };
  });
  assert.ok(Math.abs(r.at60 - r.at144) <= 1, `pours per second: 60 Hz ${r.at60}, 144 Hz ${r.at144}`);
  assert.ok(Math.abs(r.at60 - 30) <= 1, `~30 pours per second while the button is held (got ${r.at60})`);
  await context.close();
});
