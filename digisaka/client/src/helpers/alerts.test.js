import { describe, it, expect } from 'vitest';
import { orderAlerts, causeLabel, approveState } from './alerts.js';

const al = (kind, level) => ({ kind, level, text: `${kind}-${level}` });

describe('orderAlerts', () => {
  it('puts errors first, then Cannot-Check, then warnings, then notes', () => {
    const out = orderAlerts([al('history_coverage', 'info'), al('cap_approaching', 'warning'), al('cannot_check', 'warning'), al('cap_exceeded', 'error')]);
    expect(out.map((a) => a.kind)).toEqual(['cap_exceeded', 'cannot_check', 'cap_approaching', 'history_coverage']);
  });
  it('keeps payload order inside a group and does not mutate the input', () => {
    const input = [al('a', 'warning'), al('b', 'warning')];
    expect(orderAlerts(input).map((a) => a.kind)).toEqual(['a', 'b']);
    expect(input[0].kind).toBe('a');
  });
});

describe('causeLabel', () => {
  it('has a line per cause and a fallback', () => {
    expect(causeLabel('missing_rainfast')).toMatch(/rainfast/);
    expect(causeLabel('nope')).toMatch(/known sources/);
  });
  it('never says knowledge graph', () => {
    for (const c of ['missing_cap', 'missing_input', 'forecast_coverage', 'x']) expect(causeLabel(c)).not.toMatch(/knowledge graph|\bKG\b|query/i);
  });
});

describe('approveState', () => {
  const required = ['a', 'b'];
  it('enables approve once every Cannot-Check box is ticked', () => {
    expect(approveState({ approvable: true, required, acked: ['a'] }).ok).toBe(false);
    expect(approveState({ approvable: true, required, acked: ['b', 'a'] })).toEqual({ ok: true, reason: '' });
  });
  it('an error keeps approve off, with the reason, even when everything is acknowledged', () => {
    const s = approveState({ approvable: false, blockers: [{ text: 'D1 over cap.' }], required, acked: required });
    expect(s.ok).toBe(false);
    expect(s.reason).toContain('D1 over cap.');
  });
});
