import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { setTokenProvider } from '../api.js';
import { useSelectionStore } from './selection.js';

const json = (status, body) => ({ status, ok: status < 400, json: async () => body });
const B = '/api/v1/scheduler';
const period = (start = null) => ({ approval_period_id: start ? 'ap1' : null, start, end: start ? '2026-07-08' : null, days: 30 });
const lineStatus = (over = {}) => ({
  line_id: 'L04',
  selections: [{ selection_id: 's1', origin_cycle_id: 'c1', origin_week: '2026-W24', status: 'draft', products: ['u-a'], approval_period: period(), reselection_required: false }],
  applications: [], ...over,
});
const ACK = { id: 'cc-a', unit_id: 'u-a', kind: 'cannot_check', text: 'No rainfast period.' };
const sel = (status = 'draft', over = {}) => ({
  kg_build: {},
  selection: { selection_id: 's1', line_id: 'L04', status, approval_period: period(status === 'approved' ? '2026-06-08' : null), approvable: true, blockers: [], acknowledgements_required: [ACK], acknowledged: [], units: [{ unit_id: 'u-a', product: 'A', moa: 'D1' }], decided_by: null, decided_at: null, note: null, ...over },
  preview: { alerts: [{ level: 'warning', kind: 'cannot_check', id: 'cc-a', text: 'No rainfast period.', blocks_approval: true }], days: [] },
});
const cyc = (over = {}) => ({ cycle_id: 'c1', line_id: 'L04', week: '2026-W24', status: 'done', outcome: 'awaiting_decision', outcome_reason: null, ...over });
let fetchMock;
const routes = (map) => fetchMock.mockImplementation(async (url, init) => {
  const hit = map[`${init.method} ${url.replace(B, '')}`];
  return hit ? (typeof hit === 'function' ? hit(init) : hit) : json(500, {});
});
const postBody = () => JSON.parse(fetchMock.mock.calls.find((c) => c[1].method === 'POST')[1].body);
const calls = () => fetchMock.mock.calls.map((c) => `${c[1].method} ${c[0].replace(B, '')}`);

beforeEach(() => { setActivePinia(createPinia()); setTokenProvider(() => 'TOK'); fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => { vi.unstubAllGlobals(); setTokenProvider(() => null); });

const loaded = async (extra = {}) => {
  routes({ 'GET /lines/L04': json(200, lineStatus()), 'GET /cycles/c1/selection': json(200, sel()), 'GET /cycles/c1': json(200, cyc()), ...extra });
  const s = useSelectionStore();
  await s.load('L04', '2026-W24');
  return s;
};

describe('load', () => {
  it('loads the week selection and cycle, status draft, with the acknowledgements it needs', async () => {
    const s = await loaded();
    expect(s).toMatchObject({ phase: 'ready', status: 'draft' });
    expect(s.required.map((a) => a.id)).toEqual(['cc-a']);
  });
  it('carries the applications recorded against the selection', async () => {
    const apps = [{ application_id: 'a1', selection_id: 's1', product_id: 'u-a', applied_on: '2026-06-11' }, { application_id: 'a2', selection_id: 'other', product_id: 'u-a', applied_on: '2026-06-12' }];
    const s = await loaded({ 'GET /lines/L04': json(200, lineStatus({ applications: apps })) });
    expect(s.applications.map((a) => a.application_id)).toEqual(['a1']);
  });
  it('reports a week without a selection as not found', async () => {
    routes({ 'GET /lines/L04': json(200, lineStatus()) });
    const s = useSelectionStore();
    await s.load('L04', '2026-W20');
    expect(s.phase).toBe('notfound');
  });
  it('a migrated cycle (unknown_selection) is not found', async () => {
    const s = await loaded({ 'GET /cycles/c1/selection': json(404, { error: 'unknown_selection', detail: 'migrated from a proposal; no preview' }) });
    expect(s.phase).toBe('notfound');
  });
  it('shows a readable error when the scheduler fails', async () => {
    routes({ 'GET /lines/L04': json(500, {}) });
    const s = useSelectionStore();
    await s.load('L04', '2026-W24');
    expect(s).toMatchObject({ phase: 'error', error: expect.stringMatching(/Something went wrong/) });
  });
});

describe('approve and reject', () => {
  it('approves with the acknowledgements and the note, then refreshes', async () => {
    const s = await loaded();
    routes({ 'POST /selections/s1/approval': json(200, {}), 'GET /lines/L04': json(200, lineStatus()), 'GET /cycles/c1/selection': json(200, sel('approved')), 'GET /cycles/c1': json(200, cyc({ outcome: 'approved' })) });
    await s.approve(['cc-a'], '  looks right ');
    expect(postBody()).toEqual({ acknowledged: ['cc-a'], note: 'looks right' });
    expect(s).toMatchObject({ status: 'approved', error: '' });
  });
  it('shows the scheduler message when acknowledgements are missing', async () => {
    const s = await loaded();
    routes({ 'POST /selections/s1/approval': json(409, { error: 'acknowledgements_required' }) });
    await s.approve([]);
    expect(s.error).toMatch(/Acknowledge every listed check/);
    expect(s).toMatchObject({ status: 'draft', busy: false });
  });
  it('a blocked selection shows its message', async () => {
    const s = await loaded();
    routes({ 'POST /selections/s1/approval': json(409, { error: 'selection_not_approvable' }) });
    await s.approve(['cc-a']);
    expect(s.error).toMatch(/blocking alert/);
  });
  it('reject ends in human review with the cycle reason', async () => {
    const s = await loaded();
    routes({ 'POST /selections/s1/rejection': json(200, {}), 'GET /lines/L04': json(200, lineStatus()), 'GET /cycles/c1/selection': json(200, sel('rejected')), 'GET /cycles/c1': json(200, cyc({ outcome: 'human_review_required', outcome_reason: 'gate_e_rejected' })) });
    await s.reject();
    expect(postBody()).toEqual({});
    expect(s).toMatchObject({ status: 'rejected', humanReview: true });
    expect(s.cycle.outcome_reason).toBe('gate_e_rejected');
  });
  it('a repeat decision shows the scheduler message and the real state', async () => {
    const s = await loaded();
    routes({ 'POST /selections/s1/approval': json(409, { error: 'selection_not_draft' }), 'GET /lines/L04': json(200, lineStatus()), 'GET /cycles/c1/selection': json(200, sel('approved')), 'GET /cycles/c1': json(200, cyc()) });
    await s.approve(['cc-a']);
    expect(s.error).toBe('This selection was already decided.');
    expect(s.status).toBe('approved');
    expect(s.busy).toBe(false);
  });
  it('ignores a second call while one is in flight', async () => {
    const s = await loaded();
    let release; const gate = new Promise((r) => { release = r; });
    routes({ 'POST /selections/s1/approval': () => gate.then(() => json(200, {})), 'GET /lines/L04': json(200, lineStatus()), 'GET /cycles/c1/selection': json(200, sel('approved')), 'GET /cycles/c1': json(200, cyc()) });
    const a = s.approve(['cc-a']); const b = s.approve(['cc-a']);
    release(); await Promise.all([a, b]);
    expect(calls().filter((c) => c.startsWith('POST'))).toHaveLength(1);
  });
});

describe('renew', () => {
  it('posts the renewal and shows the new period', async () => {
    const s = await loaded({ 'GET /cycles/c1/selection': json(200, sel('approved')) });
    routes({ 'POST /selections/s1/renewal': json(200, {}), 'GET /lines/L04': json(200, lineStatus()), 'GET /cycles/c1/selection': json(200, sel('approved')), 'GET /cycles/c1': json(200, cyc()) });
    await s.renew(['cc-a']);
    expect(postBody()).toEqual({ acknowledged: ['cc-a'] });
    expect(s.error).toBe('');
  });
  it('a selection that is not approved cannot be renewed', async () => {
    const s = await loaded();
    routes({ 'POST /selections/s1/renewal': json(409, { error: 'selection_not_renewable' }), 'GET /lines/L04': json(200, lineStatus()), 'GET /cycles/c1/selection': json(200, sel()), 'GET /cycles/c1': json(200, cyc()) });
    await s.renew([]);
    expect(s.error).toBe('Only an approved selection can be renewed.');
  });
});

describe('apply', () => {
  const approved = () => loaded({ 'GET /cycles/c1/selection': json(200, sel('approved')) });
  it('records the product and the chosen date, then lists the application', async () => {
    const s = await approved();
    const app = { application_id: 'a1', selection_id: 's1', product_id: 'u-a', applied_on: '2026-06-11' };
    routes({ 'POST /selections/s1/applications': json(201, app), 'GET /lines/L04': json(200, lineStatus({ applications: [app] })), 'GET /cycles/c1/selection': json(200, sel('approved')), 'GET /cycles/c1': json(200, cyc()) });
    await s.apply('u-a', '2026-06-11');
    expect(postBody()).toEqual({ product_id: 'u-a', applied_on: '2026-06-11' });
    expect(s.applications).toEqual([app]);
  });
  it('refuses a malformed date without calling the scheduler', async () => {
    const s = await approved();
    fetchMock.mockClear();
    await s.apply('u-a', '11/06/2026');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(s.error).toMatch(/YYYY-MM-DD/);
  });
  it.each([
    ['no_active_selection', /approval period/],
    ['product_not_in_selection', /not part of this selection/],
  ])('shows the message for %s', async (code, message) => {
    const s = await approved();
    routes({ 'POST /selections/s1/applications': json(409, { error: code }) });
    await s.apply('u-a', '2026-06-11');
    expect(s.error).toMatch(message);
  });
  it('recording twice shows the scheduler message and the recorded application', async () => {
    const s = await approved();
    const app = { application_id: 'a1', selection_id: 's1', product_id: 'u-a', applied_on: '2026-06-11' };
    routes({
      'POST /selections/s1/applications': json(409, { error: 'application_already_recorded' }),
      'GET /lines/L04': json(200, lineStatus({ applications: [app] })), 'GET /cycles/c1/selection': json(200, sel('approved')), 'GET /cycles/c1': json(200, cyc()),
    });
    await s.apply('u-a', '2026-06-11');
    expect(s.error).toBe('The application was already recorded.');
    expect(s.applications).toEqual([app]);
  });
});
