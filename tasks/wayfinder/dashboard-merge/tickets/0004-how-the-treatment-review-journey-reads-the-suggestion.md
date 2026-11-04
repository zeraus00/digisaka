---
id: "0004"
title: "How the Treatment Review journey reads the suggestion"
map: dashboard-merge
labels: [wayfinder:grilling]
status: open
assignee: ""
blocked_by: []
---

**Model:** Opus. It changes how a screen behaves around a running scheduler run; edge cases need care.

## Question

How does the fork's `TreatmentJourney` (Scan step 4) get its suggestion and move between its four steps on our flow?

- It reads the same `suggestion` store as `/treatment`. How does it pick up ScanView step 3's tracking (`suggestion.track`, the run a verified scan starts via `reschedule`) without fetching twice?
- What does "current" mean for the gate on "Continue to fungicide options": the run is not `running`, the `revision` is newer than the scan, the `outcome` is set? What shows while a run is pending, failed, or the line has no suggestion?
- The step map: Weather, Spray log, Fungicides (with Fungicide details as its sub-page), then Schedule as a navigation to `/treatment/:lineId/:week`. How `PAGES` and `activeStep` change, and whether back navigation from `/treatment` returns to step 3.
- What is removed: `proposalStore`, `cycle.close`, the close-week `retry`/`resume`, `sampleDecision`, `confirmedOptionIds`, the Decision page, and the fork's "Review scheduler proposal" branch.
