import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { setTokenProvider } from '../api.js';
import { useRunModeStore } from './runMode.js';

const json = (status, body) => ({ status, ok: status < 400, json: async () => body });
let fetchMock;

beforeEach(() => {
  setActivePinia(createPinia()); setTokenProvider(() => 'TOK');
  fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => { vi.unstubAllGlobals(); setTokenProvider(() => null); });

describe('runMode', () => {
  it('adopts the mode at start when the route answers', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { mode: 'fail' }));
    const s = useRunModeStore();
    await s.load(true);
    expect(fetchMock.mock.calls.map((c) => `${c[1].method} ${c[0]}`)).toEqual(['GET /api/v1/scheduler/dev/run-mode']);
    expect([s.available, s.mode]).toEqual([true, 'fail']);
  });
  it.each([404, 401, 500])('is unavailable on %i', async (status) => {
    fetchMock.mockResolvedValueOnce(json(status, { error: 'x', detail: 'y' }));
    const s = useRunModeStore();
    await s.load(true);
    expect(s.available).toBe(false);
  });
  it('never calls the route outside a dev build', async () => {
    await useRunModeStore().load(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('set PUTs the mode and adopts the answer', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { mode: 'stuck' }));
    const s = useRunModeStore();
    await s.set('stuck');
    expect(fetchMock.mock.calls[0][1].method).toBe('PUT');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ mode: 'stuck' });
    expect(s.mode).toBe('stuck');
  });
  it('shows an error when set fails and keeps the mode', async () => {
    fetchMock.mockResolvedValueOnce(json(400, { error: 'validation_error', detail: 'mode: bad' }));
    const s = useRunModeStore();
    await s.set('slow');
    expect([s.mode, s.error === '']).toEqual(['normal', false]);
  });
  it('ignores a second call while busy', async () => {
    let release;
    fetchMock.mockReturnValueOnce(new Promise((r) => { release = r; }));
    const s = useRunModeStore();
    const first = s.set('fail');
    await s.set('stuck');
    release(json(200, { mode: 'fail' }));
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
