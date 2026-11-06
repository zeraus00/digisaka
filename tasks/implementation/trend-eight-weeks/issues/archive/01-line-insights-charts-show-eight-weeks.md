# 01: The Line insights charts always show 8 weeks

**Rank:** standard: client only; the 8-week series already comes from the Line Insights route the screen loads, and no API shape changes.

**Model:** Sonnet

**What to build:** On Line insights (Scan step 1) every weekly chart (All, YLS/YLI, Leaves, Rainfall) always draws the same 8 consecutive weeks, ending at the last finished week, taken from the insights series. A week with no record stays on the x axis with no value, and the missing-weeks line under the chart names it. This replaces the 3 weeks the history route returns, which is what the chart shows today; the prototype's x axis likewise keeps a constant number of weeks.

- **One source.** The weeks, and each week's YLS, YLI, rainfall and leaves, come from the insights series the screen already loads. The line-history route is no longer read on this screen. The old join of leaves onto weeks stays until ticket 02, which still uses it, and goes there. The critical and target reference values and the canopy status are used as now.
- **Not yet loaded or failed.** While the insights have not loaded, or the call failed, the chart section shows nothing, not the old 3 weeks. There is one path, not two.
- **Everything else is unchanged.** The toggle, the captions, the canopy bar and the rest of the screen behave as before. The history route and its other users are not touched.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Test at the chart: 8 weeks with a gap in the middle draw 8 x-axis labels in week order, the gap draws no point, and the missing-weeks line names the gap
- [ ] Test at the screen: the weeks drawn are the insights series, not the history weeks; with the insights unloaded or failed the chart section is empty
- [ ] The screen no longer loads the line history
- [ ] By hand in the stub app: Line insights shows 8 weeks on every toggle view, at phone width (360px) the 8 labels stay readable
- [ ] The client tests and the build pass
