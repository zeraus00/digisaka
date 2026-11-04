import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { setTokenProvider } from '../api.js';
import { useLinesStore, weekRows, dashboardSummary, cycleLabel } from './lines.js';

const json = (status, body) => ({ status, ok: status < 400, json: async () => body });
const status = (id, over = {}) => ({ line_id: id, cycles: [], applications: [], latest_cycle: null, human_review_required: false, ...over });
let fetchMock;
beforeEach(() => { setActivePinia(createPinia()); setTokenProvider(() => 'TOK'); fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => { vi.unstubAllGlobals(); setTokenProvider(() => null); });

describe('lines store', () => {
  it('loads every line status and keeps those with finished weeks for the schedule list', async () => {
    const c = { cycle_id: 'c1', week: '2026-W24', status: 'done', outcome: 'suggested', outcome_reason: null };
    fetchMock.mockImplementation(async (url) => {
      if (url.endsWith('/lines')) return json(200, { lines: ['L03', 'L04'] });
      return json(200, status(url.endsWith('L04') ? 'L04' : 'L03', url.endsWith('L04') ? { cycles: [c] } : {}));
    });
    const s = useLinesStore();
    await s.load();
    expect(s.statuses.map((l) => l.line_id)).toEqual(['L03', 'L04']);
    expect(s.withCycles.map((l) => l.line_id)).toEqual(['L04']);
    expect(s.error).toBe('');
  });
  it('a line with no history is listed, not an error', async () => {
    fetchMock.mockImplementation(async (url) => (url.endsWith('/lines') ? json(200, { lines: ['L01'] }) : json(200, status('L01'))));
    const s = useLinesStore();
    await s.load();
    expect(s.statuses).toHaveLength(1);
    expect(s.error).toBe('');
  });
  it('one failing line does not hide the others', async () => {
    fetchMock.mockImplementation(async (url) => {
      if (url.endsWith('/lines')) return json(200, { lines: ['L01', 'L02'] });
      return url.endsWith('L01') ? json(404, { error: 'unknown_line', detail: 'x' }) : json(200, status('L02'));
    });
    const s = useLinesStore();
    await s.load();
    expect(s.statuses[0]).toMatchObject({ line_id: 'L01', error: 'That line does not exist.' });
    expect(s.statuses[1].error).toBeUndefined();
  });
  it('shows an error when the line list cannot be loaded', async () => {
    fetchMock.mockResolvedValue(json(403, { error: 'forbidden', detail: 'x' }));
    const s = useLinesStore();
    await s.load();
    expect(s.error).toBe('This account is not a Practitioner.');
    expect(s.loading).toBe(false);
  });
});

describe('weekRows', () => {
  it('lists the finished weeks newest first with a plain label for each outcome', () => {
    const line = status('L04', {
      cycles: [
        { cycle_id: 'c1', week: '2026-W22', status: 'done', outcome: 'continue_monitoring', outcome_reason: null },
        { cycle_id: 'c3', week: '2026-W24', status: 'done', outcome: 'suggested', outcome_reason: null },
        { cycle_id: 'c2', week: '2026-W23', status: 'failed', outcome: 'human_review_required', outcome_reason: 'x' },
      ],
    });
    expect(weekRows(line).map((r) => [r.cycle_id, r.label])).toEqual([
      ['c3', 'Suggestion ready'], ['c2', 'Run failed'], ['c1', 'Continue monitoring'],
    ]);
    expect(cycleLabel({ status: 'done', outcome: 'human_review_required' })).toBe('Human review required');
  });
});

describe('dashboardSummary', () => {
  const cyc = (week, outcome = 'suggested') => ({ cycle_id: 'c' + week, week, status: 'done', outcome, outcome_reason: null });
  const line = (id, over = {}) => ({ line_id: id, cycles: [], applications: [], human_review_required: false, weeks_assessed: 0, leaves_scanned: 0, ...over });
  it('totals weeks assessed, leaves scanned and recorded applications', () => {
    const s = dashboardSummary([
      line('L01', { weeks_assessed: 2, leaves_scanned: 9, applications: [{ application_id: 'a' }, { application_id: 'b' }] }),
      line('L02', { weeks_assessed: 1, leaves_scanned: 4, human_review_required: true }),
    ]);
    expect(s).toMatchObject({ lines: 2, weeksAssessed: 3, leavesScanned: 13, applications: 2, humanReview: 1 });
  });
  it('lists recent results newest week first, at most five, with their line', () => {
    const s = dashboardSummary([
      line('L01', { cycles: ['01', '02', '03', '04'].map((w) => cyc('2026-W' + w)) }),
      line('L02', { cycles: [cyc('2026-W24', 'human_review_required'), cyc('2026-W10')] }),
    ]);
    expect(s.recent).toHaveLength(5);
    expect(s.recent[0]).toMatchObject({ lineId: 'L02', week: '2026-W24', label: 'Human review required' });
  });
  it('treats a line that failed to load, with no counts, as zero', () => {
    expect(dashboardSummary([{ line_id: 'L09', cycles: [], applications: [], error: 'x' }])).toMatchObject({ weeksAssessed: 0, leavesScanned: 0, applications: 0 });
  });
});
