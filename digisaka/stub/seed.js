// Fixed seed for the stub scheduler. "Today" is 2026-W24, matching the app. Each line is a named
// scenario; the data decides what happens, nothing is switched. Weekly values are null where the
// real feed would have a gap. `evidence` is the rules' reading of a cycle, null for a cycle with no trend stage.
const wk = (week, yls, yli, rainfall_mm) => ({ week, yls, yli, rainfall_mm });

// The infection-risk rule's conditions as the scheduler lists them: all met, for a verdict of yes.
const spreadConditions = () => [
  { id: 'c1', label: 'Rainfall rising over two weeks', verdict: 'met', missing: null },
  { id: 'c2', label: 'Rainfall above 0 mm over two weeks', verdict: 'met', missing: null },
  { id: 'c3', label: 'Leaf wetness above 6 hours', verdict: 'met', missing: null },
];

const seed = () => ({
  // Filled while the stub runs: scans (diagnoses), closed-week cycles (runs) and id counters.
  diagnoses: {}, uploads: {}, runs: {}, scanRuns: {}, nextId: 1,
  lines: {
    // Nothing recorded yet.
    L01: { weeks: [], cycles: [], applications: [], leaves: 0 },
    // A suggestion with an application recorded against it.
    L02: {
      weeks: [wk('2026-W20', 9, 5, 10), wk('2026-W21', 8, 5, 14), wk('2026-W22', 7, 4, 20), wk('2026-W23', 6, 4, 28)],
      cycles: [{
        cycle_id: 'c-L02-23', week: '2026-W23', status: 'done', outcome: 'suggested', outcome_reason: null,
        evidence: {
          disease: { worsening_direction: 'lower', consecutive_weeks: 2, compared_weeks: ['2026-W21', '2026-W22', '2026-W23'], worsening: true, falling: true, level: { yls: 6, below: 8, critical_below: 6, verdict: 'below' } },
          rainfall: { window_weeks: 2, min_total_mm: 0, recent_weeks: ['2026-W22', '2026-W23'], previous_weeks: ['2026-W20', '2026-W21'], recent_total_mm: 48, previous_total_mm: 24, favourable: true, conditions: spreadConditions() },
        },
      }],
      applications: [{ application_id: 'app-L02-1', product_id: 'u-chlorothalonil', applied_on: '2026-06-02', recorded_by: 'stub-practitioner', recorded_at: '2026-06-02T09:00:00.000Z' }],
      suggestion: { payload: 'clean', basis: 'stage_confirmed' },
      leaves: 12,
    },
    // A suggestion with a flagged pick: recording it asks for a confirmation.
    L03: {
      weeks: [wk('2026-W20', 9, 5, 15), wk('2026-W21', 8, 5, 20), wk('2026-W22', 7, 4, 32), wk('2026-W23', 6, 4, 40), wk('2026-W24', 5, 3, 44)],
      cycles: [{
        cycle_id: 'c-L03-24', week: '2026-W24', status: 'done', outcome: 'suggested', outcome_reason: null,
        evidence: {
          disease: { worsening_direction: 'lower', consecutive_weeks: 2, compared_weeks: ['2026-W22', '2026-W23', '2026-W24'], worsening: true, falling: true, level: { yls: 5, below: 8, critical_below: 6, verdict: 'critical' } },
          rainfall: { window_weeks: 2, min_total_mm: 0, recent_weeks: ['2026-W23', '2026-W24'], previous_weeks: ['2026-W21', '2026-W22'], recent_total_mm: 84, previous_total_mm: 52, favourable: true, conditions: spreadConditions() },
        },
      }],
      applications: [],
      suggestion: { payload: 'draft', basis: 'stage_confirmed' },
      leaves: 15,
    },
    // Ready to scan this week (the default demo line); last week had a gap in the YLI reading.
    L04: {
      weeks: [wk('2026-W20', 9, 5, 18), wk('2026-W21', 9, 6, 22), wk('2026-W22', 8, null, 30), wk('2026-W23', 8, 5, 26), wk('2026-W24', null, null, 12)],
      cycles: [{
        cycle_id: 'c-L04-23', week: '2026-W23', status: 'done', outcome: 'continue_monitoring', outcome_reason: 'disease_not_worsening',
        evidence: {
          disease: { worsening_direction: 'lower', consecutive_weeks: 2, compared_weeks: ['2026-W21', '2026-W22', '2026-W23'], worsening: false, falling: false, level: { yls: 8, below: 8, critical_below: 6, verdict: 'not_below' } },
          rainfall: { window_weeks: 2, min_total_mm: 0, recent_weeks: ['2026-W22', '2026-W23'], previous_weeks: ['2026-W20', '2026-W21'], recent_total_mm: 56, previous_total_mm: 40, favourable: true, conditions: spreadConditions() },
        },
      }],
      applications: [], leaves: 9,
      suggestion: { payload: 'real', basis: 'all_healthy_images' },
    },
    // The rules could not decide: human review, no evidence for the cycle, and a draft with a blocking alert.
    L05: {
      weeks: [wk('2026-W21', 8, 4, 12), wk('2026-W22', null, null, 18), wk('2026-W23', 6, 3, null), wk('2026-W24', 5, 3, null)],
      cycles: [{ cycle_id: 'c-L05-24', week: '2026-W24', status: 'done', outcome: 'human_review_required', outcome_reason: 'missing_feed_value', evidence: null }],
      applications: [], leaves: 7,
      suggestion: { payload: 'stressed', basis: 'no_confirmed_stage' },
    },
    // Monitoring so far; closing its next week fails (ticket 03).
    L06: {
      weeks: [wk('2026-W21', 9, 6, 20), wk('2026-W22', 9, 6, 22), wk('2026-W23', 9, 5, 25)],
      cycles: [{ cycle_id: 'c-L06-23', week: '2026-W23', status: 'done', outcome: 'continue_monitoring', outcome_reason: 'disease_not_worsening', evidence: null }],
      // A fresh-line draft recorded from the scheduler (payload `real`): only Cannot-Check Alerts to acknowledge.
      applications: [], leaves: 6,
      suggestion: { payload: 'monitoring', basis: 'stage_confirmed' },
    },
    // Nothing recorded; a verified scan starts a run.
    L07: { weeks: [], cycles: [], applications: [], leaves: 0 },
    L08: { weeks: [], cycles: [], applications: [], leaves: 0 }, // its scan run never settles: the client's follow times out
  },
});

// Holds the live copy of the seed; reset swaps in a fresh one.
export function createSeedStore() {
  const store = { data: seed(), reset() { store.data = seed(); } };
  return store;
}
