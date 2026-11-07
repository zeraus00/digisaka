# 02: The Spray log shows plant mobility on each recorded application

**Rank:** standard: stub and client only; the field follows a shape decided with the scheduler ticket 01.

**Model:** Sonnet

**What to build:** The stub's Line Insights payloads give each `history[]` entry `plant_mobility` (a list, with at least one empty case), and the stub's contract tests check it. The Spray log row shows a pill per mobility ("Systemic", "Contact"; both when both) beside the FRAC pill, and no mobility pill when the list is empty (unknown, not a guess). The Multi-site pill is removed from the row. The pill text reuses the client's existing mobility wording for products.

**Blocked by:** None to build against the stub; the live check against the scheduler waits for the scheduler ticket 01 (`tasks/implementation/history-plant-mobility` in AI_NeSy_Framework).

**Status:** ready-for-agent

- [ ] The stub payloads carry `plant_mobility` on every history entry, one of them empty, and the stub tests pass
- [ ] The Spray log shows Systemic and Contact pills as listed, none for an empty list, and no Multi-site pill
- [ ] The client tests and the build pass
- [ ] The live check against the real scheduler is noted as outstanding until the scheduler ticket is built
