# Implementation tickets: dev run mode for the next scan run

Tracer-bullet tickets for a stub-only run mode (Normal, Fail, Stuck) set from the dev bar, plus a shorter follow timeout on the stub. Local files under `issues/` (completed tickets move to `issues/archive/`), numbered in dependency order, status in each ticket's own `**Status:**` line.

Branch: digisaka, built on `monitoring-advised-card`. Local only; never merged or pushed without your go.

Source: the finished map `tasks/wayfinder/dev-run-mode/MAP.md`. Stub and dev-build client only; no scheduler or API change. Each ticket updates the README and `CLAUDE.md` lines it makes untrue, in the same commit.

## Dependency graph

| # | Ticket | Blocked by |
|---|---|---|
| 01 | The stub serves a run mode that fails or sticks the next scan run | none |
| 02 | The dev bar sets the run mode | 01 |
| 03 | The stub shortens the follow timeout | none |

03 does not touch 01 or 02, so it can run in any order.

## Waves and checkpoints

Each ticket still ends with the `implement` skill's own `/code-review`. A wave checkpoint adds a wider pass before the next wave starts. Do not start the next wave until its checkpoint is clean or the findings are ranked and dealt with (minor and standard: fix and commit; destructive or breaking: halt for the developer).

| Wave | Tickets | Checkpoint |
|---|---|---|
| 1 | 01, 03 (any order) | Inline review of the route, the settle changes, the L08 removal and the poll-limit reader; full suites; build; hand check by `curl` (Stuck holds, Normal releases) and the short timeout on the rebuilt stack |
| 2 | 02 | Inline review of `DevBar`, the run-mode store and the rename; full suites; build; hand checks in the stub app |

At each checkpoint:

- **Full suites** (not only the touched tests): `npx vitest run` in `digisaka/digisaka/client`, and from `digisaka/digisaka` `node --test "stub/*.test.js"` and `npm test` (server). Counts noted in the review record. Two stub insights tests already fail before this task (`leaf_wetness_hours`); note them as pre-existing and do not fix them here. Anything else failing blocks the checkpoint.
- **Build:** `npm run build` from `digisaka/digisaka` passes.
- **Review:** inline, over the wave's diff. Each finding ranked minor, standard or destructive or breaking, with the fix and whether it was self-decided or asked, in `decisions/code-review--dev-run-mode--wave-<n>--review.md`.
- **Hand checks** (use the `run` skill; the stack needs `up -d --build` after the compose change). Wave 1: set Stuck, scan, the run stays running; set Normal, it settles; with the stub stuck, the timeout card shows in about 20 s. Wave 2: Fail, scan, failed card, Retry, done; Stuck, scan, timeout card, switch to Normal, "Check again", done; the warn style while not Normal; against the real scheduler in dev only the date shows; two-row chip at a phone width.
- **Graph:** not needed here; the knowledge graph covers the other repo.

## Not ticketed

The page-level "Loading…" on a fresh line, shortening production polling, any real scheduler route, and a mount-based test library.

## Known risks

- The stub route has no live check; the contract test in ticket 02 is its only check against the client.
- A hidden browser tab slows the follow's timers, so the short timeout takes longer there.
