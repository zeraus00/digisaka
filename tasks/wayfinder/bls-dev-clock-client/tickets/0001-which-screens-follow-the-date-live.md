---
id: "0001"
title: "Which screens follow the date live"
map: bls-dev-clock-client
labels: [wayfinder:grilling]
status: closed
assignee: "archelaus"
blocked_by: []
---

Rank: standard (client behaviour only)

## Question

When the date changes, which readers update without a reload? Decide for `stores/scan.js` (initial week), `ScanView` (`maxDate`, the week selector), `DashboardView`, `TreatmentDetailView` (the application date input and its `max`), `helpers/week.js` and `admin/*`: reactive value (a Vue ref in `today.js`), re-read on next load, or untouched. Include what happens to a scan or a half-filled form already open.

Recommendation to test: `today.js` holds a ref; screens that show or limit by today follow it; an open scan keeps its week.

## Resolution

Rank standard; self-decided.

- `helpers/today.js` holds a Vue `ref` for the date; `today()` and `todayIso()` read it, so any template or computed that calls them updates.
- **Follow live:** `DashboardView` (the heading date, already a computed), `TreatmentDetailView` (the `max` on the date input is read in the template), `ScanView` (`maxDate` becomes a computed; the week selector's "latest week" follows).
- **Follow only when untouched:** `stores/scan.js` initial week and `TreatmentDetailView`'s default `appliedOn`: when the date changes, `ScanView` moves to the new week only if no leaves are loaded, and the application date input moves only if it still holds the old default. An open scan or an edited form keeps what the user set.
- **Untouched:** `helpers/week.js` (pure helpers on their arguments) and `admin/*` (they read no date for logic; `new Date()` there is a sync timestamp).
- **Data loaded for the old date** (lines, history, a finished cycle): not refetched by the control; the user's next navigation loads for the current date. The Scan screen already drops a cycle of another line-week (commit 812d20d).
- **Tests to name:** `today.js` reactivity (a computed over `todayIso()` changes on set and on reset); `ScanView` moves the week only with no leaves; the application date default moves only when unedited.
