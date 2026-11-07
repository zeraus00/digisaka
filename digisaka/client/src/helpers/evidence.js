// Plain-words captions and chart geometry for the evidence charts.
const WORD = { 1: 'one week', 2: 'two weeks', 3: 'three weeks' };
const weekWord = (n) => WORD[n] ?? `${n} weeks`;

export const verdictText = (v) => (v === true ? 'yes' : v === false ? 'no' : 'not enough data');

// The spread chip shows the infection-risk finding (rainfall and leaf wetness together), so it names the conditions.
export const spreadChipText = (v, detail) => `Conditions favour spread: ${verdictText(v)}${detail ? ` (${detail})` : ''}`;

// Which conditions decided the spread verdict: the ones not met when it is "no", the ones that could not be
// checked when it is unknown. Null when it is "yes" or an older scheduler sent no list.
export function conditionDetail({ favourable, conditions } = {}) {
  const want = favourable === false ? 'not_met' : favourable === 'not_computable' ? 'cannot_check' : null;
  const decided = (conditions ?? []).filter((c) => c.verdict === want);
  if (!decided.length) return null;
  const names = decided.map((c) => (c.label ?? c.id) + (c.missing ? ` (${c.missing})` : '')).join(', ');
  return `${want === 'not_met' ? 'not met' : 'could not check'}: ${names}`;
}

// The level chip: where this week's YLS sits against the rules' thresholds, with the number it was compared to.
export function levelText({ verdict, below, critical_below: critical } = {}) {
  if (verdict === 'critical') return critical == null ? 'critical' : `critical, below ${critical}`;
  if (verdict === 'below') return below == null ? 'below the threshold' : `below ${below}`;
  if (verdict === 'not_below') return below == null ? 'not below the threshold' : `not below ${below}`;
  return 'not enough data';
}

const valueOf = (weeks, week, key) => weeks.find((w) => w.week === week)?.[key];

export function diseaseCaption({ weeks, disease: d }) {
  if (d.worsening === 'not_computable' || !d.compared_weeks?.length) return 'Not enough scan history to compare YLS week to week.';
  const values = d.compared_weeks.map((w) => valueOf(weeks, w, 'yls'));
  const word = weekWord(d.consecutive_weeks);
  const verb = d.worsening_direction === 'lower' ? 'fell' : 'rose';
  return d.worsening
    ? `YLS ${verb} ${word} in a row (${values.join(' to ')}).`
    : `YLS did not ${d.worsening_direction === 'lower' ? 'fall' : 'rise'} ${word} in a row (${values.join(', ')}).`;
}

const mm = (n) => `${Number.isInteger(n) ? n : Math.round(n * 10) / 10} mm`;

export function rainfallCaption({ rainfall: r }) {
  if (r.recent_total_mm == null || r.previous_total_mm == null) return `Not enough rainfall data to compare the last ${r.window_weeks} weeks.`;
  const dir = r.recent_total_mm > r.previous_total_mm ? 'up from' : r.recent_total_mm < r.previous_total_mm ? 'down from' : 'the same as';
  const totals = `Rain over the last ${r.window_weeks} weeks: ${mm(r.recent_total_mm)}, ${dir} ${mm(r.previous_total_mm)}.`;
  const detail = conditionDetail(r);
  if (detail) return `${totals} ${detail[0].toUpperCase()}${detail.slice(1)}.`;
  // the verdict also reads leaf wetness, so unknown with known totals is not a rainfall gap
  return r.favourable === 'not_computable' ? `${totals} Not enough rainfall or leaf-wetness data to tell if conditions favour spread.` : totals;
}

export const missingWeeks = (weeks) => Object.fromEntries(['yls', 'yli', 'rainfall_mm'].map((k) => [k, weeks.filter((w) => w[k] == null).map((w) => w.week)]));

// SVG path through points; a null point breaks the line so a missing week stays a gap.
export function linePath(points) {
  let d = '', pen = false;
  for (const p of points) {
    if (!p) { pen = false; continue; }
    d += `${pen ? 'L' : 'M'}${p.x} ${p.y}`; pen = true;
  }
  return d;
}

// Smallest round number at or above v, for a chart axis top.
export function niceMax(v) {
  if (!(v > 0)) return 1;
  const pow = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 4, 5, 8, 10]) if (m * pow >= v) return m * pow;
  return 10 * pow;
}

// Last three weeks, plus any earlier week the rules compared, so every caption can be checked against the chart.
export function visibleWeeks({ weeks, disease, rainfall }) {
  const used = new Set([...(disease.compared_weeks ?? []), ...(rainfall.recent_weeks ?? []), ...(rainfall.previous_weeks ?? [])]);
  return weeks.filter((w, i) => i >= weeks.length - 3 || used.has(w.week));
}

// Trend toggle: a view is data (id, name, icon, the week fields it draws); ticket-02 adds a Leaves entry.
export const TREND_VIEWS = [
  { id: 'all', name: 'All trends', icon: 'trend-all', iconOnly: true, keys: ['yls', 'yli', 'leaves', 'rainfall_mm'] },
  { id: 'disease', name: 'YLS/YLI', icon: 'trend-lines', keys: ['yls', 'yli'] },
  { id: 'leaves', name: 'Leaves', icon: 'trend-leaf', keys: ['leaves'] },
  { id: 'rain', name: 'Rainfall', icon: 'trend-drop', keys: ['rainfall_mm'] },
];
const SERIES_NAME = { yls: 'YLS', yli: 'YLI', leaves: 'Leaves', rainfall_mm: 'Rainfall' };
const hasValue = (weeks, key) => weeks.some((w) => w[key] != null);

// Ids of the views that have at least one value in the shown weeks.
export const availableViews = (weeks, views = TREND_VIEWS) => views.filter((v) => v.keys.some((k) => hasValue(weeks, k))).map((v) => v.id);

// The picked view, or All when it has gone empty.
export const resolveView = (pick, weeks, views = TREND_VIEWS) => (availableViews(weeks, views).includes(pick) ? pick : 'all');

// The next enabled view left (-1) or right (+1) of `current`, wrapping; `current` when it is the only one.
export function nextView(current, step, weeks, views = TREND_VIEWS) {
  const ok = availableViews(weeks, views);
  const ids = views.map((v) => v.id);
  for (let n = 1; n <= ids.length; n++) {
    const id = ids[(ids.indexOf(current) + step * n + ids.length * n) % ids.length];
    if (ok.includes(id)) return id;
  }
  return current;
}

// "Missing weeks" line for the series a view draws; All lists only series that exist.
export function missingTextFor(view, weeks, views = TREND_VIEWS) {
  const missing = Object.fromEntries(Object.keys(SERIES_NAME).map((k) => [k, weeks.filter((w) => w[k] == null).map((w) => w.week)]));
  const keys = views.find((v) => v.id === view).keys.filter((k) => hasValue(weeks, k));
  const parts = keys.filter((k) => missing[k].length).map((k) => `${SERIES_NAME[k]}: ${missing[k].join(', ')}`);
  return parts.length ? `Missing weeks — ${parts.join('; ')}.` : '';
}

// Join the Line Insights series to chart weeks by week: each week gets `leaves` (the count) and `canopy` (the served
// status), and the served reference values come along. A week the series lacks, or no data yet, gives no leaves.
// Top of a 0-12 axis that grows, in steps of two, only when a value would go over it.
export const axisTop = (values) => Math.max(12, 2 * Math.ceil(Math.max(0, ...values.filter((v) => v != null)) / 2));

export function joinLeaves(weeks, data) {
  const bySeries = new Map((data?.series ?? []).map((s) => [s.week, s]));
  return {
    weeks: weeks.map((w) => ({ ...w, leaves: bySeries.get(w.week)?.functional_leaves ?? null, canopy: bySeries.get(w.week)?.canopy_status ?? null })),
    refs: { critical: data?.functional_leaves_threshold ?? null, target: data?.functional_leaves_target ?? null },
  };
}

// Reference lines to draw: only a value the server sent; the client never compares the count with them.
export const leavesLines = (refs) => [['critical', refs?.critical], ['target', refs?.target]].filter(([, v]) => v != null).map(([kind, value]) => ({ kind, value, label: `${value} ${kind}` }));

const CANOPY_WORDS = { ok: 'At or above the target.', watch: 'Below the target, above the critical level.', critical: 'Below the critical level.' };
export function leavesCaption(weeks) {
  const w = [...weeks].reverse().find((x) => x.leaves != null);
  if (!w) return 'No leaf count recorded.';
  const count = `${w.leaves} functional ${w.leaves === 1 ? 'leaf' : 'leaves'} in ${w.week}.`;
  return CANOPY_WORDS[w.canopy] ? `${count} ${CANOPY_WORDS[w.canopy]}` : count;
}
