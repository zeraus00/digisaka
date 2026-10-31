---
labels: [wayfinder:map]
title: Set current date picker (dev only)
---

# Set current date picker (dev only)

## Destination

A decided spec, ready for `/to-tickets`, for a dev-only "Set current date" control in the web client that sets the date for the scheduler and the client together, live and with no reload, plus a reset to the default.

**Acceptance:** where the control sits and when it shows is decided; which screens follow the date live is decided; how the stub backend serves the same routes is decided; the tests the build needs are named.

## Notes

- **Planning only.** The map ends at a decided spec; building goes through `/to-tickets`. The scheduler half is `bls-dev-clock-scheduler` in `AI_NeSy_Framework`; this map takes its route contract as given (`GET|PUT|DELETE /api/v1/scheduler/dev/today`, answers `{today, default, pinned}`, `PUT` takes `{today}`, a bad date is `400 validation_error`). If that contract changes, this map follows.
- **Start state:** `client/src/helpers/today.js` pins `DEMO_TODAY` (2026-06-08) in code; `today()` is a plain function. Readers: `stores/scan.js` (initial week, computed once), `views/ScanView.vue` (`maxDate`, a const), `views/DashboardView.vue`, `views/TreatmentDetailView.vue` (the date input default and `max`), `helpers/week.js`, `admin/*`.
- **Skills.** Grilling tickets call `grilling` and `domain-modeling`.
- **Ranking.** Rank every question minor, standard, or breaking (`CLAUDE.md`); the digisaka contract with the scheduler is breaking territory and is already decided.
- **Model.** Sonnet is enough.

## Decisions so far

- Any signed-in Practitioner may use it; the override is not saved and a scheduler restart returns the default; the page does not reload, it updates live; Reset calls `DELETE`. Decided by the developer 2026-10-28.
- The server's date wins when the endpoint answers; the code constant is the fallback when it does not. The control shows only in a dev build and only when `GET dev/today` answers.
- [Which screens follow the date live](tickets/0001-which-screens-follow-the-date-live.md): `today.js` holds a ref; Dashboard, the treatment date `max` and the Scan `maxDate` follow live; the scan week and the application date default move only when untouched; loaded data is not refetched.
- [Where the control sits and when it shows](tickets/0002-where-the-control-sits-and-when-it-shows.md): a dev-only footer bar on every signed-in screen, rendered only when `GET dev/today` answers; Set, Reset to default and a pinned marker.
- The stub backend serves the same three routes with the same bodies, so the client behaves the same on the stub.

## Not yet specified

Nothing left: the way to the destination is clear.

## Out of scope

- Reloading the page, saving the date in the browser, any production build path, and changing the existing week and date filters.
