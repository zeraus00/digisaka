---
id: "0001"
title: "Where the steps live"
map: treatment-steps
labels: [wayfinder:grilling]
status: open
assignee: ""
blocked_by: []
---

Rank: standard (client only; a route rename or an API change would make it breaking)

## Question

Where do the four steps (Weather, Spray log, Fungicides, Schedule) live, and how does `/treatment` split into them?

- **One home on `/treatment` (recommended going in):** `/treatment/:lineId/:week` shows the steps as tabs; Scan step 3's "Continue to weather risk" goes there; `TreatmentJourney.vue` is removed.
- **Two homes:** Scan step 4 keeps the inline journey and `/treatment` reuses the same component with tabs.

Hanging off it, decide in the same session:

1. **Deep link:** a `?step=weather|spray|fungicides|schedule` query (no new path) or none.
2. **Default step** with no `step`: Schedule (every existing link lands where it lands today) or Weather (always the top of the flow).
3. **Free tabs or gated steps:** can any tab be opened at any time, and do the "Continue to …" buttons stay?
4. **What goes on which tab:** today's Products card (alerts, recently applied, options and details, other guidance) against the Schedule tab (record form, calendar, evidence charts). One fungicide list, not two.
5. **The outcome banner** (outcome, reason, basis, what changed, "Updating…"): above the tabs on every step, or only on some.
