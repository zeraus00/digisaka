---
id: "0003"
title: "Prototype of the step tabs"
map: treatment-steps
labels: [wayfinder:prototype]
status: open
assignee: ""
blocked_by: ["0001"]
---

Rank: standard (a throwaway HTML file; no code in the app)

## Question

How does `/treatment` with its step tabs look and behave? Build `prototype.html` in this map's folder for the developer to react to and approve.

Decide on it:

1. **Tab look:** the journey's numbered stepper kept as tabs, or segmented pills.
2. **Narrow screens:** four labels at 390px; the touch targets (44px) against the stepper's 28px dots.
3. **`InsightsSummary`** beside Weather, Spray log and Fungicides: on each tab, or once in the line header (clears the map's fog).

Grounding, so it shows the real screen and not a guess:

- the tokens (`styles/tokens.css`) and journey classes (`styles/journey.css`);
- each tab's content from the component it will mount (`WeatherRisk`, `SprayLog`, `FungicideOptions` / `FungicideDetails`, the record form, `ScheduleCalendar`, `EvidenceCharts`), copy unchanged;
- sample values from a served payload (a stub or dev-stack read of Line Insights and the suggestion for one line-week), not invented numbers;
- the 0001 answers (default step, banner place, tab split) and the 0002 entry (a scan entry beside a Dashboard entry, if 0002 is closed by then);
- a phone and a desktop width, and the `?step=` value shown as tabs change.
