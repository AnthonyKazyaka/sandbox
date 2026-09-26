# Verification of the sandbox improvements

This file explains how each improvement is judged a success, and the evidence
that it is. Every claim maps to an automated check that:

1. **fails on the original code** (reproducing the reported problem), and
2. **passes on the fixed code**.

Both results are recorded in [`docs/verification/`](docs/verification/).

```bash
npm ci                 # test-only dev dependencies (the apps stay dependency-free)
npm test               # everything (56 tests, ~1 min)
npm run test:unit      # fast Node-only checks
npm run test:e2e       # Chromium checks via Playwright
```

CI runs the same command on every push (`.github/workflows/tests.yml`).

## How the checks are made deterministic

| Source of non-determinism | Control |
|---|---|
| `Math.random` in the games and simulations | Seeded PRNG (`mulberry32`) injected into the sandbox (`tests/helpers/fake-dom.js`) |
| Wall-clock time, `setTimeout`, `requestAnimationFrame` | Manual clock: tests advance time explicitly, frame by frame (`sandbox.advance`, `sandbox.frame`) |
| "Today", time zones | Playwright `clock.setFixedTime` + `timezoneId` (America/New_York and Asia/Tokyo) |
| CDNs (three.js, Chart.js, Google Fonts) | Served from `node_modules` or a stub, and every other external request is blocked (`tests/helpers/browser.js`) |
| Hosting path | Repo served under `/sandbox/`, exactly like GitHub Pages (`tests/helpers/static-server.js`) |
| Browser storage | A fresh browser context per test |

### Sources of truth used

- **The code itself, run for real.** Classic scripts run in a `vm` sandbox; ES modules are imported directly in Node; pages run in Chromium.
- **The browser's own view:**
  - `navigator.serviceWorker.ready` for installation
  - offline reload for caching
  - Chromium's parsed manifest (`Page.getAppManifest`) for scope
  - HTTP status of every referenced icon
  - computed styles for overlays
- **Cross-implementation agreement.** The MCP ranking must equal the web calculator's ranking on the same fixture.
- **Properties rather than examples** where possible. For example, "`dirty` is true exactly when the rendered cells changed", checked on every step of a 400-step seeded simulation; or "each value lands in each shuffle position with p≈0.25" over 40,000 shuffles.

### Checks rejected as unreliable

- **CDP `Page.getInstallabilityErrors`** returns `[]` in headless Chromium even for a manifest whose icons all 404, so it can't distinguish good from bad. It was replaced by the parsed-manifest and icon-fetch checks.
- **`window.app` as a "booted" signal** is truthy even when the app never started, because `<div id="app">` is exposed on `window` by name. The smoke test checks for the app instance's methods instead.

## Results

| Run | Tests | Pass | Fail |
|---|---|---|---|
| Tests as first written, original code ([log](docs/verification/tests-as-first-written-on-original-code.txt)) | 47 | 6 | 41 |
| **Final** tests, original code ([log](docs/verification/final-tests-on-original-code.txt)) | 56 | 8 | 48 |
| **Final** tests, fixed code ([log](docs/verification/final-tests-on-fixed-code.txt)) | 56 | **56** | **0** |

The 8 tests that pass on the original code are deliberate guards, which must pass both before and after a fix:

- pixel-sandbox boots
- to-do-tracker boots
- the CELLS counter is accurate
- `js/config.js` is not committed
- MCP filters still apply
- Stop halts the game of life
- grid sanity
- one pixel-sandbox smoke test

## Per-improvement evidence

Before/after values are measured by the named checks (U = `tests/unit`, E = `tests/e2e`).

| # | Claim | Success criterion (deterministic) | Check | Before (measured) | After |
|---|---|---|---|---|---|
| 1 | Backlog tracker loads without the gitignored `js/config.js` | Core modules import with no `js/config.js`; the page renders its empty state with no uncaught errors; a key saved in Settings survives a reload and is sent to RAWG (mocked) | U `game-backlog-config`, E `game-backlog-tracker`, E `smoke` | Import fails: `Cannot find module …/js/config.js`; empty state never appears | 7/7 pass |
| 2 | Auto-shooter movement is frame-rate independent and the game is playable | First frame keeps the player at centre; a bullet covers ≥ range before expiring; same distance at 30 and 144 fps; ≤ one capped step after a 5 s stall; ≥ wave 3 after 90 s of seeded auto-play; paused while upgrading; HUD max health; restart | U `auto-shooter`, E `smoke` | Player thrown to (1185, 785); bullet travels 16.1 px vs 200 px range; enemy 1.5 px/s; 7.5 px jump after a stall; still on wave 1 after 90 s | 8/8 pass; waves 4–5 across 10 seeds |
| 3 | To-do edits persist | Edit a task in the form, reload, and the new title is loaded | E `to-do-tracker` | `'Original title'` after reload | pass |
| 4 | Pixel-sandbox VR entry works | With WebXR mocked: button shows `Exit VR`, MODE shows `VR`, no errors; ending the session restores `Enter VR` / `DESKTOP` | E `pixel-sandbox` | Button shows `VR failed — check runtime` while the session is running | pass |
| 5 | "Today" is the user's local day | At 21:30 in New York and 08:30 in Tokyo: today key, Today/Tomorrow/Yesterday labels, overdue and today-list membership are all correct; far-off dates show without a day shift | E `to-do-tracker` | New York 21:30 on Mar 10 → today = `2026-03-11` | pass (both zones) |
| 6 | To-do PWA installs and works offline under `/sandbox/to-do-tracker/` | Service worker becomes `activated`; reload succeeds while offline; Chromium resolves scope to the app directory; every icon (manifest, shortcuts, page) returns 200; precache list is relative and complete | E `to-do-tracker`, U `to-do-pwa-assets` | Service worker never ready (`cache.addAll` 404s); scope resolved to `http://host/`; 10 icon files missing | pass |
| 7 | Pixel-sandbox rebuilds only when something changed; culling is correct | `dirty === (cells or colour changed)` on every step; the active set drains to 0 when settled; zero rebuilds when idle in the browser; sand under water not culled; unbiased shuffle | U `pixel-sandbox-world`, E `pixel-sandbox` | Dirty on 600/600 steps; 1024 stone cells re-simulated forever; P(value 0 at position 0) = 0.000 | Dirty on 9/600 steps; 0 active; idle step 60 µs → 0.6 µs; all pass |
| 8 | MCP ranking equals the web "Play Next" ranking | Same order and scores as `PriorityCalculator` on a fixture where the two old formulas disagree | U `game-backlog-priority-parity`, plus `mcp-server/test.js` | MCP order `b,a,d,…` vs web `b,a,c,…` | pass; the real MCP server integration test also passes |
| 9 | Analytics use the real completion time; streaks; recurring tasks | Editing a completed task keeps its completion day; streak alive until the day ends; legacy data migrated; recurring daily/weekly/monthly (month-end clamped, anchored, missed dates skipped, no duplicates) | E `to-do-tracker` | Completion moved to the edit day; streak 0 with nothing done today; recurring flag ignored | pass |
| 10 | Game of Life has one update loop | After Stop→Start within one tick: exactly 1 pending timer and the exact generation count; clicks map through CSS scaling; generation counter and speed control work | U `game-of-life` | 2 pending timers (double speed) | 4/4 pass |

Pixel-sandbox benchmark (seeded settling-sand scene, Node 22):

| Metric | Before | After |
|---|---|---|
| Steps needing a renderer rebuild | 600 / 600 | 9 / 600 |
| Active cells once settled | 1024 | 0 |
| Idle `World.step()` cost | 60.2 µs | 0.6 µs |

## Additional defects found by the checks

Writing tests against real behaviour found these; each was fixed and has a check:

- **Backlog tracker:** with top-level `await` in the new config module, the module finished loading after `DOMContentLoaded`, so the app never started. This was caught by the E2E empty-state check before commit.
- **To-do task form:** categories were hard-coded (`household`, …) and matched no category id, so every task created in the form showed "Unknown". Re-renders also reset the task-list filters.
- **To-do Analytics:** opening it always threw, because `renderAchievements`/`renderInsights` didn't exist and the family chart read the wrong data shape.
- **To-do styles:** commit `01d60ac` dropped about 60 base CSS rules, so modals and the toast rendered unstyled at the bottom of the page. The rules were restored from the previous revision.

## Test corrections made during the work

These are recorded because changing a test can hide a problem:

- **Recurrence spec:** the first draft expected a monthly task due Jan 31, completed on Mar 10, to be due next on Feb 28, which is already in the past. That contradicts the "skip missed occurrences" rule the same test asserts for daily tasks. It was changed, before implementing, to expect Mar 31, and an explicit month-end clamp case was added (Mar 31 → Apr 30).
- **Fake DOM fidelity:** `textContent` now stores strings, as real DOM does.
- **Pixel-sandbox scene:** water is designed to keep wandering, so the dirty-flag property test removes liquids partway through to also cover the idle case.
- **To-do checkbox:** the test clicks the visible label instead of force-checking a hidden input.

## Not covered by automation (manual follow-up)

- Real WebXR hardware (setSession is stubbed; only the UI flow around it is tested).
- Real Chart.js rendering (a stub records chart creation).
- iOS Safari PWA behaviour, and live CDN availability.
- Auto-shooter difficulty balance: the auto-player now rarely takes damage in early waves, which is a tuning question rather than a correctness one.
