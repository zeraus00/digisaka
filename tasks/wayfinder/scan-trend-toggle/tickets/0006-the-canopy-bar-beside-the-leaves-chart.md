---
id: "0006"
title: "The canopy bar beside the Leaves chart"
map: scan-trend-toggle
labels: [wayfinder:grilling]
status: closed
assignee: "archelaus"
blocked_by: []
---

Rank: standard (client display only)

## Question

Line insights (`LineHistory`, Scan step 1) now gets the toggle and a Leaves chart with critical and target lines. It already shows a canopy bar (`canopy-bar`: the latest functional leaves count against the served threshold and target, with the server's canopy status). Does the bar stay beside the new chart, or does the chart replace it? If it stays, is it shown on every toggle view or only with Leaves and All? Check what the bar says that the chart does not (the latest count, the status wording).

## Resolution

Rank standard; asked, developer took both recommendations (2026-11-05).

- **The canopy bar stays on Line insights, unchanged, on every toggle view.** It sits in the insights block outside `WeekCharts`, so the toggle does not touch it. The bar is the reading of now (latest count, the server's status for the selected week); the Leaves view is the history. Removing it would leave the default All view with no canopy status (it has no prose). Principle: YAGNI.
- **The status wording stays in two forms.** The bar says OK / Watch / Critical through `canopyLabel`; the Leaves caption uses the sentences from the Leaves reference lines ticket. Both read the same served `canopy_status` and neither compares the count, so they cannot disagree on the verdict. They may name different weeks (the bar the selected week, the caption the latest week with a count); each names its week.
