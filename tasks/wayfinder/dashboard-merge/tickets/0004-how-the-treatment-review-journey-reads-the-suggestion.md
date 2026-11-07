---
id: "0004"
title: "How the Treatment Review journey reads the suggestion"
map: dashboard-merge
labels: [wayfinder:grilling]
status: closed
assignee: "archelaus"
blocked_by: []
---

**Model:** Opus. It changes how a screen behaves around a running scheduler run; edge cases need care.

## Question

How does the fork's `TreatmentJourney` (Scan step 4) get its suggestion and move between its four steps on our flow?

- It reads the same `suggestion` store as `/treatment`. How does it pick up ScanView step 3's tracking (`suggestion.track`, the run a verified scan starts via `reschedule`) without fetching twice?
- What does "current" mean for the gate on "Continue to fungicide options": the run is not `running`, the `revision` is newer than the scan, the `outcome` is set? What shows while a run is pending, failed, or the line has no suggestion?
- The step map: Weather, Spray log, Fungicides (with Fungicide details as its sub-page), then Schedule as a navigation to `/treatment/:lineId/:week`. How `PAGES` and `activeStep` change, and whether back navigation from `/treatment` returns to step 3.
- What is removed: `proposalStore`, `cycle.close`, the close-week `retry`/`resume`, `sampleDecision`, `confirmedOptionIds`, the Decision page, and the fork's "Review scheduler proposal" branch.

## Resolution

Rank standard; self-decided (client-internal, inside the shape decided before charting).

1. **One store, one fetch.** The journey reads the `suggestion` store as step 3 left it. ScanView's step watch stops the update only when going back to steps 1 or 2. It does not stop it for step 4, and it does not re-track when coming back from 4 to 3. On mount the journey calls `suggestion.load(line)` only when the store is not on this line or is neither `loading` nor `ready` (no scan started a run).
2. **Current** = the store is on this line, `phase: ready`, not `updating`, and `updateState` is `ready` or `unchanged`. Only then does "Continue to fungicide options" show. Otherwise the Spray log card shows step 3's states:
   - updating;
   - failed, with Retry;
   - timeout or error, with Check again;
   - `notfound`: "This line has no treatment suggestion yet. A scan is suggested to start one."

   When the outcome is `continue_monitoring` or `human_review_required`, the card shows the outcome text and "Open the suggestion", and "Continue to fungicide options" is hidden.
3. **Shared card.** Step 3's update card moves into `SuggestionUpdate.vue`, used by step 3 and the Spray log step. Its props are `line`, `week` and `reschedule`, and it owns `track` and the retry (moved out of ScanView). ScanView passes `reschedule` to the journey.
4. **Step map:**
   - `PAGES = ['Weather', 'Spray log', 'Fungicides', 'Schedule']`. Pages: 0 Weather, 1 Spray log, 2 Fungicide options, 3 Fungicide details. `activeStep = min(page, 2)`.
   - "Continue to schedule" (on the list and the details page) is a link to `/treatment/:lineId/:week`, not a page.
   - Scan step 3 gains "Continue to weather risk" (allowed while the update runs) and keeps its "Open the suggestion" links.
   - Back from `/treatment` lands on Scan as it opens: the step resets, and the scan store keeps the line and week.
5. **Removed:**
   - The old-flow stores and calls: `proposalStore`, `prototypeStore`, `cycle.close`/`retry`/`resume` and the close-week card.
   - The decision state: `sampleDecision`, `confirmedOptionIds`/`isConfirmed`, `note` and `decide`.
   - The pages and branches: the Decision page, the fork's schedule/decision-status page with its `EvidenceCharts`, the "Review scheduler proposal" branch, and the header status chip.
   - WeatherRisk's `refresh-key`: the journey loads the insights store once, per [Line Insights store](0002-line-insights-store.md).
