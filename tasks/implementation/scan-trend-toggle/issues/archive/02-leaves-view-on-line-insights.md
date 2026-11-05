# 02: The Leaves view on Line insights

**Rank:** standard: client only; the weekly leaves and their reference values come from the Line Insights series that screen already loads.

**Model:** Sonnet

**What to build:** On Line insights (Scan step 1) the toggle gains a Leaves button and view, and All gains a leaves line. The weekly functional leaves, the served canopy status for each week, and the served critical and target values are joined to the chart's weeks by week from the insights series the screen already loads. A pure helper does the join: a week missing from the series, or a series that has not loaded, gives no leaves and does not throw.

- **Leaves view.** A line chart of leaves per week on the 0–12 scale, drawn solid with square markers, with a critical line (dashed) and a target line (dotted) from the served values, labelled "8 critical" and "10 target" at the line end. A value the server did not send means that line is not drawn. Heading "Functional leaves by week — count 8 weeks after shooting".
- **Caption.** For the latest week with a count: "{n} functional leaves in {week}." plus the served canopy status in words: ok "At or above the target."; watch "Below the target, above the critical level."; critical "Below the critical level."; no status, the count only; no count anywhere, "No leaf count recorded." The client never compares the count with the thresholds.
- **All.** The leaves line is drawn dotted with square markers on the left axis, listed in the key, with no reference lines. When no week has a count, the Leaves button is disabled (as for the other series), the line and its key entry are left out, and a Leaves entry appears in the missing-weeks line only when the series is drawn on the current view.
- **Canopy bar.** The canopy bar on Line insights stays exactly as it is, on every view.

**Blocked by:** 01: The weekly charts get a trend toggle.

**Status:** done

- [ ] Helper tests: the leaves join (matched by week; a missing week or an unloaded series gives no leaves; status and both reference values carried); the caption sentences for ok, watch and critical, the count-only and no-count cases, and a count below the threshold with served status ok gives the ok sentence; a null threshold or target draws no line and the labels read "8 critical" and "10 target"; the missing-weeks line lists Leaves only when drawn
- [ ] Render tests: the Leaves button is disabled and All's key omits Leaves when no week has a count; the Leaves view shows its heading, caption and reference lines
- [ ] By hand in the stub app: the Leaves view, the All chart with the leaves line, the canopy bar unchanged on every view, phone width
- [ ] The client tests and the build pass
