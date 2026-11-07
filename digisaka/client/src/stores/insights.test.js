import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { setTokenProvider } from '../api.js';
import { useInsightsStore } from './insights.js';

const json = (status, body) => ({ status, ok: status < 400, json: async () => body });
const payload = (line, week) => ({
  line_id: line, week,
  series: [{ week: '2026-W22', yls: 7, functional_leaves: 7, leaf_wetness_hours: 30.5 }, { week: '2026-W23', yls: 6, functional_leaves: null, leaf_wetness_hours: 28 }, { week: '2026-W24', yls: null, functional_leaves: null, leaf_wetness_hours: null }],
  history: [{ applied_on: '2026-05-12', product: 'A' }, { applied_on: '2026-06-02', product: 'B' }, { applied_on: '2026-05-26', product: 'C' }],
});
let fetchMock;

beforeEach(() => { setActivePinia(createPinia()); setTokenProvider(() => 'TOK'); fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => { vi.unstubAllGlobals(); setTokenProvider(() => null); });

describe('insights store', () => {
  it('loads a line and week, encoding both in the URL', async () => {
    fetchMock.mockResolvedValue(json(200, payload('L 04/x', '2026-W24')));
    const s = useInsightsStore();
    await s.load('L 04/x', '2026-W24');
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/scheduler/lines/L%2004%2Fx/weeks/2026-W24/insights');
    expect(s).toMatchObject({ phase: 'ready', lineId: 'L 04/x', week: '2026-W24' });
  });
  it('latest() skips nulls and returns the week; lastTreatment is the newest application', async () => {
    fetchMock.mockResolvedValue(json(200, payload('L04', '2026-W24')));
    const s = useInsightsStore();
    await s.load('L04', '2026-W24');
    expect(s.latest('yls')).toMatchObject({ week: '2026-W23', yls: 6 });
    expect(s.latest('functional_leaves')).toMatchObject({ week: '2026-W22' });
    expect(s.latest('rainfall_mm')).toBeNull();
    expect(s.latest('leaf_wetness_hours')).toMatchObject({ week: '2026-W23', leaf_wetness_hours: 28 });
    expect(s.lastTreatment.product).toBe('B');
  });
  it('getters are empty before a load', () => {
    const s = useInsightsStore();
    expect([s.latest('yls'), s.lastTreatment]).toEqual([null, null]);
  });
  it('drops a stale response from an earlier line or week', async () => {
    let first;
    fetchMock.mockImplementationOnce(() => new Promise((r) => { first = r; })).mockResolvedValueOnce(json(200, payload('L05', '2026-W24')));
    const s = useInsightsStore();
    const slow = s.load('L04', '2026-W24');
    await s.load('L05', '2026-W24');
    first(json(200, payload('L04', '2026-W24')));
    await slow;
    expect(s.data.line_id).toBe('L05');
  });
  it('shows a readable error on failure', async () => {
    fetchMock.mockResolvedValue(json(500, {}));
    const s = useInsightsStore();
    await s.load('L04', '2026-W24');
    expect(s.phase).toBe('error');
    expect(s.error).toBeTruthy();
    expect(s.data).toBeNull();
  });
  it('goes idle without a line or with an invalid week', async () => {
    const s = useInsightsStore();
    await s.load('L04', 'bad');
    await s.load('', '2026-W24');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(s).toMatchObject({ phase: 'idle', data: null });
  });
});
