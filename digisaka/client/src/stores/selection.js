import { defineStore } from 'pinia';
import { api } from '../api.js';
import { messageFor } from '../helpers/messages.js';

const base = '/api/v1/scheduler';
const e = encodeURIComponent;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
// Codes that mean another tab or an earlier request got there first: show the real state again.
const STALE = ['selection_not_draft', 'selection_not_renewable', 'application_already_recorded'];

// One line-week's Selection for the treatment detail screen.
// phase: idle, loading, ready, notfound, error. status: draft, approved, rejected, superseded, ended.
export const useSelectionStore = defineStore('selection', {
  state: () => ({ phase: 'idle', lineId: '', week: '', payload: null, cycle: null, applications: [], error: '', busy: false, run: 0 }),
  getters: {
    selection: (s) => s.payload?.selection ?? null,
    preview: (s) => s.payload?.preview ?? null,
    status: (s) => s.payload?.selection.status ?? null,
    humanReview: (s) => s.cycle?.outcome === 'human_review_required',
    // The alerts the Practitioner has to acknowledge before approving or renewing.
    required: (s) => s.payload?.selection.acknowledgements_required ?? [],
  },
  actions: {
    // The selection's payload and cycle, and the applications recorded against it.
    async _fetch(lineId, originCycleId, selectionId) {
      const [payload, cycle, line] = await Promise.all([
        api.get(`${base}/cycles/${e(originCycleId)}/selection`),
        api.get(`${base}/cycles/${e(originCycleId)}`),
        api.get(`${base}/lines/${e(lineId)}`),
      ]);
      return { payload, cycle, applications: (line.applications ?? []).filter((a) => a.selection_id === selectionId) };
    },
    async load(lineId, week) {
      this.run++; const run = this.run;
      Object.assign(this, { phase: 'loading', lineId, week, payload: null, cycle: null, applications: [], error: '', busy: false });
      try {
        const line = await api.get(`${base}/lines/${e(lineId)}`);
        const ls = (line.selections ?? []).filter((x) => x.origin_week === week).pop();
        if (!ls) { if (run === this.run) this.phase = 'notfound'; return; }
        const got = await this._fetch(lineId, ls.origin_cycle_id, ls.selection_id);
        if (run !== this.run) return;
        Object.assign(this, { ...got, phase: 'ready' });
      } catch (err) {
        if (run !== this.run) return;
        Object.assign(this, err.code === 'unknown_line' || err.code === 'unknown_selection' ? { phase: 'notfound' } : { phase: 'error', error: messageFor(err) });
      }
    },
    async _reload() { try { await this.load(this.lineId, this.week); } catch { /* keep the message */ } },
    async _act(work) {
      if (this.busy) return;
      this.busy = true; this.error = ''; const run = this.run;
      try {
        await work();
        if (run === this.run) Object.assign(this, await this._fetch(this.lineId, this.cycle.cycle_id, this.selection.selection_id));
      } catch (err) {
        const msg = messageFor(err);
        if (STALE.includes(err.code)) { await this._reload(); this.error = msg; }
        else if (run === this.run) this.error = msg;
      } finally { if (run === this.run) this.busy = false; }
    },
    _body(note, acknowledged) { return { ...(acknowledged ? { acknowledged } : {}), ...(note?.trim() ? { note: note.trim() } : {}) }; },
    approve(acknowledged, note) {
      return this._act(() => api.post(`${base}/selections/${e(this.selection.selection_id)}/approval`, this._body(note, acknowledged ?? [])));
    },
    reject(note) {
      return this._act(() => api.post(`${base}/selections/${e(this.selection.selection_id)}/rejection`, this._body(note)));
    },
    renew(acknowledged, note) {
      return this._act(() => api.post(`${base}/selections/${e(this.selection.selection_id)}/renewal`, this._body(note, acknowledged ?? [])));
    },
    apply(productId, appliedOn) {
      return this._act(async () => {
        if (!productId) throw Object.assign(new Error('product'), { code: 'validation_error' });
        if (!DATE.test(appliedOn ?? '')) throw Object.assign(new Error('date'), { code: 'invalid_date' });
        await api.post(`${base}/selections/${e(this.selection.selection_id)}/applications`, { product_id: productId, applied_on: appliedOn });
      });
    },
  },
});
