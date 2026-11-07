# Implementation tickets: trend toggle for the weekly charts

Tracer-bullet tickets for the toggle on the weekly charts (Line insights at Scan step 1, cycle evidence at Scan step 3) and the new Leaves view. Local files under `issues/` (completed tickets move to `archive/`), numbered in dependency order, status in each ticket's own `**Status:**` line.

Branch: `dashboard-merge` in digisaka. Local only; never merged or pushed without your go.

Source: the finished map `tasks/wayfinder/scan-trend-toggle/MAP.md`. All client work; no scheduler or API change.

## Dependency graph

| # | Ticket | Blocked by |
|---|---|---|
| 01 | The weekly charts get a trend toggle | none |
| 02 | The Leaves view on Line insights | 01 |
| 03 | The Leaves view on the cycle evidence at Scan step 3 | 02 |

A straight line: no two tickets can run in parallel, so each wave below is one checkpoint, not a fan-out.

## Waves and checkpoints

Each ticket still ends with the `implement` skill's own `/code-review`. A wave checkpoint adds a wider pass before the next wave starts. Do not start the next wave until its checkpoint is clean or the findings are ranked and dealt with (minor and standard: fix and commit; destructive or breaking: halt for the developer).

| Wave | Tickets | Checkpoint |
|---|---|---|
| 1 | 01 | Inline review of the toggle, its helpers and the combined All chart; full suites; build; a look at the phone width (360px) |
| 2 | 02, 03 | Inline review of the Leaves view, the join and the step 3 load; full suites; build; hand check of step 1 to step 3 in the stub app |

At each checkpoint:

- **Full suites** (not only the touched tests): `npx vitest run` in `digisaka/digisaka/client`, and from `digisaka/digisaka` `node --test "stub/*.test.js"` and `npm test` (server). All green, with the counts noted in the review record.
- **Build:** `npm run build` from `digisaka/digisaka` passes.
- **Review:** inline, over the wave's diff. Each finding ranked minor, standard or destructive or breaking, with the fix and whether it was self-decided or asked, in `decisions/code-review--scan-trend-toggle--wave-<n>--review.md`.
- **Graph:** not needed here; the knowledge graph covers the other repo.

## Not ticketed

Remembering the pick across screens or reloads, a mount-based test library, any scheduler or stub payload change, a change to the canopy bar, and the Dashboard charts.

## Known risk

The All chart has up to four series on one phone-width chart. Ticket 01 ends with a look at 360px with five weeks and crossing values; if it fails there, stop and take it to the developer rather than switching layout.
