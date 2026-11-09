// Suggestions: a line's current treatment suggestion (three groups, basis, what changed) and recording an
// application against it. The groups are built from a frozen 0004 payload laid out as the scheduler's
// SuggestionView; a line with no finished run has none. Also the scheduler's dev-date routes (the stub's
// "today").
import { readFileSync } from 'node:fs';
import { BASE, TODAY, todayOf, fail, ok, authed } from './common.js';

// The 0004 clean and stressed payloads, shifted 19 weeks earlier so their dates meet the app's demo today
// (see client/src/helpers/today.js). `draft` is the stressed one with nothing blocking: it only needs an acknowledgement.
const load = (name) => JSON.parse(readFileSync(new URL(`./payloads/selection-preview.${name}.json`, import.meta.url), 'utf8'));
// `real` is recorded from a fresh-line run of the scheduler (its tests/scheduler/fixtures copy); it changes only when re-recorded.
const clean = load('clean'), stressed = load('stressed'), real = load('real');
const draft = structuredClone(stressed);
Object.assign(draft.selection, { approvable: true, blockers: [] });
draft.preview.alerts = draft.preview.alerts.filter((a) => a.kind !== 'cap_exceeded');
// A Continue Monitoring run lists the stage's options for reference: no unit is scheduled (all `eligible`, no days, no
// alerts) and the last one fails a check, so it is `excluded` with that check as its reason.
const monitoring = structuredClone(clean);
monitoring.selection.units = monitoring.selection.units.map((u, i, all) => ({
  ...u, excluded_from_schedule: true,
  checks: i === all.length - 1 ? [...(u.checks ?? []), { check: 'group_cap', level: 'error', detail: null, result: 'fail' }] : u.checks,
}));
Object.assign(monitoring.preview, { days: [], alerts: [] });
const PAYLOADS = { clean, stressed, draft, real, monitoring };

const DAY = 86400000;
const addDays = (iso, n) => new Date(Date.parse(iso) + n * DAY).toISOString().slice(0, 10);
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const PRACTITIONER = 'stub-practitioner';
const SEED_TIME = '2026-06-01T08:00:00.000Z';
const DEFAULT = { payload: 'clean', basis: 'stage_confirmed' };

// The scheduler's ranking explanation and its fixed server caveat. Only the clean plan has one: the
// monitoring list is not ranked, so its `explanation` is null (a fallback or a dropped one is null too).
const CAVEAT = 'A language model wrote this from product facts that are not yet validated. The checks, not this text, decide which products are allowed.';
const EXPLANATIONS = { clean: { text: 'The triazole goes first and the strobilurin follows, so the two modes of action alternate.', caveat: CAVEAT } };

// A product here is the part of a unit id after `Option|`, as the scheduler records it.
const productOf = (unitId) => unitId.split('|').pop();
// Only these two outcomes are served beside `suggested`; the old approval outcomes are gone.
const SERVED_OUTCOMES = ['human_review_required', 'continue_monitoring'];

// The basis wording confirms rather than accuses: what the data suggests, then a way to verify.
const BASIS_TEXT = {
  all_healthy_images: 'The data suggests the line is healthy, as every scanned image is healthy; a further scan is suggested to verify.',
  no_confirmed_stage: 'The data suggests no stage is confirmed for this line yet; a scan is suggested to verify.',
};

// A unit's `facts`, as the live scheduler serves them: the QA `KgFacts` pieces its checks used. They come from the
// recorded `real` payload's per-product sections, matched by product name (the clean and stressed payloads have none).
const REAL_BY_NAME = new Map(real.selection.units.map((u) => [u.product.toLowerCase(), u]));
// shortcut: 10 to 15 days for every unit (the sample ABox's general fungicide guidance), not read per product; upgrade when the live run serves it.
const INTERVAL = { min_days: 10, max_days: 15, source: null };
const named = (xs) => xs.map(({ id, label }) => ({ id, label }));
function factsOf(u) {
  const r = REAL_BY_NAME.get(u.product.toLowerCase());
  if (!r) return null;
  const { details, resistance, efficacy_use: use } = r;
  const moa = { id: details.mode_of_action, label: details.mode_of_action, frac_code: details.frac_code ?? null, multisite: resistance.multisite ?? null };
  const carriers = r.conditions.filter((c) => c.kind === 'carrier'), excluded = r.conditions.filter((c) => c.kind === 'excluded');
  return {
    product: { id: productOf(u.unit_id), label: u.product, active_ingredient: details.active_ingredient ?? null, chemical_group: details.chemical_group ?? null, manufacturer: null, mode_of_action: moa, plant_mobility: details.plant_mobility ?? [], registrations: details.registrations ?? [], sources: [] },
    repeat_condition: resistance.repeat_condition ?? null,
    mixture_conditions: carriers.length || excluded.length ? [{ required_partners: named(carriers), excluded_partners: named(excluded), requires_different_mode_of_action: null, sources: [] }] : [],
    weather_requirement: null,
    application_rates: use.application_rates ?? [], dilutions: use.dilutions ?? [], coverage: use.coverage ?? [], application_methods: use.application_methods ?? [],
    application_interval: INTERVAL,
  };
}

// The schedule as the live scheduler serves it: no `frac` on an application, no `detail` on an `ok` weather entry.
const scheduleOf = (days) => days.map((d) => {
  if (!d.application) return d;
  const { frac, ...application } = d.application;
  if (application.weather?.status === 'ok') application.weather = { status: 'ok' };
  // The frozen payloads hold single-step days with no partner: kind, track and the step note are set as the scheduler sets them.
  const multisite = REAL_BY_NAME.get(String(application.product).toLowerCase())?.resistance.multisite === true;
  return { ...d, application: { ...application, kind: multisite ? 'multisite' : 'single_site', track: multisite ? 'multisite' : 'single_site', why: multisite ? 'No single-site group can be used on this date, so the group is applied alone as a multisite step.' : 'The group is next in the rotation set; it has not been used yet.', partner: null } };
});

// Read-time step fields, as the live scheduler derives them (plan-continuity 05): Planned before the window, Due inside it,
// Overdue after it; a recorded product inside the window applies the step. A record that fits no step is an off-plan row.
// shortcut: no partner, skip or past plans here (the stub plans single steps); the live run is the gate for those.
const plusDays = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const servedOf = (days, applications, day, skips = []) => {
  const used = new Set();
  const out = days.map((d, i) => {
    const a = d.application;
    if (!a) return d;
    const { start, end } = a.timing_window ?? { start: d.date, end: d.date };
    const rec = applications.find((r) => !used.has(r) && r.product_id === productOf(a.unit_id) && r.applied_on >= start && r.applied_on <= end);
    if (rec) used.add(rec);
    const stepId = `step-${d.date}-${i}`;
    const skip = rec ? null : skips.find((k) => k.step_id === stepId) ?? null;
    const status = rec ? 'applied' : skip ? 'skipped' : day < start ? 'planned' : day <= end ? 'due' : 'overdue';
    const step = { ...a, step_id: stepId, status, status_note: null, applied_on: rec?.applied_on ?? null, skip: skip && { on: skip.on, reason: skip.reason }, off_plan: false };
    return { ...d, ...(rec ? { date: rec.applied_on } : skip ? { date: skip.on } : {}), application: step };
  });
  const offPlan = applications.filter((r) => !used.has(r) && r.applied_on >= plusDays(day, -30)).map((r) => ({
    date: r.applied_on, weekday: null, state: 'needs_approval',
    application: { step_id: null, unit_id: null, product: r.product_id, moa: null, kind: 'single_site', track: 'single_site', why: null, partner: null, timing_window: null, status: 'applied', status_note: null, applied_on: r.applied_on, skip: null, off_plan: true },
  }));
  return [...out, ...offPlan].sort((x, y) => x.date.localeCompare(y.date));
};

// recommended: the sequencer's pick; eligible: passed but not picked; excluded: failed a check or not for the stage.
const groupOf = (u) => (u.selectable === false || (u.checks ?? []).some((c) => c.result === 'fail') ? 'excluded' : u.excluded_from_schedule ? 'eligible' : 'recommended');
const reasonOf = (u) => (u.selectable === false ? 'not_for_stage' : (u.checks ?? []).find((c) => c.result === 'fail')?.check ?? 'not_for_stage');

// What a payload shows, as the diff reads it: unit tiers, alert ids, the line stage and the schedule.
const tiersOf = (name) => Object.fromEntries((name ? PAYLOADS[name].selection.units : []).map((u) => [u.unit_id, groupOf(u)]));
const alertIdsOf = (name) => new Set((name ? PAYLOADS[name].preview.alerts : []).map((a, i) => a.id ?? `${a.kind}-${i}`));
const stageOf = (name, basis) => (name && basis === 'stage_confirmed' ? 2 : null);
const planOf = (name) => JSON.stringify(scheduleOf(name ? PAYLOADS[name].preview.days : []));

// The note on what changed, with the keys the live diff sets only when they apply (reschedule.describe_changes).
function changesOf(prior, payload, trigger) {
  const was = tiersOf(prior.payload), now = tiersOf(payload);
  const moved = [...new Set([...Object.keys(was), ...Object.keys(now)])].sort()
    .filter((u) => was[u] !== now[u]).map((u) => ({ unit_id: u, from: was[u] ?? null, to: now[u] ?? null }));
  const oldIds = alertIdsOf(prior.payload), newIds = alertIdsOf(payload);
  const added = [...newIds].filter((id) => !oldIds.has(id)).sort(), removed = [...oldIds].filter((id) => !newIds.has(id)).sort();
  const [oldStage, newStage] = [stageOf(prior.payload, prior.basis), stageOf(payload, prior.basis)];
  const diff = { trigger };
  if (oldStage !== newStage) diff.stage = { basis: [prior.basis, prior.basis], stage: [oldStage, newStage] };
  if (moved.length) diff.units_moved = moved;
  if (added.length || removed.length) diff.alerts = { added, removed };
  if (planOf(prior.payload) !== planOf(payload)) diff.plan_steps_changed = true;
  const headline = diff.stage ? 'the line stage changed' : `the suggestion changed after ${trigger === 'application' ? 'an' : 'a'} ${trigger}`;
  diff.summary = `The data suggests ${headline}; a scan is suggested to verify.`;
  return diff;
}

// The suggestion a finished run leaves on the line: its payload, basis, and the note on what changed.
// shortcut: the run keeps the prior payload unless it is a monitoring outcome, so a change shows only when the payload
// flips between a plan and the monitoring list; the live scheduler also diffs after an application removes a product from the plan.
export function suggestionAfter(line, run, finishedAt) {
  const prior = line.suggestion ?? DEFAULT;
  const monitoring = run.plan.outcome === 'continue_monitoring';
  const payload = monitoring ? 'monitoring' : prior.payload === 'monitoring' ? DEFAULT.payload : prior.payload ?? DEFAULT.payload;
  return {
    ...prior, payload, revision: run.cycle_id, trigger: run.trigger, created_at: new Date(finishedAt).toISOString(),
    changes: line.suggestion ? changesOf(prior, payload, run.trigger) : null, // a first run has nothing to differ from
  };
}

export function suggestionRoutes(store, { settleAll, startRun, runsOf, now = Date.now }) {
  const today = () => todayOf(store);
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
    return { id: a.id ?? `${a.kind}-${i}`, unit_id: unitId, kind: a.kind, level: a.level, text: a.text, cause: a.cause ?? null, blocks_approval: !!a.blocks_approval };
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
      const facts = factsOf(u);
      const reason = g === 'excluded' ? reasonOf(u) : cur.payload === 'monitoring' ? 'monitoring_advised' : null;
      // Only the contract's fields: the scheduler's unit has a lower-case `label` and no payload extras (found in the live run).
      groups[g].push({
        unit_id: u.unit_id, product_id: productOf(u.unit_id), label: u.product.toLowerCase(), practice_id: u.practice ?? u.unit_id.split('|')[0], rank: groups[g].length + 1,
        track: facts?.product.mode_of_action.multisite === true ? 'multisite' : 'single_site',
        checks: (u.checks ?? []).map((c) => ({ check: c.check, level: c.level, detail: c.detail ?? null, result: c.result })), alerts: mine,
        needs_confirmation: reason !== null || mine.length > 0, reason, partner_for: [], facts,
      });
    }
    const basisAlert = BASIS_TEXT[cur.basis] ? [{ id: 'stage_basis', unit_id: null, kind: 'stage_basis', level: 'info', text: BASIS_TEXT[cur.basis], cause: null, blocks_approval: false }] : [];
    const confirmed = cur.basis === 'stage_confirmed' && frozen;
    const outcome = SERVED_OUTCOMES.includes(cycle?.outcome) ? cycle.outcome : null;
    return {
      revision: cur.revision, trigger: cur.trigger, created_at: cur.created_at, basis: cur.basis,
      line_stage: { stage: confirmed ? 2 : null, tally: confirmed ? { 2: 1 } : {}, window: { from: addDays(today(), -6), to: today() } },
      groups, explanation: EXPLANATIONS[cur.payload] ?? null, other_guidance: frozen ? [{ practice_id: 'PracDeleafing', label: 'Remove the most infected leaves' }] : [],
      schedule: servedOf(scheduleOf(frozen?.preview.days ?? []), line.applications, today(), line.skips ?? []), alerts: [...basisAlert, ...alerts.filter((a) => !a.unit_id)], changes: cur.changes,
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
    { method: 'GET', path: `${BASE}/dev/run-mode`, handle: authed(() => ok({ mode: store.data.runMode ?? 'normal' })) },
    {
      method: 'PUT', path: `${BASE}/dev/run-mode`,
      handle: authed(({ body }) => {
        if (!['normal', 'fail', 'stuck'].includes(body?.mode)) return fail(400, 'validation_error', 'mode: must be normal, fail or stuck');
        store.data.runMode = body.mode;
        return ok({ mode: body.mode });
      }),
    },
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
      // Skip and Undo skip a step of the current plan; either starts a run (trigger skip, skip_undone).
      method: 'POST', path: `${BASE}/lines/:id/steps/:step/skip`,
      handle: authed(({ params, body }) => {
        settleAll();
        const line = store.data.lines[params.id];
        if (!line) return unknownLine(params.id);
        if (!currentOf(line)) return fail(404, 'unknown_cycle', `Line ${params.id} has no finished run`);
        const step = view(params.id).schedule.map((d) => d.application).find((a) => a?.step_id === params.step);
        if (!step || !['planned', 'due', 'overdue'].includes(step.status)) return fail(409, 'step_not_open', `Step ${params.step} is not open`);
        if (body?.reason != null && !['rain', 'no_product', 'low_disease', 'other'].includes(body.reason)) return fail(400, 'validation_error', 'reason: must be rain, no_product, low_disease or other');
        (line.skips ??= []).push({ step_id: params.step, on: today(), reason: body?.reason ?? null });
        const week = [...line.cycles].sort((a, b) => b.week.localeCompare(a.week)).at(0).week;
        const run = startRun(params.id, week, 'skip');
        return { status: 201, body: { reschedule: run && { cycle_id: run.cycle_id } } };
      }),
    },
    {
      method: 'DELETE', path: `${BASE}/lines/:id/steps/:step/skip`,
      handle: authed(({ params }) => {
        settleAll();
        const line = store.data.lines[params.id];
        if (!line) return unknownLine(params.id);
        if (!(line.skips ?? []).some((k) => k.step_id === params.step)) return fail(409, 'step_not_open', `Step ${params.step} is not skipped`);
        line.skips = line.skips.filter((k) => k.step_id !== params.step);
        const week = [...line.cycles].sort((a, b) => b.week.localeCompare(a.week)).at(0).week;
        const run = startRun(params.id, week, 'skip_undone');
        return ok({ reschedule: run && { cycle_id: run.cycle_id } });
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
        // A step action (plan-continuity 07): the step must be open; a product that is not the step's is off-plan and asks to confirm;
        // recording past open earlier steps asks to skip them (skip_earlier) or record them first.
        // shortcut: no partner here (the stub plans single steps), so partner_product_id is only checked for a step.
        let alerts = hit.unit.alerts;
        let skipSteps = [];
        let offPlan = false;
        if (body.partner_product_id && !body.step_id) return fail(400, 'validation_error', 'partner_product_id: needs a step_id');
        if (body.step_id) {
          const open = now_.schedule.map((d) => d.application).filter((a) => a?.step_id && ['planned', 'due', 'overdue'].includes(a.status));
          const at = open.findIndex((a) => a.step_id === body.step_id);
          if (at < 0) return fail(409, 'step_not_open', `Step ${body.step_id} is not open`);
          offPlan = productOf(open[at].unit_id) !== body.product_id;
          const before = offPlan ? [] : open.slice(0, at);
          if (before.length && body.skip_earlier !== true) {
            return { status: 409, body: { error: 'earlier_steps_open', detail: 'earlier steps are still open', steps: before.map((a) => ({ step_id: a.step_id, product: a.product, timing_window: a.timing_window })) } };
          }
          skipSteps = before.map((a) => a.step_id);
          if (offPlan) alerts = [...alerts, { id: `line:off_plan:${body.step_id}`, unit_id: null, kind: 'off_plan', level: 'warning', text: `${hit.unit.label} does not fit this step. It will be recorded off-plan and the step stays open.`, blocks_approval: false }];
        }
        const stale = body.revision !== now_.revision;
        if (stale || ((hit.unit.needs_confirmation || offPlan) && body.confirmed !== true)) {
          return { status: 409, body: { error: 'confirmation_required', detail: stale ? 'the suggestion changed; confirm to record against the current one' : 'the application needs confirming', revision: now_.revision, tier: hit.tier, reason: hit.unit.reason, alerts } };
        }
        for (const id of skipSteps) (line.skips ??= []).push({ step_id: id, on: today(), reason: null });
        const application = { application_id: `app-${store.data.nextId++}`, product_id: body.product_id, applied_on: body.applied_on, recorded_by: PRACTITIONER, recorded_at: new Date(now()).toISOString(), confirmation: { tier: hit.tier, reason: hit.unit.reason, alerts, revision: now_.revision, confirmed: body.confirmed === true } };
        line.applications.push(application);
        const week = [...line.cycles].sort((a, b) => b.week.localeCompare(a.week)).at(0).week;
        const run = startRun(params.id, week, 'application');
        return { status: 201, body: { application, reschedule: run && { cycle_id: run.cycle_id } } };
      }),
    },
  ];
}
