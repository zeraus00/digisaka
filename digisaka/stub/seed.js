import { readFileSync } from 'node:fs';
import { shiftWeek } from './insights.js';

// Fixed seed for the stub scheduler. "Today" is 2026-06-15 (week 25), matching the app; a cycle reads up to the week before its own. Each line is a named
// scenario; the data decides what happens, nothing is switched. Weekly values are null where the
// real feed would have a gap. `evidence` is the rules' reading of a cycle, null for a cycle with no trend stage.
const wk = (week, yls, yli, rainfall_mm) => ({ week, yls, yli, rainfall_mm });

// The scheduler's synthetic weekly dataset (L01 to L23, weeks W16 to W24, the Last finished week of the app's today), copied from its demo data:
// `payloads/synthetic-weekly.json`. A line's chart weeks and Line Insights readings come from it; `name` is not served.
const WEEKLY = JSON.parse(readFileSync(new URL('./payloads/synthetic-weekly.json', import.meta.url), 'utf8'));
const weekly = (id) => ({ name: WEEKLY[id].name, weeks: WEEKLY[id].weeks.map((r) => wk(r.week, r.yls, r.yli, r.rainfall_mm)), records: WEEKLY[id].weeks });

// The rules' reading of a cycle, derived from the line's weekly records at the cycle's Last finished week (the week
// before its own): YLS over the three weeks ending there (a lower leaf number is worse), and rainfall over the two weeks before the two before those.
// shortcut: a missing record counts as 0 mm and breaks the trend; the seeded lines have no gaps at their cycle weeks.
const evidenceAt = (id, cycleWeek) => {
  const week = shiftWeek(cycleWeek, -1);
  const records = WEEKLY[id].weeks;
  const at = (n) => records.find((r) => r.week === shiftWeek(week, n));
  const yls = [-2, -1, 0].map((n) => at(n)?.yls);
  let run = 0;
  for (let i = 2; i > 0 && yls[i] < yls[i - 1]; i--) run++;
  const mm = (ns) => ns.reduce((t, n) => t + (at(n)?.rainfall_mm ?? 0), 0);
  const recent = mm([-1, 0]), previous = mm([-3, -2]), wet = at(0)?.leaf_wetness_hours;
  const met = (ok) => (ok ? 'met' : 'not_met');
  const conditions = [
    { id: 'c1', label: 'Rainfall rising over two weeks', verdict: met(recent > previous), missing: null },
    { id: 'c2', label: 'Rainfall above 0 mm over two weeks', verdict: met(recent > 0), missing: null },
    { id: 'c3', label: 'Leaf wetness above 6 hours', verdict: met(wet > 6), missing: null },
  ];
  const level = yls[2];
  return {
    disease: { worsening_direction: 'lower', consecutive_weeks: run, compared_weeks: [-2, -1, 0].map((n) => shiftWeek(week, n)), worsening: run >= 2, falling: run >= 2, level: { yls: level, below: 8, critical_below: 6, verdict: level < 6 ? 'critical' : level < 8 ? 'below' : 'not_below' } },
    rainfall: { window_weeks: 2, min_total_mm: 0, recent_weeks: [-1, 0].map((n) => shiftWeek(week, n)), previous_weeks: [-3, -2].map((n) => shiftWeek(week, n)), recent_total_mm: recent, previous_total_mm: previous, favourable: conditions.every((c) => c.verdict === 'met'), conditions },
  };
};

const seed = () => ({
  // Filled while the stub runs: scans (diagnoses), closed-week cycles (runs) and id counters.
  diagnoses: {}, uploads: {}, runs: {}, scanRuns: {}, nextId: 1,
  lines: {
    // Nothing recorded yet.
    L01: { ...weekly('L01'), cycles: [], applications: [], leaves: 0 },
    // A suggestion with an application recorded against it.
    L02: {
      ...weekly('L02'),
      cycles: [{
        cycle_id: 'c-L02-24', week: '2026-W24', status: 'done', outcome: 'suggested', outcome_reason: null,
        evidence: evidenceAt('L02', '2026-W24'),
      }],
      applications: [{ application_id: 'app-L02-1', product_id: 'u-chlorothalonil', applied_on: '2026-06-02', recorded_by: 'stub-practitioner', recorded_at: '2026-06-02T09:00:00.000Z' }],
      suggestion: { payload: 'clean', basis: 'stage_confirmed' },
      leaves: 12,
    },
    // A suggestion with a flagged pick: recording it asks for a confirmation.
    L03: {
      ...weekly('L03'),
      cycles: [{
        cycle_id: 'c-L03-25', week: '2026-W25', status: 'done', outcome: 'suggested', outcome_reason: null,
        evidence: evidenceAt('L03', '2026-W25'),
      }],
      applications: [],
      suggestion: { payload: 'draft', basis: 'stage_confirmed' },
      leaves: 15,
    },
    // Ready to scan this week (the default demo line); its last cycle found the disease not worsening, with no evidence kept (the dataset shows the disease worsening at W23, the week it read).
    L04: {
      ...weekly('L04'),
      cycles: [{
        cycle_id: 'c-L04-24', week: '2026-W24', status: 'done', outcome: 'continue_monitoring', outcome_reason: 'disease_not_worsening',
        evidence: null,
      }],
      applications: [], leaves: 9,
      suggestion: { payload: 'real', basis: 'all_healthy_images' },
    },
    // The rules could not decide: human review, no evidence for the cycle, and a draft with a blocking alert.
    L05: {
      ...weekly('L05'),
      cycles: [{ cycle_id: 'c-L05-25', week: '2026-W25', status: 'done', outcome: 'human_review_required', outcome_reason: 'missing_feed_value', evidence: null }],
      applications: [], leaves: 7,
      suggestion: { payload: 'stressed', basis: 'no_confirmed_stage' },
    },
    // Monitoring so far; closing its next week fails (ticket 03).
    L06: {
      ...weekly('L06'),
      cycles: [{ cycle_id: 'c-L06-24', week: '2026-W24', status: 'done', outcome: 'continue_monitoring', outcome_reason: 'disease_not_worsening', evidence: null }],
      // A fresh-line draft recorded from the scheduler (payload `real`): only Cannot-Check Alerts to acknowledge.
      applications: [], leaves: 6,
      suggestion: { payload: 'monitoring', basis: 'stage_confirmed' },
    },
    // Nothing recorded; a verified scan starts a run.
    L07: { ...weekly('L07'), cycles: [], applications: [], leaves: 0 },
    // L08 to L23: weekly data only. A verified scan starts a run that ends in monitoring, like any line without a plan.
    ...Object.fromEntries(Array.from({ length: 16 }, (_, i) => `L${String(i + 8).padStart(2, '0')}`).map((id) => [id, { ...weekly(id), cycles: [], applications: [], leaves: 0 }])),
  },
});

// Holds the live copy of the seed; reset swaps in a fresh one.
export function createSeedStore() {
  const store = { data: seed(), reset() { store.data = seed(); } };
  return store;
}
