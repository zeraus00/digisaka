# 01: The Treatment screen shows the assessment note

**Rank:** breaking. The screen starts to read a new field of the scheduler's suggestion response (the frontend/API contract).

**What to build:** On a line with Continue monitoring, the Treatment screen shows Canopy watch and Aggressive progression under "What is driving the assessment" with nothing that links them to the outcome. The banner reason is the generic "Treatment not yet warranted by the latest week's data and the current rules." Users read the two findings as a cause for concern.

The scheduler (AI_NeSy_Framework, task `assessment-note`, ticket 01) now serves, on the suggestion response, the requirement's conditions (each met / not met / cannot check), each fired finding tagged `trigger` or `context`, and one note that joins them. Show it:

- The banner's reason line shows the note instead of the generic outcome-reason text. When the field is absent, keep today's text.
- In the Weather card, "What is driving the assessment" separates findings that trigger treatment from those that are context only, with the requirement's conditions and their results beside them, so "Canopy watch" is never shown as a trigger. Rename the heading if it no longer fits.
- The screen shows the note and tags as served. It sets no verdict and builds no text of its own.

The note may be the template or a model rewording (scheduler ticket 02); the screen does not care which.

**Blocked by:** AI_NeSy_Framework `tasks/implementation/assessment-note/issues/01-scheduler-serves-the-assessment-note.md` (the field must exist in the scheduler and in the stub backend).

**Status:** ready-for-agent

- [ ] L14 (Continue monitoring, both findings context) shows the note in the banner and the two findings under a context-only label, with Possible progression and Infection risk shown as not met.
- [ ] A line whose requirement fired (L30, L25) shows the triggering findings as triggers.
- [ ] A response without the new field renders as today (no error).
- [ ] The stub backend and its contract test serve and check the new field.
- [ ] Component tests cover the three cases above; build and lint clean.
