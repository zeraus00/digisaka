---
id: "0001"
title: "Where the weekly leaves come from"
map: scan-trend-toggle
labels: [wayfinder:grilling]
status: open
assignee: ""
blocked_by: []
---

Rank: potentially breaking (one option changes the scheduler's evidence response, ADR-0028)

## Question

The Leaves chart and the All chart need weekly `functional_leaves`. `EvidenceWeek` (cycle evidence, Scan step 3; line history, Scan step 1) does not carry it; `InsightWeek` (Line Insights `series`) does. For each `WeekCharts` user, where does the leaves series come from?

- **Client join:** `WeekCharts` users join the insights series by week. `LineHistory` already loads insights. `EvidenceCharts` would need to load insights for the scan's line and week: it only gets a `cycleId` today, and the insights store is empty at step 3 because `LineHistory` resets it on unmount.
- **Contract field:** add `functional_leaves` to `EvidenceWeek` on the scheduler (and the stub). This changes an API shape: the developer decides.

Check before deciding: does the insights series cover every week the evidence shows, including the older compared weeks (`visibleWeeks`)? A week in the evidence with no insights row has no leaves.
