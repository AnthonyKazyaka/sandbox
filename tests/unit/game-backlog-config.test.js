// Item 1 — the backlog tracker must start without the gitignored js/config.js.
// Source of truth: the module graph. If any statically imported file is
// missing, importing web/core modules throws ERR_MODULE_NOT_FOUND in Node
// (and the browser refuses to run web/app.js at all).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { installLocalStorage } from '../helpers/local-storage.js';

installLocalStorage();

test('js/config.js is not in the repo (it is gitignored), so it must not be required', () => {
  assert.equal(fs.existsSync(new URL('../../game-backlog-tracker/js/config.js', import.meta.url)), false);
});

test('core/rawg-api.js loads when js/config.js does not exist', async () => {
  const mod = await import('../../game-backlog-tracker/core/rawg-api.js');
  assert.ok(mod.rawgApi, 'rawgApi singleton is exported');
});

test('API key comes from user settings and is used in request URLs', async () => {
  const { rawgApi } = await import('../../game-backlog-tracker/core/rawg-api.js');
  const config = await import('../../game-backlog-tracker/core/config.js');
  localStorage.clear();
  assert.equal(config.hasRawgApiKey(), false, 'placeholder key does not count as configured');
  config.setRawgApiKey('  test-key-123  ');
  assert.equal(config.hasRawgApiKey(), true);
  assert.match(rawgApi.buildUrl('/games', { search: 'hades' }), /[?&]key=test-key-123(&|$)/);
  config.setRawgApiKey('');
  assert.equal(config.hasRawgApiKey(), false);
});

test('searching without a key fails fast with an actionable message (no network call)', async () => {
  const { rawgApi } = await import('../../game-backlog-tracker/core/rawg-api.js');
  localStorage.clear();
  let fetched = false;
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => { fetched = true; throw new Error('should not fetch'); };
  try {
    await assert.rejects(rawgApi.searchGames('hades'), /API key/i);
    assert.equal(fetched, false);
  } finally {
    globalThis.fetch = realFetch;
  }
});
