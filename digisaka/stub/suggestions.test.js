import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createStub } from './server.js';
import { SAMPLE_USERS, issueToken } from './supabase.js';

const B = '/api/v1/scheduler';
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
  const res = await fetch(base + B + path, { method, headers: farmer, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, body: await res.json() };
};
const suggestion = async (line) => (await call('GET', `/lines/${line}/suggestion`)).body;
const record = (line, body) => call('POST', `/lines/${line}/applications`, body);
const units = (s) => Object.values(s.groups).flat();

test('the suggestion has the contract fields, three groups and the schedule days', async () => {
  const s = await suggestion('L02');
  assert.deepEqual(Object.keys(s).sort(), ['alerts', 'basis', 'changes', 'created_at', 'explanation', 'groups', 'line_stage', 'other_guidance', 'outcome', 'outcome_reason', 'revision', 'running', 'schedule', 'trigger']);
  assert.deepEqual([s.revision, s.trigger, s.basis, s.running, s.changes], ['c-L02-24', 'scan', 'stage_confirmed', false, null]);
  assert.deepEqual(Object.keys(s.groups), ['recommended', 'eligible', 'excluded']);
  assert.equal(s.groups.recommended.length > 0, true);
  assert.ok(s.schedule.length > 0 && s.schedule[0].date);
  assert.deepEqual(Object.keys(s.line_stage), ['stage', 'tally', 'window']);
  const u = s.groups.recommended[0];
  for (const k of ['unit_id', 'product_id', 'label', 'practice_id', 'rank', 'track', 'checks', 'alerts', 'needs_confirmation', 'reason', 'facts']) assert.ok(k in u, k);
  assert.equal(u.rank, 1);
  assert.deepEqual(Object.keys(u).sort(), ['alerts', 'checks', 'facts', 'label', 'needs_confirmation', 'partner_for', 'practice_id', 'product_id', 'rank', 'reason', 'track', 'unit_id'], 'a unit carries the contract fields only');
  assert.deepEqual(Object.keys(s.line_stage.window), ['from', 'to']);
});

test('each line carries its basis, outcome and units', async () => {
  const l4 = await suggestion('L04');
  assert.equal(l4.basis, 'all_healthy_images');
  assert.ok(l4.alerts.some((a) => a.kind === 'stage_basis' && a.level === 'info' && /suggest/.test(a.text)));
  assert.ok(units(l4).every((u) => !u.product_id.includes('|')), 'the product is the part after the pipe');
  assert.ok(units(l4).length > 10);
  const l5 = await suggestion('L05');
  assert.deepEqual([l5.basis, l5.outcome, l5.outcome_reason], ['no_confirmed_stage', 'human_review_required', 'missing_feed_value']);
  assert.ok(l5.groups.excluded.some((u) => u.reason === 'not_for_stage' && u.needs_confirmation));
  const l6 = await suggestion('L06');
  assert.equal(l6.outcome, 'continue_monitoring');
  assert.deepEqual([l6.groups.recommended.length, l6.schedule.length], [0, 0]);
  assert.ok(l6.groups.eligible.length && l6.groups.eligible.every((u) => u.reason === 'monitoring_advised' && u.needs_confirmation));
  assert.ok(l6.groups.excluded.length && l6.groups.excluded.every((u) => u.reason === 'group_cap'));
});

test('a unit with its own alert needs confirmation and carries it', async () => {
  const s = await suggestion('L03');
  const spiro = units(s).find((u) => u.product_id === 'u-spiroxamine');
  assert.equal(spiro.needs_confirmation, true);
  assert.deepEqual(Object.keys(spiro.alerts[0]), ['id', 'unit_id', 'kind', 'level', 'text', 'cause', 'blocks_approval']);
  assert.equal(spiro.alerts[0].unit_id, 'u-spiroxamine');
});

test('every unit carries facts with the decided members; unknown ones are null or empty', async () => {
  for (const line of ['L02', 'L03', 'L04']) {
    const all = units(await suggestion(line));
    assert.ok(all.length);
    for (const u of all) {
      const f = u.facts;
      assert.deepEqual(Object.keys(f).sort(), ['application_interval', 'application_methods', 'application_rates', 'coverage', 'dilutions', 'mixture_conditions', 'product', 'repeat_condition', 'weather_requirement'], u.unit_id);
      assert.equal(f.product.label.toLowerCase(), u.label);
      assert.deepEqual([f.product.manufacturer, f.weather_requirement], [null, null]);
      assert.ok('frac_code' in f.product.mode_of_action, 'a group with no FRAC code is null, not missing');
      assert.deepEqual(f.application_interval, { min_days: 10, max_days: 15, source: null });
      assert.ok(Array.isArray(f.mixture_conditions));
    }
  }
});

test('alerts carry a cause, the schedule drops frac and an ok weather detail', async () => {
  const s = await suggestion('L03');
  for (const a of [...s.alerts, ...units(s).flatMap((u) => u.alerts)]) assert.ok('cause' in a, a.id);
  const apps = s.schedule.filter((d) => d.application).map((d) => d.application);
  assert.ok(apps.length);
  for (const a of apps) {
    assert.equal('frac' in a, false);
    assert.deepEqual([a.kind, a.partner, typeof a.why], [a.track === 'multisite' ? 'multisite' : 'single_site', null, 'string']);
    if (a.weather?.status === 'ok') assert.deepEqual(a.weather, { status: 'ok' });
  }
  const ok = (await suggestion('L02')).schedule.filter((d) => d.application?.weather?.status === 'ok');
  assert.ok(ok.length, 'a clean-payload week serves an ok weather entry');
});

test('a line with no finished run has no suggestion; unknown lines are unknown_line', async () => {
  assert.deepEqual((await call('GET', '/lines/L01/suggestion')).body.error, 'unknown_cycle');
  assert.deepEqual((await call('GET', '/lines/L99/suggestion')).body.error, 'unknown_line');
});

test('recording a recommended unit with no alerts succeeds and asks for a reschedule', async () => {
  const s = await suggestion('L02');
  const u = s.groups.recommended.find((x) => !x.needs_confirmation);
  const r = await record('L02', { product_id: u.product_id, applied_on: '2026-06-05', revision: s.revision, confirmed: false });
  assert.equal(r.status, 201);
  assert.deepEqual(Object.keys(r.body.application), ['application_id', 'product_id', 'applied_on', 'recorded_by', 'recorded_at', 'confirmation']);
  assert.deepEqual(r.body.application.confirmation, { tier: 'recommended', reason: null, alerts: [], revision: s.revision, confirmed: false });
  const cycle = r.body.reschedule.cycle_id;
  assert.match(cycle, /^c-L02-24-\d+$/);
  assert.equal((await call('GET', '/lines/L02')).body.applications.at(-1).applied_on, '2026-06-05');
  assert.equal((await suggestion('L02')).running, true);
  t += 3000;
  const after = await suggestion('L02');
  assert.deepEqual([after.running, after.revision, after.trigger], [false, cycle, 'application']);
  // The stub's run ends in monitoring, so the plan goes: the diff names every unit that moved and the plan, as the live one does.
  const c = after.changes;
  assert.deepEqual(Object.keys(c).sort(), ['alerts', 'plan_steps_changed', 'summary', 'trigger', 'units_moved'].filter((k) => k in c));
  assert.deepEqual([c.trigger, c.plan_steps_changed, c.summary], ['application', true, 'The data suggests the suggestion changed after an application; a scan is suggested to verify.']);
  assert.ok(c.units_moved.length && c.units_moved.every((m) => ['eligible', 'excluded'].includes(m.to) && typeof m.unit_id === 'string' && ['recommended', 'eligible', 'excluded'].includes(m.from)));
  assert.ok(Array.isArray(c.alerts?.added ?? []) && Array.isArray(c.alerts?.removed ?? []));
});

test('an excluded unit answers confirmation_required with its tier and alerts, then records once confirmed', async () => {
  const s = await suggestion('L05');
  const u = s.groups.excluded[0];
  const body = { product_id: u.product_id, applied_on: '2026-06-05', revision: s.revision, confirmed: false };
  const refused = await record('L05', body);
  assert.deepEqual([refused.status, refused.body.error, refused.body.tier, refused.body.revision], [409, 'confirmation_required', 'excluded', s.revision]);
  assert.ok(Array.isArray(refused.body.alerts));
  assert.equal((await call('GET', '/lines/L05')).body.applications.length, 0);
  const done = await record('L05', { ...body, confirmed: true });
  assert.equal(done.status, 201);
  assert.equal(done.body.application.confirmation.tier, 'excluded');
});

test('a stale revision is refused with the current one, even when confirmed', async () => {
  const s = await suggestion('L02');
  const u = s.groups.recommended[0];
  const r = await record('L02', { product_id: u.product_id, applied_on: '2026-06-05', revision: 'c-old', confirmed: true });
  assert.deepEqual([r.status, r.body.error, r.body.revision], [409, 'confirmation_required', s.revision]);
});

test('a product the suggestion does not offer, a repeat, a future date and a bad body are refused', async () => {
  const s = await suggestion('L02');
  const ok = { product_id: s.groups.recommended[0].product_id, applied_on: '2026-06-05', revision: s.revision, confirmed: true };
  assert.deepEqual([409, 'product_not_offered'], await record('L02', { ...ok, product_id: 'u-nothing' }).then((r) => [r.status, r.body.error]));
  assert.equal((await record('L02', ok)).status, 201);
  assert.equal((await record('L02', ok)).body.error, 'application_already_recorded');
  assert.equal((await record('L02', { ...ok, applied_on: '2026-06-16' })).body.error, 'validation_error');
  assert.equal((await record('L02', { product_id: 'x' })).status, 400);
  assert.equal((await record('L01', ok)).body.error, 'unknown_cycle');
  assert.equal((await record('L99', ok)).status, 404);
});

test('the removed approval routes answer 404', async () => {
  for (const [method, path] of [
    ['GET', '/cycles/c-L02-24/selection'], ['POST', '/selections/sel-L03-24/approval'], ['POST', '/selections/sel-L03-24/rejection'],
    ['POST', '/selections/sel-L02-23/renewal'], ['POST', '/selections/sel-L02-23/applications'], ['POST', '/lines/L04/weeks/2026-W24/close'], ['POST', '/cycles/c-L07-25/reopen'],
  ]) {
    const r = await call(method, path, method === 'GET' ? undefined : {});
    assert.deepEqual([path, r.status, r.body.error], [path, 404, 'not_found']);
  }
});

test('the dev date is read, set and reset with the scheduler\'s bodies', async () => {
  assert.deepEqual((await call('GET', '/dev/today')).body, { today: '2026-06-15', default: '2026-06-15', pinned: false });
  const set = await call('PUT', '/dev/today', { today: '2026-06-22' });
  assert.deepEqual([set.status, set.body], [200, { today: '2026-06-22', default: '2026-06-15', pinned: true }]);
  assert.deepEqual((await call('DELETE', '/dev/today')).body, { today: '2026-06-15', default: '2026-06-15', pinned: false });
});

test('a bad dev date is 400 validation_error and the token is needed', async () => {
  for (const body of [{ today: 'June 8' }, { today: '2026-13-40' }, {}]) {
    const bad = await call('PUT', '/dev/today', body);
    assert.deepEqual([bad.status, bad.body.error], [400, 'validation_error']);
  }
  assert.equal((await fetch(base + B + '/dev/today')).status, 401);
});

test('the dev run mode defaults to normal, reads back each mode, refuses others and needs the token', async () => {
  assert.deepEqual((await call('GET', '/dev/run-mode')).body, { mode: 'normal' });
  for (const mode of ['fail', 'stuck', 'normal']) {
    assert.deepEqual((await call('PUT', '/dev/run-mode', { mode })).body, { mode });
    assert.equal((await call('GET', '/dev/run-mode')).body.mode, mode);
  }
  for (const body of [{ mode: 'slow' }, {}]) {
    const bad = await call('PUT', '/dev/run-mode', body);
    assert.deepEqual([bad.status, bad.body.error], [400, 'validation_error']);
  }
  assert.equal((await fetch(base + B + '/dev/run-mode')).status, 401);
});

test('the set date moves the stub\'s future check', async () => {
  const s = await suggestion('L02');
  const body = { product_id: s.groups.recommended[0].product_id, applied_on: '2026-06-16', revision: s.revision, confirmed: true };
  assert.equal((await record('L02', body)).body.error, 'validation_error');
  await call('PUT', '/dev/today', { today: '2026-06-22' });
  assert.equal((await record('L02', body)).status, 201);
});

test('a monitoring-advised unit answers confirmation_required with its reason and records it once confirmed', async () => {
  const s = await suggestion('L06');
  const u = s.groups.eligible[0];
  const body = { product_id: u.product_id, applied_on: '2026-06-05', revision: s.revision, confirmed: false };
  const refused = await record('L06', body);
  assert.deepEqual([refused.status, refused.body.tier, refused.body.reason], [409, 'eligible', 'monitoring_advised']);
  const done = await record('L06', { ...body, confirmed: true });
  assert.deepEqual([done.status, done.body.application.confirmation.reason], [201, 'monitoring_advised']);
});

test('the explanation is {text, caveat} on a ranked plan and null on a monitoring list', async () => {
  const ranked = await suggestion('L02');
  assert.deepEqual(Object.keys(ranked.explanation), ['text', 'caveat']);
  assert.ok(ranked.explanation.text.length > 0 && /not yet validated/.test(ranked.explanation.caveat));
  assert.equal((await suggestion('L06')).explanation, null);
});

test('a step can be skipped and the skip undone; a step that is not open is step_not_open', async () => {
  const open = (await suggestion('L02')).schedule.map((d) => d.application).find((a) => a && ['planned', 'due', 'overdue'].includes(a.status));
  assert.ok(open?.step_id, 'the plan has a step with a status and an id');
  const skipped = await call('POST', `/lines/L02/steps/${open.step_id}/skip`, { reason: 'rain' });
  assert.equal(skipped.status, 201);
  assert.ok('reschedule' in skipped.body);
  const mine = (await suggestion('L02')).schedule.map((d) => d.application).find((a) => a?.step_id === open.step_id);
  assert.deepEqual([mine.status, mine.skip.reason], ['skipped', 'rain']);
  assert.equal((await call('POST', `/lines/L02/steps/${open.step_id}/skip`)).status, 409);
  assert.equal((await call('DELETE', `/lines/L02/steps/${open.step_id}/skip`)).status, 200);
  const undone = await call('DELETE', `/lines/L02/steps/${open.step_id}/skip`);
  assert.deepEqual([undone.status, undone.body.error], [409, 'step_not_open']);
  assert.equal((await call('POST', '/lines/L02/steps/nope/skip')).body.error, 'step_not_open');
});
