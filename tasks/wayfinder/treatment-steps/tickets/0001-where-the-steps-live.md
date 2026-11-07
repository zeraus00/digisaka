---
id: "0001"
title: "Where the steps live"
map: treatment-steps
labels: [wayfinder:grilling]
status: closed
assignee: "archelaus"
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

## Resolution

Rank standard (client only, no route renamed, no API change); every question self-decided on the recommendation (2026-11-05).

- **One home on `/treatment/:lineId/:week`.** It shows the four steps as tabs. Scan step 3's "Continue to weather risk" goes to `/treatment/:lineId/:week?step=weather`. `TreatmentJourney.vue` is removed; its step pages become the tabs. Principle: DRY (one place for the steps), and it fixes "no way back" for every entry point, not only the scan.
- **Deep link `?step=weather|spray|fungicides|schedule`.** One route, no new path. A tab change writes it with `router.replace`, so browser back leaves the screen instead of walking the tabs. A missing or unknown value opens the default step. Principle: YAGNI (no per-step child routes).
- **Default step: Schedule.** Dashboard, History, ScheduleLine and `SuggestionUpdate` keep landing where they land today; only the scan hand-off asks for `weather`.
- **Free tabs, guided buttons kept.** Any tab opens at any time; the "Continue to …" button at the bottom of Weather, Spray log and Fungicides moves to the next tab. The tab bar keeps the journey's look; "done" now means "visited", not "required". The Spray log's `SuggestionUpdate` keeps `:link="false"` (the tabs replace the jump).
- **Tab split (moved as they are, no redesign):**
  - Weather: `WeatherRisk`.
  - Spray log: `SprayLog`, with `SuggestionUpdate` in its slot.
  - Fungicides: line alerts, "Recently applied", `FungicideOptions` → `FungicideDetails` in the tab ("Back to options"), other guidance. Today's Products card leaves Schedule. Principle: DRY (one fungicide list).
  - Schedule: Record an application (with the confirmation block), `ScheduleCalendar`, `EvidenceCharts`.
- **Outcome banner above the tabs on every step:** outcome or basis, reason, what changed, "Updating…", and the load and error states. The verdict is server-set and line-wide, so every step shows it. Principle: separation of concerns (the client only displays the served verdict).
- **Build notes:** `/treatment` loads both the suggestion and Line Insights on mount (the journey loaded insights; `TreatmentDetailView` does not today). Who stops or keeps the scan's update on the hand-off is The scan hand-off's question. Where `InsightsSummary` sits stays with the prototype.
- No glossary change: the steps and tabs are screen names, not domain terms.
