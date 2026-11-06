// Line Insights: the read-outs for one line and week. The scheduler computes them; here a frozen copy of a payload
// is served with the line and week laid over it: the one with a cycle when the line has a cycle for that week, the
// one before any cycle otherwise. shortcut: the series, history and outlook are fixed, not derived from the seed,
// the stub proves the frontend against the contract, the manual run against the real scheduler is the gate.
import { readFileSync } from 'node:fs';
import { BASE, TODAY, fail, ok, authed, isValidWeek, shiftWeek, readEnd } from './common.js';

const load = (name) => JSON.parse(readFileSync(new URL(`./payloads/line-insights.${name}.json`, import.meta.url), 'utf8'));
const PAYLOADS = { cycle: load('cycle'), none: load('no-cycle') };

export { shiftWeek };

// The rules' reading of the series' latest week: the disease trend over its last three weeks (a lower leaf number is
// a younger leaf, so a falling number is progress of the disease) and the functional-leaf bands. Empty when the week has no record.
function readingsFor(series, frozen) {
  const last = series.at(-1);
  if (last.yls === null && last.functional_leaves === null) return [];
  const out = [];
  const window = series.slice(-3).filter((w) => w.yls !== null);
  if (window.length > 1) {
    const [a, b] = [window[0], window.at(-1)], span = series.indexOf(b) - series.indexOf(a);
    const yli = a.yli !== null && b.yli !== null ? `; YLI leaf ${a.yli} to leaf ${b.yli}` : '';
    out.push({ rule: 'R1 Disease trend', finding: b.yls < a.yls ? 'Disease is progressing' : 'Disease is not progressing', text: `YLS leaf ${a.yls} to leaf ${b.yls} over ${span} weeks${yli}. A lower number means a younger leaf.`, source: null, sample_fact: false });
  }
  const n = last.functional_leaves;
  if (n !== null && n < frozen.functional_leaves_threshold) {
    out.push({ rule: 'R3 Functional leaves', finding: 'Few functional leaves', text: `Functional leaves ${n}, below the ${frozen.functional_leaves_threshold}-leaf threshold.`, source: null, sample_fact: false });
    out.push({ rule: 'R7 Canopy critical', finding: 'Canopy critical', text: `Functional leaves ${n}, below the ${frozen.functional_leaves_threshold}-leaf canopy band.`, source: null, sample_fact: false });
  }
  return out;
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
      // The series is the window of weeks ending at the read end (the asked week's Last finished week, capped at today's),
      // read from the line's weekly records (the dataset copy in the seed); the asked week has no entry. The readings are
      // derived from the same series, and are blank when its last week has no record.
      const end = readEnd(params.week, store.data.devToday ?? TODAY);
      const last = frozen.series.length - 1;
      const record = (week) => line.records.find((r) => r.week === week);
      const series = frozen.series.map((_, i) => {
        const week = shiftWeek(end, i - last), r = record(week);
        const leaves = r?.functional_leaves ?? null;
        return { week, yli: r?.yli ?? null, yls: r?.yls ?? null, functional_leaves: leaves, leaves_at_shooting: r?.leaves_at_shooting ?? null, rainfall_mm: r?.rainfall_mm ?? null, leaf_wetness_hours: r?.leaf_wetness_hours ?? null, canopy_status: leaves === null ? null : leaves >= frozen.functional_leaves_target ? 'ok' : leaves >= frozen.functional_leaves_threshold ? 'watch' : 'critical' };
      });
      const body = { ...frozen, line_id: params.id, week: params.week, series, readings: readingsFor(series, frozen) };
      return ok(body);
    }),
  }];
}
