# 04: Treatment Review shell and the Weather step

**Rank:** standard: client only; the four-step journey shape was decided before charting.

**Model:** Sonnet

**What to build:** Scan gains its fourth step: "Continue to weather risk" on step 3 opens the Treatment Review journey with the steps Weather, Spray log, Fungicides and Schedule (a link to `/treatment/:lineId/:week`). The journey loads the insights store once and reads the suggestion store as step 3 left it. The Weather step shows the weekly recorded rainfall, the risk finding, the 5-day outlook, the conditions and readings, and a shared side summary (with the action chips and `actions.summary`); humidity, leaf wetness and infection risk level are greyed out. The suggestion update keeps running from step 3 into the journey.

**Decisions:** [How the treatment review journey reads the suggestion](../../../wayfinder/dashboard-merge/tickets/0004-how-the-treatment-review-journey-reads-the-suggestion.md), [Field map for the insights screens](../../../wayfinder/dashboard-merge/tickets/0005-field-map-for-the-insights-screens.md)

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Moving from step 3 to the journey does not refetch or stop the suggestion update; going back to step 1 or 2 stops it
- [ ] The Weather step reads no prototype, proposal or cycle store
- [ ] The rain-day count and the Treatment chip rule are covered by helper tests
- [ ] Back from `/treatment` lands on Scan with its step reset
