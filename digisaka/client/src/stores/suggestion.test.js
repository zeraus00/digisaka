import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { setTokenProvider } from '../api.js';
import { useSuggestionStore } from './suggestion.js';

const json = (status, body) => ({ status, ok: status < 400, json: async () => body });
const sug = (revision, over = {}) => ({ revision, running: false, groups: { recommended: [], eligible: [], excluded: [] }, schedule: [], ...over });
let fetchMock, wait;

// Answers by route, in order for each: [suggestion reads], [cycle reads].
function serve({ suggestions, cycles }) {
  fetchMock.mockImplementation(async (url) => {
    if (url.endsWith('/suggestion')) return json(200, suggestions.length > 1 ? suggestions.shift() : suggestions[0]);
    if (url.includes('/cycles/')) return json(200, cycles.length > 1 ? cycles.shift() : cycles[0]);
    return json(200, { line_id: 'L10', applications: [], cycles: [] });
  });
}
const cycleReads = () => fetchMock.mock.calls.filter((c) => c[0].includes('/cycles/')).length;

beforeEach(() => {
  setActivePinia(createPinia()); setTokenProvider(() => 'TOK');
  fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock); wait = vi.fn(async () => {});
});
afterEach(() => { vi.unstubAllGlobals(); setTokenProvider(() => null); });

describe('follow a scan run', () => {
  it('stops with unchanged when the run is done and the suggestion keeps its old revision', async () => {
    serve({ suggestions: [sug('old')], cycles: [{ cycle_id: 'new', status: 'done' }] });
    const s = useSuggestionStore(); s.lineId = 'L10';
    expect(await s.follow('new', wait)).toBe('unchanged');
    expect(cycleReads()).toBe(1);
    expect(wait).not.toHaveBeenCalled();
    expect(s.updating).toBe(false);
  });
  it('is ready once the suggestion carries the new revision', async () => {
    serve({ suggestions: [sug('new')], cycles: [{ cycle_id: 'new', status: 'done' }] });
    const s = useSuggestionStore(); s.lineId = 'L10';
    expect(await s.follow('new', wait)).toBe('ready');
  });
  it('keeps polling while the run itself has not finished', async () => {
    serve({ suggestions: [sug('old'), sug('new')], cycles: [{ cycle_id: 'new', status: 'running' }] });
    const s = useSuggestionStore(); s.lineId = 'L10';
    expect(await s.follow('new', wait)).toBe('ready');
    expect(wait).toHaveBeenCalledTimes(1);
  });
  it('reports a failed run', async () => {
    serve({ suggestions: [sug('old')], cycles: [{ cycle_id: 'new', status: 'failed' }] });
    const s = useSuggestionStore(); s.lineId = 'L10';
    expect(await s.follow('new', wait)).toBe('failed');
  });
});

describe('record against a step', () => {
  const err = (status, code, data) => json(status, { error: code, ...data });
  const posts = () => fetchMock.mock.calls.filter((c) => c[1]?.method === 'POST').map((c) => JSON.parse(c[1].body));
  const post = (...answers) => {
    fetchMock.mockImplementation(async (url, init) => {
      if (init?.method === 'POST') return answers.length > 1 ? answers.shift() : answers[0];
      if (url.endsWith('/suggestion')) return json(200, sug('r1'));
      return json(200, { line_id: 'L10', applications: [], cycles: [] });
    });
  };
  it('sends step_id and partner_product_id; earlier_steps_open waits in `earlier`, skipEarlier sends it again with skip_earlier', async () => {
    post(err(409, 'earlier_steps_open', { steps: [{ step_id: 's1', product: 'a' }] }), json(201, { application: {} }));
    const s = useSuggestionStore(); s.lineId = 'L10';
    expect(await s.record('P', '2026-06-05', wait, { step_id: 's2', partner_product_id: 'M' })).toBe('earlier');
    expect(s.earlier.steps).toEqual([{ step_id: 's1', product: 'a' }]);
    expect(posts()[0]).toMatchObject({ product_id: 'P', step_id: 's2', partner_product_id: 'M', confirmed: false });
    expect(await s.skipEarlier(wait)).toBe('recorded');
    expect(posts()[1]).toMatchObject({ step_id: 's2', partner_product_id: 'M', skip_earlier: true });
    expect(s.earlier).toBeNull();
  });
  it('a confirmation keeps the step, the partner and skip_earlier for the resend', async () => {
    post(err(409, 'confirmation_required', { revision: 'r1', alerts: [{ id: 'a', kind: 'off_plan' }] }), json(201, { application: {} }));
    const s = useSuggestionStore(); s.lineId = 'L10';
    expect(await s.record('P', '2026-06-05', wait, { step_id: 's2' })).toBe('confirm');
    expect(s.pending).toMatchObject({ step_id: 's2', skip_earlier: false });
    expect(await s.confirm(wait)).toBe('recorded');
    expect(posts()[1]).toMatchObject({ step_id: 's2', confirmed: true });
    expect(posts()[1].skip_earlier).toBeUndefined();
  });
  it('a plain record sends no step fields; step_not_open reads the line again and cancel clears earlier', async () => {
    post(err(409, 'step_not_open', {}));
    const s = useSuggestionStore(); s.lineId = 'L10';
    expect(await s.record('P', '2026-06-05', wait)).toBe('error');
    expect(Object.keys(posts()[0])).toEqual(['product_id', 'applied_on', 'revision', 'confirmed']);
    s.earlier = { body: {}, steps: [] }; s.cancel();
    expect(s.earlier).toBeNull();
  });
});
