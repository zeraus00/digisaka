# 04: Scanning ends in an updating suggestion, not in closing the week

**Rank:** standard, the shape is fixed by the API contract decision (developer-approved exception); changing what a screen does is within the pivot's agreed screen changes.

**Model:** Sonnet

**What to build:** The scan screen's last step no longer closes the week and no longer offers reopening. After a symptom confirmation, a non-null `reschedule` shows an updating state that polls the suggestion until the new revision is ready, then links to it; a null `reschedule` says the line stage is unchanged and links to the current suggestion.

**Blocked by:** 02 The client holds a line's suggestion and records against it

**Status:** ready-for-agent

- [ ] No "Confirm & Schedule" or "Reopen this week" control remains
- [ ] A scan with `reschedule` set shows the updating state, then a link to the new suggestion
- [ ] A scan with `reschedule: null` links to the current suggestion with the unchanged message
- [ ] Screen tests pass
