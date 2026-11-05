---
id: "0001"
title: "What the run mode does"
map: dev-run-mode
labels: [wayfinder:grilling]
status: open
assignee: ""
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
