---
id: "0002"
title: "Line Insights store"
map: dashboard-merge
labels: [wayfinder:grilling]
status: closed
assignee: "archelaus"
blocked_by: []
---

**Model:** Sonnet. A local store shape; the consumers and fields are known.

## Question

What client store reads Line Insights (`GET /api/v1/scheduler/lines/{id}/weeks/{week}/insights`), and what becomes of the fork's `stores/lineHistory.js` reads?

- A new store, or an extension of `lineHistory` (which today reads `/history` for the week list `WeekCharts` draws)?
- The fork's `lineHistory` reads old-flow data (line status `proposals`, `/cycles/{id}/proposal`, `/cycles/{id}/evidence`): what is dropped, what (if anything) moves to the suggestion store, and how the fork's `lineHistory.test.js` is rewritten.
- Consumers: Disease Detection (`LineHistory.vue`, step 1) and the Weather and Spray log steps' side summaries. One fetch per line and week shared across them, or one per screen?
- When does it refetch: the week changes, a scan finishes, an application is recorded, the suggestion `revision` changes?
- Which fields it exposes as-is versus derived getters (latest non-null `yls`/`yli`, last treatment), with derivations kept to display only (the server sets every verdict).

## Resolution

Rank standard; self-decided (client-internal, no route or field changes).

- **A new store, `stores/insights.js`** (`useInsightsStore`). `lineHistory` stays as it is on `login-merge`: it serves the week rows (`/history`, last three weeks) that `WeekCharts` draws and that `EvidenceCharts` also passes in, so no `WeekCharts` caller changes. The fork's `lineHistory` additions (line status, `/cycles/{id}/evidence`, `/cycles/{id}/proposal`, `proposals`, `latest_cycle`) are not taken, and the fork's extra `lineHistory.test.js` cases go with them.
- **Shape:** the `lineHistory` pattern: `state: { phase, lineId, week, data, error, run }`, phase `idle | loading | ready | error`, `load(lineId, week)` guarded by the `run` counter, `isValidWeek` check, `messageFor` for errors. `data` is the payload as served (no renaming, no copies of its fields).
- **Getters, display-only:** `latest(key)` returns the newest `series[]` entry whose `key` is not null (for YLS, YLI, `functional_leaves`, `leaves_at_shooting`), with its week; `lastTreatment` is the `history[]` entry with the newest `applied_on`. Every verdict (`risk.result`, `canopy_status`, `status`, `actions.summary`) is read from `data` and shown; the client sets none. Text labels for those values belong to the two field-map tickets.
- **Who loads and when:** the screen that owns a step calls `load` on mount and when line or week change; its child components read the store. Step 1 (`LineHistory.vue`) is one owner; the Treatment Review journey is the other (it loads once and the Weather and Spray log steps read). No cache: step 4 arrives after step 3 has followed the suggestion update, so a fresh read on mount is current and always right (YAGNI on a key-matched cache and a force flag). An application recorded on `/treatment` is picked up the next time a screen mounts.
- **Does not fetch the suggestion.** The latest scheduler result (`outcome`, `outcome_reason`) comes from the suggestion store; which screen loads it is settled in the field-map and journey tickets.
- **Tests to name:** a store test with one inline trimmed fixture (the shape of `line-insights.cycle.json`): load builds the URL with encoded ids, `latest()` skips nulls, `lastTreatment` picks the newest, a stale response from an earlier line/week is dropped, an error sets `phase: 'error'`, an invalid week resets to idle. The full field list stays in `stub/insights.test.js` (one list, not two); no client test imports `stub/`.
- **Removed from the map:** the fork's `lineHistory`/`LineHistory.vue` old-flow code is not ported; the Disease Detection slice rebuilds `LineHistory.vue` on this store plus `lineHistory.weeks` for the chart.
