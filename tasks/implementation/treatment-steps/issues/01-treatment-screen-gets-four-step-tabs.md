# 01: The treatment screen gets four step tabs

**Rank:** standard: client only; no route renamed, no API change.

**Model:** Sonnet

**What to build:** The treatment screen for a line and week (`/treatment/:lineId/:week`) shows the review's four steps as tabs: Weather, Spray Log, Fungicides, Schedule. Any tab opens at any time. The Dashboard, History, Schedule and "Open the suggestion" links keep working unchanged and land on Schedule.

- **Tabs (approved prototype, look C).** A row of icon-only pills, the open one filled green. Each pill is named for assistive tech and as a tooltip (Weather, Spray Log, Fungicides, Schedule) and is at least 44px tall; four fit one row at 390px. Schedule reuses the existing calendar icon; Weather (rain cloud), Spray Log (droplet beside list lines) and Fungicides (flask) are three new icons in the existing icon component, in the same stroke style. A visited, not-open step shows a check, as the old journey did. The heading under the tabs names the open step in Title Case: Weather Risk, Spray Log, Fungicide Options (Fungicide Details inside a product), Schedule. The page title is "Treatment Suggestion".
- **Link per step.** `?step=weather|spray|fungicides|schedule`. A missing, unknown or repeated value opens Schedule. Choosing a tab rewrites the link without adding a history entry, so the browser back button leaves the screen instead of walking the tabs.
- **What each tab holds, moved as it is, no redesign.** Weather: the weather risk step. Spray Log: the spray log step. Fungicides: the line's alerts, "Recently applied", the options list and product details (with "Back to options" inside the tab) and other guidance. Schedule: record an application with its confirmation panel, the schedule calendar and the evidence charts. The fungicide list appears once. The Weather, Spray Log and Fungicides tabs keep the line summary beside them (below on a phone); Schedule has none. Weather, Spray Log and Fungicides each end with a "Continue to …" button that opens the next tab.
- **Above the tabs, on every step.** The outcome banner, its reason and basis lines, "What changed" and "Updating…", and the screen's loading, error and "no suggestion yet" states. The screen loads the line's Line Insights on mount as well as the suggestion, and ignores a stale answer after the line changes.
- **Structure.** Reading the `step` value is a pure helper beside the other helpers, unit tested without a DOM.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Helper tests: each valid `step` returns itself; missing, unknown and repeated values return Schedule
- [ ] `treatment.screen.test.js` rendered per `?step=`: each existing check moves to the step that holds it, with the Title Case wording ("Fungicide Options"); the bare path selects Schedule and omits the options list; each `?step=` shows its heading, four tabs named Weather, Spray Log, Fungicides, Schedule, and only its own tab selected; the banner and "What changed" render on two different steps; the monitoring card and the confirm-step reason check still pass on their step
- [ ] The client tests and the build pass
- [ ] By hand in the stub app (use the `run` skill): Dashboard, History and Schedule links land on Schedule; each tab opens from the pills and from its "Continue to …" button; browser back leaves the screen; keyboard focus and tooltips work; 390px shows one row of four pills; the line summary sits beside Weather, Spray Log and Fungicides
