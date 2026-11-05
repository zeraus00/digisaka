---
id: "0002"
title: "Where the toggle shows, what it remembers, and its icons"
map: scan-trend-toggle
labels: [wayfinder:grilling]
status: closed
assignee: "archelaus"
blocked_by: []
---

Rank: standard (client behaviour only)

## Question

- Does the toggle show on both `WeekCharts` users (`EvidenceCharts` at Scan step 3, `LineHistory` at Scan step 1) or on one only? The ask says /scan; both users sit on /scan.
- What does the toggle remember: nothing (All on each mount), the pick per chart instance while the screen is open, or one pick shared across screens (store or browser storage)?
- The four icons (All as a grid or layers mark, YLS/YLI as one mark, Leaves, Rainfall): inline SVG drawn here with no new dependency, or supplied by the design?

## Resolution

Rank standard; asked, developer agreed with all three recommendations (2026-11-05).

- **Both users get the toggle.** It lives in `WeekCharts`, so `EvidenceCharts` (Scan step 3) and `LineHistory` (Scan step 1) both show it; no prop to turn it off (YAGNI). This makes the canopy-bar question real: see the new ticket.
- **Nothing is remembered.** The pick is plain component state, All on each mount, one per chart instance. No store, no browser storage.
- **Icons are inline SVG paths in `Icon.vue`** (DRY with the existing component, no dependency): a grid for All, a two-line mark for YLS/YLI, a leaf for Leaves, a drop for Rainfall, drawn as in the approved prototype.
