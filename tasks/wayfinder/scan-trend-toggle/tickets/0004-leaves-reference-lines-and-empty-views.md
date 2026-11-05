---
id: "0004"
title: "Leaves reference lines and empty views"
map: scan-trend-toggle
labels: [wayfinder:grilling]
status: open
assignee: ""
blocked_by: ["0001"]
---

Rank: standard (client display only, using served values)

## Question

- Does the Leaves chart draw the critical and target lines, and with what labels ("8 critical", "10 target")? The values come from the served `functional_leaves_threshold` and `_target`. Does the All chart draw them too?
- A view with no data (no leaves recorded, no rainfall): disable its button (as the prototype does) or keep it enabled and show an empty-state line? What does All show when one series is empty?
- What do the Leaves heading and caption say, in the style of the YLS/YLI and Rainfall captions?

Blocked by [Where the weekly leaves come from](0001-where-the-weekly-leaves-come-from.md): which weeks can have no leaves depends on the source.
