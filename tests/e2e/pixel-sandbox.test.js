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
