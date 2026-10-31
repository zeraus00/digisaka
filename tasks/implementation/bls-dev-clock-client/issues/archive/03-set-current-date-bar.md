# 03: A dev-only "Set current date" bar

**Rank:** standard, dev-only client UI.

**Model:** Sonnet.

**What to build:** A footer bar on every signed-in screen, apart from the week and date filters: a date input holding the effective date, `Set`, `Reset to <default>`, and a `pinned` marker. It renders only in a dev build and only when the clock store says the endpoint answered; it is hidden on 404, 401, 403 or a failure at start. A failure on `Set` or `Reset` shows one line in the bar and leaves the date unchanged. Add a line to `CLAUDE.md` that the stub keeps the three routes in step with the scheduler.

**Decisions:** [Where the control sits and when it shows](../../../wayfinder/bls-dev-clock-client/tickets/0002-where-the-control-sits-and-when-it-shows.md).

**Blocked by:** 02 (The client's date follows the server and updates live)

**Status:** ready-for-agent

- [ ] The bar is hidden when the endpoint 404s, 403s or fails, and in a production build; shown when it answers
- [ ] `Set` calls `PUT` and the screens update without a reload; `Reset` calls `DELETE`
- [ ] A failed `Set` or `Reset` shows an error line and keeps the date
- [ ] Component test for the bar; the client suite and the stub tests pass; `CLAUDE.md` updated
