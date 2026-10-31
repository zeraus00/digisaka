import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { setTokenProvider } from '../api.js';
import { useLinesStore, weekRows, dashboardSummary } from './lines.js';

const json = (status, body) => ({ status, ok: status < 400, json: async () => body });
const status = (id, over = {}) => ({ line_id: id, selections: [], applications: [], latest_cycle: null, human_review_required: false, ...over });
let fetchMock;
beforeEach(() => { setActivePinia(createPinia()); setTokenProvider(() => 'TOK'); fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => { vi.unstubAllGlobals(); setTokenProvider(() => null); });

describe('lines store', () => {
  it('loads every line status and keeps those with selections for the schedule list', async () => {
    const p = { selection_id: 's1', origin_cycle_id: 'c1', origin_week: '2026-W24', status: 'draft', products: ['u-a'] };
    fetchMock.mockImplementation(async (url) => {
      if (url.endsWith('/lines')) return json(200, { lines: ['L03', 'L04'] });
      return json(200, status(url.endsWith('L04') ? 'L04' : 'L03', url.endsWith('L04') ? { selections: [p] } : {}));
    });
    const s = useLinesStore();
    await s.load();
    expect(s.statuses.map((l) => l.line_id)).toEqual(['L03', 'L04']);
    expect(s.withSelections.map((l) => l.line_id)).toEqual(['L04']);
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
  it('lists the weeks that used a Selection newest first, a continued week naming the Selection it kept, with the application dates', () => {
    const line = status('L04', {
      selections: [{ selection_id: 'a', origin_week: '2026-W22', status: 'approved' }],
      cycles: [
        { cycle_id: 'c3', week: '2026-W24', selection_id: null, continued: false },
        { cycle_id: 'c2', week: '2026-W23', selection_id: 'a', continued: true },
        { cycle_id: 'c1', week: '2026-W22', selection_id: 'a', continued: false },
      ],
      applications: [{ selection_id: 'a', applied_on: '2026-06-12' }, { selection_id: 'a', applied_on: '2026-06-10' }],
    });
    expect(weekRows(line).map((r) => [r.cycle_id, r.week, r.continued, r.fromWeek, r.appliedOn])).toEqual([
      ['c2', '2026-W23', true, '2026-W22', ['2026-06-10', '2026-06-12']],
      ['c1', '2026-W22', false, '2026-W22', ['2026-06-10', '2026-06-12']],
    ]);
  });
});

describe('dashboardSummary', () => {
  const line = (id, over = {}) => ({ line_id: id, selections: [], applications: [], human_review_required: false, weeks_assessed: 0, leaves_scanned: 0, ...over });
  const prop = (id, week, status) => ({ selection_id: id, origin_week: week, status, origin_cycle_id: 'c' + id });
  const withCycles = (l) => ({ ...l, cycles: l.selections.map((p) => ({ cycle_id: p.origin_cycle_id, week: p.origin_week, selection_id: p.selection_id, continued: false })) });
  it('totals weeks assessed and leaves scanned, and counts selections awaiting a decision', () => {
    const s = dashboardSummary([
      line('L01', { weeks_assessed: 2, leaves_scanned: 9, selections: [prop('a', '2026-W22', 'draft'), prop('b', '2026-W23', 'approved')] }),
      line('L02', { weeks_assessed: 1, leaves_scanned: 4, human_review_required: true, selections: [prop('c', '2026-W24', 'draft')] }),
    ].map(withCycles));
    expect(s).toMatchObject({ lines: 2, weeksAssessed: 3, leavesScanned: 13, awaitingDecision: 2, humanReview: 1 });
  });
  it('lists recent selections newest week first, at most five, with their line', () => {
    const s = dashboardSummary([
      line('L01', { selections: ['01', '02', '03', '04'].map((w, i) => prop('x' + i, '2026-W' + w, 'draft')) }),
      line('L02', { selections: [prop('y', '2026-W24', 'approved'), prop('z', '2026-W10', 'rejected')] }),
    ].map(withCycles));
    expect(s.recent).toHaveLength(5);
    expect(s.recent[0]).toMatchObject({ lineId: 'L02', week: '2026-W24', status: 'approved' });
  });
  it('treats a line that failed to load, with no counts, as zero', () => {
    expect(dashboardSummary([{ line_id: 'L09', selections: [], applications: [], error: 'x' }])).toMatchObject({ weeksAssessed: 0, leavesScanned: 0, awaitingDecision: 0 });
  });
});
