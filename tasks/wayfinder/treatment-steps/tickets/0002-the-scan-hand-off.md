---
id: "0002"
title: "The scan hand-off"
map: treatment-steps
labels: [wayfinder:grilling]
status: open
assignee: ""
blocked_by: ["0001"]
---

Rank: standard (client only)

## Question

When a verified scan hands off to the steps, what happens to the scan's in-flight suggestion update, and how does the Practitioner get back to the scan results?

- **The update:** today `ScanView` stops it on unmount (`stopUpdate` in `onBeforeUnmount`) and `TreatmentDetailView` calls `store.stop()` on its own unmount. The Spray log step shows `SuggestionUpdate` with the scan's `reschedule`. Options: the steps read `scan.reschedule` from the scan store when its line and week match the route and keep following it; or `/treatment` just reloads the suggestion and shows "Updating…" from the store. Check in code which one keeps a run that is still going visible without a second start.
- **Back to scan results:** `ScanView` keeps its `step` in a local `ref`, so a return to `/scan` starts at step 1. Options: move `step` into the scan store so a "Back to scan results" link returns to Results; or show no such link (browser back and the Scan nav item remain).

If 0001 keeps two homes, this ticket shrinks to the second bullet or is ruled out.
