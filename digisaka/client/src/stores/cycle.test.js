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

describe('close', () => {
  it('closes the week, polls while running, and ends with a selection', async () => {
    fetchMock.mockResolvedValueOnce(json(202, cyc()))
      .mockResolvedValueOnce(json(200, cyc())).mockResolvedValueOnce(json(200, done()));
    const s = useCycleStore();
    await s.close('L04', '2026-W24', wait);
    expect(urls()).toEqual(['POST /api/v1/scheduler/lines/L04/weeks/2026-W24/close', 'GET /api/v1/scheduler/cycles/c1', 'GET /api/v1/scheduler/cycles/c1']);
    expect(wait).toHaveBeenCalledTimes(1);
    expect(s.phase).toBe('selection');
  });
  it('an already closed week leads to the existing cycle', async () => {
    fetchMock.mockResolvedValueOnce(json(200, done())).mockResolvedValueOnce(json(200, done()));
    const s = useCycleStore();
    await s.close('L04', '2026-W24', wait);
    expect(s.phase).toBe('selection');
  });
  it('explains a week with nothing verified and starts no polling', async () => {
    fetchMock.mockResolvedValueOnce(json(409, { error: 'week_not_verified', detail: 'x' }));
    const s = useCycleStore();
    await s.close('L04', '2026-W24', wait);
    expect(s).toMatchObject({ phase: 'idle', error: expect.stringMatching(/Finish at least one scan/) });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('ends in human review with the reason on the cycle', async () => {
    fetchMock.mockResolvedValueOnce(json(202, cyc())).mockResolvedValueOnce(json(200, done({ outcome: 'human_review_required', outcome_reason: 'gate_e_rejected' })));
    const s = useCycleStore();
    await s.close('L04', '2026-W24', wait);
    expect(s.phase).toBe('review');
    expect(s.cycle.outcome_reason).toBe('gate_e_rejected');
  });
  it('ends in monitoring, not a selection, when no treatment is needed', async () => {
    fetchMock.mockResolvedValueOnce(json(202, cyc())).mockResolvedValueOnce(json(200, done({ outcome: 'continue_monitoring', outcome_reason: 'disease_not_worsening' })));
    const s = useCycleStore();
    await s.close('L04', '2026-W24', wait);
    expect(s.phase).toBe('monitoring');
    expect(s.cycle.outcome_reason).toBe('disease_not_worsening');
  });
  it('times out after the poll limit', async () => {
    fetchMock.mockImplementation(async (url, init) => json(init.method === 'POST' ? 202 : 200, cyc()));
    const s = useCycleStore();
    await s.close('L04', '2026-W24', wait);
    expect(s.phase).toBe('timeout');
    expect(fetchMock).toHaveBeenCalledTimes(1 + POLL_LIMIT);
  });
  it('gives up after three failed polls in a row', async () => {
    fetchMock.mockResolvedValueOnce(json(202, cyc())).mockResolvedValue(json(500, {}));
    const s = useCycleStore();
    await s.close('L04', '2026-W24', wait);
    expect(s.phase).toBe('error');
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
  it('stops polling when stop() is called', async () => {
    fetchMock.mockResolvedValueOnce(json(202, cyc())).mockResolvedValue(json(200, cyc()));
    const s = useCycleStore();
    wait.mockImplementation(async () => s.stop());
    await s.close('L04', '2026-W24', wait);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(s.phase).toBe('running');
  });
});

describe('reopen', () => {
  const rejected = () => done({ outcome: 'human_review_required', outcome_reason: 'gate_e_rejected' });
  it('reopens a rejected week, polls the new cycle and ends on its selection', async () => {
    fetchMock.mockResolvedValueOnce(json(202, cyc())).mockResolvedValueOnce(json(200, rejected()));
    const s = useCycleStore();
    await s.close('L04', '2026-W24', wait);
    fetchMock.mockClear();
    fetchMock.mockResolvedValueOnce(json(202, cyc({ cycle_id: 'c2', retry_of: 'c1' }))).mockResolvedValueOnce(json(200, done({ cycle_id: 'c2', retry_of: 'c1' })));
    await s.reopen(wait);
    expect(urls()).toEqual(['POST /api/v1/scheduler/cycles/c1/reopen', 'GET /api/v1/scheduler/cycles/c2']);
    expect(s.phase).toBe('selection');
    expect(s.cycle.cycle_id).toBe('c2');
  });
  it('keeps the rejected cycle on screen with the message when the reopen is refused', async () => {
    fetchMock.mockResolvedValueOnce(json(202, cyc())).mockResolvedValueOnce(json(200, rejected()));
    const s = useCycleStore();
    await s.close('L04', '2026-W24', wait);
    fetchMock.mockResolvedValueOnce(json(409, { error: 'cycle_not_reopenable', detail: 'x' }));
    await s.reopen(wait);
    expect(s.phase).toBe('review');
    expect(s.cycle.cycle_id).toBe('c1');
    expect(s.error).toMatch(/reopened/);
  });
});

describe('follow', () => {
  it('clears a finished cycle that belongs to another line-week', () => {
    const s = useCycleStore();
    Object.assign(s, { phase: 'selection', cycle: done({ line_id: 'L05', week: '2026-W24' }) });
    s.follow('L06', '2026-W24');
    expect(s.phase).toBe('idle');
    expect(s.cycle).toBeNull();
  });
  it('keeps the cycle of the line-week being scanned', () => {
    const s = useCycleStore();
    Object.assign(s, { phase: 'selection', cycle: done({ line_id: 'L06', week: '2026-W24' }) });
    s.follow('L06', '2026-W24');
    expect(s.phase).toBe('selection');
  });
  it('leaves a close in flight alone', () => {
    const s = useCycleStore();
    Object.assign(s, { phase: 'closing', busy: true });
    s.follow('L06', '2026-W24');
    expect(s.phase).toBe('closing');
  });
});

describe('failed cycle and retry', () => {
  it('shows failed with the reason, and retry runs a new cycle to its end', async () => {
    fetchMock.mockResolvedValueOnce(json(200, cyc({ status: 'failed', failure_reason: 'boom' })))
      .mockResolvedValueOnce(json(200, cyc({ status: 'failed', failure_reason: 'boom' })));
    const s = useCycleStore();
    await s.close('L04', '2026-W24', wait);
    expect(s.phase).toBe('failed');
    fetchMock.mockResolvedValueOnce(json(202, cyc({ cycle_id: 'c2' }))).mockResolvedValueOnce(json(200, done({ cycle_id: 'c2' })));
    await s.retry(wait);
    expect(urls().slice(-2)).toEqual(['POST /api/v1/scheduler/cycles/c1/retry', 'GET /api/v1/scheduler/cycles/c2']);
    expect(s.phase).toBe('selection');
  });
  it('stays failed with a message when retry is refused', async () => {
    fetchMock.mockResolvedValue(json(200, cyc({ status: 'failed' })));
    const s = useCycleStore();
    await s.close('L04', '2026-W24', wait);
    fetchMock.mockResolvedValueOnce(json(409, { error: 'cycle_slot_taken', detail: 'x' }));
    await s.retry(wait);
    expect(s).toMatchObject({ phase: 'failed', error: expect.stringMatching(/Another cycle is already running/) });
  });
});
