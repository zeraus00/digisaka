# 01: Merge the fork dashboard branch

**Rank:** standard: a local merge commit with the decided resolution (no history rewrite); the `git merge` itself still waits for the developer's go signal (project rule).

**Model:** Sonnet

**What to build:** A new `dashboard-merge` branch on top of `login-merge` takes the fork branch `web/user/dashboard` by a plain `--no-ff` merge, keeping its hashes, with the per-file resolution the merge ticket decided: conflicting views stay ours, `lineHistory`/`LineHistory.vue` stay ours, the prototype catalog (stub routes, store and their tests) is deleted in the merge, `bananaleaf2.png` is kept. A follow-up commit moves the nine design mockups under `tasks/` as design references, removes the README's treatment-prototype line, and removes the profile page, its route and its "My Profile" link. The new journey components stay unmounted, so nothing a user sees changes yet.

**Decisions:** [Merge resolution and a green merge commit](../../../wayfinder/dashboard-merge/tickets/0001-merge-resolution-and-a-green-merge-commit.md)

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `dashboard-merge` exists with a merge commit whose second parent is the fork branch tip
- [ ] Build, client, stub and server tests pass at the merge commit and after the follow-up
- [ ] No module reads the prototype catalog; no `/profile` route or link remains
- [ ] The mockups live under `tasks/`, not `client/src/assets/`
