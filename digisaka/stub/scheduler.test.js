import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createStub } from './server.js';
import { SAMPLE_USERS, issueToken } from './supabase.js';
import { createSeedStore } from './seed.js';

let server, base;
const B = '/api/v1/scheduler';
const as = (email) => ({ Authorization: `Bearer ${issueToken(SAMPLE_USERS.find((u) => u.email === email))}` });
const farmer = as('farmer@digisaka.test');
const get = (path, headers = farmer) => fetch(base + B + path, { headers });

before(async () => {
  server = createStub();
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

test('every scheduler request needs a Practitioner token', async () => {
  assert.deepEqual(await (await get('/lines', {})).json(), { error: 'unauthenticated', detail: 'Sign in to continue.' });
  assert.equal((await get('/lines', { Authorization: 'Bearer junk' })).status, 401);
  const res = await get('/lines', as('admin@digisaka.test'));
  assert.equal(res.status, 403);
  assert.equal((await res.json()).error, 'forbidden');
  assert.equal((await get('/lines', as('both@digisaka.test'))).status, 200);
});

test('lists the 21 seed lines', async () => {
  assert.deepEqual((await (await get('/lines')).json()).lines, Array.from({ length: 21 }, (_, i) => `L${String(i + 1).padStart(2, '0')}`));
});

test('line status carries the scenario for each seed line', async () => {
  const status = async (id) => (await get(`/lines/${id}`)).json();
  assert.deepEqual(await status('L01'), { line_id: 'L01', cycles: [], applications: [], latest_cycle: null, human_review_required: false, weeks_assessed: 0, leaves_scanned: 0 });
  const l2 = await status('L02');
  assert.equal(l2.cycles[0].outcome, 'suggested');
  assert.equal(l2.applications[0].product_id, 'u-chlorothalonil');
  assert.equal((await status('L03')).cycles[0].outcome, 'suggested');
  assert.equal((await status('L04')).applications.length, 0);
  assert.equal('selections' in l2, false);
  const l5 = await status('L05');
  assert.equal(l5.human_review_required, true);
  assert.equal(l5.latest_cycle.week, '2026-W24');
});

test('history is the last three weeks up to the week, from the weekly dataset', async () => {
  const h = await (await get('/lines/L04/weeks/2026-W24/history')).json();
  assert.deepEqual(h.weeks.map((w) => w.week), ['2026-W22', '2026-W23', '2026-W24']);
  assert.deepEqual(h.weeks.at(-1), { week: '2026-W24', yls: 7, yli: 6, rainfall_mm: 30 });
  const early = await (await get('/lines/L04/weeks/2026-W21/history')).json();
  assert.deepEqual(early.weeks.map((w) => w.week), ['2026-W20', '2026-W21']);
});

test('errors use the scheduler codes', async () => {
  const unknown = await get('/lines/L99');
  assert.equal(unknown.status, 404);
  assert.equal((await unknown.json()).error, 'unknown_line');
  assert.equal((await get('/lines/L99/weeks/2026-W24/history')).status, 404);
  const bad = await get('/lines/L04/weeks/2026-24/history');
  assert.equal(bad.status, 400);
  assert.equal((await bad.json()).error, 'invalid_week');
  assert.equal((await get('/lines/L04/weeks/2026-W54/history')).status, 400);
  assert.equal((await (await get('/cycles/nope/evidence')).json()).error, 'unknown_cycle');
});

test('evidence has weeks, disease and rainfall; a cycle without it is unknown_evidence', async () => {
  const ev = await (await get('/cycles/c-L03-24/evidence')).json();
  assert.equal(ev.cycle_id, 'c-L03-24');
  assert.deepEqual(ev.weeks.at(-1), { week: '2026-W24', yls: 7, yli: 6, rainfall_mm: 30 });
  assert.equal(ev.disease.worsening, true);
  assert.equal(ev.disease.falling, true);
  assert.deepEqual(ev.disease.level, { yls: 5, below: 8, critical_below: 6, verdict: 'critical' });
  assert.equal(ev.rainfall.recent_total_mm, 84);
  assert.deepEqual(ev.rainfall.conditions.map((c) => [c.id, c.verdict, c.missing]), [['c1', 'met', null], ['c2', 'met', null], ['c3', 'met', null]]);
  assert.ok(ev.rainfall.conditions.every((c) => typeof c.label === 'string'));
  const none = await get('/cycles/c-L05-24/evidence');
  assert.equal(none.status, 404);
  assert.equal((await none.json()).error, 'unknown_evidence');
});

test('seed consistency: compared weeks have data', () => {
  const { lines } = createSeedStore().data;
  for (const [id, l] of Object.entries(lines)) {
    const weeks = new Set(l.weeks.map((w) => w.week));
    for (const c of l.cycles) {
      assert.ok(weeks.has(c.week), `${id} ${c.cycle_id} week has no data`);
      for (const w of [...(c.evidence?.disease.compared_weeks ?? []), ...(c.evidence?.rainfall.recent_weeks ?? []), ...(c.evidence?.rainfall.previous_weeks ?? [])]) {
        assert.ok(weeks.has(w), `${id} ${c.cycle_id} compares ${w} with no data`);
      }
    }
  }
});

test('reset restores the seed', async () => {
  const store = createSeedStore();
  store.data.lines.L01.leaves = 99;
  store.reset();
  assert.equal(store.data.lines.L01.leaves, 0);
});
