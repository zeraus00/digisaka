---
id: "0006"
title: "Field map for spray log and fungicides"
map: dashboard-merge
labels: [wayfinder:grilling]
status: open
assignee: ""
blocked_by: ["0003", "0004"]
---

**Model:** Opus. The largest screen set, with product facts, grouping and wording rules.

## Question

For the Spray log step (`SprayLog.vue`) and the Fungicides step (the fork's option list and details pages), which field or client mapping fills each element, and which elements stay greyed out?

- **Spray log:** the history panel from `history[]` (`applied_on`, `product`, `mode_of_action`, the `frac_code` pill); the per-spray status pill (from the matching `group_usage[]` row's `status`, or none); the FRAC group card from `group_usage[]` (count, cap, `status`, `alerts[]`), headed with "Discouraged" wording; the action chips from `actions.kinds[]` (one Treatment pill) and the `actions.summary` line; the suggestion update state in place of the close-week card; the stale "Restricted groups are excluded…" line removed.
- **Fungicide list:** eligible versus excluded counts and the Recommended badge from `groups`; grouping ("Group A: contact, multi-site protectants") from `facts` (mode of action, multisite, plant mobility); the FRAC and mobility pills; price greyed out; the excluded reason text for each `reason` code plus failing `checks[].detail` and unit `alerts[]`; "Use caution" for excluded units; "Continue to schedule"; the insist, decision and sample-selection controls removed.
- **Fungicide details:** name; which `facts` fill active ingredient, manufacturer, chemical group, mode of action, plant mobility pills, rate, rainfast, application interval and registrations; formulation and price greyed out; the application window and next assessment from `schedule`; the eligibility checks card from real `checks[]`, with the registration row greyed out; the caution card from failing checks and alerts.
- How an empty fact shows ("Unknown") versus a greyed-out field that will not be provided.
