import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createStub } from './server.js';
import { SAMPLE_USERS, issueToken } from './supabase.js';
import { productsOf } from './selections.js';

const B = '/api/v1/scheduler';
const farmer = { Authorization: `Bearer ${issueToken(SAMPLE_USERS[0])}`, 'Content-Type': 'application/json' };
let server, base;
beforeEach(async () => {
  server = createStub();
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
afterEach(() => server.close());

const call = async (method, path, body) => {
  const res = await fetch(base + B + path, { method, headers: farmer, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, body: await res.json() };
};
const post = (id, action, body = {}) => call('POST', `/selections/${id}/${action}`, body);
const apply = (id, product_id, applied_on) => post(id, 'applications', { product_id, applied_on });
const read = async (cycle) => (await call('GET', `/cycles/${cycle}/selection`)).body;
const ACK = 'cc-spiroxamine-rainfast';

test('a cycle serves its frozen payload with the selection\'s live state laid over it', async () => {
  const clean = await read('c-L02-23');
  assert.deepEqual(Object.keys(clean), ['kg_build', 'selection', 'preview']);
  assert.deepEqual(clean.selection.approval_period, { approval_period_id: 'ap-L02-23-1', start: '2026-05-25', end: '2026-06-24', days: 30 });
  assert.equal(clean.selection.selection_id, 'sel-L02-23');
  assert.equal(clean.selection.line_id, 'L02');
  assert.equal(clean.selection.status, 'approved');
  assert.equal(clean.selection._note, undefined);
  const stressed = await read('c-L05-24');
  assert.equal(stressed.selection.status, 'draft');
  assert.equal(stressed.selection.approvable, false);
  assert.equal(stressed.selection.blockers.length, 1);
  assert.equal(stressed.selection.approval_period.start, null);
  assert.equal((await call('GET', '/cycles/nope/selection')).body.error, 'unknown_selection');
});

test('approval needs the acknowledgement; the cycle then reads approved with a 30-day period', async () => {
  const refused = await post('sel-L03-24', 'approval');
  assert.deepEqual([refused.status, refused.body.error], [409, 'acknowledgements_required']);
  assert.equal((await post('sel-L03-24', 'approval', { acknowledged: ['nope'] })).body.error, 'validation_error');
  const r = await post('sel-L03-24', 'approval', { acknowledged: [ACK], note: '  Spray at dawn  ' });
  assert.equal(r.status, 200);
  assert.deepEqual([r.body.status, r.body.note, r.body.approval_period.start, r.body.approval_period.end], ['approved', 'Spray at dawn', '2026-06-08', '2026-07-08']);
  assert.equal((await call('GET', '/cycles/c-L03-24')).body.outcome, 'approved');
  assert.equal((await post('sel-L03-24', 'approval', { acknowledged: [ACK] })).body.error, 'selection_not_draft');
});

test('a blocker stops approval; rejection moves the cycle to human review', async () => {
  const blocked = await post('sel-L05-24', 'approval', { acknowledged: [ACK] });
  assert.deepEqual([blocked.status, blocked.body.error], [409, 'selection_not_approvable']);
  assert.equal((await post('sel-L05-24', 'rejection', { note: 'no' })).body.status, 'rejected');
  const cycle = (await call('GET', '/cycles/c-L05-24')).body;
  assert.deepEqual([cycle.outcome, cycle.outcome_reason], ['human_review_required', 'gate_e_rejected']);
  assert.equal((await post('sel-L05-24', 'rejection')).body.error, 'selection_not_draft');
});

test('renewal adds a period only to an approved selection', async () => {
  assert.equal((await post('sel-L03-24', 'renewal')).body.error, 'selection_not_renewable');
  const r = await post('sel-L02-23', 'renewal');
  assert.deepEqual([r.status, r.body.approval_period.approval_period_id], [200, 'ap-L02-23-2']);
  assert.equal((await read('c-L02-23')).selection.approval_period.approval_period_id, 'ap-L02-23-2');
});

test('applications: inside the period, a unit of the selection, not in the future, not twice', async () => {
  const ok = await apply('sel-L02-23', 'u-pyrimethanil', '2026-06-05');
  assert.equal(ok.status, 201);
  assert.deepEqual(Object.keys(ok.body), ['application_id', 'selection_id', 'product_id', 'applied_on', 'recorded_by', 'recorded_at']);
  assert.deepEqual((await call('GET', '/lines/L02')).body.applications.map((a) => a.applied_on), ['2026-06-02', '2026-06-05']);
  assert.equal((await apply('sel-L02-23', 'u-pyrimethanil', '2026-06-05')).body.error, 'application_already_recorded');
  assert.equal((await apply('sel-L02-23', 'u-pyrimethanil', '2026-04-01')).body.error, 'no_active_selection');
  assert.equal((await apply('sel-L02-23', 'u-spiroxamine', '2026-06-05')).body.error, 'product_not_in_selection');
  assert.equal((await apply('sel-L02-23', 'u-pyrimethanil', '2026-06-09')).body.error, 'validation_error');
  assert.equal((await apply('sel-L02-23', 'u-pyrimethanil', '5 June')).status, 400);
  assert.equal((await apply('sel-L03-24', 'u-spiroxamine', '2026-06-05')).body.error, 'no_active_selection');
  assert.equal((await apply('nope', 'u-pyrimethanil', '2026-06-05')).status, 404);
});

test('a selection made by closing a week can be read and approved', async () => {
  let t = 0;
  server.close();
  server = createStub({ now: () => t, cycleMs: 100 });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
  await call('POST', '/lines/L04/weeks/2026-W24/diagnoses', { img_name: 'healthy.jpg', img: 'A' });
  await call('POST', '/lines/L04/weeks/2026-W24/close');
  t += 100;
  const sel = (await read('c-L04-24')).selection;
  assert.deepEqual([sel.selection_id, sel.status], ['sel-L04-24', 'draft']);
  assert.equal((await post(sel.selection_id, 'approval', { acknowledged: [ACK] })).status, 200);
});

test('a unit id of the form Option|Product is recorded by its product, as the scheduler does', () => {
  const ids = productsOf({ payload: 'real' });
  assert.ok(ids.length > 0);
  assert.ok(ids.every((id) => !id.includes('|')));
});
