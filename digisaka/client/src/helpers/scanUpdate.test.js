import { describe, it, expect } from 'vitest';
import { updateState } from './scanUpdate.js';

describe('updateState', () => {
  it('no reschedule means the line stage is unchanged, whatever else is set', () => {
    expect(updateState({ reschedule: null, tracked: '', updating: true })).toBe('unchanged');
  });
  it('a reschedule is updating until following it ends', () => {
    expect(updateState({ reschedule: { cycle_id: 'c1' }, tracked: '', updating: false })).toBe('updating');
    expect(updateState({ reschedule: { cycle_id: 'c1' }, tracked: 'ready', updating: true })).toBe('updating');
  });
  it.each(['ready', 'failed', 'timeout', 'error'])('a followed run that ended %s says so', (tracked) => {
    expect(updateState({ reschedule: { cycle_id: 'c1' }, tracked, updating: false })).toBe(tracked);
  });
});
