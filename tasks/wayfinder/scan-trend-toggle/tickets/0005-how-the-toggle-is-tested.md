---
id: "0005"
title: "How the toggle is tested"
map: scan-trend-toggle
labels: [wayfinder:grilling]
status: closed
assignee: "archelaus"
blocked_by: []
---

Rank: standard (test setup; a new dev dependency is not on the breaking list)

## Question

Client component tests are SSR only (`renderToString`, as in `ScheduleCalendar.test.js`); there is no mount library or DOM. A toggle needs its clicks, `aria-pressed`, arrow keys and the clearing of hover state when a chart hides checked. Options:

- Add `@vue/test-utils` and `happy-dom` (dev only) and mount `WeekCharts`.
- Keep SSR only: put the view logic (which series and captions a view shows, the missing-weeks text, the next button on an arrow key) in a plain helper with unit tests, and SSR-render each view through a prop that sets the starting view.

Name the tests the build needs either way.


## Resolution

Rank standard; the developer confirmed the rank, so the recommendations were taken (2026-11-05).

- **Plain helpers plus render-to-string; no new dependency.** The view logic lives in pure helpers (in `helpers/evidence.js` or a sibling); `WeekCharts` calls them in one-line handlers and takes an `initialView` prop (default All) so a test can render each view. If a handler later grows logic, move that logic to a helper first. Principle: YAGNI.
- **Tests the build names.**
  - Helpers: (1) leaves join by week (a week missing from the insights series, or insights not loaded, gives no leaves and no throw); (2) available views (a view needs a value in the shown weeks; All needs any); (3) effective view falls back to All when the pick becomes unavailable; (4) arrow keys move to the next available button, wrap and skip disabled ones; (5) missing-weeks line lists only series drawn on the view, Leaves only when drawn; (6) Leaves caption: ok, watch and critical sentences, count only with no status, "No leaf count recorded." with no count, and a count below the threshold with served status *ok* gives the ok sentence (the client never compares); (7) reference lines: a null threshold or target is not drawn, labels "8 critical" and "10 target".
  - Render-to-string on `WeekCharts`: (8) default view: labelled group, four buttons, All pressed, All has an `aria-label`, one combined chart with a key, no prose caption; (9) each single view shows only its own heading and caption; (10) no leaves: Leaves button disabled and All's key leaves the series out; (11) the "Show the numbers" table is gone.
  - Store: (12) `EvidenceCharts` asks the insights store for the scan's line and week (API mocked, as in `insights.test.js`).
  - By hand in the stub app (`run` skill) at the end of the build: click each view, arrow keys, the live line, focus ring, phone width, hover cleared when a chart hides, and the step 1 to 3 insights order.
