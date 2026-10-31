---
id: "0002"
title: "Where the control sits and when it shows"
map: bls-dev-clock-client
labels: [wayfinder:prototype]
status: closed
assignee: "archelaus"
blocked_by: []
---

Rank: standard (dev-only UI)

## Question

Where does the "Set current date" control live (app header, a dev-only footer, a settings page) so it is clearly not one of the week or date filters, what does it show (effective date, default, pinned), and what does it do when `GET dev/today` is absent (hide), refused (hide) or fails (show an error)? A rough sketch is enough.

Recommendation to test: a small dev-only bar at the foot of every screen, hidden unless the endpoint answers.

## Resolution

Rank standard; self-decided. Rough sketch (a bar fixed at the foot of every signed-in screen, visually separate from the filters):

```
┌────────────────────────────────────────────────────────────────────┐
│ DEV  Current date [ 2026-06-15 ]  [Set]  [Reset to 2026-06-08]  pinned │
└────────────────────────────────────────────────────────────────────┘
```

- **Shows:** the effective date in a date input, `Set`, and `Reset to <default>`; `pinned` is shown when the server reports an override or env date, nothing when it is the real date.
- **When:** only in a dev build (`import.meta.env.DEV`), only after `GET dev/today` answered once at start. Absent route (404), refused (401 or 403) or a network failure at start: the bar is not rendered. A failure on `PUT` or `DELETE` after it showed: a one-line error in the bar, the date unchanged.
- **Where:** a footer component mounted once in the signed-in layout, not on the Scan screen, so no existing filter is touched.
- **Stub:** serves the three routes with the same bodies, so the bar shows on the stub.
- **Tests to name:** hidden when the endpoint 404s, 403s or fails; shown when it answers; `Set` calls `PUT` and updates `today.js`; `Reset` calls `DELETE`; hidden in a production build.
