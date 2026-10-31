# 02: The client holds a line's suggestion and records against it

**Rank:** standard, a store behind the decided contract.

**Model:** Sonnet

**What to build:** A suggestion store replaces the Selection store. It loads a line's suggestion, polls while `running` is true until the new revision arrives (with the same limit and interval style the cycle store uses), and records an application: it submits with `confirmed: false`, and on `confirmation_required` it exposes the returned tier, alerts and revision so a screen can ask, then resubmits with `confirmed: true` and the returned revision. `productOf` moves with it. The cycle store loses its close and reopen actions and keeps retry and polling.

**Blocked by:** 01 The stub serves the new scheduler contract

**Status:** ready-for-agent

- [ ] Loading populates groups, basis, changes and the schedule days
- [ ] While `running`, the store polls and stops on a new revision or the limit
- [ ] A refused record exposes the alerts and a confirmed resubmit succeeds with the returned revision
- [ ] `product_not_offered` surfaces as an error the screen can show
- [ ] Store tests pass; no code calls the removed cycle actions
