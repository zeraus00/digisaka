---
id: "0001"
title: "Where the weekly leaves come from"
map: scan-trend-toggle
labels: [wayfinder:grilling]
status: closed
assignee: "archelaus"
blocked_by: []
---

Rank: potentially breaking (one option changes the scheduler's evidence response, ADR-0028)

## Question

The Leaves chart and the All chart need weekly `functional_leaves`. `EvidenceWeek` (cycle evidence, Scan step 3; line history, Scan step 1) does not carry it; `InsightWeek` (Line Insights `series`) does. For each `WeekCharts` user, where does the leaves series come from?

- **Client join:** `WeekCharts` users join the insights series by week. `LineHistory` already loads insights. `EvidenceCharts` would need to load insights for the scan's line and week: it only gets a `cycleId` today, and the insights store is empty at step 3 because `LineHistory` resets it on unmount.
- **Contract field:** add `functional_leaves` to `EvidenceWeek` on the scheduler (and the stub). This changes an API shape: the developer decides.

Check before deciding: does the insights series cover every week the evidence shows, including the older compared weeks (`visibleWeeks`)? A week in the evidence with no insights row has no leaves.

## Resolution

Rank breaking-territory question; asked, developer agreed with the recommendation (2026-11-05).

- **Client join, no API change.** Both routes read the same weekly records, which already hold the leaves count; the insights series covers 8 weeks, the charts show at most the last 3 weeks plus the compared weeks (all within 2 weeks of the end), so every shown week is covered; a week with no insights row has no leaves.
- `LineHistory` (Scan step 1) already loads insights: it joins its series by week.
- `EvidenceCharts` (Scan step 3) loads the insights for the scan's line and week (passed in from `ScanView`; it only gets a `cycleId` today) and joins leaves, `functional_leaves_threshold` and `functional_leaves_target` by week. The critical and target values come from the same read.
- Build notes: `LineHistory` resets the insights store when it unmounts and `EvidenceCharts` loads it when it mounts, so the build checks the order on the step 1 to 3 switch; the store's `run` counter already drops stale answers.
- Principle: YAGNI (no scheduler change when an existing route meets the need). No scheduler, stub or API.md change.
