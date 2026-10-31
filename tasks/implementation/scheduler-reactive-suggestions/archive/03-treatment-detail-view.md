# 03: The treatment screen shows ranked suggestions and always lets the practitioner record

**Rank:** standard, the shape is fixed by the API contract decision (developer-approved exception); changing what a screen does is within the pivot's agreed screen changes.

**Model:** Sonnet

**What to build:** The treatment detail screen loses its approval, rejection and renewal controls. The header shows the basis label, the "what changed" note when present and an updating marker while `running`. The body shows the recommended, eligible and excluded groups with each unit's alerts and a needs-confirmation mark, the other guidance, and the calendar. The record form is always shown; its list holds every unit of the three groups with excluded ones marked; it submits unconfirmed, and a `confirmation_required` answer opens the existing "Record anyway" panel with the returned alerts, then resubmits confirmed.

**Blocked by:** 02 The client holds a line's suggestion and records against it

**Status:** ready-for-agent

- [ ] No approval, rejection or renewal control remains
- [ ] The three groups, the basis label and the note render from the stub
- [ ] Recording a recommended unit with no alerts succeeds without a panel
- [ ] Recording an excluded unit opens "Record anyway" with its alerts and succeeds after confirming
- [ ] An updating marker shows while `running` and clears on the new revision
- [ ] Screen tests pass
