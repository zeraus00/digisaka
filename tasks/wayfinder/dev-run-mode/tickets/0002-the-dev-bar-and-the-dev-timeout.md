---
id: "0002"
title: "The dev bar and the dev timeout"
map: dev-run-mode
labels: [wayfinder:grilling]
status: open
assignee: ""
blocked_by: ["0001"]
---

Rank: standard (dev-build client only; production constants unchanged)

## Question

How does the dev bar hold the run mode beside the dev date, and is the follow's timeout shortened in dev?

1. **Component.** Rename `DevDateBar` to a general dev bar holding both controls, or add a second component inside one shared chip. Does each control hide on its own when its route does not answer (the date answers on the real scheduler in dev, the run mode does not)?
2. **Control.** A select or three toggle buttons for Normal / Fail / Stuck; how the current mode and a one-shot mode (if 0001 picks one) are shown.
3. **Phone width.** Layout of two controls in the fixed footer chip (`position: fixed`, above the tab bar) without covering screen content. Call `prototype` if words are not enough.
4. **Timeout in dev.** Keep about 3 minutes (`POLL_LIMIT` 90 x `POLL_MS` 2 s, `stores/cycle.js`), or shorten it in a dev or stub build only (for example a Vite env value read beside the constants), without changing the production values.
