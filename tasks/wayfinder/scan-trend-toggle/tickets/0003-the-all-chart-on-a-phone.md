---
id: "0003"
title: "The All chart on a phone"
map: scan-trend-toggle
labels: [wayfinder:prototype]
status: closed
assignee: "archelaus"
blocked_by: []
---

Rank: standard (client layout only)

## Question

The All chart puts YLS, YLI and leaves lines on a left 0–12 axis and rainfall bars on a right mm axis. Is that readable at phone width (about 360px) with the most weeks the evidence and line history show? If not, the fallback is stacked charts on one shared x axis. Extend `prototype.html` with a phone-width view of both and decide. The series must stay apart without colour alone (line style, markers).

## Resolution

Rank standard; decided by the developer after trying the prototype (2026-11-05).

- **The All chart is the combined dual-axis chart:** YLS, YLI and leaves lines on the left 0–12 axis, rainfall bars (faint, behind) on the right mm axis. The stacked fallback is not built.
- **Series stay apart without colour alone:** YLS a solid line with circle markers, YLI a dashed line with triangle markers, Leaves a dotted line with square markers. The key draws each line and marker as it appears in the chart. The single Leaves view draws its line solid.
- Reference: `prototype.html` in this map's folder (excluded from git; layout choice and shapes are in its All-chart code).
