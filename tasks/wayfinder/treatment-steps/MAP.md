---
labels: [wayfinder:map]
title: Weather, Spray log and Fungicides as steps of /treatment
---

# Weather, Spray log and Fungicides as steps of /treatment

## Destination

A decided spec, ready for `/to-tickets`, and an approved prototype for a `/treatment/:lineId/:week` screen that holds the treatment review's four steps (Weather, Spray log, Fungicides, Schedule), so a Practitioner can move between them from any entry point.

**Acceptance:** where the steps live and how Scan hands off are decided; the default step, the deep link and the banner's place are decided; what happens to the scan's in-flight suggestion update on the hand-off is decided; the prototype is approved; the tests the build needs are named.

## Notes

- **Planning only.** Building goes through `/to-tickets`.
- **Start state:** the four steps exist only in Scan step 4 (`TreatmentJourney.vue`, mounted by `ScanView` with `@back`); "Continue to schedule" goes to `/treatment/:lineId/:week` (`TreatmentDetailView.vue`) and there is no way back. `/treatment` is one long page: outcome banner, Products (alerts, `FungicideOptions` / `FungicideDetails`, other guidance), Record an application, `ScheduleCalendar`, `EvidenceCharts`. Dashboard, History, ScheduleLine and `SuggestionUpdate` link to `/treatment/:lineId/:week`. The scan's `reschedule` is in the scan store; `ScanView` stops the update on unmount, `TreatmentDetailView` calls `store.stop()` on its unmount. `stub-contract/treatment.screen.test.js` renders the whole `TreatmentDetailView` and expects the options and the record form in one render.
- **Fork design:** `digisaka/Disease Detection Screen.md` kept `/treatment` as is "for now" and left its revision to a later ticket; this map is that revision. Say "the fork design", never its author.
- **Skills.** Grilling tickets call `grilling` and `domain-modeling`; the prototype ticket calls `prototype`.
- **Ranking.** Rank every question minor, standard, or breaking (`CLAUDE.md`). Client only so far: standard. A route rename or any API change (ADR-0028) is breaking: the developer decides.
- **Model.** Opus for the first ticket and the prototype; Sonnet is enough for the testing ticket.

## Decisions so far

- Destination and the ticket cut: decided at charting.

## Not yet specified

- Whether `InsightsSummary`, shown beside Weather, Spray log and Fungicides today, stays on every one of those tabs or moves to the line header. Sharpens once the prototype shows the tabs side by side.

## Out of scope

- The "Coming soon" tiles (humidity, infection risk level, price, label and registration) and leaf wetness: the scan trend toggle follow-ups.
- Monitoring decided by the KG.
- A product deep link (`&unit=`) and per-step child routes: no named need (YAGNI).
- Revising the fungicide list's or the record form's own design: they move as they are.
