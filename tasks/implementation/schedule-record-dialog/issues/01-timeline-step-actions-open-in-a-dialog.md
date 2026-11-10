# 01: A timeline step's actions open in one dialog

**Rank:** standard: client only; the same record, skip and confirmation calls as today, no API shape changes.

**Model:** Sonnet

**What to build:** On the Schedule screen, a timeline entry that can be acted on shows one button, "Record or skip", instead of Record, Choose something different, the reason dropdown and Skip. The button opens a centred dialog (centred box at every screen size, a scrim behind, Esc and a scrim click close it, it scrolls inside when tall). The look and every state is in `tasks/wayfinder/schedule-record-dialog/prototype.html`; follow it.

- **Planned view (default).** Shows the step's product and partner, its group and window. The date defaults to today and cannot be in the future. The main button is "Record planned". A partnered step shows the partner picker, the planned partner first, a mark informs and never disables. "Choose something different" is a secondary button; "Skip this step" is a quiet link.
- **Choose another.** The plan block is replaced by a product list, the same group first, with the excluded mark as today. The main button is "Record". "Back to the plan" returns.
- **Skip.** The optional reason is chosen inside the dialog, then "Skip step". The reason dropdown leaves the card.
- **Confirmations inside the dialog.** The flagged-pick confirmation and the "earlier steps are still open" choice (skip them all, or record them first) show inside the dialog in place of the buttons, as the page-level form shows them today. That page-level step form, below the timeline, is removed.
- **Card.** "Undo skip" stays on the card. Past, skipped and monitoring entries get no button.
- **Busy and errors.** While a call runs the dialog's buttons are disabled; a failed call shows the same error the screen shows today and keeps the dialog open.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Test at the screen: Record planned records the step's own product (and its partner) on the chosen date; Choose something different records another product, same group first; Skip records the reason or none; Undo skip still works from the card
- [ ] Test: a flagged pick and an open earlier step each show their confirmation inside the dialog, and the choices call the same actions as before
- [ ] Test: the dialog closes on Esc, on a scrim click and after a successful call; it stays open on a failed call
- [ ] The old step form below the timeline and its now-unused state are removed, and nothing else references them
- [ ] By hand in the stub app: each state of the prototype at desktop and phone width (360px), no horizontal scroll
- [ ] The client, stub and server tests and the build pass
