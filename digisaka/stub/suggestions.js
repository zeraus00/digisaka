// Suggestions: a line's current treatment suggestion (three groups, basis, what changed) and recording an
// application against it. The groups are built from a frozen 0004 payload laid out as the scheduler's
// SuggestionView; a line with no finished run has none. Also the scheduler's dev-date routes (the stub's
// "today"). A line's `selections` stay only so the line status and the schedule list keep their rows.
import { readFileSync } from 'node:fs';
import { BASE, fail, ok, authed } from './common.js';

// The 0004 clean and stressed payloads, shifted 20 weeks earlier so their dates meet the app's demo today
// (see client/src/helpers/today.js). `draft` is the stressed one with nothing blocking: it only needs an acknowledgement.
const load = (name) => JSON.parse(readFileSync(new URL(`./payloads/selection-preview.${name}.json`, import.meta.url), 'utf8'));
// `real` is recorded from a fresh-line run of the scheduler (its tests/scheduler/fixtures copy); it changes only when re-recorded.
const clean = load('clean'), stressed = load('stressed'), real = load('real');
const draft = structuredClone(stressed);
Object.assign(draft.selection, { approvable: true, blockers: [] });
draft.preview.alerts = draft.preview.alerts.filter((a) => a.kind !== 'cap_exceeded');
const PAYLOADS = { clean, stressed, draft, real };

export const TODAY = '2026-06-08';
const DAY = 86400000;
const addDays = (iso, n) => new Date(Date.parse(iso) + n * DAY).toISOString().slice(0, 10);
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const PRACTITIONER = 'stub-practitioner';
const SEED_TIME = '2026-06-01T08:00:00.000Z';
const DEFAULT = { payload: 'clean', basis: 'stage_confirmed' };

// A product here is the part of a unit id after `Option|`, as the scheduler records it.
const productOf = (unitId) => unitId.split('|').pop();
// Only these two outcomes are served; the rest ("approved", "awaiting_decision") belong to the retired approval flow.
const SERVED_OUTCOMES = ['human_review_required', 'continue_monitoring'];

// A selection as the line status lists it (the schedule list still reads it).
export const summaryOf = (sel) => ({ selection_id: sel.selection_id, origin_cycle_id: sel.origin_cycle_id, origin_week: sel.origin_week, status: sel.status, products: [], approval_period: { approval_period_id: null, start: null, end: null, days: 30 }, reselection_required: false });

// A row for a finished run in the line status.
export const newDraft = (lineId, cycleId, week) => ({ selection_id: `sel-${lineId}-${week.slice(6)}`, origin_cycle_id: cycleId, origin_week: week, status: 'draft', payload: 'draft', periods: [], decided_by: null, decided_at: null, note: null });

// The basis wording confirms rather than accuses: what the data suggests, then a way to verify.
const BASIS_TEXT = {
  all_healthy_images: 'The data suggests the line is healthy, as every scanned image is healthy; a further scan is suggested to verify.',
  no_confirmed_stage: 'The data suggests no stage is confirmed for this line yet; a scan is suggested to verify.',
};

// recommended: the sequencer's pick; eligible: passed but not picked; excluded: failed a check or not for the stage.
const groupOf = (u) => (u.selectable === false || (u.checks ?? []).some((c) => c.result === 'fail') ? 'excluded' : u.excluded_from_schedule ? 'eligible' : 'recommended');
const reasonOf = (u) => (u.selectable === false ? 'not_for_stage' : (u.checks ?? []).find((c) => c.result === 'fail')?.check ?? 'not_for_stage');

// The suggestion a finished run leaves on the line: its payload, basis, and the note on what changed.
export function suggestionAfter(line, run, finishedAt) {
  const prior = line.suggestion ?? DEFAULT;
  const monitoring = run.plan.outcome === 'continue_monitoring';
  return {
    ...prior, payload: monitoring ? null : prior.payload ?? DEFAULT.payload, revision: run.cycle_id, trigger: run.trigger, created_at: new Date(finishedAt).toISOString(),
    changes: { trigger: run.trigger, summary: run.trigger === 'scan' ? 'A new scan of this line moved the suggestion.' : 'The recorded application moved the schedule.', units_moved: 0 },
  };
}

export function suggestionRoutes(store, { settleAll, startRun, runsOf, now = Date.now }) {
  // The date the stub treats as today: the dev date when one is set, else TODAY (the scheduler's DevClock).
  const today = () => store.data.devToday ?? TODAY;
  const todayView = () => ok({ today: today(), default: TODAY, pinned: store.data.devToday != null });
  const validDay = (v) => typeof v === 'string' && DATE.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().startsWith(v);
  const unknownLine = (id) => fail(404, 'unknown_line', `No line ${id}`);

  // The line's current suggestion state: the stored one, or the seed's with the newest cycle as its revision.
  function currentOf(line) {
    const newest = [...line.cycles].sort((a, b) => b.week.localeCompare(a.week)).at(0);
    if (!newest) return null;
    const s = line.suggestion ?? DEFAULT;
    if (s.revision) return s;
    return { ...s, revision: newest.cycle_id, trigger: 'scan', created_at: SEED_TIME, changes: null };
  }

  function alertView(a, i, unitId) {
    return { id: a.id ?? `${a.kind}-${i}`, unit_id: unitId, kind: a.kind, level: a.level, text: a.text, blocks_approval: !!a.blocks_approval };
  }

  function view(lineId) {
    const line = store.data.lines[lineId];
    const cur = currentOf(line);
    const cycle = line.cycles.find((c) => c.cycle_id === cur.revision) ?? store.data.runs[cur.revision];
    const frozen = cur.payload ? PAYLOADS[cur.payload] : null;
    const ackUnit = Object.fromEntries((frozen?.selection.acknowledgements_required ?? []).map((a) => [a.id, a.unit_id]));
    const alerts = (frozen?.preview.alerts ?? []).map((a, i) => alertView(a, i, a.unit_id ?? ackUnit[a.id] ?? null));
    const groups = { recommended: [], eligible: [], excluded: [] };
    for (const u of frozen?.selection.units ?? []) {
      const g = groupOf(u);
      const mine = alerts.filter((a) => a.unit_id === u.unit_id);
      // Only the contract's fields: the scheduler's unit has a lower-case `label` and no payload extras (found in the live run).
      groups[g].push({
        unit_id: u.unit_id, product_id: productOf(u.unit_id), label: u.product.toLowerCase(), practice_id: u.practice ?? u.unit_id.split('|')[0], rank: groups[g].length + 1,
        checks: (u.checks ?? []).map((c) => ({ check: c.check, level: c.level, detail: c.detail ?? null, result: c.result })), alerts: mine,
        needs_confirmation: g === 'excluded' || mine.length > 0, reason: g === 'excluded' ? reasonOf(u) : null,
      });
    }
    const basisAlert = BASIS_TEXT[cur.basis] ? [{ id: 'stage_basis', unit_id: null, kind: 'stage_basis', level: 'info', text: BASIS_TEXT[cur.basis], blocks_approval: false }] : [];
    const confirmed = cur.basis === 'stage_confirmed' && frozen;
    const outcome = SERVED_OUTCOMES.includes(cycle?.outcome) ? cycle.outcome : null;
    return {
      revision: cur.revision, trigger: cur.trigger, created_at: cur.created_at, basis: cur.basis,
      line_stage: { stage: confirmed ? 2 : null, tally: confirmed ? { 2: 1 } : {}, window: { from: addDays(today(), -6), to: today() } },
      groups, other_guidance: frozen ? [{ practice_id: 'PracDeleafing', label: 'Remove the most infected leaves' }] : [],
      schedule: frozen?.preview.days ?? [], alerts: [...basisAlert, ...alerts.filter((a) => !a.unit_id)], changes: cur.changes,
      running: runsOf(lineId).some((r) => r.status === 'running'), outcome, outcome_reason: outcome ? cycle.outcome_reason ?? null : null,
    };
  }

  const recorded = (line, body) => line.applications.some((a) => a.product_id === body.product_id && a.applied_on === body.applied_on);

  return [
    { method: 'GET', path: `${BASE}/dev/today`, handle: authed(() => todayView()) },
    {
      method: 'PUT', path: `${BASE}/dev/today`,
      handle: authed(({ body }) => {
        if (!validDay(body?.today)) return fail(400, 'validation_error', 'today: must be YYYY-MM-DD');
        store.data.devToday = body.today;
        return todayView();
      }),
    },
    { method: 'DELETE', path: `${BASE}/dev/today`, handle: authed(() => { delete store.data.devToday; return todayView(); }) },
    {
      method: 'GET', path: `${BASE}/lines/:id/suggestion`,
      handle: authed(({ params }) => {
        settleAll();
        const line = store.data.lines[params.id];
        if (!line) return unknownLine(params.id);
        if (!currentOf(line)) return fail(404, 'unknown_cycle', `Line ${params.id} has no finished run`);
        return ok(view(params.id));
      }),
    },
    {
      method: 'POST', path: `${BASE}/lines/:id/applications`,
      handle: authed(({ params, body }) => {
        settleAll();
        const line = store.data.lines[params.id];
        if (!line) return unknownLine(params.id);
        if (!currentOf(line)) return fail(404, 'unknown_cycle', `Line ${params.id} has no finished run`);
        if (!DATE.test(body?.applied_on ?? '') || typeof body?.product_id !== 'string' || typeof body?.revision !== 'string') return fail(400, 'validation_error', 'product_id, applied_on (YYYY-MM-DD) and revision are required');
        if (body.applied_on > today()) return fail(400, 'validation_error', 'applied_on must not be in the future');
        const now_ = view(params.id);
        const tiers = Object.entries(now_.groups).flatMap(([tier, units]) => units.map((u) => ({ tier, unit: u })));
        const hit = tiers.find((x) => x.unit.product_id === body.product_id);
        if (!hit) return fail(409, 'product_not_offered', `${body.product_id} is not a unit of the current suggestion`);
        if (recorded(line, body)) return fail(409, 'application_already_recorded', 'The application was already recorded');
        const stale = body.revision !== now_.revision;
        if (stale || (hit.unit.needs_confirmation && body.confirmed !== true)) {
          return { status: 409, body: { error: 'confirmation_required', detail: stale ? 'the suggestion changed; confirm to record against the current one' : 'the application needs confirming', revision: now_.revision, tier: hit.tier, alerts: hit.unit.alerts } };
        }
        const application = { application_id: `app-${store.data.nextId++}`, product_id: body.product_id, applied_on: body.applied_on, recorded_by: PRACTITIONER, recorded_at: new Date(now()).toISOString(), confirmation: { tier: hit.tier, alerts: hit.unit.alerts, revision: now_.revision, confirmed: body.confirmed === true } };
        line.applications.push(application);
        const week = [...line.cycles].sort((a, b) => b.week.localeCompare(a.week)).at(0).week;
        const run = startRun(params.id, week, 'application');
        return { status: 201, body: { application, reschedule: run && { cycle_id: run.cycle_id } } };
      }),
    },
  ];
}
