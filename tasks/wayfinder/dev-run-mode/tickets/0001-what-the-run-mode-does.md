---
id: "0001"
title: "What the run mode does"
map: dev-run-mode
labels: [wayfinder:grilling]
status: closed
assignee: "archelaus"
blocked_by: []
---

Rank: standard (stub and dev-build client only; any real scheduler route would make it breaking)

## Question

What does the run mode do on the stub, and how does the client find it?

1. **Route and detection.** `GET|PUT /api/v1/scheduler/dev/run-mode` on the stub only, body `{ mode: 'normal' | 'fail' | 'stuck' }` (recommended going in: it rides the existing `/api/v1/scheduler` proxy, and the client shows the control only when the route answers, as `devClock` does with `available`, so the real scheduler's 404 hides it). Other options: a `/__stub/...` route (not proxied to the client today), or a client flag like `VITE_STUB_SAMPLES` plus the route.
2. **Lifetime.** Does a mode apply to the next scan run only and then fall back to Normal, or stay until changed? Does `POST /__stub/reset` restore Normal?
3. **Which runs.** Scan-triggered runs only (the rough plan's "next scan run"), or also runs started by a recorded application or the weekday?
4. **Fail.** Does Fail fail every attempt, or only the first so Retry succeeds (as L06 does today)?
5. **Stuck.** Does a stuck run block the line for good (`startRun` refuses while one is running), and how does it end: a mode change, stub reset, or nothing?
6. **The seeded lines.** Remove L08 and its `stuck` plan (touches `stub/seed.js`, `stub/scheduler.js`, `stub/scan-cycle.test.js`, `stub/scheduler.test.js`, `client/src/stub-contract/scheduler-read.contract.test.js` `lines: 8`, the README line list) and keep L06's `failFirst`, or remove both, or keep both.

## Resolution

Rank standard (stub and dev-build client only; the real scheduler gets no route); every question self-decided on the recommendation (2026-11-06).

- **Route: `GET|PUT /api/v1/scheduler/dev/run-mode` on the stub only.** Body and answer `{ mode: 'normal' | 'fail' | 'stuck' }`; `authed` like `dev/today`; any other value answers 400 `validation_error`. It rides the existing `/api/v1/scheduler` proxy. The client loads it in a dev build only and shows the control only once it answers (`available`, as `devClock` does); the real scheduler's 404 hides it. No `/__stub` route (not proxied) and no env flag (a second switch to keep in step). Principle: YAGNI, and one pattern for dev controls (DRY).
- **One mode for the whole stub, kept until changed.** Not per line, not one-shot: the hand-checker sets it once and scans any line. It lives in `store.data`, so `POST /__stub/reset` restores Normal. Principle: YAGNI (no "used" state to show).
- **Scan runs only.** The mode is read when `startRun` starts a run with trigger `scan`; application runs keep their line's plan. The named need is the scan's update card. Principle: YAGNI.
- **Fail fails the first attempt only.** Retry succeeds, as L06 does today, so both the failed card and the Retry path can be checked.
- **Stuck holds the run while the mode stays Stuck.** A stuck run never settles and blocks the line (`startRun` and Retry refuse while it runs). Changing the mode away from Stuck lets it settle on the next read as a normal run (its time is already past), so "Check again" after the timeout card can be seen to recover without a stub reset; reset also ends it.
- **Remove L08 and its `stuck` plan; keep L06's `failFirst`.** The mode replaces L08, which is a fake line on the Dashboard, the Schedule list and the scan line picker (touches `stub/seed.js`, `stub/scheduler.js`, `stub/scan-cycle.test.js`, `stub/scheduler.test.js`, `client/src/stub-contract/scheduler-read.contract.test.js` `lines: 8` to 7, the README line list and `CLAUDE.md`'s stub paragraph). L06 stays: it is a real seeded scenario with existing tests, and it fails without any dev control.
- **The page-level "Loading…"** on a fresh line (L01 and L07 have no finished run) predates this map; the mode only makes it easier to reach. Ruled out of scope here.
