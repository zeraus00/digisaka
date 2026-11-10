# 02: Stub: stage-6 alert and an active `mechanical` insight

**Rank:** standard. Stub and tests only; the screens already render both.

**Model:** Sonnet

**What to build:** Two new things the scheduler can now serve, shown in the stub so the screens and tests cover them.

- **Stage-6 alert.** A line whose most severe confirmed stage this week is 6 gets one extra line-level alert in the suggestion's `alerts`: kind `stage_basis`, id `line:stage_basis:stage_6`, level `warning` (`info` when the run is Continue Monitoring), `unit_id` null, `blocks_approval` false. Text, shown as given: "The data suggests some of the leaves scanned this week are at stage 6, past the point a fungicide protects them; removing the affected leaves may be advised." No new alert kind: the screen already renders `stage_basis` alerts. The fungicide list does not change because of it. `stub/suggestions.js` adds this alert for a stage-6 line; a stub test asserts it (and that a stage-5 line has none).
- **`mechanical` insight.** The insights `mechanical` action kind ("removing diseased leaves") can now be active: the scheduler turns it on when a sample rule advises mechanical management (critical progression or reduced canopy). The API shape is unchanged. Stub tests and payloads that assert it is always inactive (`stub/insights.test.js`, `stub/payloads/line-insights.*.json`) need a case where it is active; the screen shows it like the other kinds.

**Blocked by:** The scheduler tickets "R12 mechanical management advice" and "Stage-6 alert advising leaf removal" (in the AI_NeSy_Framework repo, `tasks/implementation/indicator-driven-eligibility/issues/01-r12-mechanical-management-advice.md` and `05-stage-6-leaf-removal-alert.md`).

**Status:** ready-for-agent

- [ ] The stub serves the stage-6 alert for a stage-6 line and none for stage 5, with the fields above
- [ ] A stub insights payload has `mechanical` active, and the insights test covers active and inactive
- [ ] The screen renders both without a screen code change (if one is needed, note it in the ticket and keep it small)
- [ ] The stub tests and the screen contract tests pass
