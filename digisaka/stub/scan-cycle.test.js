import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createStub } from './server.js';
import { SAMPLE_USERS, issueToken } from './supabase.js';

const B = '/api/v1/scheduler';
const WEEK = '2026-W25';
const farmer = { Authorization: `Bearer ${issueToken(SAMPLE_USERS[0])}`, 'Content-Type': 'application/json' };
let server, base, t;

beforeEach(async () => {
  t = 1_000_000;
  server = createStub({ now: () => t, cycleMs: 3000 });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
afterEach(() => server.close());

const call = async (method, path, body) => {
  const res = await fetch(base + path, { method, headers: farmer, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, body: await res.json() };
};
const scan = (line, name, extra = {}) => call('POST', `${B}/lines/${line}/weeks/${WEEK}/diagnoses`, { img_name: name, img: 'AAAA', ...extra });
const verify = (line) => scan(line, 'leaf-healthy.jpg');

test('each image name gives its canned answer; unrecognised names are stage 2', async () => {
  assert.deepEqual((await scan('L04', 'a-healthy.jpg')).body, { qa_output_id: 'qa-1', outcome: 'healthy', stage: null, reschedule: { cycle_id: 'c-L04-25' } });
  assert.equal((await scan('L04', 'not_leaf.jpg')).body.outcome, 'not_leaf');
  assert.equal((await scan('L04', 'referral.jpg')).body.outcome, 'referral');
  assert.equal((await scan('L04', 'rescan.jpg')).body.next_action, 're_scan');
  const stage2 = (await scan('L04', 'IMG_0042.jpg')).body;
  assert.equal(stage2.outcome, null);
  assert.equal(stage2.stage, 'Stage 2');
  assert.ok(stage2.symptom_checklist.length > 0);
});

test('an image the QA service cannot take answers 503 once, then goes through', async () => {
  const first = await scan('L04', 'unavailable.jpg');
  assert.equal(first.status, 503);
  assert.equal(first.body.error, 'qa_unavailable');
  assert.equal((await scan('L04', 'unavailable.jpg')).status, 201);
});

test('confirming symptoms finishes the scan; denying asks for a re-scan, and a re-scan keeps the same session', async () => {
  const q = (await scan('L04', 'a.jpg')).body.qa_output_id;
  const yes = await call('POST', `${B}/diagnoses/${q}/confirm-symptoms`, { confirmed: true });
  assert.deepEqual(yes.body, { qa_output_id: q, outcome: 'treatment_result', stage: 'Stage 2', reschedule: { cycle_id: 'c-L04-25' } });
  const q2 = (await scan('L04', 'b.jpg')).body.qa_output_id;
  assert.equal((await call('POST', `${B}/diagnoses/${q2}/confirm-symptoms`, { confirmed: false })).body.next_action, 're_scan');
  const again = await scan('L04', 'b2.jpg', { qa_output_id: q2 });
  assert.equal(again.body.qa_output_id, q2);
  assert.ok(again.body.symptom_checklist);
  assert.equal((await call('POST', `${B}/diagnoses/nope/confirm-symptoms`, { confirmed: true })).body.error, 'unknown_session');
  assert.equal((await scan('L04', 'c.jpg', { qa_output_id: 'nope' })).body.error, 'unknown_session');
});

test('scan validation: missing image and bad week', async () => {
  assert.equal((await call('POST', `${B}/lines/L04/weeks/${WEEK}/diagnoses`, { img_name: 'a.jpg' })).body.error, 'validation_error');
  assert.equal((await call('POST', `${B}/lines/L04/weeks/bad/diagnoses`, { img_name: 'a', img: 'A' })).body.error, 'invalid_week');
});

test('a scan awaiting confirmation or a re-scan does not reschedule; the first verified scan of a line-week does, once', async () => {
  const pending = (await scan('L04', 'a.jpg')).body;
  assert.equal(pending.reschedule, null);
  const first = await call('POST', `${B}/diagnoses/${pending.qa_output_id}/confirm-symptoms`, { confirmed: true });
  assert.deepEqual(first.body.reschedule, { cycle_id: 'c-L04-25' });
  assert.equal((await verify('L04')).body.reschedule, null, 'a second verified scan of the week leaves the stage as it was');
  assert.match((await verify('L05')).body.reschedule.cycle_id, /^c-L05-25-\d+$/, 'a taken cycle id gets a suffix');
});

test('the reschedule becomes the new revision of the suggestion; the week read lists every run, newest last', async () => {
  const before = (await call('GET', `${B}/lines/L04/suggestion`)).body;
  const id = (await verify('L04')).body.reschedule.cycle_id;
  assert.equal((await call('GET', `${B}/lines/L04/suggestion`)).body.running, true);
  t += 2999;
  assert.equal((await call('GET', `${B}/lines/L04/suggestion`)).body.revision, before.revision);
  t += 1;
  const after = (await call('GET', `${B}/lines/L04/suggestion`)).body;
  assert.deepEqual([after.revision, after.running, after.trigger, after.changes.trigger], [id, false, 'scan', 'scan']);
  const week = (await call('GET', `${B}/lines/L04/weeks/${WEEK}`)).body;
  assert.deepEqual([week.cycle_id, week.status], [id, 'done']);
  assert.deepEqual(week.runs.map((r) => [r.cycle_id, r.trigger, r.changed]), [[id, 'scan', true]]);
  assert.deepEqual(Object.keys(week.runs[0]), ['cycle_id', 'trigger', 'started_at', 'changed']);
  const seeded = (await call('GET', `${B}/lines/L03/weeks/${WEEK}`)).body;
  assert.deepEqual(seeded.runs.map((r) => r.cycle_id), ['c-L03-25']);
  assert.equal((await call('GET', `${B}/lines/L04/weeks/2026-W20`)).body.error, 'unknown_cycle');
  assert.equal((await call('GET', `${B}/lines/L99/weeks/${WEEK}`)).body.error, 'unknown_line');
  assert.equal((await call('GET', `${B}/lines/L04/weeks/bad`)).body.error, 'invalid_week');
});

test('a first run of a line with none gives it a suggestion, and the line status lists the finished cycle', async () => {
  assert.equal((await call('GET', `${B}/lines/L01/suggestion`)).status, 404);
  await verify('L01');
  assert.equal((await call('GET', `${B}/lines/L01/suggestion`)).status, 404, 'still no finished run');
  t += 3000;
  const s = (await call('GET', `${B}/lines/L01/suggestion`)).body;
  assert.deepEqual([s.revision, s.outcome], ['c-L01-25', 'continue_monitoring']);
  const status = (await call('GET', `${B}/lines/L01`)).body;
  assert.equal(status.latest_cycle.week, WEEK);
  assert.equal(status.leaves_scanned, 1);
});

test('L06 fails, retry succeeds, and a cycle that is not failed cannot be retried', async () => {
  const id = (await verify('L06')).body.reschedule.cycle_id;
  assert.equal((await call('POST', `${B}/cycles/${id}/retry`)).body.error, 'cycle_not_failed');
  t += 3000;
  const failed = (await call('GET', `${B}/cycles/${id}`)).body;
  assert.equal(failed.status, 'failed');
  assert.ok(failed.failure_reason);
  const suggestion = (await call('GET', `${B}/lines/L06/suggestion`)).body;
  assert.deepEqual([suggestion.running, suggestion.revision], [false, 'c-L06-24'], 'a failed run leaves the suggestion as it was');
  const retry = await call('POST', `${B}/cycles/${id}/retry`);
  assert.equal(retry.status, 202);
  assert.equal(retry.body.status, 'running');
  t += 3000;
  assert.deepEqual(await call('GET', `${B}/cycles/${id}`).then((r) => [r.body.status, r.body.outcome]), ['done', 'continue_monitoring']);
  assert.equal((await call('POST', `${B}/cycles/c-L02-24/retry`)).body.error, 'cycle_not_failed');
  assert.equal((await call('POST', `${B}/cycles/nope/retry`)).body.error, 'unknown_cycle');
});

test('only one running run per line: a record while a run is in progress asks for no second reschedule', async () => {
  await verify('L02');
  const s = (await call('GET', `${B}/lines/L02/suggestion`)).body;
  const u = s.groups.recommended.find((x) => !x.needs_confirmation);
  const r = await call('POST', `${B}/lines/L02/applications`, { product_id: u.product_id, applied_on: '2026-06-05', revision: s.revision, confirmed: false });
  assert.equal(r.status, 201);
  assert.equal(r.body.reschedule, null);
});

test('state survives until reset, which restores the seed', async () => {
  const id = (await verify('L04')).body.reschedule.cycle_id;
  t += 3000;
  assert.equal((await call('GET', `${B}/cycles/${id}`)).body.status, 'done');
  await fetch(`${base}/__stub/reset`, { method: 'POST' });
  assert.equal((await call('GET', `${B}/cycles/${id}`)).body.error, 'unknown_cycle');
  assert.equal((await verify('L04')).body.reschedule.cycle_id, 'c-L04-25');
});

const mode = (m) => call('PUT', `${B}/dev/run-mode`, { mode: m });

test('Stuck: the scan run stays running however long the client waits, until the mode changes', async () => {
  await mode('stuck');
  const id = (await verify('L04')).body.reschedule.cycle_id;
  t += 10 * 60_000;
  assert.equal((await call('GET', `${B}/cycles/${id}`)).body.status, 'running');
  await mode('normal');
  assert.equal((await call('GET', `${B}/cycles/${id}`)).body.status, 'done');
});

test('Fail: the first scan run fails on any line and Retry succeeds; an application run is not failed', async () => {
  await mode('fail');
  const id = (await verify('L04')).body.reschedule.cycle_id;
  t += 3000;
  assert.equal((await call('GET', `${B}/cycles/${id}`)).body.status, 'failed');
  assert.equal((await call('POST', `${B}/cycles/${id}/retry`)).status, 202);
  t += 3000;
  assert.equal((await call('GET', `${B}/cycles/${id}`)).body.status, 'done');
  await verify('L02');
  t += 3000;
  const s = (await call('GET', `${B}/lines/L02/suggestion`)).body;
  const u = s.groups.recommended.find((x) => !x.needs_confirmation);
  const r = await call('POST', `${B}/lines/L02/applications`, { product_id: u.product_id, applied_on: '2026-06-05', revision: s.revision, confirmed: false });
  t += 3000;
  assert.equal((await call('GET', `${B}/cycles/${r.body.reschedule.cycle_id}`)).body.status, 'done');
});

test('reset puts the run mode back to Normal', async () => {
  await mode('stuck');
  await fetch(`${base}/__stub/reset`, { method: 'POST' });
  assert.equal((await call('GET', `${B}/dev/run-mode`)).body.mode, 'normal');
});
