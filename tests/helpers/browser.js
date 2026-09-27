// Playwright helpers that make browser tests hermetic and deterministic:
// every third-party request is either served from a local copy or blocked,
// so results never depend on CDN availability.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { REPO_ROOT } from './static-server.js';

const THREE_MODULE = path.join(REPO_ROOT, 'node_modules/three/build/three.module.js');

// Chart.js is only needed for the to-do analytics canvases; a stub keeps
// tests independent of the CDN while still exercising the calling code.
const CHART_STUB = `
  window.Chart = class Chart {
    constructor(ctx, config) { this.ctx = ctx; this.config = config; Chart.instances.push(this); }
    destroy() {} update() {} resize() {}
  };
  window.Chart.instances = [];
  window.Chart.defaults = { font: {}, plugins: { legend: { labels: {} } } };
`;

export async function launchBrowser() {
  return chromium.launch();
}

export async function newContext(browser, options = {}) {
  const context = await browser.newContext(options);
  const blocked = [];
  await context.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, route => {
    const url = route.request().url();
    if (url.startsWith('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js')) {
      return route.fulfill({ path: THREE_MODULE, contentType: 'text/javascript' });
    }
    if (url.startsWith('https://cdn.jsdelivr.net/npm/chart.js')) {
      return route.fulfill({ body: CHART_STUB, contentType: 'text/javascript' });
    }
    if (/fonts\.(googleapis|gstatic)\.com/.test(url)) {
      return route.fulfill({ body: '', contentType: 'text/css' });
    }
    blocked.push(url);
    return route.abort();
  });
  context.blockedRequests = blocked;
  return context;
}

// Collects uncaught page errors and failed same-origin requests.
export function trackErrors(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('response', r => {
    if (r.status() >= 400 && /localhost/.test(r.url())) errors.push(`${r.status()} ${r.url()}`);
  });
  return errors;
}

export function readRepoFile(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');
}

// Headless and automated Chromium never grant pointer lock (the page stays
// "unlocked"), so emulate only the lock itself: pointerLockElement reports
// the canvas after requestPointerLock(), and ESC releases it as a browser
// would. All keyboard/mouse input still goes through the page's real handlers.
export async function emulatePointerLock(page) {
  await page.addInitScript(() => {
    let locked = null;
    Object.defineProperty(Document.prototype, 'pointerLockElement', { configurable: true, get: () => locked });
    Element.prototype.requestPointerLock = function () {
      locked = this;
      document.dispatchEvent(new Event('pointerlockchange'));
    };
    Document.prototype.exitPointerLock = function () {
      locked = null;
      document.dispatchEvent(new Event('pointerlockchange'));
    };
    addEventListener('keydown', e => { if (e.code === 'Escape' && locked) document.exitPointerLock(); }, true);
  });
}
