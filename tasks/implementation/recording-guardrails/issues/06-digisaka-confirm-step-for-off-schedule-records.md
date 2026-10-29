# 06: digisaka asks for confirmation before recording off the schedule

**Rank:** potentially breaking, digisaka starts sending `confirmed_off_schedule` and reading `409` warnings and `acknowledged_warnings` (ADR-0028). Approved by the developer 2026-10-29 (map `recording-guardrails`). Work lands in the digisaka repo on `bls-sample-abox-qa-integration`.

**Model:** Sonnet.

**What to build:** When recording an application answers `409 application_off_schedule`, the treatment detail view lists the warnings and asks the user to confirm. Confirming re-sends the same record with `confirmed_off_schedule: true`; cancelling leaves nothing recorded. Other errors keep their current handling. Check first how the client uses `ApplicationView`, so the new `acknowledged_warnings` field does not break its parsing, and show the stored warnings where the record is shown if that fits the existing view.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] An off-schedule record shows the warnings and a confirm and a cancel action
- [ ] Confirm re-sends with `confirmed_off_schedule: true` and the record appears; cancel records nothing
- [ ] Other `409` codes and errors behave as before
- [ ] Stub payloads and the stub-contract tests cover the `409` warnings and `acknowledged_warnings`
- [ ] digisaka's tests and build pass
