---
id: "0002"
title: "Line Insights store"
map: dashboard-merge
labels: [wayfinder:grilling]
status: open
assignee: ""
blocked_by: []
---

**Model:** Sonnet. A local store shape; the consumers and fields are known.

## Question

What client store reads Line Insights (`GET /api/v1/scheduler/lines/{id}/weeks/{week}/insights`), and what becomes of the fork's `stores/lineHistory.js` reads?

- A new store, or an extension of `lineHistory` (which today reads `/history` for the week list `WeekCharts` draws)?
- The fork's `lineHistory` reads old-flow data (line status `proposals`, `/cycles/{id}/proposal`, `/cycles/{id}/evidence`): what is dropped, what (if anything) moves to the suggestion store, and how the fork's `lineHistory.test.js` is rewritten.
- Consumers: Disease Detection (`LineHistory.vue`, step 1) and the Weather and Spray log steps' side summaries. One fetch per line and week shared across them, or one per screen?
- When does it refetch: the week changes, a scan finishes, an application is recorded, the suggestion `revision` changes?
- Which fields it exposes as-is versus derived getters (latest non-null `yls`/`yli`, last treatment), with derivations kept to display only (the server sets every verdict).
