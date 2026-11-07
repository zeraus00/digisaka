---
id: "0005"
title: "Field map for the insights screens"
map: dashboard-merge
labels: [wayfinder:grilling]
status: closed
assignee: "archelaus"
blocked_by: ["0002", "0003"]
---

**Model:** Sonnet. Element-by-element mapping against known fields.

## Question

For Disease Detection (Scan step 1, `LineHistory.vue`) and the Weather step (`WeatherRisk.vue`), which field or client mapping fills each element, and which elements stay greyed out?

- **Disease Detection:** the six cards (YLS, YLI, `leaves_at_shooting`, infection risk greyed out, progression, last treatment); the canopy meter on `functional_leaves` with `functional_leaves_threshold`, `functional_leaves_target` and the band from `canopy_status` (null hides the pill); the "Why management may be needed" reasons (disease progression, rainfall context) from `readings[]`, `risk` and `rain_outlook`; the latest scheduler result from the suggestion's `outcome`/`outcome_reason` (no proposal wording); the disclaimer stays.
- **Weather:** the rainfall metric (the design labels it "Past 7 days": the weekly `series[].rainfall_mm` or a sum of `rain_outlook.days[]`? if neither matches, which label change); humidity and leaf wetness greyed out; the weather risk signal from `risk`; the infection risk level greyed out; the 5-day strip and "Rain on N of next 5 days" from `rain_outlook.days[]`; "What is driving the assessment" from `readings[]`; the side summary as on step 1.
- Which text mappings live in the client (labels for `risk.result`, `canopy_status`, a day's `status`), and that none sets a verdict the server does not send.

## Resolution

Rank standard; self-decided (client-internal, every field already decided on the scheduler map). Full questions: ten, all A.

**Disease Detection**
- Six cards: YLS and YLI from `insights.latest()`; slot 3 is `leaves_at_shooting`, titled "Leaves at shooting"; Infection risk greyed ("Coming soon", `TODO(contract): infection risk level`); Progression from the reading whose `rule` starts `R1` (`finding` value, `text` caption; none: "Not assessed"); Last treatment from `lastTreatment`.
- Canopy meter: value `latest('functional_leaves')`, ticks at `functional_leaves_threshold` and `functional_leaves_target`, scale maximum the larger of 1.2 times the target and the value; pill is that week's `canopy_status` (OK, Watch, Critical; null hides it); the caption states numbers only, never "below the target" (the pill is the verdict). The prototype chip and note go.
- Why management may be needed: progression is the `R1` reading's `text`; rainfall context is this week's recorded rainfall plus "Rain on N of the next 5 days"; latest scheduler result is the suggestion's `outcome` (Continue monitoring, Expert review suggested, Treatment suggested) plus `outcomeReasonText`. The step loads the `suggestion` store beside `insights`; `notfound`: "No scheduler result yet for this line." Disclaimer stays.

**Weather**
- Rainfall metric: the weekly `series[].rainfall_mm` of the journey's week, labelled "Recorded rainfall", "{week} · weekly total". "Past 7 days" goes with the sample value; summing `rain_outlook` would be future days.
- Greyed ("Coming soon" plus `TODO(contract)`): humidity, leaf wetness, infection risk level (risk card line and side-summary row).
- Risk signal: `risk.finding` as served (null: "Not assessed"), badge from `risk.status`, style from `risk.result`; fine print becomes "This is not a forecast or a probability of infection." (the finding is R5, not rainfall alone).
- 5-day strip from `rain_outlook.days[]` (`dry` shows 0 mm; `not_reported` and `weather_not_yet_checked` show "—"); "Rain on N of the next 5 days" counts `rain` days, adds "(m not reported)", and reads "Weather not yet checked." when the outlook is unchecked; the server's `rain_above_mm` is stated.
- "What is driving the assessment": `risk.conditions[]` (label, Met / Not met / Cannot be checked, inputs) and `readings[]` (finding, text, source marker).
- Side summary: rows as on step 1; chips Preventive, Mechanical, Treatment (either fungicide kind active), Monitor; `actions.summary` below (null hides); provisional chip, sample note and "Risk is not assessed…" line dropped; disclaimer stays.

**Text mappings** live in one `helpers/insights.js` (canopy pill labels, condition words, weekday, outcome text, the `R1` constant, the Treatment pill rule), with `insights.test.js`. Unknown values show as served; no table sets a verdict.

**Risk to know:** the `R1` prefix match is on a KG rule name; a renamed rule shows "Not assessed" until the constant follows. A scheduler field for the disease trend would remove it, but that is a new API field and breaking here, so it is not asked for.
