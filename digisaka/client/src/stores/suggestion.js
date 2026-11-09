import { defineStore } from 'pinia';
import { api } from '../api.js';
import { messageFor } from '../helpers/messages.js';
import { POLL_MS, POLL_LIMIT } from './cycle.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const base = '/api/v1/scheduler';
const e = encodeURIComponent;
// A unit id is `Option|Product`; the scheduler records and checks the product alone.
export const productOf = (unitId) => unitId.split('|').pop();
const stepFields = (s) => ({ ...(s.step_id ? { step_id: s.step_id } : {}), ...(s.partner_product_id ? { partner_product_id: s.partner_product_id } : {}) });
const DATE = /^\d{4}-\d{2}-\d{2}$/;
// Codes that mean the line moved on under the screen: show the real state again.
const STALE = ['application_already_recorded', 'step_not_open'];

// A line's current treatment suggestion, the line's recorded applications, and recording against it.
// phase: idle, loading, ready, notfound, error. `updating` is true while a newer run is in progress.
// `pending` holds a record the scheduler asked to confirm: {product_id, applied_on, revision, tier, reason, alerts, step_id, partner_product_id, skip_earlier}.
// `earlier` holds a record refused as `earlier_steps_open`: {body, steps}; skipEarlier() sends it again with `skip_earlier`.
export const useSuggestionStore = defineStore('suggestion', {
  state: () => ({ phase: 'idle', lineId: '', suggestion: null, history: [], cycles: [], error: '', busy: false, updating: false, pending: null, earlier: null, tracked: '', run: 0 }),
  getters: {
    groups: (s) => s.suggestion?.groups ?? { recommended: [], eligible: [], excluded: [] },
    units() { return [...this.groups.recommended, ...this.groups.eligible, ...this.groups.excluded]; },
    days: (s) => s.suggestion?.schedule ?? [],
    revision: (s) => s.suggestion?.revision ?? null,
  },
  actions: {
    stop() { this.run++; },
    async _read() {
      const [suggestion, line] = await Promise.all([api.get(`${base}/lines/${e(this.lineId)}/suggestion`), api.get(`${base}/lines/${e(this.lineId)}`)]);
      const history = [...(line.applications ?? [])].sort((a, b) => a.applied_on.localeCompare(b.applied_on));
      Object.assign(this, { suggestion, history, cycles: line.cycles ?? [], updating: suggestion.running });
    },
    // Read the line's suggestion; while a newer run is in progress keep reading until it is done.
    async load(lineId, wait = sleep) {
      this.run++; const run = this.run;
      Object.assign(this, { phase: 'loading', lineId, suggestion: null, history: [], cycles: [], error: '', busy: false, updating: false, pending: null, earlier: null });
      try {
        await this._read();
        if (run !== this.run) return;
        this.phase = 'ready';
        if (this.updating) await this.follow(null, wait, run);
      } catch (err) {
        if (run !== this.run) return;
        Object.assign(this, err.code === 'unknown_line' || err.code === 'unknown_cycle' ? { phase: 'notfound' } : { phase: 'error', error: messageFor(err) });
      }
    },
    // Poll the suggestion until no run is in progress and, when `target` names a cycle, until that cycle is the revision.
    // Returns ready, unchanged (the run finished and left the suggestion as it was), failed (the run failed), timeout, error or stopped.
    async follow(target, wait = sleep, run = this.run) {
      let failures = 0;
      this.updating = true;
      for (let i = 0; i < POLL_LIMIT; i++) {
        if (run !== this.run) return 'stopped';
        try {
          await this._read(); failures = 0;
          if (run !== this.run) return 'stopped';
          this.phase = 'ready';
          const s = this.suggestion;
          if (!s.running && (!target || s.revision === target)) { this.updating = false; return 'ready'; }
          if (!s.running && target) {
            // The suggestion shows the latest run that changed something, so a run that changed nothing never becomes its revision.
            const status = (await api.get(`${base}/cycles/${e(target)}`).catch(() => null))?.status;
            if (status === 'failed' || status === 'done') { this.updating = false; return status === 'failed' ? 'failed' : 'unchanged'; }
          }
        } catch (err) {
          // The first run of a line has no suggestion until it is done; any other blip gives up after three in a row.
          if (!(target && err.code === 'unknown_cycle') && ++failures >= 3) { this.updating = false; this.error = messageFor(err); return 'error'; }
        }
        if (i < POLL_LIMIT - 1) await wait(POLL_MS);
      }
      if (run === this.run) this.updating = false;
      return 'timeout';
    },
    // Follow the run a scan started on a line; `tracked` ends as ready, unchanged, failed, timeout or error.
    async track(lineId, cycleId, wait = sleep) {
      this.run++; const run = this.run;
      Object.assign(this, { lineId, suggestion: null, history: [], cycles: [], error: '', busy: false, pending: null, tracked: '', phase: 'loading' });
      const out = await this.follow(cycleId, wait, run);
      if (run === this.run) this.tracked = out;
      return out;
    },
    // Submit unconfirmed; a `confirmation_required` answer is not an error, it waits in `pending` for confirm() or cancel().
    // `step` ({step_id, partner_product_id}) records against a plan step.
    async record(productId, appliedOn, wait = sleep, step = {}) { return this._submit({ product_id: productId, applied_on: appliedOn, revision: this.revision, confirmed: false, ...stepFields(step) }, wait); },
    // Resubmit what the scheduler asked to confirm, with the revision it returned.
    async confirm(wait = sleep) { const p = this.pending; return p ? this._submit({ product_id: p.product_id, applied_on: p.applied_on, revision: p.revision, confirmed: true, ...stepFields(p), ...(p.skip_earlier ? { skip_earlier: true } : {}) }, wait) : undefined; },
    // Send the record refused as `earlier_steps_open` again, skipping the earlier steps in the same request.
    async skipEarlier(wait = sleep) { const b = this.earlier?.body; return b ? this._submit({ ...b, skip_earlier: true }, wait) : undefined; },
    cancel() { this.pending = null; this.earlier = null; },
    // Skip a step ({reason} optional), or undo the skip: both start a run, followed like a record. `step_not_open` reads the line again.
    async skip(stepId, reason = null, wait = sleep) { return this._step('post', stepId, reason ? { reason } : undefined, wait); },
    async undoSkip(stepId, wait = sleep) { return this._step('del', stepId, undefined, wait); },
    async _step(verb, stepId, body, wait) {
      if (this.busy) return undefined;
      this.busy = true; this.error = ''; const run = this.run;
      try {
        const out = await api[verb](`${base}/lines/${e(this.lineId)}/steps/${e(stepId)}/skip`, body);
        if (run !== this.run) return 'done';
        if (out.reschedule) { this.busy = false; await this.follow(out.reschedule.cycle_id, wait, run); } else await this._read();
        return 'done';
      } catch (err) {
        if (run !== this.run) return 'error';
        this.error = messageFor(err);
        if (STALE.includes(err.code)) { try { await this._read(); } catch { /* keep the message */ } }
        return 'error';
      } finally { if (run === this.run) this.busy = false; }
    },
    async _submit(body, wait) {
      if (this.busy) return undefined;
      this.busy = true; this.error = ''; this.pending = null; this.earlier = null; const run = this.run;
      try {
        if (!body.product_id) throw Object.assign(new Error('product'), { code: 'validation_error' });
        if (!DATE.test(body.applied_on ?? '')) throw Object.assign(new Error('date'), { code: 'invalid_date' });
        const out = await api.post(`${base}/lines/${e(this.lineId)}/applications`, body);
        if (run !== this.run) return 'recorded';
        // A reschedule means a newer revision is coming: read until it arrives; otherwise read the line again.
        if (out.reschedule) { this.busy = false; await this.follow(out.reschedule.cycle_id, wait, run); } else await this._read();
        return 'recorded';
      } catch (err) {
        if (run !== this.run) return 'error';
        if (err.code === 'confirmation_required') {
          this.pending = { product_id: body.product_id, applied_on: body.applied_on, revision: err.data?.revision ?? body.revision, tier: err.data?.tier ?? null, reason: err.data?.reason ?? null, alerts: err.data?.alerts ?? [], ...stepFields(body), skip_earlier: body.skip_earlier === true };
          return 'confirm';
        }
        if (err.code === 'earlier_steps_open') { this.earlier = { body, steps: err.data?.steps ?? [] }; return 'earlier'; }
        this.error = messageFor(err);
        if (STALE.includes(err.code)) { try { await this._read(); } catch { /* keep the message */ } }
        return 'error';
      } finally { if (run === this.run) this.busy = false; }
    },
  },
});
