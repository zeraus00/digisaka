// Selections: read a cycle's, approve, reject, renew, and record applications. A line's `selections` hold the
// live state (status, Approval Periods, decision); the preview is a frozen copy of a 0004 payload, served with
// that live state laid over it, as the scheduler does. Applications are the line's `applications`.
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

// A product here is the part of a unit id after `Option|`, as the scheduler records it; a unit the sequencer cannot select, or left out of the Selection, is not offered.
export const productsOf = (sel) => PAYLOADS[sel.payload].selection.units.filter((u) => u.selectable !== false && !u.excluded_from_schedule).map((u) => u.unit_id.split('|').pop());
const lastPeriod = (sel) => sel.periods.at(-1);
const periodView = (sel) => ({ approval_period_id: lastPeriod(sel)?.approval_period_id ?? null, start: lastPeriod(sel)?.start ?? null, end: lastPeriod(sel)?.end ?? null, days: 30 });
const ackIds = (p) => [...p.selection.acknowledgements_required.map((a) => a.id), ...p.preview.alerts.filter((a) => a.id).map((a) => a.id)];

// A selection as the line status lists it.
export const summaryOf = (sel) => ({ selection_id: sel.selection_id, origin_cycle_id: sel.origin_cycle_id, origin_week: sel.origin_week, status: sel.status, products: productsOf(sel), approval_period: periodView(sel), reselection_required: false });

// A fresh draft for a cycle that just finished with a new selection.
export const newDraft = (lineId, cycleId, week) => ({ selection_id: `sel-${lineId}-${week.slice(6)}`, origin_cycle_id: cycleId, origin_week: week, status: 'draft', payload: 'draft', periods: [], decided_by: null, decided_at: null, note: null });

export function selectionRoutes(store, { settleAll, now = Date.now }) {
  const all = () => { settleAll(); return Object.entries(store.data.lines).flatMap(([lineId, line]) => line.selections.map((sel) => ({ lineId, line, sel }))); };
  const find = (id) => all().find((x) => x.sel.selection_id === id);
  const unknown = (id) => fail(404, 'unknown_selection', `No selection ${id}`);
  // Deciding a selection moves its cycle on, as the scheduler does: approval is `approved`, rejection human review.
  const setOutcome = (line, cycleId, outcome, outcome_reason) => {
    for (const c of [line.cycles.find((x) => x.cycle_id === cycleId), store.data.runs[cycleId]]) if (c) Object.assign(c, { outcome, outcome_reason });
  };

  // Approval and renewal share the checks, in the scheduler's order.
  function checked(sel, body) {
    const acknowledged = body?.acknowledged ?? [];
    const p = PAYLOADS[sel.payload];
    if (!Array.isArray(acknowledged) || acknowledged.some((a) => typeof a !== 'string')) return fail(400, 'validation_error', 'acknowledged must be a list of alert ids');
    const unknownId = acknowledged.find((a) => !ackIds(p).includes(a));
    if (unknownId) return fail(400, 'validation_error', `${unknownId} is not an alert of the preview`);
    if (p.selection.blockers.length) return fail(409, 'selection_not_approvable', 'A blocking alert must be resolved first');
    const missing = p.selection.acknowledgements_required.filter((a) => !acknowledged.includes(a.id));
    if (missing.length) return fail(409, 'acknowledgements_required', `Acknowledge ${missing.map((a) => a.id).join(', ')}`);
    return null;
  }
  const note = (body) => (typeof body?.note === 'string' && body.note.trim() ? body.note.trim() : null);
  const decided = (sel) => ok({ selection_id: sel.selection_id, status: sel.status, decided_by: sel.decided_by, decided_at: sel.decided_at, note: sel.note, approval_period: periodView(sel) });
  const addPeriod = (sel, acknowledged) => {
    sel.periods.push({ approval_period_id: `ap-${sel.selection_id.slice(4)}-${sel.periods.length + 1}`, start: TODAY, end: addDays(TODAY, 30), acknowledged });
  };

  return [
    {
      method: 'GET', path: `${BASE}/cycles/:id/selection`,
      handle: authed(({ params }) => {
        const hit = all().find((x) => x.sel.origin_cycle_id === params.id);
        if (!hit) return fail(404, 'unknown_selection', `Cycle ${params.id} has no selection`);
        const { sel, lineId } = hit;
        const frozen = PAYLOADS[sel.payload];
        const overlay = { selection_id: sel.selection_id, line_id: lineId, status: sel.status, approval_period: periodView(sel), decided_by: sel.decided_by, decided_at: sel.decided_at, note: sel.note };
        return ok({ kg_build: frozen.kg_build, selection: { ...frozen.selection, ...overlay }, preview: frozen.preview });
      }),
    },
    {
      method: 'POST', path: `${BASE}/selections/:id/approval`,
      handle: authed(({ params, body }) => {
        const hit = find(params.id);
        if (!hit) return unknown(params.id);
        const { sel, line } = hit;
        if (sel.status !== 'draft') return fail(409, 'selection_not_draft', 'Only a draft can be decided');
        const refused = checked(sel, body);
        if (refused) return refused;
        Object.assign(sel, { status: 'approved', decided_by: PRACTITIONER, decided_at: new Date(now()).toISOString(), note: note(body) });
        addPeriod(sel, body?.acknowledged ?? []);
        setOutcome(line, sel.origin_cycle_id, 'approved', null);
        return decided(sel);
      }),
    },
    {
      method: 'POST', path: `${BASE}/selections/:id/rejection`,
      handle: authed(({ params, body }) => {
        const hit = find(params.id);
        if (!hit) return unknown(params.id);
        const { sel, line } = hit;
        if (sel.status !== 'draft') return fail(409, 'selection_not_draft', 'Only a draft can be decided');
        Object.assign(sel, { status: 'rejected', decided_by: PRACTITIONER, decided_at: new Date(now()).toISOString(), note: note(body) });
        setOutcome(line, sel.origin_cycle_id, 'human_review_required', 'gate_e_rejected');
        return decided(sel);
      }),
    },
    {
      method: 'POST', path: `${BASE}/selections/:id/renewal`,
      handle: authed(({ params, body }) => {
        const hit = find(params.id);
        if (!hit) return unknown(params.id);
        const { sel } = hit;
        if (sel.status !== 'approved') return fail(409, 'selection_not_renewable', 'Only an approved selection is renewed');
        const refused = checked(sel, body);
        if (refused) return refused;
        addPeriod(sel, body?.acknowledged ?? []);
        if (note(body)) sel.note = note(body);
        return decided(sel);
      }),
    },
    {
      method: 'POST', path: `${BASE}/selections/:id/applications`,
      handle: authed(({ params, body }) => {
        const hit = find(params.id);
        if (!hit) return unknown(params.id);
        const { sel, line } = hit;
        if (!DATE.test(body?.applied_on ?? '') || typeof body?.product_id !== 'string') return fail(400, 'validation_error', 'product_id and applied_on (YYYY-MM-DD) are required');
        if (body.applied_on > TODAY) return fail(400, 'validation_error', 'applied_on must not be in the future');
        if (!sel.periods.some((p) => p.start <= body.applied_on && body.applied_on <= p.end)) return fail(409, 'no_active_selection', 'No Approval Period of the selection covers that date');
        if (!productsOf(sel).includes(body.product_id)) return fail(409, 'product_not_in_selection', `${body.product_id} is not a unit of the selection`);
        if (line.applications.some((a) => a.selection_id === sel.selection_id && a.product_id === body.product_id && a.applied_on === body.applied_on)) return fail(409, 'application_already_recorded', 'The application was already recorded');
        const application = { application_id: `app-${store.data.nextId++}`, selection_id: sel.selection_id, product_id: body.product_id, applied_on: body.applied_on, recorded_by: PRACTITIONER, recorded_at: new Date(now()).toISOString() };
        line.applications.push(application);
        return { status: 201, body: application };
      }),
    },
  ];
}
