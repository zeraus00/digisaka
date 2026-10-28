---
id: "0002"
title: "Where the control sits and when it shows"
map: bls-dev-clock-client
labels: [wayfinder:prototype]
status: open
assignee: ""
blocked_by: []
---

Rank: standard (dev-only UI)

## Question

Where does the "Set current date" control live (app header, a dev-only footer, a settings page) so it is clearly not one of the week or date filters, what does it show (effective date, default, pinned), and what does it do when `GET dev/today` is absent (hide), refused (hide) or fails (show an error)? A rough sketch is enough.

Recommendation to test: a small dev-only bar at the foot of every screen, hidden unless the endpoint answers.
