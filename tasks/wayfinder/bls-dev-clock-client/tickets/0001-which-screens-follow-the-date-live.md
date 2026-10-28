---
id: "0001"
title: "Which screens follow the date live"
map: bls-dev-clock-client
labels: [wayfinder:grilling]
status: open
assignee: ""
blocked_by: []
---

Rank: standard (client behaviour only)

## Question

When the date changes, which readers update without a reload? Decide for `stores/scan.js` (initial week), `ScanView` (`maxDate`, the week selector), `DashboardView`, `TreatmentDetailView` (the application date input and its `max`), `helpers/week.js` and `admin/*`: reactive value (a Vue ref in `today.js`), re-read on next load, or untouched. Include what happens to a scan or a half-filled form already open.

Recommendation to test: `today.js` holds a ref; screens that show or limit by today follow it; an open scan keeps its week.
