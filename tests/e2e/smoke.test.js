// Regression guard: every project page boots in Chromium without uncaught
// errors or missing same-origin files, and its main loop is running.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startStaticServer } from '../helpers/static-server.js';
import { launchBrowser, newContext, trackErrors } from '../helpers/browser.js';

let server, browser;
before(async () => { server = await startStaticServer(); browser = await launchBrowser(); });
after(async () => { await browser?.close(); await server?.close(); });

// Optional developer override that is intentionally absent from the repo.
const OPTIONAL = [/game-backlog-tracker\/js\/config\.js$/];

const PAGES = [
  { path: 'auto-shooter/', ready: () => Number(document.getElementById('wave').textContent) >= 1 && document.getElementById('maxHealth').textContent === '100' },
  { path: 'game-of-life-ancestry/', ready: () => document.getElementById('generation').textContent === '0' },
  { path: 'pixel-sandbox/', ready: () => !!window.sandbox?.world },
  { path: 'to-do-tracker/', ready: () => document.getElementById('app').style.display === 'flex' },
  // window.app alone would match <div id="app"> via named access, so check the instance
  { path: 'game-backlog-tracker/', ready: () => typeof window.app?.switchView === 'function' },
];

for (const { path, ready } of PAGES) {
  test(`${path} boots cleanly`, async () => {
    const context = await newContext(browser);
    const page = await context.newPage();
    const errors = trackErrors(page);
    await page.goto(server.url(path));
    await page.waitForFunction(ready, null, { timeout: 5000 });
    await page.waitForTimeout(300);
    assert.deepEqual(errors.filter(e => !OPTIONAL.some(re => re.test(e))), []);
    await context.close();
  });
}

test('auto-shooter: game advances in real time in the browser', async () => {
  const context = await newContext(browser);
  const page = await context.newPage();
  await page.goto(server.url('auto-shooter/'));
  // Before the unit fix, bullets vanished after 16 px, so nothing was ever killed.
  await page.waitForFunction(() => Number(document.getElementById('xp').textContent) > 0
    || Number(document.getElementById('level').textContent) > 1, null, { timeout: 15000 });
  await context.close();
});

test('to-do: analytics view renders with streak and charts', async () => {
  const context = await newContext(browser);
  const page = await context.newPage();
  const errors = trackErrors(page);
  await page.goto(server.url('to-do-tracker/'));
  await page.waitForFunction(() => document.getElementById('app').style.display === 'flex');
  await page.evaluate(() => { app.toggleTask(app.tasks[0].id); app.switchView('analytics'); });
  await page.waitForFunction(() => document.getElementById('currentStreak').textContent.trim() !== '');
  assert.equal((await page.textContent('#currentStreak')).trim(), '1 day');
  assert.equal(await page.locator('#achievementsList .achievement-item').count(), 6);
  assert.ok(await page.locator('#achievementsList', { hasText: 'Getting Started' }).count());
  assert.ok(await page.evaluate(() => Chart.instances.length) >= 1, 'charts were created');
  // Re-render through an empty period and back (placeholders replace canvases)
  await page.evaluate(() => { app.tasks = []; app.renderAnalytics(); });
  await page.evaluate(() => { app.toggleTask(app.addTask({ title: 'again', category: '1' }).id); app.renderAnalytics(); });
  assert.equal(await page.locator('#familyChart').count(), 1, 'family chart is drawn again after the placeholder');
  assert.deepEqual(errors, []);
  await context.close();
});

test('to-do: modals and toast are overlays, hidden until used', async () => {
  const context = await newContext(browser);
  const page = await context.newPage();
  await page.goto(server.url('to-do-tracker/'));
  await page.waitForFunction(() => document.getElementById('app').style.display === 'flex');
  const style = sel => page.$eval(sel, el => { const cs = getComputedStyle(el); return { position: cs.position, visibility: cs.visibility }; });
  assert.deepEqual(await style('#taskModal'), { position: 'fixed', visibility: 'hidden' });
  assert.equal(await page.locator('#taskModal').isVisible(), false);
  await page.click('#addTaskBtn');
  await page.waitForFunction(() => getComputedStyle(document.getElementById('taskModal')).visibility === 'visible');
  assert.equal((await style('#taskModal')).position, 'fixed');
  assert.equal(await page.locator('#taskRecurrenceGroup').isVisible(), false, 'repeat options hidden until Recurring is checked');
  await page.click('#taskModal .checkbox-label');
  assert.equal(await page.locator('#taskRecurrenceGroup').isVisible(), true);
  assert.equal((await style('#toast')).position, 'fixed');
  await context.close();
});
