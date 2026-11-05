---
id: "0004"
title: "How the steps are tested"
map: treatment-steps
labels: [wayfinder:grilling]
status: closed
assignee: "archelaus"
blocked_by: ["0001", "0002", "0003"]
---

Rank: standard (tests only)

## Question

Which tests does the build need, and how do they run with the client's SSR-only test setup (`renderToString`, no mount library)?

- `stub-contract/treatment.screen.test.js` renders the whole `TreatmentDetailView` and expects "Fungicide options" and "Record application" in one render. After the split they sit on different tabs: render per `?step=`, or test each tab's component on its own?
- The `?step=` read (unknown value, missing value → the default step) and write: a pure helper with unit tests, or a render test per step?
- The scan hand-off from 0002: what can be checked offline, and what is a hand check in the stub app?
- Hand checks: each entry point (Scan, Dashboard, History, ScheduleLine, `SuggestionUpdate`) lands on the expected step.
- The approved prototype renames the titles to Title Case ("Fungicide Options" and so on): `treatment.screen.test.js` expects "Fungicide options" today, so its assertions follow the new wording.

## Resolution

Rank standard (tests only); every question self-decided on the recommendation (2026-11-05).

Facts: client tests are SSR only (`renderScreen` in `stub-contract/screens.js`: `renderToString` with a memory router; `onMounted` does not run, so a test loads the store first). `renderScreen` takes a full path, so `?step=` works as is. No test mounts `TreatmentJourney` or `ScanView` step 4; no new dependency is needed.

- **Mount-time choices become pure helpers, unit tested** (one new helper file with its `.test.js`), because SSR never runs `onMounted`:
  1. `stepFrom(query)`: each of `weather`, `spray`, `fungicides`, `schedule` returns itself.
  2. `stepFrom`: a missing, unknown or repeated `step` returns `schedule`.
  3. Scan entry: the scan store's line and week match the route and `reschedule` is set → follow that cycle id.
  4. Scan entry: line or week differs, or no `reschedule` → load; no update card.
  5. "Back to scan results" shows only when line and week match and the scan reached Results.
- **Scan store** (the store's test file): 6. `select` with a new line or week and "New scan" reset `step` to 1; otherwise `step` is kept across routes.
- **Screen render tests, `treatment.screen.test.js` rewritten per step** (render per `?step=`, not each component alone: the screen's job is the split):
  7. The four existing tests keep their checks, each on the step that now holds them: options, "Recommended", other guidance and the excluded record-form option on the steps that hold them (`?step=fungicides`, `?step=schedule`); "Record anyway" on Schedule; the basis, the human review banner, "What changed" and "Updating…" above the tabs (checked on two different steps). Expected text follows the Title Case titles ("Fungicide Options").
  8. The bare path opens Schedule: the Schedule tab is `aria-selected="true"` and "Fungicide Options" is absent.
  9. Each `?step=` renders its Title Case heading, four tabs with `aria-label`s Weather, Spray Log, Fungicides, Schedule, and only its own tab selected.
  10. Spray Log: the update card renders for a matching scan entry while updating (and on failure, with Retry); absent for a non-matching entry and once done.
  11. "Back to scan results" renders for a matching scan at Results; absent from a Dashboard entry.
  12. The monitoring card and confirm-step reason test moves to the step that holds them, unchanged otherwise.
- **Hand checks in the stub app** (what SSR cannot show): the five entry points (Scan → Weather Risk; Dashboard, History, ScheduleLine, `SuggestionUpdate` → Schedule); Scan "Continue to weather risk" mid-run → Spray Log shows updating, then nothing once done (this confirms Vue unmounts `ScanView` before `/treatment` mounts); a failed run shows Retry on Spray Log; "Back to scan results" and browser back land on Results, and a run still going is followed again; browser back from any tab leaves the screen (`router.replace`); 390px shows one row of four pills with working tooltips and keyboard focus.
- No test for the new icons' drawing; the render test names them by `aria-label`.
