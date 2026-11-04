import { defineStore } from 'pinia';
import { api } from '../api.js';
import { messageFor } from '../helpers/messages.js';
import { isValidWeek } from '../helpers/week.js';

// A line's insights for a week, as the scheduler serves them (the payload is kept as served).
// phase: idle, loading, ready, error. Every verdict (`risk.result`, `canopy_status`, `group_usage[].status`) is the server's; the getters only pick values.
export const useInsightsStore = defineStore('insights', {
  state: () => ({ phase: 'idle', lineId: '', week: '', data: null, error: '', run: 0 }),
  getters: {
    // The newest series week whose `key` was reported, with its week.
    latest: (s) => (key) => [...(s.data?.series ?? [])].reverse().find((w) => w[key] != null) ?? null,
    lastTreatment: (s) => [...(s.data?.history ?? [])].sort((a, b) => b.applied_on.localeCompare(a.applied_on)).at(0) ?? null,
  },
  actions: {
    async load(lineId, week) {
      this.run++; const run = this.run;
      if (!lineId || !isValidWeek(week)) { Object.assign(this, { phase: 'idle', lineId: '', week: '', data: null, error: '' }); return; }
      Object.assign(this, { phase: 'loading', lineId, week, data: null, error: '' });
      try {
        const data = await api.get(`/api/v1/scheduler/lines/${encodeURIComponent(lineId)}/weeks/${encodeURIComponent(week)}/insights`);
        if (run === this.run) Object.assign(this, { phase: 'ready', data });
      } catch (err) {
        if (run === this.run) Object.assign(this, { phase: 'error', error: messageFor(err) });
      }
    },
  },
});
