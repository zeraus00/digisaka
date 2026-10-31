# 03: digisaka offers Reopen on a rejected week

**Rank:** potentially breaking, digisaka starts calling a new route and reads a new cycle status (ADR-0028). Approved by the developer 2026-10-29 (map `reopen-rejected-week`). Work lands in the digisaka repo on `bls-sample-abox-qa-integration`.

**Model:** Sonnet.

**What to build:** A week that ended in Human Review Required with reason `gate_e_rejected` shows a "Reopen this week" action. It calls the reopen route, polls the new cycle like a close does, and shows the new Selection when it finishes. A first cycle with status `reopened` reads as replaced, not as a rejection waiting for review. Refusals show their message and leave the screen as it was. The stub gains the route so the contract tests run against it.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] A rejected week shows the action; any other week does not
- [ ] Reopening starts polling and ends on the new draft Selection in the stub
- [ ] A `reopened` cycle is not offered the action again
- [ ] Each refusal code shows its message and nothing changes
- [ ] digisaka's tests and build pass
