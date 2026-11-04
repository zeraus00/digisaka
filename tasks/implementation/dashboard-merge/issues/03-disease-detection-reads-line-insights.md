# 03: Disease Detection reads Line Insights

**Rank:** standard: client only, reads decided fields.

**Model:** Sonnet

**What to build:** Scan step 1 shows the fork's "Line X insights" design on live data. A new insights store (beside `lineHistory`, which keeps feeding the week charts) loads the line and week on mount. The six cards, the canopy meter and "Why management may be needed" are filled as the insights field map decided, with infection risk greyed out ("Coming soon" plus `TODO(contract)`); the latest scheduler result comes from the suggestion store. Text tables live in one insights helper. The fork's old-flow `lineHistory` reads are not ported.

**Decisions:** [Line insights store](../../../wayfinder/dashboard-merge/tickets/0002-line-insights-store.md), [Field map for the insights screens](../../../wayfinder/dashboard-merge/tickets/0005-field-map-for-the-insights-screens.md)

**Blocked by:** 01, 02

**Status:** ready-for-agent

- [ ] The insights store test covers URL encoding, `latest()` skipping nulls, `lastTreatment`, a dropped stale response, error and invalid-week states
- [ ] The canopy pill is `canopy_status` as served and hidden when null; the caption states numbers only
- [ ] The insights helper test covers each table and passes an unknown value through
- [ ] No sample or prototype wording remains on the step
