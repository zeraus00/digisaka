---
id: "0003"
title: "Stub payloads for the decided fields"
map: dashboard-merge
labels: [wayfinder:grilling]
status: closed
assignee: "archelaus"
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

## Resolution

Rank standard; self-decided (stub only, every field follows a shape decided on the scheduler map).

1. **Insights: the two payload files are edited** with values that agree with their own data. `frac_code` uses the KG's mode-of-action codes, as the suggestion payloads do (Chlorothalonil `M`/multisite `true`, Pyrimethanil `D1`/`false`); `history[].mode_of_action` takes the KG labels ("Mode of action M"). `group_usage` (cycle payload; the groups of the clean suggestion's products):
   - `M`: count 2, cap 2 to 4 per crop cycle ("Sample source B"), `status: discouraged`, its alert moved from `resistance_alerts` (alternatives `["D1"]`).
   - `D1`: count 1, cap 3 to 4 per crop cycle, source null, `ok`, no alerts.
   - `G2`: count 0, cap 2 to 3 per crop cycle, `ok`.
   The no-cycle payload has `group_usage: []`. `functional_leaves_target: 10.0` in both. `canopy_status` per week from the decided bands on `functional_leaves` (10 up `ok`, 8 to 9 `watch`, below 8 `critical`, null count gives null). The cycle payload gains one canopy reading for its week ("Canopy critical", source null, `sample_fact: true`) and `actions.summary`: "The data suggests favourable to infection and disease is progressing; preventive treatment, a systemic fungicide, a contact fungicide and closer monitoring are suggested." The no-cycle summary is null. `resistance_alerts` is gone.
2. **Suggestion `facts` are built in `suggestions.js` from the recorded `real` payload's per-product sections** (`details`, `resistance`, `efficacy_use`, `conditions`), matched by product name. It covers every demo product, and no payload file changes. The `facts` members:
   - `product` (the QA `Product` shape plus `manufacturer`), `repeat_condition`, `application_rates`, `dilutions`, `coverage`, `application_methods`.
   - `mixture_conditions`: carriers as required partners, excluded as excluded partners; `[]` when there are none.
   - Empty (unknown): `manufacturer` null for every product (no sample product links one), `weather_requirement` null (not in the record).
   - `application_interval` is 10 to 15 days for every unit (the sample ABox's general fungicide guidance), marked with a `shortcut:` comment.
3. **Live mismatches: the stub follows live on all four now, in `view()`** (the frozen files stay as they are):
   - `changes` takes the live keys and wording: `units_moved` as a `{unit_id, from, to}` list, and `stage`, `alerts`, `plan_steps_changed` only when they apply.
   - Unit `alerts[].cause` is served (null when the payload has none).
   - Schedule `application` drops `frac`.
   - Weather drops `detail` on an `ok` entry.

   The client already reads `moa` and `changes.summary`, and needs nothing else from these.
4. **Ownership:** one stub slice on this map, before the screen slices. The scheduler tickets 01-04, 06 and 07 stay as written; their stub item becomes a check that the stub equals the live view.
5. **Tests and docs:**
   - `insights.test.js`: field lists for the new and replaced fields, plus checks that each week's `canopy_status` matches its count's band and each `group_usage` count equals its `history` entries.
   - `suggestions.test.js`: `facts` members, `cause`, the schedule `application` keys, and the allowed `changes` keys.
   - The stub line in `digisaka/CLAUDE.md` says the stub runs ahead of the live scheduler for these fields until its tickets land, and the live run checks them then.
