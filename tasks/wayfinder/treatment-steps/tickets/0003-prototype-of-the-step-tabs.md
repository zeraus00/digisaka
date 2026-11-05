---
id: "0003"
title: "Prototype of the step tabs"
map: treatment-steps
labels: [wayfinder:prototype]
status: closed
assignee: "archelaus"
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

## Resolution

Approved by the developer on `prototype.html` in this map's folder (2026-11-05). Built from a live dev-scheduler read of line L18, 2026-W24 (suggestion, line, Line Insights), with the app's tokens, journey classes and copy.

- **Tab look: icon pills (look C).** A segmented pill row, one pill per step, icon only; the open pill is filled forest green. Each pill has the step name as its accessible name and tooltip (`aria-label`, `title`), and the heading under the tabs names the open step. Rejected: the numbered stepper (A), word pills (B), and icons with the open tab's label (D: squished at 390px even at 12px).
- **Icons:** Schedule reuses `Icon.vue`'s `calendar`. Weather (rain cloud), Spray Log (droplet beside list lines) and Fungicides (flask) are three new `Icon.vue` paths in the same stroke style; the prototype holds the drawn paths.
- **Title Case for the page and step titles:** "Treatment Suggestion" (page), "Weather Risk", "Spray Log", "Fungicide Options", "Fungicide Details", "Schedule" (step headings and tab names). Card headings ("Weather risk signal", "Spray history", "FRAC group usage") keep their case.
- **Phone:** one row of four pills at 390px, each at least 44px tall; no scroll, no shortened names.
- **Line summary (`InsightsSummary`):** stays beside Weather Risk, Spray Log and Fungicide Options as the journey had it (below the tab's content on a phone); not on Schedule, not moved into the header. Clears the map's fog.
- Confirmed on the prototype, as decided earlier: the scan entry shows "← Back to scan results" and opens `?step=weather`; a Dashboard entry opens the bare link on Schedule; the outcome banner and "What changed" sit above the tabs; the Spray Log update card shows only for a scan entry while updating or failed.
- Prototype shortcuts, not design: every fungicide card opens Paviso 13WP's details; "Back to scan results" shows a popup.
