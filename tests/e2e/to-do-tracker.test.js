// Items 3, 5, 6, 9 — Family To-Do Tracker behaviour in a real browser.
// Time and timezone are pinned with Playwright's clock + timezoneId so the
// date assertions are exact and reproducible on any machine.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startStaticServer } from '../helpers/static-server.js';
import { launchBrowser, newContext, trackErrors } from '../helpers/browser.js';

let server, browser;
before(async () => { server = await startStaticServer(); browser = await launchBrowser(); });
after(async () => { await browser?.close(); await server?.close(); });

async function openTodo({ timezoneId = 'America/New_York', time = '2026-03-10T14:00:00-04:00', serviceWorkers = 'block', seed } = {}) {
  const context = await newContext(browser, { timezoneId, locale: 'en-US', serviceWorkers });
  const page = await context.newPage();
  const errors = trackErrors(page);
  if (seed) await page.addInitScript(s => { if (!localStorage.getItem('familyTrackerData')) localStorage.setItem('familyTrackerData', s); }, JSON.stringify(seed));
  await page.clock.setFixedTime(new Date(time));
  await page.goto(server.url('to-do-tracker/'));
  await waitReady(page);
  return { context, page, errors };
}

async function waitReady(page) {
  await page.waitForFunction(() => typeof app !== 'undefined' && app.currentUser && document.getElementById('app').style.display === 'flex');
}

// ---------------------------------------------------------------- Item 3
test('editing a task persists across a reload', async () => {
  const { context, page, errors } = await openTodo();
  const id = await page.evaluate(() => app.addTask({ title: 'Original title', category: '1' }).id);
  await page.evaluate(id => app.editTask(id), id);
  await page.fill('#taskTitle', 'Renamed title');
  await page.click('#saveTaskBtn');
  await page.reload();
  await waitReady(page);
  assert.equal(await page.evaluate(id => app.tasks.find(t => t.id === id)?.title, id), 'Renamed title');
  assert.deepEqual(errors, []);
  await context.close();
});

// ---------------------------------------------------------------- Item 5
const DATE_CASES = [
  // US evening: UTC is already "tomorrow".
  { timezoneId: 'America/New_York', time: '2026-03-10T21:30:00-04:00', today: '2026-03-10', tomorrow: '2026-03-11', yesterday: '2026-03-09' },
  // Asia morning: UTC is still "yesterday".
  { timezoneId: 'Asia/Tokyo', time: '2026-03-11T08:30:00+09:00', today: '2026-03-11', tomorrow: '2026-03-12', yesterday: '2026-03-10' },
];

for (const c of DATE_CASES) {
  test(`"today" follows the user's local calendar (${c.timezoneId} at ${c.time})`, async () => {
    const { context, page } = await openTodo(c);
    const r = await page.evaluate(c => {
      const t = app.addTask({ title: 'Due today', category: '1', dueDate: c.today });
      return {
        today: app.getTodayDate(),
        overdue: app.isOverdue(t),
        inToday: app.getTodayTasks().some(x => x.id === t.id),
        labelToday: app.formatDueDate(c.today),
        labelTomorrow: app.formatDueDate(c.tomorrow),
        labelYesterday: app.formatDueDate(c.yesterday),
        labelFar: app.formatDueDate('2026-03-20'),
        expectedFar: new Date(2026, 2, 20).toLocaleDateString(),
        yesterdayOverdue: app.isOverdue({ dueDate: c.yesterday, completed: false }),
      };
    }, c);
    assert.equal(r.today, c.today);
    assert.equal(r.overdue, false, 'a task due today is not overdue');
    assert.equal(r.inToday, true, 'a task due today is listed for today');
    assert.equal(r.labelToday, 'Today');
    assert.equal(r.labelTomorrow, 'Tomorrow');
    assert.equal(r.labelYesterday, 'Yesterday');
    assert.equal(r.labelFar, r.expectedFar, 'calendar dates are shown without a timezone shift');
    assert.equal(r.yesterdayOverdue, true);
    await context.close();
  });
}

// ---------------------------------------------------------------- Item 9
test('completion date is kept when a completed task is edited later', async () => {
  const { context, page } = await openTodo({ time: '2026-03-09T15:00:00-04:00' });
  const id = await page.evaluate(() => {
    app.tasks = []; app.saveData();
    const t = app.addTask({ title: 'Mow lawn', category: '1' });
    app.toggleTask(t.id);
    return t.id;
  });
  await page.clock.setFixedTime(new Date('2026-03-10T10:00:00-04:00'));
  await page.evaluate(id => app.editTask(id), id);
  await page.fill('#taskTitle', 'Mow the lawn');
  await page.click('#saveTaskBtn');
  const r = await page.evaluate(id => ({
    completedAt: app.tasks.find(t => t.id === id).completedAt,
    weekly: app.getWeeklyProgressData().completed,
  }), id);
  assert.equal(new Date(r.completedAt).toISOString(), '2026-03-09T19:00:00.000Z');
  assert.equal(r.weekly.at(-2), 1, 'counted on the day it was completed (Mar 9)');
  assert.equal(r.weekly.at(-1), 0, 'not counted on the day it was edited (Mar 10)');
  await context.close();
});

test('streak stays alive until the end of today', async () => {
  const { context, page } = await openTodo({ time: '2026-03-08T12:00:00-04:00' });
  await page.evaluate(() => { app.tasks = []; app.toggleTask(app.addTask({ title: 'Day 1', category: '1' }).id); });
  await page.clock.setFixedTime(new Date('2026-03-09T12:00:00-04:00'));
  await page.evaluate(() => app.toggleTask(app.addTask({ title: 'Day 2', category: '1' }).id));
  await page.clock.setFixedTime(new Date('2026-03-10T08:00:00-04:00'));
  assert.equal(await page.evaluate(() => app.getCurrentStreak()), 2, 'nothing done yet today, streak is still 2');
  await page.evaluate(() => app.toggleTask(app.addTask({ title: 'Day 3', category: '1' }).id));
  assert.equal(await page.evaluate(() => app.getCurrentStreak()), 3);
  await page.clock.setFixedTime(new Date('2026-03-12T08:00:00-04:00'));
  assert.equal(await page.evaluate(() => app.getCurrentStreak()), 0, 'a missed day breaks the streak');
  await context.close();
});

test('legacy completed tasks get completedAt migrated from updatedAt', async () => {
  const seed = {
    tasks: [{ id: 'legacy1', title: 'Old', category: '1', priority: 'medium', assignee: '1', completed: true, completedBy: '1',
      createdAt: '2026-03-01T12:00:00.000Z', updatedAt: '2026-03-05T12:00:00.000Z' }],
    categories: [{ id: '1', name: 'Household', icon: '🏠', color: '#3b82f6' }],
    familyMembers: [{ id: '1', name: 'You', avatar: '👤', color: '#3b82f6', role: 'admin' }],
    settings: {}, currentUser: { id: '1', name: 'You', avatar: '👤' },
  };
  const { context, page } = await openTodo({ seed });
  assert.equal(await page.evaluate(() => app.tasks.find(t => t.id === 'legacy1').completedAt), '2026-03-05T12:00:00.000Z');
  await context.close();
});

test('completing a recurring task schedules the next occurrence (created via the form)', async () => {
  const { context, page, errors } = await openTodo();
  await page.evaluate(() => { app.tasks = []; app.saveData(); });
  await page.click('#addTaskBtn');
  await page.fill('#taskTitle', 'Water plants');
  await page.selectOption('#taskCategory', '1');
  await page.fill('#taskDueDate', '2026-03-10');
  await page.check('#taskRecurring', { force: true });
  await page.selectOption('#taskRecurrence', 'weekly');
  await page.click('#saveTaskBtn');
  const id = await page.evaluate(() => app.tasks.find(t => t.title === 'Water plants').id);
  await page.evaluate(id => app.toggleTask(id), id);
  let series = await page.evaluate(() => app.tasks.filter(t => t.title === 'Water plants')
    .map(t => ({ due: t.dueDate, done: t.completed, recurring: t.recurring, recurrence: t.recurrence })));
  assert.deepEqual(series, [
    { due: '2026-03-10', done: true, recurring: true, recurrence: 'weekly' },
    { due: '2026-03-17', done: false, recurring: true, recurrence: 'weekly' },
  ]);
  // Un-completing and re-completing must not create duplicates.
  await page.evaluate(id => { app.toggleTask(id); app.toggleTask(id); }, id);
  series = await page.evaluate(() => app.tasks.filter(t => t.title === 'Water plants').length);
  assert.equal(series, 2);
  await page.reload();
  await waitReady(page);
  assert.equal(await page.evaluate(() => app.tasks.filter(t => t.title === 'Water plants').length), 2, 'persisted');
  assert.deepEqual(errors, []);
  await context.close();
});

test('recurrence intervals: daily, monthly (clamped to month end), and undated tasks', async () => {
  const { context, page } = await openTodo();
  const next = await page.evaluate(() => {
    app.tasks = [];
    const run = data => {
      const t = app.addTask({ category: '1', recurring: true, ...data });
      app.toggleTask(t.id);
      return app.tasks.find(x => x.title === data.title && !x.completed)?.dueDate ?? null;
    };
    return {
      daily: run({ title: 'd', recurrence: 'daily', dueDate: '2026-03-10' }),
      monthly: run({ title: 'm', recurrence: 'monthly', dueDate: '2026-01-31' }),
      undated: run({ title: 'u', recurrence: 'weekly' }),
      lateDaily: run({ title: 'late', recurrence: 'daily', dueDate: '2026-03-01' }),
    };
  });
  assert.equal(next.daily, '2026-03-11');
  assert.equal(next.monthly, '2026-02-28');
  assert.equal(next.undated, '2026-03-17', 'undated tasks repeat from the completion day');
  assert.equal(next.lateDaily, '2026-03-11', 'overdue recurring tasks catch up to the next future date');
  await context.close();
});

// ---------------------------------------------------------------- Item 6
test('service worker installs and activates under the GitHub Pages sub-path', async () => {
  const { context, page } = await openTodo({ serviceWorkers: 'allow' });
  const state = await page.evaluate(() => Promise.race([
    navigator.serviceWorker.ready.then(r => r.active?.state ?? 'none'),
    new Promise(r => setTimeout(() => r('timeout: service worker never became ready'), 5000)),
  ]));
  assert.equal(state, 'activated');
  await context.close();
});

test('app shell loads offline after the first visit', async () => {
  const { context, page } = await openTodo({ serviceWorkers: 'allow' });
  await page.evaluate(() => Promise.race([navigator.serviceWorker.ready, new Promise((_, j) => setTimeout(() => j(new Error('no SW')), 5000))]));
  await page.reload();
  await waitReady(page);
  await context.setOffline(true);
  await page.reload();
  await waitReady(page);
  assert.ok(await page.locator('#dashboardView').isVisible());
  await context.close();
});

// Note: CDP Page.getInstallabilityErrors returns [] in headless Chromium even
// for a manifest with missing icons, so it is not used as an oracle. Instead we
// check the manifest exactly as Chromium parsed it, and fetch every icon.
test('manifest as parsed by Chromium is scoped to the app and all icons load', async () => {
  const { context, page } = await openTodo();
  const cdp = await context.newCDPSession(page);
  const { url, errors, parsed } = await cdp.send('Page.getAppManifest');
  const appUrl = server.url('to-do-tracker/');
  assert.equal(url, `${appUrl}manifest.json`);
  assert.deepEqual(errors, []);
  assert.equal(parsed.scope, appUrl, 'scope is the app directory');
  assert.ok(parsed.startUrl?.startsWith(appUrl), `start_url ${parsed.startUrl} is inside the app`);
  const iconUrls = [...parsed.icons, ...(parsed.shortcuts || []).flatMap(s => s.icons || [])].map(i => i.url);
  assert.ok(iconUrls.length >= 2);
  const statuses = await page.evaluate(urls => Promise.all(urls.map(u => fetch(u).then(r => [u, r.status]))), iconUrls);
  assert.deepEqual(statuses.filter(([, s]) => s !== 200), []);
  await context.close();
});
