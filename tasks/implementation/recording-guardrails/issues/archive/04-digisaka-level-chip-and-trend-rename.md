# 04: digisaka shows the level verdict and renames the trend chip

**Rank:** potentially breaking, digisaka's contract with the scheduler evidence payload changes (ADR-0028). Approved by the developer 2026-10-29 (map `recording-guardrails`, ticket 0001). Work lands in the digisaka repo on `bls-sample-abox-qa-integration`.

**Model:** Sonnet.

**What to build:** The evidence charts replace "Disease getting worse" with a trend chip, "YLS is falling: yes/no", read from `falling`, and add a level chip read from `level.verdict` with the thresholds in its text (for example "critical, below 6"). The client wording for the `disease_not_worsening` reason becomes "YLS is not below 8 and not falling"; reason codes are unchanged. A `"not_computable"` trend reads as unknown, not "no".

**Blocked by:** 03 (the scheduler fields must exist)

**Status:** ready-for-agent

- [ ] A flat YLS 5 line shows "YLS is falling: no" and a level chip reading critical
- [ ] A not-computable trend shows an unknown state, not "no"
- [ ] Stub payloads carry `falling` and `level`; the stub-contract tests pass against the scheduler's committed OpenAPI shape
- [ ] The `disease_not_worsening` wording is updated
- [ ] digisaka's tests and build pass
