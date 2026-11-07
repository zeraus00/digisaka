---
id: "0006"
title: "Field map for spray log and fungicides"
map: dashboard-merge
labels: [wayfinder:grilling]
status: closed
assignee: "archelaus"
blocked_by: ["0003", "0004"]
---

**Model:** Opus. The largest screen set, with product facts, grouping and wording rules.

## Question

For the Spray log step (`SprayLog.vue`) and the Fungicides step (the fork's option list and details pages), which field or client mapping fills each element, and which elements stay greyed out?

- **Spray log:** the history panel from `history[]` (`applied_on`, `product`, `mode_of_action`, the `frac_code` pill); the per-spray status pill (from the matching `group_usage[]` row's `status`, or none); the FRAC group card from `group_usage[]` (count, cap, `status`, `alerts[]`), headed with "Discouraged" wording; the action chips from `actions.kinds[]` (one Treatment pill) and the `actions.summary` line; the suggestion update state in place of the close-week card (the shared `SuggestionUpdate` card, settled in the journey ticket); the stale "Restricted groups are excluded…" line removed.
- **Fungicide list:** eligible versus excluded counts and the Recommended badge from `groups`; grouping ("Group A: contact, multi-site protectants") from `facts` (mode of action, multisite, plant mobility); the FRAC and mobility pills; price greyed out; the excluded reason text for each `reason` code plus failing `checks[].detail` and unit `alerts[]`; "Use caution" for excluded units; "Continue to schedule"; the insist, decision and sample-selection controls removed.
- **Fungicide details:** name; which `facts` fill active ingredient, manufacturer, chemical group, mode of action, plant mobility pills, rate, rainfast, application interval and registrations; formulation and price greyed out; the application window and next assessment from `schedule`; the eligibility checks card from real `checks[]`, with the registration row greyed out; the caution card from failing checks and alerts.
- How an empty fact shows ("Unknown") versus a greyed-out field that will not be provided.

## Resolution

Rank standard; self-decided (client-internal, every field already decided on the scheduler map). Ten questions, all A.

**Spray log**
- History panel: `insights.data.history[]`, newest first: date, product, "{mode_of_action} · FRAC {frac_code}"; badge from the `group_usage[]` row with the same `frac_code` (`discouraged` "Discouraged", `maxed` "Maxed", else "Applied"); "{n} recorded"; the server's `history_coverage` sentence under the header. The prototype timeline goes.
- FRAC card: one row per `group_usage[]` (FRAC pill, group label, "{count} of {range_min} to {range_max} {period}" or "cap unknown", cap source, status pill OK / Discouraged / Maxed / none) with its `alerts[]` text and alternatives. Heading "Discouraged FRAC groups" when any row is `discouraged` or `maxed`, else "FRAC history". The "Restricted groups are excluded…" footnote goes.
- Side summary: one shared `InsightsSummary.vue` with the Weather step (rows, chips, `actions.summary`, disclaimer). The close-week card is `SuggestionUpdate` (journey ticket).

**Fungicide list**
- Sections by the server's tiers: Recommended (combo card, "Recommended" badge), Eligible (same style, no badge), "Use caution" for excluded, headed "Excluded options". Count line "{recommended + eligible} eligible · {excluded} excluded". No client sub-grouping by facts. The "not a combination to mix" warning stays.
- Row: `titleCase(label)`, pills from one helper `unitFacts(unit)` (FRAC, Multi-site or Single-site, each mobility; an empty fact leaves its pill out), price greyed, "View details →" by `unit_id`. Insist, Selected, Insisted, sample selections and "Continue to decision" are removed; "Continue to schedule" is a link.
- Excluded reason table: a check name through `checkLabel` ("Fails: Rotation"); `rotation`, `no_interval`, `not_for_stage` have their own sentences; an unknown code is shown as served. Then each failing check's `humanDetail`, then the unit's alerts in `orderAlerts` order.

**Fungicide details**
- Badge is the tier's `GROUP_LABEL`. Manufacturer, active ingredient, chemical group, FRAC code and mode of action (`explainMoa`) come from `facts.product`. Mobility pills are the four fixed ones, active from `plant_mobility`, plus any other value as an extra pill.
- Use information: Rate is `application_rates[].text`; Rainfast is `weather_requirement.rainfast_period`; the interval is "{min_days} to {max_days} days". The application window is the `timing_window` of this unit's schedule entry, and the next assessment is the first monitoring day after it; a unit not in the plan reads "Not in this plan".
- Formulation and price are greyed. Registrations, dilutions, coverage and methods are not shown (no slot in the design).
- Caution card: shown for an excluded unit or one with alerts; the insist text goes.
- Eligibility checks: one row per real `checks[]` entry (`checkLabel`, `RESULT_LABEL` badge, `humanDetail`), plus a greyed "Label and registration" row; no checks gives "No checks were run" plus the reason. The specialist note stays.

**Unknown versus not provided:** an empty fact (`null` or `[]`) reads "Unknown". A field the API will not serve is greyed "Coming soon" with `TODO(contract): <field>`. `unitFacts` returns `null` for empty; the component picks the word.

**Helpers:** `unitFacts` and the reason table sit beside the existing check helpers in `helpers/checks.js`, so the `/treatment` restyle reuses them.
