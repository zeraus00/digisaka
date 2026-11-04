---
id: "0005"
title: "Field map for the insights screens"
map: dashboard-merge
labels: [wayfinder:grilling]
status: open
assignee: ""
blocked_by: ["0002", "0003"]
---

**Model:** Sonnet. Element-by-element mapping against known fields.

## Question

For Disease Detection (Scan step 1, `LineHistory.vue`) and the Weather step (`WeatherRisk.vue`), which field or client mapping fills each element, and which elements stay greyed out?

- **Disease Detection:** the six cards (YLS, YLI, `leaves_at_shooting`, infection risk greyed out, progression, last treatment); the canopy meter on `functional_leaves` with `functional_leaves_threshold`, `functional_leaves_target` and the band from `canopy_status` (null hides the pill); the "Why management may be needed" reasons (disease progression, rainfall context) from `readings[]`, `risk` and `rain_outlook`; the latest scheduler result from the suggestion's `outcome`/`outcome_reason` (no proposal wording); the disclaimer stays.
- **Weather:** the rainfall metric (the design labels it "Past 7 days": the weekly `series[].rainfall_mm` or a sum of `rain_outlook.days[]`? if neither matches, which label change); humidity and leaf wetness greyed out; the weather risk signal from `risk`; the infection risk level greyed out; the 5-day strip and "Rain on N of next 5 days" from `rain_outlook.days[]`; "What is driving the assessment" from `readings[]`; the side summary as on step 1.
- Which text mappings live in the client (labels for `risk.result`, `canopy_status`, a day's `status`), and that none sets a verdict the server does not send.
