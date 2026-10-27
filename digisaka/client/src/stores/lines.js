import { defineStore } from 'pinia';
import { api } from '../api.js';
import { messageFor } from '../helpers/messages.js';

const base = '/api/v1/scheduler';

// Each line's status (latest cycle, selections, recorded applications) from the scheduler.
export const useLinesStore = defineStore('lines', {
  state: () => ({ statuses: [], loading: false, error: '', loaded: false }),
  getters: {
    withSelections: (s) => s.statuses.filter((l) => l.selections?.length),
  },
  actions: {
    async load() {
      this.loading = true; this.error = '';
      try {
        const ids = (await api.get(`${base}/lines`)).lines ?? [];
        // One line failing to load must not hide the others.
        const results = await Promise.allSettled(ids.map((id) => api.get(`${base}/lines/${encodeURIComponent(id)}`)));
        this.statuses = results.map((r, i) => (r.status === 'fulfilled'
          ? r.value
          : { line_id: ids[i], selections: [], applications: [], latest_cycle: null, human_review_required: false, error: messageFor(r.reason) }));
      } catch (e) { this.error = messageFor(e); this.statuses = []; }
      finally { this.loading = false; this.loaded = true; }
    },
    byId(id) { return this.statuses.find((l) => l.line_id === id); },
  },
});

// Selections newest origin week first, each with the dates its applications were recorded.
export function selectionRows(line) {
  return [...(line.selections ?? [])]
    .sort((a, b) => b.origin_week.localeCompare(a.origin_week))
    .map((x) => ({ ...x, week: x.origin_week, appliedOn: (line.applications ?? []).filter((a) => a.selection_id === x.selection_id).map((a) => a.applied_on).sort() }));
}

// Totals and the newest selections across all lines, for the dashboard.
export function dashboardSummary(statuses) {
  const sum = (key) => statuses.reduce((n, l) => n + (l[key] ?? 0), 0);
  const rows = statuses.flatMap((l) => (l.selections ?? []).map((x) => ({ lineId: l.line_id, week: x.origin_week, status: x.status })));
  return {
    lines: statuses.length,
    weeksAssessed: sum('weeks_assessed'),
    leavesScanned: sum('leaves_scanned'),
    awaitingDecision: rows.filter((r) => r.status === 'draft').length,
    humanReview: statuses.filter((l) => l.human_review_required).length,
    recent: rows.sort((a, b) => b.week.localeCompare(a.week) || a.lineId.localeCompare(b.lineId)).slice(0, 5),
  };
}
