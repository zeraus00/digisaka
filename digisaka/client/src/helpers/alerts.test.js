import { describe, it, expect } from 'vitest';
import { orderAlerts } from './alerts.js';

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
