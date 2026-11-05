---
id: "0002"
title: "The dev bar and the dev timeout"
map: dev-run-mode
labels: [wayfinder:grilling]
status: closed
assignee: "archelaus"
blocked_by: ["0001"]
---

Rank: standard (dev-build client only; production constants unchanged)

## Question

How does the dev bar hold the run mode beside the dev date, and is the follow's timeout shortened in dev?

1. **Component.** Rename `DevDateBar` to a general dev bar holding both controls, or add a second component inside one shared chip. Does each control hide on its own when its route does not answer (the date answers on the real scheduler in dev, the run mode does not)?
2. **Control.** A select or three toggle buttons for Normal / Fail / Stuck; how the current mode is shown (the mode stays until changed, per 0001, so a non-Normal mode must be easy to notice).
3. **Phone width.** Layout of two controls in the fixed footer chip (`position: fixed`, above the tab bar) without covering screen content. Call `prototype` if words are not enough.
4. **Timeout in dev.** Keep about 3 minutes (`POLL_LIMIT` 90 x `POLL_MS` 2 s, `stores/cycle.js`), or shorten it in a dev or stub build only (for example a Vite env value read beside the constants), without changing the production values.

## Resolution

Rank standard (dev-build client and the stub compose file only; the production poll values are unchanged); every question self-decided on the recommendation (2026-11-06).

- **One chip, renamed `DevBar`.** `DevDateBar.vue` becomes `DevBar.vue` (its one import is in `AppLayout.vue`), region label "Development tools". It holds the date group and the run-mode group; each group shows only when its own store is `available`, and the chip shows when either is. Against the real scheduler in dev only the date shows.
- **A separate store, `stores/runMode.js`.** Same shape as `devClock` (`available`, `mode`, `error`, `busy`; `load(dev = import.meta.env.DEV)`, `set(mode)`), loaded beside `devClock` in `AppLayout`'s `onMounted`. Not folded into `devClock`: each route is found on its own. Principle: interface segregation and separation of concerns.
- **Control: a select labelled "Scan runs"** with Normal, Fail, Stuck; a change sets the mode at once (no Set button); `busy` disables it; an error shows like the date's. A non-Normal mode gets the warn style on the select, so it is easy to notice. A select beats three buttons on a phone width.
- **Phone width: no new layout.** The chip already wraps (`flex-wrap`); on a phone the two groups take two rows. No prototype needed.
- **Dev timeout: `VITE_STUB_POLL_LIMIT`, set only in `docker-compose.stub.yml`** (to `10`: about 20 s, while a stub run settles in 4 s). `stores/cycle.js` reads it beside the constants: a positive whole number replaces `POLL_LIMIT`, anything else keeps 90. `POLL_MS` stays 2 s. Not tied to `import.meta.env.DEV`: a dev build against the real scheduler (runs of about 25 s) keeps the full limit. Follows the `VITE_STUB_SAMPLES` precedent. A hidden browser tab still slows the timers.
