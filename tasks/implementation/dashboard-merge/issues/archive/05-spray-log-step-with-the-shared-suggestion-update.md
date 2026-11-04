# 05: Spray log step with the shared suggestion update

**Rank:** standard: client only.

**Model:** Sonnet

**What to build:** The Spray log step shows the recorded spray history and the FRAC group card from Line Insights (server statuses, "Discouraged FRAC groups" heading when a group is discouraged or maxed) and the shared side summary. Step 3's update card becomes one shared component used by step 3 and the Spray log step; "Continue to fungicide options" shows only when the suggestion is current, and a monitoring or review outcome shows its text and "Open the suggestion" instead.

**Decisions:** [How the treatment review journey reads the suggestion](../../../wayfinder/dashboard-merge/tickets/0004-how-the-treatment-review-journey-reads-the-suggestion.md), [Field map for spray log and fungicides](../../../wayfinder/dashboard-merge/tickets/0006-field-map-for-spray-log-and-fungicides.md)

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] Step 3 and the Spray log show the same update states from one component
- [ ] The gate opens only on a current suggestion (ready, not updating, update state ready or unchanged)
- [ ] No "Restricted" wording and no close-week card remain
