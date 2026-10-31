import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { setTokenProvider } from '../api.js';
import { useCycleStore, POLL_LIMIT } from './cycle.js';

const json = (status, body) => ({ status, ok: status < 400, json: async () => body });
const cyc = (over = {}) => ({ cycle_id: 'c1', line_id: 'L04', week: '2026-W24', status: 'running', outcome: null, outcome_reason: null, failure_reason: null, ...over });
const done = (over) => cyc({ status: 'done', outcome: 'awaiting_decision', ...over });
let fetchMock, wait;

beforeEach(() => {
  setActivePinia(createPinia()); setTokenProvider(() => 'TOK');
  fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock); wait = vi.fn(async () => {});
});
afterEach(() => { vi.unstubAllGlobals(); setTokenProvider(() => null); });
const urls = () => fetchMock.mock.calls.map((c) => `${c[1].method} ${c[0]}`);

describe('attach', () => {
  it('reads the cycle, polls while running, and ends ready', async () => {
    fetchMock.mockResolvedValueOnce(json(200, cyc())).mockResolvedValueOnce(json(200, cyc())).mockResolvedValueOnce(json(200, done()));
    const s = useCycleStore();
    await s.attach('c1', wait);
    expect(urls()).toEqual(Array(3).fill('GET /api/v1/scheduler/cycles/c1'));
    expect(wait).toHaveBeenCalledTimes(1);
    expect(s.phase).toBe('ready');
  });
  it('ends in human review with the reason on the cycle', async () => {
    fetchMock.mockResolvedValue(json(200, done({ outcome: 'human_review_required', outcome_reason: 'missing_feed_value' })));
    const s = useCycleStore();
    await s.attach('c1', wait);
    expect(s.phase).toBe('review');
    expect(s.cycle.outcome_reason).toBe('missing_feed_value');
  });
  it('ends in monitoring when no treatment is needed', async () => {
    fetchMock.mockResolvedValue(json(200, done({ outcome: 'continue_monitoring', outcome_reason: 'disease_not_worsening' })));
    const s = useCycleStore();
    await s.attach('c1', wait);
    expect(s.phase).toBe('monitoring');
  });
  it('times out after the poll limit', async () => {
    fetchMock.mockResolvedValue(json(200, cyc()));
    const s = useCycleStore();
    await s.attach('c1', wait);
    expect(s.phase).toBe('timeout');
    expect(fetchMock).toHaveBeenCalledTimes(1 + POLL_LIMIT);
  });
  it('gives up after three failed polls in a row', async () => {
    fetchMock.mockResolvedValueOnce(json(200, cyc())).mockResolvedValue(json(500, {}));
    const s = useCycleStore();
    await s.attach('c1', wait);
    expect(s.phase).toBe('error');
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
  it('stops polling when stop() is called', async () => {
    fetchMock.mockResolvedValue(json(200, cyc()));
    const s = useCycleStore();
    wait.mockImplementation(async () => s.stop());
    await s.attach('c1', wait);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(s.phase).toBe('running');
  });
});

describe('failed cycle and retry', () => {
  it('shows failed with the reason, and retry runs a new cycle to its end', async () => {
    fetchMock.mockResolvedValue(json(200, cyc({ status: 'failed', failure_reason: 'boom' })));
    const s = useCycleStore();
    await s.attach('c1', wait);
    expect(s.phase).toBe('failed');
    expect(s.cycle.failure_reason).toBe('boom');
    fetchMock.mockClear();
    fetchMock.mockResolvedValueOnce(json(202, cyc({ cycle_id: 'c2' }))).mockResolvedValueOnce(json(200, done({ cycle_id: 'c2' })));
    await s.retry(wait);
    expect(urls()).toEqual(['POST /api/v1/scheduler/cycles/c1/retry', 'GET /api/v1/scheduler/cycles/c2']);
    expect(s.phase).toBe('ready');
  });
  it('stays failed with a message when retry is refused', async () => {
    fetchMock.mockResolvedValue(json(200, cyc({ status: 'failed' })));
    const s = useCycleStore();
    await s.attach('c1', wait);
    fetchMock.mockResolvedValueOnce(json(409, { error: 'cycle_slot_taken', detail: 'x' }));
    await s.retry(wait);
    expect(s).toMatchObject({ phase: 'failed', error: expect.stringMatching(/Another cycle is already running/) });
  });
});
