# 01: The stub serves a run mode that fails or sticks the next scan run

**Rank:** standard: stub only; no real scheduler route or shape changes.

**Model:** Sonnet

**What to build:** The stub answers `GET|PUT /api/v1/scheduler/dev/run-mode` with `{ mode }`, where mode is `normal`, `fail` or `stuck`; it needs the Practitioner token like the dev date, and any other value answers 400 `validation_error`. The mode is one value for the whole stub, kept until changed, and a stub reset puts it back to Normal. It applies to runs started by a verified scan only; runs started by recording an application keep their line's plan.

- **Fail:** the scan's run fails on its first attempt and Retry succeeds, on any line (as L06 does today).
- **Stuck:** the scan's run never settles and blocks its line while the mode stays Stuck. Setting another mode lets that run settle as a normal run on the next read. A stub reset also ends it.
- **L08 goes.** Remove its seed line and its stuck plan; the stub then has seven lines. L06's first-attempt failure stays as it is. The route is stub-only: the real scheduler gets nothing.
- **Docs.** The README "Run it on the stub" line list drops L08 and a *Run mode* bullet describes the route and the three modes; `CLAUDE.md`'s stub paragraph names the route and drops L08; the code comments on the run plans and the seed follow.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Route tests: default `normal`; each mode set and read back; a bad value answers 400; no token answers 401
- [ ] Settle tests on a default-plan line: Fail fails the first scan run and Retry succeeds; Stuck stays running past the cycle time; setting Normal lets it settle done; with Fail set, an application run settles done; reset restores Normal
- [ ] The L08 test is replaced by the Stuck test; the L06 test stays; the seed-line tests expect seven lines; `scheduler-read.contract.test.js` expects seven lines (`lines: 7`)
- [ ] Stub and client tests pass; the two pre-existing insights failures are noted
- [ ] By hand with `curl` on the running stub: set Stuck, scan a line, the run stays running; set Normal, the run settles
