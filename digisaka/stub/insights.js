// Line Insights: the read-outs for one line and week. The scheduler computes them; here a frozen copy of a payload
// is served with the line and week laid over it: the one with a cycle when the line has a cycle for that week, the
// one before any cycle otherwise. shortcut: the series, history and outlook are fixed, not derived from the seed,
// the stub proves the frontend against the contract, the manual run against the real scheduler is the gate.
import { readFileSync } from 'node:fs';
import { BASE, fail, ok, authed, isValidWeek } from './common.js';

const load = (name) => JSON.parse(readFileSync(new URL(`./payloads/line-insights.${name}.json`, import.meta.url), 'utf8'));
const PAYLOADS = { cycle: load('cycle'), none: load('no-cycle') };

// The ISO week key `n` weeks from `week` (n may be negative), through the Thursday that names a week's year.
export function shiftWeek(week, n) {
  const [y, w] = week.split('-W').map(Number);
  const mondayOf = (year) => { const j4 = new Date(Date.UTC(year, 0, 4)); j4.setUTCDate(j4.getUTCDate() - ((j4.getUTCDay() + 6) % 7)); return j4; };
  const mon = mondayOf(y); mon.setUTCDate(mon.getUTCDate() + (w - 1 + n) * 7);
  const thu = new Date(mon); thu.setUTCDate(mon.getUTCDate() + 3);
  const year = thu.getUTCFullYear();
  return `${year}-W${String(Math.round((mon - mondayOf(year)) / 604800000) + 1).padStart(2, '0')}`;
}

export function insightsRoutes(store, { settleAll }) {
  return [{
    method: 'GET', path: `${BASE}/lines/:id/weeks/:week/insights`,
    handle: authed(({ params }) => {
      settleAll();
      const line = store.data.lines[params.id];
      if (!line) return fail(404, 'unknown_line', `No line ${params.id}`);
      if (!isValidWeek(params.week)) return fail(422, 'invalid_week', `${params.week} is not a week key`);
      const frozen = line.cycles.some((c) => c.week === params.week) ? PAYLOADS.cycle : PAYLOADS.none;
      // The series is the window of weeks ending at the asked week, read from the line's weekly records (the dataset
      // copy in the seed); the readings text stays the frozen copy's, and is blank when the asked week has no record.
      const last = frozen.series.length - 1;
      const record = (week) => line.records.find((r) => r.week === week);
      const series = frozen.series.map((_, i) => {
        const week = shiftWeek(params.week, i - last), r = record(week);
        const leaves = r?.functional_leaves ?? null;
        return { week, yli: r?.yli ?? null, yls: r?.yls ?? null, functional_leaves: leaves, leaves_at_shooting: r?.leaves_at_shooting ?? null, rainfall_mm: r?.rainfall_mm ?? null, leaf_wetness_hours: r?.leaf_wetness_hours ?? null, canopy_status: leaves === null ? null : leaves >= frozen.functional_leaves_target ? 'ok' : leaves >= frozen.functional_leaves_threshold ? 'watch' : 'critical' };
      });
      const body = { ...frozen, line_id: params.id, week: params.week, series, readings: record(params.week) ? frozen.readings : [] };
      return ok(body);
    }),
  }];
}
