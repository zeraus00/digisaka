# 09: No sample text or prototype trace remains

**Rank:** standard: client copy and dead code only.

**Model:** Sonnet

**What to build:** A last sweep: no "sample", "prototype" or "illustrative" copy is left on any user screen apart from server-sent markers (a Sample Fact's source marker), the `VITE_STUB_SAMPLES` copy in the stub-samples helper is gone, and no module imports the deleted proposal or prototype stores. Safety disclaimers stay.

**Decisions:** [Merge resolution and a green merge commit](../../../wayfinder/dashboard-merge/tickets/0001-merge-resolution-and-a-green-merge-commit.md)

**Blocked by:** 03, 04, 05, 06, 07, 08

**Status:** ready-for-agent

- [ ] A search of the client finds no sample or prototype copy outside server-sent markers and tests
- [ ] No import of a deleted module; build and all suites pass
