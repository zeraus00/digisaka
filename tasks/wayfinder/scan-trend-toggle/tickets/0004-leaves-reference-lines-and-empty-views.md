---
id: "0004"
title: "Leaves reference lines and empty views"
map: scan-trend-toggle
labels: [wayfinder:grilling]
status: closed
assignee: "archelaus"
blocked_by: []
---

Rank: standard (client display only, using served values)

## Question

- Does the Leaves chart draw the critical and target lines, and with what labels ("8 critical", "10 target")? The values come from the served `functional_leaves_threshold` and `_target`. Does the All chart draw them too?
- A view with no data (no leaves recorded, no rainfall): disable its button (as the prototype does) or keep it enabled and show an empty-state line? What does All show when one series is empty?
- What do the Leaves heading and caption say, in the style of the YLS/YLI and Rainfall captions?


## Resolution

Rank standard; asked, developer agreed with all five recommendations (2026-11-05).

- **Leaves view draws both reference lines** from the served `functional_leaves_threshold` and `_target`, labelled at the line end ("8 critical", "10 target"); critical dashed, target dotted (not colour alone). A null value means that line is not drawn.
- **All draws no reference lines.** They show on the Leaves view only.
- **A series with no values in the shown weeks disables its button** (as in the approved prototype). If the shown view goes empty, the chart falls back to All.
- **All draws the series that exist;** an empty series is left out of the chart and the key. The missing-weeks line gains a Leaves entry, shown only when that series is drawn on the current view.
- **Leaves heading:** "Functional leaves by week — count 8 weeks after shooting". **Caption** for the latest week with a count: "{n} functional leaves in {week}." plus the served `canopy_status` in words: ok "At or above the target."; watch "Below the target, above the critical level."; critical "Below the critical level."; no status, the count only; no count anywhere, "No leaf count recorded." The client never compares the count with the thresholds (the server sets every verdict); the prototype's client-side comparison is not carried over.
