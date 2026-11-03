# 07: The spread chip shows which condition decided it

**Rank:** standard, consumes the response shape fixed by scheduler ticket 15 once the developer approves it; if the approved shape differs, stop at the next safe point and re-rank.

**Model:** Sonnet

**What to build:** On the evidence screen the "Conditions favour spread" chip shows its verdict only. With the scheduler's new list of conditions behind it, the chip also says which condition was not met or could not be checked (for example, leaf wetness not above the threshold, or no wetness value for the week), using the KG label the scheduler returns. The caption under the chart drops its generic "rainfall or leaf-wetness" sentence and names the same condition. The local scheduler stub serves the new list in the same shape, so the screen can be run and tested without the real scheduler. A response without the list (an older scheduler) still renders the chip and caption as today.

**Decisions:** The chip text and the neutral caption come from the earlier relabel; this ticket replaces the generic sentence once the scheduler can say which condition failed.

**Blocked by:** scheduler 15 (The evidence summary returns each condition of the spread verdict)

**Status:** ready-for-agent

- [ ] The stub serves the conditions, and its contract test covers the shape
- [ ] A condition not met, a condition that cannot be checked and an all-met verdict each show the right detail on the chip
- [ ] A response with no list renders as before
- [ ] The caption names the deciding condition instead of the generic sentence
- [ ] The API document lists the new field
- [ ] The client tests and build pass; a manual run against the real scheduler shows the detail on a line whose wetness is not met
