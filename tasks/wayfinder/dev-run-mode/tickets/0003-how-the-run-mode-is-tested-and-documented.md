---
id: "0003"
title: "How the run mode is tested and documented"
map: dev-run-mode
labels: [wayfinder:grilling]
status: closed
assignee: "archelaus"
blocked_by: ["0001", "0002"]
---

Rank: standard (tests and docs only)

## Question

Which tests and doc changes does the build need?

1. **Stub tests.** Route tests for run mode (read, set, bad value, auth), and settle tests per mode (Fail then Retry succeeds, Stuck holds, a mode change releases a stuck run, application runs ignore the mode, reset restores Normal), in `stub/scheduler.test.js` or `stub/scan-cycle.test.js`; the tests that name L08 change with its removal.
2. **Client tests.** A store test for `stores/runMode.js`; an SSR render test (`renderScreen`) for `DevBar`: each group shown or hidden by its own store's `available`, the warn style on a non-Normal mode; a test for reading `VITE_STUB_POLL_LIMIT` (valid, missing, bad value). Tests stay SSR; `onMounted` and unmount do not run.
3. **Docs.** The stub README section and `CLAUDE.md`'s stub paragraph (the dev-date mention renamed to `DevBar`, the run mode, `VITE_STUB_POLL_LIMIT`, L06/L08 wording), and the line list without L08.
4. **Hand checks.** Which checks run by hand on the stub app: Fail then Retry, Stuck then the short timeout then Normal and "Check again", the run-mode group hidden against the real scheduler while the date stays, the two-row chip on a phone width.

## Resolution

Rank standard (tests and docs only); every question self-decided on the recommendation (2026-11-06).

- **Stub route tests, in `stub/scheduler.test.js`** (the route lives with `PLANS` in `stub/scheduler.js`): `GET` answers `{ mode: 'normal' }` at start; `PUT` with each mode answers it back; any other value answers 400 `validation_error`; no token answers 401. "Lists the eight seed lines" becomes seven, and the line status test drops L08.
- **Stub settle tests, in `stub/scan-cycle.test.js`**, on a default-plan line (not L06): Fail fails the first scan run and Retry succeeds; Stuck keeps the run `running` past `cycleMs`; setting Normal lets the stuck run settle `done` on the next read; with Fail set, an application run settles `done`; `POST /__stub/reset` restores Normal. "L08 run never settles" is replaced by the Stuck test. The L06 test stays.
- **Store test, `stores/runMode.test.js`**, after `devClock.test.js`: load adopts the mode when the route answers; unavailable on 404, 401 and 500; no request outside a dev build; `set` PUTs and adopts the answer; an error shows its message; `busy` stops a second call.
- **One contract test, in `client/src/stub-contract/`**, driving `stores/runMode.js` against the in-process stub (load, set Fail, read back). The route is stub-only, so no live run checks the shape; this is its only check. `scheduler-read.contract.test.js` drops L08 (`lines: 8` to 7).
- **Render test, `components/DevBar.test.js`**, SSR in the style of `WeatherRisk.test.js` with the stores preset: date group only, run-mode group only, both, neither (renders nothing), the warn style on a non-Normal mode.
- **Poll limit:** `stores/cycle.js` exports a small pure reader for the env value, tested in `cycle.test.js`: `'10'` gives 10; missing, `'0'`, `'-3'`, `'2.5'` and `'abc'` give 90. The existing timeout test keeps `1 + POLL_LIMIT`.
- **Docs.** README "Run it on the stub": the line list drops L08; a *Run mode* bullet (the "Scan runs" control, the three modes, kept until changed, reset restores Normal, scan runs only); `VITE_STUB_POLL_LIMIT` beside the sample-leaves bullet (stub compose only, needs `up -d --build`). `CLAUDE.md`'s stub paragraph: `DevDateBar` becomes `DevBar`, the run-mode route (stub only, not in the scheduler), `VITE_STUB_POLL_LIMIT`, L08 gone. Code comments on `PLANS` and the L08 seed line follow.
- **Hand checks on the stub app** (tests are SSR, so these cover mount and timing): Fail, scan, the failed card, Retry, done; Stuck, scan, the timeout card in about 20 s, switch to Normal, "Check again", done; the warn style while not Normal; against the real scheduler in dev, the date shows and the run-mode group does not; the two-row chip on a phone width.
