import { defineStore } from 'pinia';
import { api } from '../api.js';
import { messageFor } from '../helpers/messages.js';
import { setToday } from '../helpers/today.js';

const URL = '/api/v1/scheduler/dev/today';

// The scheduler's dev clock (dev and test servers only). `available` is false until the endpoint has
// answered once; then the client's date is the server's, and set/reset move both.
export const useDevClockStore = defineStore('devClock', {
  state: () => ({ available: false, today: null, default: null, pinned: false, error: '', busy: false }),
  actions: {
    _take(b) {
      Object.assign(this, { available: true, today: b.today, default: b.default, pinned: b.pinned, error: '' });
      setToday(b.today);
    },
    async load(dev = import.meta.env.DEV) {
      if (!dev) return;
      try { this._take(await api.get(URL)); } catch { this.available = false; }
    },
    set(day) { return this._call(() => api.put(URL, { today: day })); },
    reset() { return this._call(() => api.del(URL)); },
    async _call(fn) {
      if (this.busy) return;
      this.busy = true;
      try { this._take(await fn()); } catch (err) { this.error = messageFor(err); } finally { this.busy = false; }
    },
  },
});
