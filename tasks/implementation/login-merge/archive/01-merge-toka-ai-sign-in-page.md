# 01: Merge the Toka AI sign-in page

**Rank:** standard. One view is replaced and the auth logic is untouched; a dry-run merge into this stack is clean. It does not touch the frontend/API contract, migrations, Fuseki or `reset`/`bootstrap`. No history is rewritten: the merge is local and nothing is pushed.

**What to build:** A visitor opens the sign-in page and sees the redesigned Toka AI page: a promotional panel beside the form, the staggered entrance animation, a show/hide control on the password field, and a layout that holds up on a narrow screen. Signing in behaves exactly as today: a wrong password shows a clear message, a Practitioner and a Technical User each land where the route guard sends them, and a safe `next` target is honoured. The page arrives by merging `fork/admin_login_ui` with a merge commit, so her four commits and their hashes stay in this branch's history. A follow-up commit then removes the parts we do not want, and a second follow-up commit applies the fixes already found in review.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] `fork/admin_login_ui` is an ancestor of the branch, merged with a merge commit (no squash, no rebase), and her four commits keep their original hashes and authors.
- [x] A separate commit removes what the merge brought but we do not want: the two design-reference HTML mockups, the unused image, the long design log appended to the README, and the lockfile flag-only changes. Only the two images the page imports remain added. The README ends up as the stack's README without the design log.
- [x] A separate commit, after the removal, applies the review fixes: the dead Remember me checkbox and its styles are gone; the email field says "Email" and the password field says "Password"; the entrance stagger applies to both form groups; the dead media-query selector is gone; the page inherits the app font instead of an unloaded one; the password toggle shows a focus ring when focused by keyboard.
- [x] The page matches the redesign on the stub stack: promo panel, form, entrance animation, password toggle, and the compact layout on a narrow viewport. The animation is shortened or skipped under the reduced-motion setting, and fields are usable by keyboard with labels.
- [x] Sign-in outcomes are unchanged: a Practitioner lands on the practitioner shell and a Technical User on the admin side, a bad password shows the error, and a `next` target is honoured only when safe. Verified live on the stub and on the real backends, and against the existing route-guard tests.
- [x] The promo copy makes no mention of approving, rejecting or renewing; it fits the suggestion-only flow.
- [x] The client test suite and the client build pass.
- [x] CLAUDE.md still matches the tree (update it in this branch only if something it describes changed).
