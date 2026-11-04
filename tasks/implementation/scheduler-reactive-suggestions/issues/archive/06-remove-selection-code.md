# 06: The Selection code and its tests are gone

**Rank:** standard, removing client code the contract no longer serves.

**Model:** Sonnet

**What to build:** Delete the Selection store and its tests, the cycle store's close and reopen paths, and any stub route or fixture still serving the removed scheduler routes; the dev-date routes and Line Insights stay (they live beside the Selections in `stub/selections.js`). Also delete the client code the new screens no longer reach: `AlertWhy.vue`, `approveState`, `groupAlerts`, `causeLabel`, `ACK_MEANING`, the selection error messages, and the schedule list screens still reading `selections` (`weekRows`, `withSelections`). Update this repository's CLAUDE.md to record the widened integration scope (QA and scheduler screens) and the removed approval flow, and the README, FLOW and API documents where they describe approval.

**Blocked by:** 03, 04 and 05 (the treatment screen, the scan screen and the calendar marks)

**Status:** ready-for-agent

- [x] No source file references the Selection store, approval, rejection, renewal, reopen or close week
- [x] None of the unreachable approval-flow code named above remains
- [x] The client build and all tests pass; `DevDateBar` still works on the stub
- [x] A manual run against the real scheduler passes the screens (the acceptance gate in CLAUDE.md)
- [x] CLAUDE.md, README, FLOW and API describe the suggestion flow
