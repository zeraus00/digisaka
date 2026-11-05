---
id: "0004"
title: "How the steps are tested"
map: treatment-steps
labels: [wayfinder:grilling]
status: open
assignee: ""
blocked_by: ["0001", "0002", "0003"]
---

Rank: standard (tests only)

## Question

Which tests does the build need, and how do they run with the client's SSR-only test setup (`renderToString`, no mount library)?

- `stub-contract/treatment.screen.test.js` renders the whole `TreatmentDetailView` and expects "Fungicide options" and "Record application" in one render. After the split they sit on different tabs: render per `?step=`, or test each tab's component on its own?
- The `?step=` read (unknown value, missing value → the default step) and write: a pure helper with unit tests, or a render test per step?
- The scan hand-off from 0002: what can be checked offline, and what is a hand check in the stub app?
- Hand checks: each entry point (Scan, Dashboard, History, ScheduleLine, `SuggestionUpdate`) lands on the expected step.
