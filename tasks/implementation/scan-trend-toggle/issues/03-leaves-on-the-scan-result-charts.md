# 03: The Leaves view on the cycle evidence at Scan step 3

**Rank:** standard: client only; it reads the existing Line Insights route for the scan's line and week.

**Model:** Sonnet

**What to build:** At Scan step 3 the cycle evidence charts get the same Leaves view and leaves line as Line insights. The evidence only carries YLS, YLI and rainfall, so the evidence component loads the insights for the scan's line and week itself (the scan screen passes the line and week in) and joins the leaves, canopy status and reference values by week with the helper from ticket 02. No API change.

- A week the insights series does not cover has no leaves. While the insights are loading or if they fail, the toggle still works on the other views and Leaves is disabled; a failed insights read does not hide the evidence charts or show an error in their place.
- The insights store is also used by Line insights, which resets it when it leaves the screen. Going from step 1 to step 3 must end with the insights loaded for the right line and week, not empty or stale; the store already drops stale answers.

**Blocked by:** 02: The Leaves view on Line insights.

**Status:** ready-for-agent

- [ ] Store test: the evidence component asks the insights store for the scan's line and week (API mocked, as in the existing insights store test), and a failed read leaves the other views working
- [ ] By hand in the stub app: step 1 to step 3 shows leaves at step 3; the Leaves view, All with the leaves line and the caption; a week outside the insights series has no leaves; changing the line or week and rescanning loads the new insights
- [ ] The client tests and the build pass
