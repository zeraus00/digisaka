import { describe, it, expect } from 'vitest';
import { humanDetail, unitGroup, stripChecks, titleCase, sentenceCase, explainMoa } from './checks.js';

describe('humanDetail', () => {
  it('splits the group cap into a count, a range and a source', () => {
    const r = humanDetail('group_cap', 'C3: 0 recorded + 1 planned = 1, range 2 to 3 per crop cycle, source FAO fungicide manual, section 4.3.2, pp. 31-32');
    expect(r).toEqual({ text: 'Group C3: 0 recorded + 1 planned = 1. Allowed 2 to 3 per crop cycle', source: 'FAO fungicide manual, section 4.3.2, pp. 31-32' });
  });
  it('reads the fail, approaching and short group cap forms', () => {
    expect(humanDetail('group_cap', 'D1: 4 recorded + 1 planned = 5 > max 4 per crop cycle').text).toContain('above the maximum of 4 per crop cycle');
    expect(humanDetail('group_cap', 'G2: 0 recorded + 2 planned = 2, at the minimum of 2 (maximum 3): approaching').text).toContain('approaching the maximum of 3');
    expect(humanDetail('group_cap', 'M: 2 of 3 to 4 per crop cycle').text).toBe('Group M: 2 planned. Allowed 3 to 4 per crop cycle');
  });
  it('reads durations, repeats and risk levels', () => {
    expect(humanDetail('label_weather', 'PT2H').text).toBe('Rainfast after 2 h');
    expect(humanDetail('max_consecutive', '1 of 2').text).toBe('1 in a row, at most 2 allowed');
    expect(humanDetail('resistance_risk', 'high, very high').text).toBe('Sources differ: high, very high');
    expect(humanDetail('resistance_risk', 'medium, medium').text).toBe('Risk medium');
  });
  it('reads the mixture note', () => {
    expect(humanDetail('mixture', 'not checked by the scheduler (property: systemic)').text).toBe('The scheduler does not check this, so check it yourself. Needs: systemic.');
    expect(humanDetail('mixture', 'not checked by the scheduler (carrier: Straight mineral oil; property: Morpholines)').text).toContain('Add: Straight mineral oil. Needs: Morpholines.');
    expect(humanDetail('mixture', 'not checked by the scheduler (other: x)').text).toBe('not checked by the scheduler (other: x)');
  });
  it('shows an unknown template as it came', () => {
    expect(humanDetail('group_cap', 'something new').text).toBe('something new');
    expect(humanDetail('label_weather', 'Rainfast 3 h').text).toBe('Rainfast 3 h');
    expect(humanDetail('mixture', null)).toBeNull();
  });
});

describe('unitGroup', () => {
  const u = (over, ...r) => ({ checks: r.map((result) => ({ check: 'x', result })), ...over });
  it('splits picked, eligible and failed units', () => {
    expect(unitGroup(u({}, 'pass', 'warn'))).toBe('recommended');
    expect(unitGroup(u({ excluded_from_schedule: true, selectable: true }, 'pass'))).toBe('eligible');
    expect(unitGroup(u({ excluded_from_schedule: true, selectable: false }, 'pass'))).toBe('excluded');
  });
  it('counts a failed check when selectable is absent', () => expect(unitGroup(u({ excluded_from_schedule: true }, 'fail'))).toBe('excluded'));
  it('strips only the non-pass checks', () => expect(stripChecks(u({}, 'pass', 'warn', 'unchecked'))).toHaveLength(1));
});

describe('casing', () => {
  it('title-cases a product name and keeps the rest as written', () => {
    expect(titleCase('azoxystrobin')).toBe('Azoxystrobin');
    expect(titleCase('thiophanate-methyl')).toBe('Thiophanate-methyl');
    expect(titleCase('paviso 13WP')).toBe('Paviso 13WP');
  });
  it('sentence-cases a phrase', () => expect(sentenceCase('systemic')).toBe('Systemic'));
});

describe('explainMoa', () => {
  it('adds the meaning of M and leaves other groups alone', () => {
    expect(explainMoa('Mode of action M')).toBe('Mode of action M (multi-site)');
    expect(explainMoa('Mode of action B1')).toBe('Mode of action B1');
    expect(humanDetail('mixture', 'not checked by the scheduler (carrier: Straight mineral oil; property: Mode of action M)').text).toContain('Needs: Mode of action M (multi-site).');
  });
});
