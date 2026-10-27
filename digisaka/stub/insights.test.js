// Contract test for GET /lines/:id/weeks/:week/insights: every field the scheduler serves (LineInsightsView),
// nullable ones included, on a week with a cycle and one without.
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createStub } from './server.js';
import { SAMPLE_USERS, issueToken } from './supabase.js';

const B = '/api/v1/scheduler';
const farmer = { Authorization: `Bearer ${issueToken(SAMPLE_USERS[0])}` };
let server, base;
beforeEach(async () => {
  server = createStub();
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
afterEach(() => server.close());

const get = async (path, headers = farmer) => {
  const res = await fetch(base + B + path, { headers });
  return { status: res.status, body: await res.json() };
};
const insights = async (line, week) => (await get(`/lines/${line}/weeks/${week}/insights`)).body;
const keys = (o) => Object.keys(o).sort();
const same = (o, fields) => assert.deepEqual(keys(o), [...fields].sort());

const TOP = ['line_id', 'week', 'window_weeks', 'functional_leaves_threshold', 'series', 'readings', 'risk', 'rain_outlook', 'history', 'history_coverage', 'resistance_alerts', 'actions'];
const WEEK = ['week', 'yli', 'yls', 'functional_leaves', 'leaves_at_shooting', 'rainfall_mm'];
const READING = ['rule', 'finding', 'text', 'source', 'sample_fact'];
const RISK = ['status', 'finding', 'result', 'conditions'];
const CONDITION = ['label', 'result', 'input'];
const OUTLOOK = ['status', 'rain_above_mm', 'days'];
const DAY = ['date', 'status', 'precipitation_mm', 'temperature_c', 'wind_kmh'];
const APPLICATION = ['applied_on', 'product_id', 'product', 'mode_of_action', 'source', 'response'];
const ALERT = ['kind', 'group', 'count', 'range_min', 'range_max', 'period', 'source', 'alternatives', 'text'];
const ACTIONS = ['status', 'kinds'];
const KIND = ['kind', 'active', 'options'];
const KINDS = ['preventive', 'systemic_fungicide', 'contact_fungicide', 'mechanical', 'monitoring'];

function shape(b) {
  same(b, TOP);
  assert.equal(b.window_weeks, 8);
  assert.equal(b.series.length, b.window_weeks);
  b.series.forEach((w) => same(w, WEEK));
  b.readings.forEach((r) => same(r, READING));
  same(b.risk, RISK);
  b.risk.conditions.forEach((c) => same(c, CONDITION));
  same(b.rain_outlook, OUTLOOK);
  assert.equal(b.rain_outlook.days.length, 5);
  b.rain_outlook.days.forEach((d) => same(d, DAY));
  b.history.forEach((a) => same(a, APPLICATION));
  b.resistance_alerts.forEach((a) => same(a, ALERT));
  same(b.actions, ACTIONS);
  assert.deepEqual(b.actions.kinds.map((k) => k.kind), KINDS);
  b.actions.kinds.forEach((k) => same(k, KIND));
}

test('a week with a cycle serves every field, with the risk, history, alerts and action kinds assessed', async () => {
  const b = await insights('L03', '2026-W24');
  shape(b);
  assert.deepEqual([b.line_id, b.week], ['L03', '2026-W24']);
  assert.equal(typeof b.functional_leaves_threshold, 'number');
  assert.equal(b.series.at(-1).week, '2026-W24');
  assert.ok(b.series.some((w) => w.yli === null), 'a week the feed did not report is null');
  assert.ok(b.readings.length && b.readings.every((r) => r.text));
  assert.equal(b.risk.status, 'assessed');
  assert.ok(b.risk.conditions.some((c) => c.result === 'cannot_check'));
  assert.deepEqual(b.rain_outlook.days.map((d) => d.status), ['rain', 'rain', 'dry', 'not_reported', 'dry']);
  assert.deepEqual([...new Set(b.history.map((a) => a.response))].sort(), ['not_poor', 'not_yet_reassessed', 'poor']);
  assert.equal(typeof b.history_coverage, 'string');
  assert.equal(b.resistance_alerts[0].kind, 'discouraged');
  assert.equal(b.actions.status, 'assessed');
  assert.equal(b.actions.kinds.find((k) => k.kind === 'mechanical').active, false);
});

test('a week without a cycle serves the same fields, with the risk and action kinds not yet assessed', async () => {
  const b = await insights('L04', '2026-W24');
  shape(b);
  assert.deepEqual([b.line_id, b.week], ['L04', '2026-W24']);
  assert.deepEqual(b.risk, { status: 'not_yet_assessed', finding: null, result: null, conditions: [] });
  assert.equal(b.rain_outlook.status, 'weather_not_yet_checked');
  assert.ok(b.rain_outlook.days.every((d) => d.status === 'weather_not_yet_checked' && d.precipitation_mm === null));
  assert.deepEqual([b.history, b.history_coverage, b.resistance_alerts], [[], null, []]);
  assert.equal(b.actions.status, 'not_yet_assessed');
  assert.ok(b.actions.kinds.every((k) => !k.active && !k.options.length));
});

test('the week decides which: L03 has a cycle in W24 and none in W23', async () => {
  assert.equal((await insights('L03', '2026-W24')).risk.status, 'assessed');
  assert.equal((await insights('L03', '2026-W23')).risk.status, 'not_yet_assessed');
});

test('errors: unknown line, bad week key, no token, a role that is not a Practitioner', async () => {
  assert.deepEqual([(await get('/lines/nope/weeks/2026-W24/insights')).status, (await get('/lines/nope/weeks/2026-W24/insights')).body.error], [404, 'unknown_line']);
  const bad = await get('/lines/L03/weeks/2026-24/insights');
  assert.deepEqual([bad.status, bad.body.error], [422, 'invalid_week']);
  assert.equal((await get('/lines/L03/weeks/2026-W24/insights', {})).status, 401);
  const technical = SAMPLE_USERS.find((u) => !u.roles.includes('practitioner'));
  if (technical) assert.equal((await get('/lines/L03/weeks/2026-W24/insights', { Authorization: `Bearer ${issueToken(technical)}` })).status, 403);
});
