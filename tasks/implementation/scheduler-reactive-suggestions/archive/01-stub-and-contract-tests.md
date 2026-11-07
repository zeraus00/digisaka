# 01: The stub serves the new scheduler contract

**Rank:** standard, the shape is fixed by the API contract decision (developer-approved exception to the repo rule); a field or error the contract lacks makes this ticket breaking: stop and re-rank.

**Model:** Sonnet

**What to build:** The stub server implements the contract in the README: the suggestion read with the three groups, a basis label, a "what changed" note and a `running` flag that turns false after a short delay; the line-level record route with `product_not_offered` and `confirmation_required` (excluded units and units with their own alerts need `confirmed: true`; a stale `revision` is refused with the current one); `reschedule` on the scan responses; and `runs` on the week read. The removed routes answer 404. The contract tests change first and describe each response. The stub keeps serving the scheduler's dev-date routes (`GET|PUT|DELETE /dev/today`, today in `stub/selections.js`) and the Line Insights payloads unchanged; a rename of that file moves them with it. The README contract is the source (the scheduler is reached over HTTP, never by reading its code); the stub can drift from the real service, so the manual run against the real scheduler stays the acceptance gate.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The stub answers every route of the contract with the fields listed in the README
- [ ] A record of an excluded unit without `confirmed: true` answers `confirmation_required` with the unit's tier and alerts
- [ ] A stale revision is refused with the current one
- [ ] The removed routes answer 404
- [ ] The dev-date routes and Line Insights still answer as before (their tests pass)
- [ ] The contract tests cover each case and pass
