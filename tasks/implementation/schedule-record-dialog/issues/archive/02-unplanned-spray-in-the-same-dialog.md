# 02: An unplanned spray is recorded in the same dialog

**Rank:** standard: client only; it uses the same record call as the page-level form it replaces, no API shape changes.

**Model:** Sonnet

**What to build:** The Schedule screen's header gets a "Record a spray" button that opens the same dialog as ticket 01, with no step: product, an optional partner and the date (not in the future), main button "Record spray". It replaces the page-level "Record another spray" form and its link. The unplanned view is in `tasks/wayfinder/schedule-record-dialog/prototype.html` ("Unplanned spray").

- **Same behaviour.** The flagged-pick confirmation and the earlier-steps choice show inside the dialog as in ticket 01; a spray linked to no step records exactly as the page form did.
- **One dialog.** The unplanned view reuses ticket 01's dialog component, not a second one.
- **Old form gone.** The page-level form, its link and its state are removed.

**Blocked by:** 01: A timeline step's actions open in one dialog.

**Status:** ready-for-agent

- [ ] Test at the screen: Record a spray records the chosen product, partner and date with no step link; a flagged pick and an earlier open step confirm inside the dialog
- [ ] The page-level "Record another spray" form and its link are removed, and nothing else references them
- [ ] By hand in the stub app: header button at desktop and phone width (360px)
- [ ] The client, stub and server tests and the build pass
