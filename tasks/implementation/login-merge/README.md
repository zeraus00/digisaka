# Implementation tickets: Toka AI login redesign by merge

One ticket that lands the redesigned sign-in page from `fork/admin_login_ui` (four commits by Daina Parducho) by merging her branch, so her commits and hashes are preserved, then removing what we do not want. Local files under `issues/` (completed tickets move to `archive/`).

Branch: `login-merge`, built on `scheduler-reactive-suggestions-tickets`. Local only; never pushed without the human developer's go signal.

## Dependency graph

| # | Ticket | Blocked by |
|---|---|---|
| 01 | Merge the Toka AI sign-in page | none |

## Not ticketed

The other web branches (`web/admin/overview`, `web/admin/reactodia`, `web/user/dashboard`) and the mobile chain. The Toka AI rebrand outside the sign-in page belongs to the dashboard branch.

## Known gap

The sign-in page says "Toka AI" while the rest of the app still says Digisaka until the dashboard branch is brought over.
