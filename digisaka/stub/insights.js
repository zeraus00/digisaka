// Line Insights: the read-outs for one line and week. The scheduler computes them; here a frozen copy of a payload
// is served with the line and week laid over it: the one with a cycle when the line has a cycle for that week, the
// one before any cycle otherwise. shortcut: the series, history and outlook are fixed, not derived from the seed,
// the stub proves the frontend against the contract, the manual run against the real scheduler is the gate.
import { readFileSync } from 'node:fs';
import { BASE, fail, ok, authed, isValidWeek } from './common.js';

const load = (name) => JSON.parse(readFileSync(new URL(`./payloads/line-insights.${name}.json`, import.meta.url), 'utf8'));
const PAYLOADS = { cycle: load('cycle'), none: load('no-cycle') };

export function insightsRoutes(store, { settleAll }) {
  return [{
    method: 'GET', path: `${BASE}/lines/:id/weeks/:week/insights`,
    handle: authed(({ params }) => {
      settleAll();
      const line = store.data.lines[params.id];
      if (!line) return fail(404, 'unknown_line', `No line ${params.id}`);
      if (!isValidWeek(params.week)) return fail(422, 'invalid_week', `${params.week} is not a week key`);
      const frozen = line.cycles.some((c) => c.week === params.week) ? PAYLOADS.cycle : PAYLOADS.none;
      return ok({ ...frozen, line_id: params.id, week: params.week });
    }),
  }];
}
