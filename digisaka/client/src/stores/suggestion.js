import { defineStore } from 'pinia';
import { api } from '../api.js';
import { messageFor } from '../helpers/messages.js';
import { POLL_MS, POLL_LIMIT } from './cycle.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const base = '/api/v1/scheduler';
const e = encodeURIComponent;
// A unit id is `Option|Product`; the scheduler records and checks the product alone.
export const productOf = (unitId) => unitId.split('|').pop();
const DATE = /^\d{4}-\d{2}-\d{2}$/;
// Codes that mean the line moved on under the screen: show the real state again.
const STALE = ['application_already_recorded'];

// A line's current treatment suggestion, the line's recorded applications, and recording against it.
// phase: idle, loading, ready, notfound, error. `updating` is true while a newer run is in progress.
// `pending` holds a record the scheduler asked to confirm: {product_id, applied_on, revision, tier, alerts}.
export const useSuggestionStore = defineStore('suggestion', {
  state: () => ({ phase: 'idle', lineId: '', suggestion: null, history: [], cycles: [], error: '', busy: false, updating: false, pending: null, run: 0 }),
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
      Object.assign(this, { phase: 'loading', lineId, suggestion: null, history: [], cycles: [], error: '', busy: false, updating: false, pending: null });
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
    // Returns ready, failed (the run failed), timeout, error or stopped.
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
          if (!s.running && target && (await api.get(`${base}/cycles/${e(target)}`).catch(() => null))?.status === 'failed') { this.updating = false; return 'failed'; }
        } catch (err) {
          // The first run of a line has no suggestion until it is done; any other blip gives up after three in a row.
          if (!(target && err.code === 'unknown_cycle') && ++failures >= 3) { this.updating = false; this.error = messageFor(err); return 'error'; }
        }
        if (i < POLL_LIMIT - 1) await wait(POLL_MS);
      }
      if (run === this.run) this.updating = false;
      return 'timeout';
    },
    // Submit unconfirmed; a `confirmation_required` answer is not an error, it waits in `pending` for confirm() or cancel().
    async record(productId, appliedOn, wait = sleep) { return this._submit({ product_id: productId, applied_on: appliedOn, revision: this.revision, confirmed: false }, wait); },
    // Resubmit what the scheduler asked to confirm, with the revision it returned.
    async confirm(wait = sleep) { const p = this.pending; return p ? this._submit({ product_id: p.product_id, applied_on: p.applied_on, revision: p.revision, confirmed: true }, wait) : undefined; },
    cancel() { this.pending = null; },
    async _submit(body, wait) {
      if (this.busy) return undefined;
      this.busy = true; this.error = ''; this.pending = null; const run = this.run;
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
          this.pending = { product_id: body.product_id, applied_on: body.applied_on, revision: err.data?.revision ?? body.revision, tier: err.data?.tier ?? null, alerts: err.data?.alerts ?? [] };
          return 'confirm';
        }
        this.error = messageFor(err);
        if (STALE.includes(err.code)) { try { await this._read(); } catch { /* keep the message */ } }
        return 'error';
      } finally { if (run === this.run) this.busy = false; }
    },
  },
});
