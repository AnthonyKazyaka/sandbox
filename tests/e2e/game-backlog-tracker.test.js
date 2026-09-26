// Item 1 — the deployed backlog tracker must boot and be usable without js/config.js.
// Evidence: a real Chromium session against the repo served exactly as on
// GitHub Pages (no js/config.js exists in the repo or the deploy).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startStaticServer } from '../helpers/static-server.js';
import { launchBrowser, newContext, trackErrors } from '../helpers/browser.js';

let server, browser;
before(async () => { server = await startStaticServer(); browser = await launchBrowser(); });
after(async () => { await browser?.close(); await server?.close(); });

const RAWG_FIXTURE = {
  count: 1, next: null, previous: null,
  results: [{
    id: 1, slug: 'hades', name: 'Hades', released: '2020-09-17', background_image: null,
    metacritic: 93, rating: 4.5, playtime: 22,
    platforms: [{ platform: { id: 4, name: 'PC' } }], genres: [{ id: 1, name: 'Action' }],
  }],
};

async function openApp(context) {
  const page = await context.newPage();
  const errors = trackErrors(page);
  await page.goto(server.url('game-backlog-tracker/'));
  return { page, errors };
}

// A local js/config.js is an optional developer override; its absence is expected.
const fatal = errors => errors.filter(e => !/\/js\/config\.js$/.test(e));

test('app boots: no uncaught errors and the empty backlog state is rendered', async () => {
  const context = await newContext(browser);
  const { page, errors } = await openApp(context);
  await page.locator('#empty-backlog').waitFor({ state: 'visible', timeout: 5000 });
  assert.deepEqual(fatal(errors), []);
  await context.close();
});

test('search without an API key tells the user to add one in Settings', async () => {
  const context = await newContext(browser);
  const { page } = await openApp(context);
  await page.click('#add-game-btn');
  await page.fill('#rawg-search', 'hades');
  await page.click('#rawg-search-btn');
  await assert.doesNotReject(page.locator('#rawg-results', { hasText: /Settings/ }).waitFor({ timeout: 5000 }));
  await context.close();
});

test('API key saved in Settings is used for RAWG searches', async () => {
  const context = await newContext(browser);
  const seen = [];
  await context.route('https://api.rawg.io/**', route => {
    seen.push(route.request().url());
    return route.fulfill({ json: RAWG_FIXTURE });
  });
  const { page, errors } = await openApp(context);
  await page.click('.nav-item[data-view="settings"]');
  await page.fill('#setting-rawg-key', 'my-test-key');
  await page.click('#save-rawg-key');
  await page.reload();
  await page.click('.nav-item[data-view="settings"]');
  assert.equal(await page.inputValue('#setting-rawg-key'), 'my-test-key', 'key persists across reloads');
  await page.click('#add-game-btn');
  await page.fill('#rawg-search', 'hades');
  await page.click('#rawg-search-btn');
  await page.locator('#rawg-results .search-result-title', { hasText: 'Hades' }).waitFor({ timeout: 5000 });
  assert.ok(seen.some(u => new URL(u).searchParams.get('key') === 'my-test-key'));
  assert.deepEqual(fatal(errors), []);
  await context.close();
});
