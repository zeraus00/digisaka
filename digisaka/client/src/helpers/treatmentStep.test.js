import { describe, it, expect } from 'vitest';
import { STEPS, stepOf } from './treatmentStep.js';

describe('stepOf', () => {
  it('returns each valid step as given', () => {
    for (const { id } of STEPS) expect(stepOf(id)).toBe(id);
  });
  it('opens Schedule for a missing, unknown or repeated value', () => {
    for (const v of [undefined, null, '', 'nope', 'Weather', ['weather', 'spray'], ['weather']]) expect(stepOf(v)).toBe('schedule');
  });
});
