# Implementation tickets: 8 weeks always on the weekly charts

Follow-up to `scan-trend-toggle`. The weekly charts on Line insights (Scan step 1) and the cycle evidence (Scan step 3) draw a constant 8 consecutive weeks from the insights series, as the prototype keeps a constant number of weeks. All client work; no scheduler or API change. Supersedes the "last 3 weeks plus the compared weeks" choice of scan-trend-toggle ticket 01.

Local files under `issues/` (completed tickets move to `archive/`). Branch: `monitoring-advised-card` in digisaka. Local only; never merged or pushed without your go.

| # | Ticket | Blocked by |
|---|---|---|
| 01 | The Line insights charts always show 8 weeks | none |
| 02 | The Scan evidence charts always show 8 weeks | 01 |

A straight line in one wave: 01 then 02, one checkpoint after 02.

## Wave and checkpoint

Each ticket still ends with the `implement` skill's own `/code-review`, ranked and recorded in `decisions/code-review--trend-eight-weeks--<ticket>--review.md`. Minor and standard findings are fixed and committed; a destructive or breaking one halts for the developer.

| Wave | Tickets | Checkpoint (after 02) |
|---|---|---|
| 1 | 01, 02 | Inline review of both screens together; full suites; build; hand check of Scan step 1 to step 3 in the stub app on a line with a gap week, 8 weeks at phone width (360px) |

At the checkpoint run the **full suites**, not only the touched tests: `npx vitest run` in `digisaka/digisaka/client`, and from `digisaka/digisaka` `node --test "stub/*.test.js"` and `npm test` (server). All green, with the counts noted in the review record.

Run: `/implement tasks/implementation/trend-eight-weeks/issues/01-line-insights-charts-show-eight-weeks.md`
