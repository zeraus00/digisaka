---
id: "0005"
title: "How the toggle is tested"
map: scan-trend-toggle
labels: [wayfinder:grilling]
status: open
assignee: ""
blocked_by: ["0002"]
---

Rank: standard (test setup; a new dev dependency is not on the breaking list)

## Question

Client component tests are SSR only (`renderToString`, as in `ScheduleCalendar.test.js`); there is no mount library or DOM. A toggle needs its clicks, `aria-pressed`, arrow keys and the clearing of hover state when a chart hides checked. Options:

- Add `@vue/test-utils` and `happy-dom` (dev only) and mount `WeekCharts`.
- Keep SSR only: put the view logic (which series and captions a view shows, the missing-weeks text, the next button on an arrow key) in a plain helper with unit tests, and SSR-render each view through a prop that sets the starting view.

Name the tests the build needs either way.

Blocked by [Where the toggle shows, what it remembers, and its icons](0002-where-the-toggle-shows-what-it-remembers-and-its-icons.md): what the toggle remembers decides what must be tested.
