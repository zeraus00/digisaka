# Implementation tickets: Weather, Spray Log and Fungicides as steps of the treatment screen

Tracer-bullet tickets for giving the treatment review's four steps one home, the treatment screen (`/treatment/:lineId/:week`), and handing a scan off to it. Local files under `issues/` (completed tickets move to `issues/archive/`), numbered in dependency order, status in each ticket's own `**Status:**` line.

Branch: digisaka, built on `monitoring-advised-card`. Local only; never merged or pushed without your go.

Source: the finished map `tasks/wayfinder/treatment-steps/MAP.md` and its approved `prototype.html`. All client work; no scheduler, stub or API change.

## Dependency graph

| # | Ticket | Blocked by |
|---|---|---|
| 01 | The treatment screen gets four step tabs | none |
| 02 | A scan hands off to the treatment screen | 01 |

A straight line: no two tickets can run in parallel, so each wave below is one checkpoint, not a fan-out.

## Waves and checkpoints

Each ticket still ends with the `implement` skill's own `/code-review`. A wave checkpoint adds a wider pass before the next wave starts. Do not start the next wave until its checkpoint is clean or the findings are ranked and dealt with (minor and standard: fix and commit; destructive or breaking: halt for the developer).

| Wave | Tickets | Checkpoint |
|---|---|---|
| 1 | 01 | Inline review of the tabs, the `step` helper, the split screen and the new icons; full suites; build; hand check of the existing links and the 390px row |
| 2 | 02 | Inline review of the hand-off, the scan store `step`, the run following and the Spray Log update card; full suites; build; hand check of all five entry points and the unmount order mid-run |

At each checkpoint:

- **Full suites** (not only the touched tests): `npx vitest run` in `digisaka/digisaka/client`, and from `digisaka/digisaka` `node --test "stub/*.test.js"` and `npm test` (server). Counts noted in the review record. Two stub insights tests already fail before this task (the stub's expected series omits `leaf_wetness_hours`); note them as pre-existing and do not fix them here. Anything else failing blocks the checkpoint.
- **Build:** `npm run build` from `digisaka/digisaka` passes.
- **Review:** inline, over the wave's diff. Each finding ranked minor, standard or destructive or breaking, with the fix and whether it was self-decided or asked, in `decisions/code-review--treatment-steps--wave-<n>--review.md`.
- **Graph:** not needed here; the knowledge graph covers the other repo.

## Not ticketed

A product deep link and per-step child routes, any redesign of the fungicide list, the record form or the line summary panel, the "Coming soon" tiles, leaf wetness, and a mount-based test library.

## Known risks

- Ticket 02 relies on the scan screen being removed before the treatment screen mounts (otherwise its stop would cut off the new follow). The hand check mid-run confirms it; if it fails, stop and take it to the developer.
- The icon-only tabs lean on the pill's name, tooltip and the heading under the tabs. If the three new icons read unclearly at 390px on the hand check, take it to the developer instead of adding labels.
