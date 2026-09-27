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

## Pixel-sandbox VR and desktop controls (v0.4.0)

VR can't run in CI, so the checks come in two layers:

1. **Pure geometry** in `pixel-sandbox/vr-math.js`, unit-tested as properties over many poses, turn angles and world scales (`tests/unit/pixel-sandbox-vr-math.test.js`).
2. **The real `VRPlacer.update()`** driven frame by frame in Chromium (`tests/e2e/pixel-sandbox.test.js`). The animation loop is stopped, and the XR session, head pose and two controllers are stubbed with xr-standard gamepads. The controllers connect **right first**, which some runtimes do.

   The stub mirrors three.js r128 exactly, as confirmed in its source:
   - `controllers[i]` is updated from `session.inputSources[i]` every frame
   - controller spaces have `matrixAutoUpdate = false`
   - the XR camera's matrix is this frame's first-eye pose

| # | Claim | Success criterion | Before (measured on `main` @ 3021be1) | After |
|---|---|---|---|---|
| 1 | Entering VR shows the world in front of you | Grid centre 0.6–2 m ahead and centred; floor below eye level; 1–2.5 m wide; all corners in front | World centre **15.8 m behind** the player; 32 m wide | 1.2 m ahead, 0.65 m below the eyes, 1.6 m wide |
| 2 | Stick-forward flies toward where the left hand points, at a fixed speed | cos(motion, aim) > 0.99 after 0, 1, 2 and 4 snap turns (unit test: every 15° × 3 aims × 2 scales); 3.2 voxels/s; same distance at 72 and 120 Hz | cos **−1.00** (backwards) at 0 turns, −0.71 after 1, 0.00 after 2; 2.88 vs 4.80 voxels/s at 72 vs 120 Hz | cos = 1.000 in every case; 3.20 voxels/s at any rate |
| 3 | Turning happens in place; two-hand scaling keeps the point between the hands fixed | Head's position in voxel coordinates unchanged by a turn; midpoint between hands unchanged by scaling | Head drifted **0.83 voxels** per turn (player away from the room origin); midpoint drifted **0.63 voxels** | < 1e-6 |
| 4 | Pouring, erasing, the stream and the wrist panel use the correct hand | With the right controller connected first: material lands where the right hand aims, and the wrist panel is on the left hand | Poured from the **left** hand's aim; panel on the right hand | Correct hands |
| 4b | Leaving VR restores the desktop view | World transform back to identity after a VR session with turns | World left rotated or scaled on desktop | Identity |
| 5 | Desktop pouring works from the starting viewpoint | Crosshair on the floor centre + click places a voxel there; raycast from outside the grid hits the entry voxel with the right face and distance | Raycast returned `null` (it stopped as soon as it was outside the grid); reach 22 < 37 needed | Voxel placed; raycast unit tests pass |
| 10 | Small fixes | `setSpout` marks the world dirty; one scroll step changes reach once (0.03 × deltaY) and in SPOUT mode only the rate; pouring is 30 stamps/s at 60, 72, 120 and 144 Hz | Not dirty; reach changed 2× and also in SPOUT mode; pour rate tied to refresh rate | All pass |

| Run | Tests | Pass | Fail |
|---|---|---|---|
| Tests as first written, original code ([log](docs/verification/pixel-vr-tests-as-first-written-on-original-code.txt)) | 28 | 11 | 17 |
| **Final** pixel tests, original code ([log](docs/verification/pixel-vr-final-tests-on-original-code.txt)) | 29 | 11 | 18 |
| **Final** pixel tests, fixed code ([log](docs/verification/pixel-vr-final-tests-on-fixed-code.txt)) | 41 | **41** | **0** |

The 11 tests that pass on the original code are the earlier v0.3.1 checks plus two raycast guards (a ray inside the grid, and a ray that misses the grid). The final run on the original counts fewer tests because the `vr-math` file fails to load there (the module doesn't exist).

**Test corrections made during this work:**
- **Pour-rate tests:** at first these passed on the old code only because nothing was poured at all (0 = 0). They now also require about 30 pours per second.
- **Stub controllers:** poses are composed into the matrix, as three.js does. The first draft set only `position`, which three.js ignores for XR controllers, so the scaling check produced NaN instead of a measurement.
- **Raycast target:** the desktop target is the floor's top surface (y = 1). Aiming at the voxel centre (y = 0.5) correctly hits the surface one voxel nearer.

**Still needs a headset:**
- comfort of the spawn distance and height
- the 3.2 voxels/s flying speed
- actual controller ordering on Quest and PC VR

## Pixel-sandbox desktop controls and rendering (v0.5.0)

This comes from a hands-on review in Chromium with real Playwright keyboard, mouse-button, mouse-move and scroll input (`tests/e2e/pixel-sandbox-desktop.test.js`). Automated Chromium never grants pointer lock, even headed under Xvfb, so only the lock state is emulated (`emulatePointerLock` in `tests/helpers/browser.js`). The game's own lock handler and input listeners run unchanged.

| # | Problem found | Success criterion | Before (measured on `main` @ 7ee26ca) | After |
|---|---|---|---|---|
| 1 | Stone rendered black; other materials flat and over-bright | Every voxel mesh and spout visual has a full-size colour buffer. Pixel readback: floor tops are neither black nor saturated, are grey like `#7a7a8a`, and show more than one shade; sand reads yellow | Colour buffers had length **0**: three.js r128 `setColorAt()` sizes them from `count`, which was 0. Floor pixel `(0,0,0)`. See [before](docs/verification/pixel-colours-before.png) | Buffers allocated up front; white base materials; lighting rebalanced. See [after](docs/verification/pixel-colours-and-marker-after.png) |
| 2 | Clicking "Click to enter" did nothing | Clicking the prompt captures the mouse | Not captured (the prompt swallowed the click and had no handler) | Captured |
| 3 | Left-click did nothing in ERASE or SPOUT mode; spouts needed a middle button | Left-click pours, places exactly one spout per click, or erases, depending on the tool | ERASE + left-click: nothing; SPOUT + left-click: 0 spouts | Works; right-click still always erases |
| 4 | Keys stuck after alt-tab | `blur`, a hidden tab, or releasing the mouse clears held keys; no drift after re-entering | W stayed held and the camera drifted on return | Cleared |
| 5 | No flight bounds | 20 simulated seconds of Shift+S, Shift+Space and Shift+A stays within [−32, 64] on every axis | Reached (−544, 765, 578) | Clamped |
| 6 | No target indicator; crosshair invisible on light blocks | An outline marks the cell the tool will act on (the empty cell for pour/spout, the block for erase, the mid-air cell); hidden when the mouse is released; crosshair uses `mix-blend-mode: difference` | No marker; white crosshair over a pale block | Marker and contrast-safe crosshair (also shown in VR at the right hand's aim) |
| 7 | Number keys failed on AZERTY | `Digit1` selects material 1 whatever character it types; hints use the keyboard layout (`navigator.keyboard.getLayoutMap`) | AZERTY "1" (types `&`) did nothing; hints always QWERTY | Works; hints read "Z Q S D", "SPC/E", "A/C" on AZERTY |
| 8 | No mid-air placement on desktop (VR has it) | With nothing under the crosshair, pour/spout act on the cell REACH voxels along the ray | Nothing placed | Placed; REACH (default 12, scroll to change) now means mid-air distance |

**Key map** (one `KEYS` table in `index.html`): up is **Space or E**, down is **Q or C**, and tool mode is **Tab** (only while the mouse is captured). This follows the Q = down / E = up convention of Unity, Unreal and Blender. E previously cycled the tool mode, next to Q.

| Run | Tests | Pass | Fail |
|---|---|---|---|
| Tests as first written, original code ([log](docs/verification/pixel-desktop-tests-as-first-written-on-original-code.txt)) | 11 | 1 | 10 |
| **Final** tests, original code ([log](docs/verification/pixel-desktop-final-tests-on-original-code.txt)) | 11 | 1 | 10 |
| **Final** tests, fixed code ([log](docs/verification/pixel-desktop-final-tests-on-fixed-code.txt)) | 11 | **11** | **0** |

The one test passing on the original code is the "boots without page errors" guard.

**Test corrections made during this work:**
- **Timing:** the flight-bounds and key-direction tests first measured wall-clock movement. Under load, the bounds test once passed on the unbounded original, and Space once moved exactly 1.00 against a "> 1" threshold. Both now hold the real keys but advance `fly.update(0.05)` deterministically.
- **Mid-air marker:** the check now runs before pouring. Once the cell is filled, the crosshair correctly targets the cell in front of it.
- **Rejected suspicion:** Space does not re-trigger a focused toolbar button, because clicking back into the game moves focus to the page. No change was needed.

## Not covered by automation (manual follow-up)

- Real WebXR hardware: sessions, poses and gamepads are stubbed. The VR logic runs for real, but comfort and feel need a headset.
- Real Chart.js rendering (a stub records chart creation).
- iOS Safari PWA behaviour, and live CDN availability.
- Auto-shooter difficulty balance: the auto-player now rarely takes damage in early waves, which is a tuning question rather than a correctness one.
