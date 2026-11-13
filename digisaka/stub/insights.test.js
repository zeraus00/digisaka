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

const TOP = ['line_id', 'week', 'window_weeks', 'functional_leaves_threshold', 'functional_leaves_target', 'series', 'readings', 'risk', 'rain_outlook', 'history', 'history_coverage', 'group_usage', 'actions'];
const WEEK = ['week', 'yli', 'yls', 'functional_leaves', 'leaves_at_shooting', 'rainfall_mm', 'canopy_status', 'leaf_wetness_hours'];
const READING = ['rule', 'finding', 'text', 'source', 'sample_fact'];
const RISK = ['status', 'finding', 'result', 'conditions'];
const CONDITION = ['label', 'result', 'input'];
const OUTLOOK = ['status', 'rain_above_mm', 'days'];
const DAY = ['date', 'status', 'precipitation_mm', 'temperature_c', 'wind_kmh'];
const APPLICATION = ['applied_on', 'off_plan', 'product_id', 'product', 'mode_of_action', 'moa_code', 'frac_code', 'multisite', 'track', 'plant_mobility', 'source', 'response'];
const USAGE = ['mode_of_action', 'moa_code', 'frac_code', 'multisite', 'track', 'count', 'range_min', 'range_max', 'period', 'source', 'status', 'alerts'];
const ALERT = ['kind', 'text', 'alternatives'];
const ACTIONS = ['status', 'kinds', 'summary'];
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
  b.group_usage.forEach((g) => { same(g, USAGE); g.alerts.forEach((a) => same(a, ALERT)); });
  same(b.actions, ACTIONS);
  assert.deepEqual(b.actions.kinds.map((k) => k.kind), KINDS);
  b.actions.kinds.forEach((k) => same(k, KIND));
}

test('a week with a cycle serves every field, with the risk, history, alerts and action kinds assessed', async () => {
  const b = await insights('L03', '2026-W25');
  shape(b);
  assert.deepEqual([b.line_id, b.week], ['L03', '2026-W25']);
  assert.equal(typeof b.functional_leaves_threshold, 'number');
  assert.equal(b.series.at(-1).week, '2026-W24');
  const gappy = await insights('L22', '2026-W25');
  assert.ok(gappy.series.some((w) => w.yli === null), 'a week the feed did not report is null');
  assert.ok(b.readings.length && b.readings.every((r) => r.text));
  assert.equal(b.risk.status, 'assessed');
  assert.ok(b.risk.conditions.some((c) => c.result === 'cannot_check'));
  assert.deepEqual(b.rain_outlook.days.map((d) => d.status), ['rain', 'rain', 'dry', 'not_reported', 'dry']);
  assert.deepEqual([...new Set(b.history.map((a) => a.response))].sort(), ['not_poor', 'not_yet_reassessed', 'poor']);
  b.history.forEach((a) => assert.ok(Array.isArray(a.plant_mobility) && a.plant_mobility.every((m) => typeof m === 'string'), a.product));
  assert.ok(b.history.some((a) => a.plant_mobility.length === 0), 'one entry is unknown (an empty list)');
  assert.equal(typeof b.history_coverage, 'string');
  assert.equal(JSON.stringify(b).includes('resistance_alerts'), false);
  assert.equal(b.functional_leaves_target, 10);
  const band = (n) => (n === null ? null : n >= 10 ? 'ok' : n >= 8 ? 'watch' : 'critical');
  b.series.forEach((w) => assert.equal(w.canopy_status, band(w.functional_leaves), w.week));
  b.group_usage.forEach((g) => assert.equal(g.count, b.history.filter((a) => a.moa_code === g.moa_code).length, g.moa_code));
  assert.deepEqual(b.group_usage.map((g) => [g.moa_code, g.status]), [['M', null], ['D1', 'discouraged'], ['G2', 'ok']]);
  assert.deepEqual(b.group_usage[0].alerts, [], 'a multisite group has no cap, so no alert');
  assert.deepEqual(b.group_usage[1].alerts.map((a) => a.kind), ['discouraged']);
  assert.ok(b.readings.some((r) => r.finding === 'Canopy critical'), 'the canopy reading matches the latest week');
  assert.match(b.actions.summary, /suggested\.$/);
  assert.equal(b.actions.status, 'assessed');
  assert.equal(b.actions.kinds.find((k) => k.kind === 'mechanical').active, false);
});

test('a week without a cycle serves the same fields, with the risk and action kinds not yet assessed', async () => {
  const b = await insights('L04', '2026-W25');
  shape(b);
  assert.deepEqual([b.line_id, b.week], ['L04', '2026-W25']);
  assert.deepEqual(b.risk, { status: 'not_yet_assessed', finding: null, result: null, conditions: [] });
  assert.equal(b.rain_outlook.status, 'weather_not_yet_checked');
  assert.ok(b.rain_outlook.days.every((d) => d.status === 'weather_not_yet_checked' && d.precipitation_mm === null));
  assert.deepEqual([b.history, b.history_coverage, b.group_usage, b.actions.summary], [[], null, [], null]);
  assert.equal(b.actions.status, 'not_yet_assessed');
  assert.ok(b.actions.kinds.every((k) => !k.active && !k.options.length));
});

test('the series and readings come from the line\'s weekly records, blank where the line has none', async () => {
  const feed = await insights('L12', '2026-W25');
  assert.deepEqual([feed.series.at(-1).yls, feed.series.at(-1).functional_leaves, feed.series.at(-1).canopy_status], [7, null, null], 'a missing feed value is null');
  assert.ok(feed.readings.length);
  const early = await insights('L10', '2026-W23'); // L10 has one week of history, W24
  assert.deepEqual(early.readings, []);
  early.series.forEach((w) => assert.deepEqual([w.yli, w.yls, w.functional_leaves, w.rainfall_mm, w.canopy_status], [null, null, null, null, null], w.week));
  const one = await insights('L10', '2026-W25');
  assert.deepEqual(one.series.map((w) => w.yls).filter((v) => v !== null), [9]);
});

test('the series ends at the asked week\'s Last finished week, across a year boundary too', async () => {
  const weeks = async (line, week) => (await insights(line, week)).series.map((w) => w.week);
  assert.deepEqual((await weeks('L02', '2026-W25')).slice(-2), ['2026-W23', '2026-W24']);
  assert.deepEqual((await weeks('L02', '2026-W02')).slice(-4), ['2025-W50', '2025-W51', '2025-W52', '2026-W01']);
});

test('a week after the stub\'s today is capped at the Last finished week of today (W24)', async () => {
  const weeks = async (line, week) => (await insights(line, week)).series.map((w) => w.week);
  assert.equal((await weeks('L02', '2026-W27')).at(-1), '2026-W24');
});

test('the week decides which: L03 has a cycle in W25 and none in W24', async () => {
  assert.equal((await insights('L03', '2026-W25')).risk.status, 'assessed');
  assert.equal((await insights('L03', '2026-W24')).risk.status, 'not_yet_assessed');
});

test('errors: unknown line, bad week key, no token, a role that is not a Practitioner', async () => {
  assert.deepEqual([(await get('/lines/nope/weeks/2026-W25/insights')).status, (await get('/lines/nope/weeks/2026-W25/insights')).body.error], [404, 'unknown_line']);
  const bad = await get('/lines/L03/weeks/2026-24/insights');
  assert.deepEqual([bad.status, bad.body.error], [422, 'invalid_week']);
  assert.equal((await get('/lines/L03/weeks/2026-W25/insights', {})).status, 401);
  const technical = SAMPLE_USERS.find((u) => !u.roles.includes('practitioner'));
  if (technical) assert.equal((await get('/lines/L03/weeks/2026-W25/insights', { Authorization: `Bearer ${issueToken(technical)}` })).status, 403);
});
