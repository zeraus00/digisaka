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
