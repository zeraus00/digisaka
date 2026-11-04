# 02: The stub serves the decided contract fields

**Rank:** standard: stub only; every field follows a shape decided on the scheduler map.

**Model:** Sonnet

**What to build:** Against the stub, Line Insights carries `history[].frac_code`/`multisite`, `group_usage[]` (in place of `resistance_alerts`), `functional_leaves_target`, per-week `canopy_status`, a canopy reading and `actions.summary`, with values that agree with the payload's own series and history. Each suggestion unit carries `facts`, built from the recorded `real` payload's product sections. The stub's suggestion view follows the live scheduler on its four known differences (`changes` keys, alert `cause`, no schedule `frac`, no `detail` on an `ok` weather entry). `digisaka/CLAUDE.md` says the stub runs ahead of the live scheduler for these fields until its tickets land.

**Decisions:** [Stub payloads for the decided fields](../../../wayfinder/dashboard-merge/tickets/0003-stub-payloads-for-the-decided-fields.md)

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Insights field lists cover the new and replaced fields; each week's `canopy_status` matches its count's band; each `group_usage` count equals its `history` entries
- [ ] Every unit has `facts` with the decided members; empty facts are `null` or `[]`
- [ ] Suggestion tests cover `facts`, `cause`, the schedule `application` keys and the allowed `changes` keys
- [ ] No stub, payload or test names `resistance_alerts`
