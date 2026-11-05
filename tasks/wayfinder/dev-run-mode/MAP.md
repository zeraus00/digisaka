---
labels: [wayfinder:map]
title: Dev run mode for the next scan run
---

# Dev run mode for the next scan run

## Destination

A decided spec, ready for `/to-tickets`, for a stub-only **run mode** (Normal, Fail, Stuck) set from the dev bar beside the dev date, so a failed or stuck scan run can be hand-checked on any line.

**Acceptance:** the route, its detection and what each mode does are decided; the fate of L06's `failFirst` and L08's `stuck` is decided; the dev bar's layout and whether the follow's timeout is shortened in dev are decided; the tests and docs the build needs are named.

## Notes

- **Planning only.** Building goes through `/to-tickets`.
- **Start state:** the stub (`stub/scheduler.js`) settles runs lazily (`settle()`, `startRun`) from per-line `PLANS`: L06 `failFirst` (first scan run fails, Retry succeeds), L08 `stuck` (never settles; added in 6e988ea; seeded in `stub/seed.js`, shown on the Dashboard, the Schedule list and the scan line picker). `DevDateBar.vue` (mounted in `AppLayout.vue`) shows only once `stores/devClock.js` gets an answer from `/api/v1/scheduler/dev/today` (`available`), and only in a dev build. Vite proxies `/api/v1/scheduler` to the stub on the stub stack, so a stub route under it needs no proxy change; the real scheduler answers 404 for a route it lacks. The client follows a run with `suggestion.track` / `follow` for `POLL_LIMIT` 90 x `POLL_MS` 2 s (`stores/cycle.js`), about 3 minutes, then `timeout`. Precedent for a stub-only client switch: `VITE_STUB_SAMPLES` (`helpers/stubSamples.js`, set only in `docker-compose.stub.yml`).
- **Skills.** Grilling tickets call `grilling` and `domain-modeling`. The dev bar ticket may call `prototype` if the layout is not clear in words.
- **Ranking.** Rank every question minor, standard, or breaking (`CLAUDE.md`). Stub and dev-build UI only: standard. Any change to the real scheduler or its API is breaking: the developer decides.
- **Terms.** "Run mode" is a dev tool name, not a domain term; digisaka has no `CONTEXT.md`, so no glossary change.
- **Model.** Sonnet is enough for every ticket.

## Decisions so far

- Destination and the ticket cut: decided at charting.

## Not yet specified

- Whether the page-level "Loading…" above the tabs (shown when a first run never reads a suggestion; wave 2 review finding 1 of treatment-steps) must be fixed for the modes to be usable on a fresh line. Depends on which lines a mode applies to ([What the run mode does](tickets/0001-what-the-run-mode-does.md)).

## Out of scope

- Any change to the real scheduler or its API (the scheduler repo has no run-mode route and gets none).
- Shortening production polling.
- A mount-based test library (tests stay SSR, `renderScreen`).
- New QA image scenarios: the stub already picks those by image name.
