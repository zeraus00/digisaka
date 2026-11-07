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
- [Where the steps live](tickets/0001-where-the-steps-live.md): one home, `/treatment/:lineId/:week` with free tabs Weather, Spray log, Fungicides, Schedule; `?step=` via `router.replace`, default Schedule; scan hands off with `?step=weather`; `TreatmentJourney` removed; the fungicide list moves to Fungicides; the outcome banner sits above the tabs.
- [The scan hand-off](tickets/0002-the-scan-hand-off.md): `/treatment` tracks the scan's run (`suggestion.track`) when the scan store matches the route, else loads; Spray log mounts `SuggestionUpdate` only for that entry, without the done card; `step` moves into the scan store so "Back to scan results" and browser back land on Results.
- [Prototype of the step tabs](tickets/0003-prototype-of-the-step-tabs.md): approved; icon-only pill tabs (Schedule reuses `calendar`, three new icons), Title Case page and step titles, one row on a phone, the line summary stays beside the first three steps.
- [How the steps are tested](tickets/0004-how-the-steps-are-tested.md): pure helpers for `?step=` and the scan entry with unit tests; a scan store test for `step`; `treatment.screen.test.js` rendered per `?step=`; twelve named tests; the hand-off order and entry points checked by hand in the stub app.

## Not yet specified

Nothing left that is unsharp: the line summary placement was decided on the prototype.

## Out of scope

- The "Coming soon" tiles (humidity, infection risk level, price, label and registration) and leaf wetness: the scan trend toggle follow-ups.
- Monitoring decided by the KG.
- A product deep link (`&unit=`) and per-step child routes: no named need (YAGNI).
- Revising the fungicide list's or the record form's own design, or the line summary panel: they move as they are.
