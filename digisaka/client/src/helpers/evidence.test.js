import { describe, it, expect } from 'vitest';
import { diseaseCaption, rainfallCaption, spreadChipText, conditionDetail, verdictText, levelText, missingWeeks, availableViews, resolveView, nextView, missingTextFor, axisTop, chartWeeks, leavesLines, leavesCaption, linePath, niceMax } from './evidence.js';

const weeks = [
  { week: '2026-W22', yls: 7, yli: 4, rainfall_mm: 10 },
  { week: '2026-W23', yls: 6, yli: null, rainfall_mm: 30 },
  { week: '2026-W24', yls: 5, yli: 3, rainfall_mm: null },
];
const ev = (over = {}) => ({
  weeks,
  disease: { worsening_direction: 'lower', consecutive_weeks: 2, compared_weeks: ['2026-W22', '2026-W23', '2026-W24'], worsening: true },
  rainfall: { window_weeks: 2, min_total_mm: 0, recent_weeks: ['2026-W23', '2026-W24'], previous_weeks: ['2026-W21', '2026-W22'], recent_total_mm: 84, previous_total_mm: 52, favourable: true },
  ...over,
});

describe('diseaseCaption', () => {
  it('describes a fall over the compared weeks', () => {
    expect(diseaseCaption(ev())).toBe('YLS fell two weeks in a row (7 to 6 to 5).');
  });
  it('says it was not falling when the disease is not worsening', () => {
    expect(diseaseCaption(ev({ disease: { ...ev().disease, worsening: false } }))).toBe('YLS did not fall two weeks in a row (7, 6, 5).');
  });
  it('says there is not enough data when not computable', () => {
    expect(diseaseCaption(ev({ disease: { ...ev().disease, worsening: 'not_computable', compared_weeks: [] } }))).toBe('Not enough scan history to compare YLS week to week.');
  });
});

describe('rainfallCaption', () => {
  it('compares the recent and previous totals', () => {
    expect(rainfallCaption(ev())).toBe('Rain over the last 2 weeks: 84 mm, up from 52 mm.');
  });
  it('says down when it fell', () => {
    expect(rainfallCaption(ev({ rainfall: { ...ev().rainfall, recent_total_mm: 20 } }))).toBe('Rain over the last 2 weeks: 20 mm, down from 52 mm.');
  });
  it('says not enough data when not computable', () => {
    expect(rainfallCaption(ev({ rainfall: { ...ev().rainfall, favourable: 'not_computable', recent_total_mm: null, previous_total_mm: null } }))).toBe('Not enough rainfall data to compare the last 2 weeks.');
  });
});

describe('rainfallCaption when the verdict is unknown but the totals are known', () => {
  it('does not blame the rainfall data', () => {
    const caption = rainfallCaption(ev({ rainfall: { ...ev().rainfall, favourable: 'not_computable' } }));
    expect(caption).toBe('Rain over the last 2 weeks: 84 mm, up from 52 mm. Not enough rainfall or leaf-wetness data to tell if conditions favour spread.');
  });
});

describe('spreadChipText', () => {
  it('names the conditions, since the verdict also reads leaf wetness', () => {
    expect(spreadChipText(true)).toBe('Conditions favour spread: yes');
    expect(spreadChipText(false)).toBe('Conditions favour spread: no');
    expect(spreadChipText('not_computable')).toBe('Conditions favour spread: not enough data');
  });
});

describe('verdictText', () => {
  it('maps the three states', () => {
    expect(verdictText(true)).toBe('yes');
    expect(verdictText(false)).toBe('no');
    expect(verdictText('not_computable')).toBe('not enough data');
  });
});

describe('missingWeeks', () => {
  it('lists weeks missing a yls, yli or rainfall value', () => {
    expect(missingWeeks(weeks)).toEqual({ yls: [], yli: ['2026-W23'], rainfall_mm: ['2026-W24'] });
  });
});

describe('linePath', () => {
  it('breaks the line at a null instead of filling it', () => {
    expect(linePath([{ x: 0, y: 1 }, { x: 10, y: 2 }, null, { x: 30, y: 4 }])).toBe('M0 1L10 2M30 4');
  });
  it('is empty when there are no points', () => { expect(linePath([null, null])).toBe(''); });
});

describe('niceMax', () => {
  it('rounds up to a round number', () => {
    expect(niceMax(84)).toBe(100);
    expect(niceMax(7)).toBe(8);
    expect(niceMax(0)).toBe(1);
  });
});

describe('levelText', () => {
  const level = { yls: 5, below: 8, critical_below: 6 };
  it('names the critical threshold', () => expect(levelText({ ...level, verdict: 'critical' })).toBe('critical, below 6'));
  it('names the threshold for below and not below', () => {
    expect(levelText({ ...level, verdict: 'below' })).toBe('below 8');
    expect(levelText({ ...level, verdict: 'not_below' })).toBe('not below 8');
  });
  it('reads a missing threshold or verdict without a number', () => {
    expect(levelText({ yls: 5, below: null, critical_below: null, verdict: 'below' })).toBe('below the threshold');
    expect(levelText({ ...level, verdict: 'not_computable' })).toBe('not enough data');
  });
  it('reads a not-computable trend as unknown, not no', () => {
    expect(verdictText('not_computable')).toBe('not enough data');
    expect(verdictText(false)).toBe('no');
  });
});

const wetnessNotMet = [
  { id: 'c1', label: 'Rainfall rising over two weeks', verdict: 'met', missing: null },
  { id: 'c2', label: 'Rainfall above 0 mm over two weeks', verdict: 'met', missing: null },
  { id: 'c3', label: 'Leaf wetness above 6 hours', verdict: 'not_met', missing: null },
];
const wetnessMissing = wetnessNotMet.map((c) => (c.id === 'c3' ? { ...c, verdict: 'cannot_check', missing: 'leaf wetness for 2026-W24' } : c));
const rain = (favourable, conditions) => ({ ...ev().rainfall, favourable, conditions });

describe('conditionDetail', () => {
  it('names the condition that was not met when the verdict is no', () => {
    expect(conditionDetail(rain(false, wetnessNotMet))).toBe('not met: Leaf wetness above 6 hours');
  });
  it('names the condition that could not be checked, and what was missing, when the verdict is unknown', () => {
    expect(conditionDetail(rain('not_computable', wetnessMissing))).toBe('could not check: Leaf wetness above 6 hours (leaf wetness for 2026-W24)');
  });
  it('falls back to the id when the KG sent no label', () => {
    expect(conditionDetail(rain(false, [{ id: 'c3', label: null, verdict: 'not_met', missing: null }]))).toBe('not met: c3');
  });
  it('has nothing to add when every condition is met or the scheduler sent no list', () => {
    expect(conditionDetail(rain(true, wetnessNotMet.map((c) => ({ ...c, verdict: 'met' }))))).toBeNull();
    expect(conditionDetail(rain(false, undefined))).toBeNull();
    expect(conditionDetail(rain('not_computable', []))).toBeNull();
  });
});

describe('the chip and the caption with the deciding condition', () => {
  it('puts the detail on the chip', () => {
    expect(spreadChipText(false, 'not met: Leaf wetness above 6 hours')).toBe('Conditions favour spread: no (not met: Leaf wetness above 6 hours)');
    expect(spreadChipText(true, null)).toBe('Conditions favour spread: yes');
  });
  it('names the unmet condition in the caption', () => {
    expect(rainfallCaption(ev({ rainfall: rain(false, wetnessNotMet) }))).toBe('Rain over the last 2 weeks: 84 mm, up from 52 mm. Not met: Leaf wetness above 6 hours.');
  });
  it('replaces the generic sentence with the condition that could not be checked', () => {
    const caption = rainfallCaption(ev({ rainfall: rain('not_computable', wetnessMissing) }));
    expect(caption).toBe('Rain over the last 2 weeks: 84 mm, up from 52 mm. Could not check: Leaf wetness above 6 hours (leaf wetness for 2026-W24).');
    expect(caption).not.toContain('rainfall or leaf-wetness');
  });
});

describe('trend views', () => {
  const noRain = weeks.map((w) => ({ ...w, rainfall_mm: null }));
  const noYls = weeks.map((w) => ({ ...w, yls: null, yli: null }));
  it('lists views with a value', () => {
    expect(availableViews(weeks)).toEqual(['all', 'disease', 'rain']);
    expect(availableViews(noRain)).toEqual(['all', 'disease']);
    expect(availableViews(noYls)).toEqual(['all', 'rain']);
  });
  it('falls back to All when the pick is empty', () => {
    expect(resolveView('rain', noRain)).toBe('all');
    expect(resolveView('rain', weeks)).toBe('rain');
  });
  it('arrow keys wrap and skip disabled views', () => {
    expect(nextView('rain', 1, weeks)).toBe('all');
    expect(nextView('all', -1, weeks)).toBe('rain');
    expect(nextView('disease', 1, noRain)).toBe('all');
    expect(nextView('all', -1, noRain)).toBe('disease');
    expect(nextView('all', 1, noYls)).toBe('rain');
  });
  it('missing-weeks line lists only the series the view draws', () => {
    expect(missingTextFor('all', weeks)).toBe('Missing weeks — YLI: 2026-W23; Rainfall: 2026-W24.');
    expect(missingTextFor('disease', weeks)).toBe('Missing weeks — YLI: 2026-W23.');
    expect(missingTextFor('rain', weeks)).toBe('Missing weeks — Rainfall: 2026-W24.');
    expect(missingTextFor('all', noRain)).toBe('Missing weeks — YLI: 2026-W23.');
  });
});

describe('axisTop', () => {
  it('stays at 12 and grows in steps of two only when a value needs it', () => {
    expect(axisTop([7, null, 12])).toBe(12);
    expect(axisTop([13])).toBe(14);
    expect(axisTop([14.5, 3])).toBe(16);
    expect(axisTop([])).toBe(12);
  });
});

describe('leaves', () => {
  const data = { functional_leaves_threshold: 8, functional_leaves_target: 10, series: [
    { week: '2026-W22', functional_leaves: 11, canopy_status: 'ok' }, { week: '2026-W23', functional_leaves: 7, canopy_status: 'ok' }] };
  it('takes every series week, with the leaves and status, and carries the served references', () => {
    const j = chartWeeks(data);
    expect(j.weeks.map((w) => [w.week, w.leaves, w.canopy])).toEqual([['2026-W22', 11, 'ok'], ['2026-W23', 7, 'ok']]);
    expect(j.refs).toEqual({ critical: 8, target: 10 });
  });
  it('gives no weeks, and does not throw, when the series is not loaded', () => {
    const j = chartWeeks(null);
    expect(j.weeks).toEqual([]);
    expect(j.refs).toEqual({ critical: null, target: null });
  });
  it('draws only the reference lines the server sent, labelled', () => {
    expect(leavesLines({ critical: 8, target: 10 }).map((l) => l.label)).toEqual(['8 critical', '10 target']);
    expect(leavesLines({ critical: null, target: 10 }).map((l) => l.label)).toEqual(['10 target']);
    expect(leavesLines(null)).toEqual([]);
  });
  const cap = (leaves, canopy) => leavesCaption([{ week: '2026-W22', leaves: 1, canopy: 'ok' }, { week: '2026-W23', leaves, canopy }]);
  it('words the served status for the latest counted week', () => {
    expect(cap(11, 'ok')).toBe('11 functional leaves in 2026-W23. At or above the target.');
    expect(cap(9, 'watch')).toBe('9 functional leaves in 2026-W23. Below the target, above the critical level.');
    expect(cap(5, 'critical')).toBe('5 functional leaves in 2026-W23. Below the critical level.');
    expect(cap(5, null)).toBe('5 functional leaves in 2026-W23.');
    expect(cap(5, 'ok')).toBe('5 functional leaves in 2026-W23. At or above the target.'); // never re-judged by the client
  });
  it('skips weeks with no count, and says so when none has one', () => {
    expect(leavesCaption([{ week: '2026-W22', leaves: 6, canopy: 'watch' }, { week: '2026-W23', leaves: null }])).toContain('in 2026-W22');
    expect(leavesCaption(weeks)).toBe('No leaf count recorded.');
  });
  it('lists Leaves as missing only when the series is drawn on the view', () => {
    const j = weeks.map((w) => ({ ...w, leaves: w.week === '2026-W24' ? null : 6 }));
    expect(missingTextFor('leaves', j)).toBe('Missing weeks — Leaves: 2026-W24.');
    expect(missingTextFor('disease', j)).toBe('Missing weeks — YLI: 2026-W23.');
    expect(missingTextFor('all', weeks)).not.toContain('Leaves');
  });
});
