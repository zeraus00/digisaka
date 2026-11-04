---
id: "0003"
title: "Stub payloads for the decided fields"
map: dashboard-merge
labels: [wayfinder:grilling]
status: open
assignee: ""
blocked_by: []
---

**Model:** Opus. It reads the scheduler's decided shapes across two repos and picks consistent sample values.

## Question

How does the stub serve each field the scheduler map decided, before the scheduler serves it?

Shapes come from `AI_NeSy_Framework/tasks/implementation/dashboard-contract-gaps/issues/`. For each:

1. **Insights** (`stub/insights.js`, `stub/payloads/line-insights.{cycle,no-cycle}.json`): `history[].frac_code`/`multisite`, `group_usage[]` in place of `resistance_alerts`, `functional_leaves_target`, per-week `canopy_status`, `actions.summary`. Which values, consistent with the payload's own series and history (a `canopy_status` that matches its `functional_leaves`, a `group_usage` count that matches its history)?
2. **Suggestion units** (`stub/suggestions.js`, built from the frozen 0004 payloads in `stub/payloads/selection-preview.*.json`): `facts` per unit. Does the frozen payload hold the unit's check inputs, or do the stub's demo products need a hand-written facts table? Which facts stay empty (unknown)?
3. **Live mismatches:** the scheduler map found the live suggestion differs from the stub in four places (`changes`, a unit alert's `cause`, the schedule's `frac` versus `moa`, the weather fields). Which does the stub follow now, and which does the client read?
4. **Tests and docs:** `stub/insights.test.js` and `suggestions.test.js` field lists; the stub entry in `CLAUDE.md` saying the stub runs ahead of the live API for these fields until the scheduler tickets land.
