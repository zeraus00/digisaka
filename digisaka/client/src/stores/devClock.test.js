import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { setTokenProvider } from '../api.js';
import { todayIso, setToday } from '../helpers/today.js';
import { useDevClockStore } from './devClock.js';

const json = (status, body) => ({ status, ok: status < 400, json: async () => body });
const view = (today, pinned = true) => ({ today, default: '2026-06-08', pinned });
let fetchMock;

beforeEach(() => {
  setActivePinia(createPinia()); setTokenProvider(() => 'TOK');
  fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => { vi.unstubAllGlobals(); setTokenProvider(() => null); setToday('2026-06-08'); });
const urls = () => fetchMock.mock.calls.map((c) => `${c[1].method} ${c[0]}`);

describe('devClock', () => {
  it('adopts the server date at start when the endpoint answers', async () => {
    fetchMock.mockResolvedValueOnce(json(200, view('2026-06-15')));
    const s = useDevClockStore();
    await s.load(true);
    expect(urls()).toEqual(['GET /api/v1/scheduler/dev/today']);
    expect([s.available, s.today, s.default, s.pinned]).toEqual([true, '2026-06-15', '2026-06-08', true]);
    expect(todayIso()).toBe('2026-06-15');
  });
  it.each([404, 401, 403, 500])('keeps the constant and is unavailable on %i', async (status) => {
    fetchMock.mockResolvedValueOnce(json(status, { error: 'x', detail: 'y' }));
    const s = useDevClockStore();
    await s.load(true);
    expect(s.available).toBe(false);
    expect(todayIso()).toBe('2026-06-08');
  });
  it('is unavailable on a network failure', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('network'));
    const s = useDevClockStore();
    await s.load(true);
    expect(s.available).toBe(false);
  });
  it('never calls the endpoint outside a dev build', async () => {
    await useDevClockStore().load(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('set and reset call PUT and DELETE and move the date', async () => {
    fetchMock.mockResolvedValueOnce(json(200, view('2026-06-15'))).mockResolvedValueOnce(json(200, view('2026-06-08', false)));
    const s = useDevClockStore();
    await s.set('2026-06-15');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ today: '2026-06-15' });
    expect(todayIso()).toBe('2026-06-15');
    await s.reset();
    expect(urls()).toEqual(['PUT /api/v1/scheduler/dev/today', 'DELETE /api/v1/scheduler/dev/today']);
    expect([todayIso(), s.pinned]).toEqual(['2026-06-08', false]);
  });
  it('keeps the date and shows an error when set fails', async () => {
    fetchMock.mockResolvedValueOnce(json(400, { error: 'validation_error', detail: 'today: must be YYYY-MM-DD' }));
    const s = useDevClockStore();
    await s.set('nope');
    expect(todayIso()).toBe('2026-06-08');
    expect(s.error).not.toBe('');
  });
});
