import { defineStore } from 'pinia';
import { api } from '../api.js';
import { messageFor } from '../helpers/messages.js';

const URL = '/api/v1/scheduler/dev/run-mode';

// The stub's dev run mode for the next scan runs (stub only; the real scheduler has no such route, so
// `available` stays false there). Same shape as the dev clock store.
export const useRunModeStore = defineStore('runMode', {
  state: () => ({ available: false, mode: 'normal', error: '', busy: false }),
  actions: {
    _take(b) { Object.assign(this, { available: true, mode: b.mode, error: '' }); },
    async load(dev = import.meta.env.DEV) {
      if (!dev) return;
      try { this._take(await api.get(URL)); } catch { this.available = false; }
    },
    async set(mode) {
      if (this.busy) return;
      this.busy = true;
      try { this._take(await api.put(URL, { mode })); } catch (err) { this.error = messageFor(err); } finally { this.busy = false; }
    },
  },
});
