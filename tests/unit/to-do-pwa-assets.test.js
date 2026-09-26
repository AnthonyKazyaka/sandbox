// Item 6 — static checks for the to-do PWA: every URL the manifest, page and
// service worker reference must exist, and none may be root-absolute (the app
// is served from /sandbox/to-do-tracker/, not from /).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from '../helpers/static-server.js';

const dir = path.join(REPO_ROOT, 'to-do-tracker');
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
const sw = fs.readFileSync(path.join(dir, 'sw.js'), 'utf8');
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');

const exists = rel => fs.existsSync(path.join(dir, rel.split('?')[0]));

test('manifest start_url and scope stay inside the app directory', () => {
  for (const key of ['start_url', 'scope']) {
    assert.ok(manifest[key], `${key} is set`);
    assert.ok(!manifest[key].startsWith('/'), `${key} "${manifest[key]}" must be relative`);
  }
});

test('every manifest icon (including shortcut icons) exists', () => {
  const icons = [...manifest.icons, ...(manifest.shortcuts || []).flatMap(s => s.icons || [])];
  assert.ok(icons.some(i => i.sizes === '192x192') && icons.some(i => i.sizes === '512x512'), '192 and 512 icons present');
  const missing = icons.filter(i => !exists(i.src)).map(i => i.src);
  assert.deepEqual(missing, []);
});

test('shortcut URLs are relative', () => {
  for (const s of manifest.shortcuts || []) assert.ok(!s.url.startsWith('/'), s.url);
});

test('icons linked from index.html exist', () => {
  const hrefs = [...html.matchAll(/<link[^>]+rel="(?:icon|apple-touch-icon)"[^>]*href="([^"]+)"/g)].map(m => m[1]);
  assert.ok(hrefs.length > 0);
  assert.deepEqual(hrefs.filter(h => !exists(h)), []);
});

test('service worker precache list is relative and complete', () => {
  const list = sw.match(/const APP_SHELL = \[([\s\S]*?)\];/);
  assert.ok(list, 'APP_SHELL array is declared');
  const urls = [...list[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
  for (const u of urls) assert.ok(!u.startsWith('/'), `precache entry "${u}" must be relative`);
  const local = urls.filter(u => !/^https?:/.test(u) && u !== './');
  assert.deepEqual(local.filter(u => !exists(u)), [], 'all precached files exist');
  for (const f of ['index.html', 'styles.css', 'app.js', 'manifest.json']) assert.ok(urls.includes(f) || urls.includes(`./${f}`), `${f} precached`);
});
