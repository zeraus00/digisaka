---
labels: [wayfinder:map]
title: Trend toggle for the weekly charts
---

# Trend toggle for the weekly charts

## Destination

A decided spec, ready for `/to-tickets`, for a toggle row on the weekly charts (`WeekCharts.vue`) that picks All, YLS/YLI, Leaves or Rainfall, plus the new Leaves chart.

**Acceptance:** the data source for weekly leaves on each screen is decided; which screens get the toggle and what it remembers are decided; the All chart's phone layout is decided; the Leaves chart's reference lines and the empty views are decided; the tests the build needs are named.

## Notes

- **Planning only.** Building goes through `/to-tickets`.
- **Already decided (approved prototype `prototype.html`, design C without the canopy bar):** buttons All (icon only, `aria-label="All trends"`), YLS/YLI, Leaves, Rainfall; default All. All is one chart: YLS, YLI and leaves lines on a left 0–12 axis, rainfall bars behind on a right mm axis, a key, no prose. The prose captions show only on single views; the missing-weeks line always shows, filtered to the shown series. The "Show the numbers" table is removed. Accessibility: native buttons in a labelled group with `aria-pressed`, 44px targets, the selected state not shown by colour alone, a text name on the icon-only button, visible focus, arrow keys inside the group, an `aria-live` line, wrapping on narrow screens.
- **Start state:** `WeekCharts.vue` has two users, `EvidenceCharts.vue` (Scan step 3, fed by cycle evidence, `cycleId` only) and `LineHistory.vue` (Scan step 1, fed by line history; it also loads the insights store and resets it on unmount). `EvidenceWeek` has `yls`, `yli`, `rainfall_mm` and no leaves; `InsightWeek` has `functional_leaves`, with `functional_leaves_threshold` and `_target` served. Client component tests are SSR only (`renderToString`); there is no mount library.
- **Skills.** Grilling tickets call `grilling` and `domain-modeling`; the prototype ticket calls `prototype`.
- **Ranking.** Rank every question minor, standard, or breaking (`CLAUDE.md`). Any change to a scheduler response shape (ADR-0028) is breaking: the developer decides.
- **Model.** Sonnet is enough; Opus only if the leaves data source becomes a scheduler change.

## Decisions so far

- Destination, the settled design above and the ticket cut: decided at charting.

## Not yet specified

- **The canopy bar on Line insights.** If Line insights gets the toggle, does its canopy bar (`canopy-bar`, threshold, target, leaves count) stay beside the new Leaves chart or give way to it? Waits on [Where the toggle shows, what it remembers, and its icons](tickets/0002-where-the-toggle-shows-what-it-remembers-and-its-icons.md).

## Out of scope

- The canopy-check bar and the "Provisional" tag from design C; the Dashboard charts; any change to how YLS, YLI or rainfall are computed or served.
