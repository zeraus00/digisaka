# 01: The Weather risk tile shows leaf wetness

**Rank:** standard: client only; it displays a field the scheduler already serves once the scheduler ticket "Line Insights serves the week's leaf wetness" has landed.

**Model:** Sonnet

**What to build:** On the Weather step, the "Leaf wetness" tile (today "Coming soon") shows the selected week's hours from the Line Insights series, styled like the "Recorded rainfall" tile.

- **With a value.** The hours (for example `32.4 h`) and the week, as the rainfall tile does. No badge: dev data is synthetic like the rest.
- **No value.** "—" with "No leaf wetness value recorded for this week".
- **Stub.** Both Line Insights stub payloads carry `leaf_wetness_hours` on every week, as the scheduler serves it (a missing week in one of them so the no-value state shows).
- **Cleanup.** The `TODO(contract)` comment on that block is narrowed to humidity; the Humidity tile stays "Coming soon".

**Blocked by:** AI_NeSy_Framework ticket "Line Insights serves the week's leaf wetness".

**Status:** ready-for-agent

- [ ] Insights store and stub tests: the series carries the field; a week with no value reads `null`
- [ ] Component tests: a value shows; no value shows "—" and the no-value line; Humidity still "Coming soon"
- [ ] The tile at the phone width (360px) reads clearly
- [ ] By hand in the stub app (use the `run` skill): the Weather step shows the hours on a normal week and the no-value text on the missing week
- [ ] The client tests and the build pass
