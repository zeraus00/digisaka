---
id: "0003"
title: "How the run mode is tested and documented"
map: dev-run-mode
labels: [wayfinder:grilling]
status: open
assignee: ""
blocked_by: ["0001", "0002"]
---

Rank: standard (tests and docs only)

## Question

Which tests and doc changes does the build need?

1. **Stub tests.** Route tests for run mode (read, set, bad value, auth), and settle tests per mode (Fail, Stuck, the lifetime decided in 0001, reset restores Normal), in `stub/scheduler.test.js` or `stub/scan-cycle.test.js`.
2. **Client tests.** A store test for the run-mode store (or the extended dev clock store), and an SSR render test (`renderScreen`) for the dev bar: shown, hidden when the route does not answer, hidden in a production build. Tests stay SSR; `onMounted` and unmount do not run.
3. **Docs.** The stub README section and `CLAUDE.md`'s stub paragraph (the dev-date mention, L06/L08 wording), and the line list if L08 goes.
4. **Hand checks.** Which checks run by hand on the stub app: Fail then Retry, Stuck then timeout, the bar hidden against the real scheduler.
