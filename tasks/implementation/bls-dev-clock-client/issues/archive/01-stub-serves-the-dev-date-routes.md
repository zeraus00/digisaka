# 01: The stub backend serves the dev date routes

**Rank:** standard, the stub's own routes; they copy the scheduler's contract as accepted on the scheduler map.

**Model:** Sonnet.

**What to build:** The stub backend (`stub/`, port 9000) serves `GET`, `PUT` and `DELETE /api/v1/scheduler/dev/today` with the scheduler's bodies: every answer is `{today, default, pinned}`, `PUT` takes `{today}`, a bad date is `400 validation_error` in the scheduler error shape, the same Practitioner token rule as the other stub routes. The stub's own date (used for its approval period checks and the "future" check) follows the set date. The default is the stub's current constant (2026-06-08).

**Decisions:** [Set current date picker (dev only)](../../../wayfinder/bls-dev-clock-client/MAP.md), Decisions so far.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The three routes answer with the scheduler's bodies and codes; `pinned` is false at the default and true after a `PUT`
- [ ] A set date moves the stub's approval period start and the application window; `DELETE` returns to the default
- [ ] Stub route tests cover set, read, reset, a bad date and a missing token; `node --test "stub/*.test.js"` passes
