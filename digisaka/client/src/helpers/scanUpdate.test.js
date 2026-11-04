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
  it.each(['ready', 'unchanged', 'failed', 'timeout', 'error'])('a followed run that ended %s says so', (tracked) => {
    expect(updateState({ reschedule: { cycle_id: 'c1' }, tracked, updating: false })).toBe(tracked);
  });
});

import { isCurrent, hasFungicides } from './scanUpdate.js';
describe('suggestion gate', () => {
  it('is current only when read, not updating, and ready or unchanged', () => {
    expect(isCurrent({ phase: 'ready', updating: false, state: 'ready' })).toBe(true);
    expect(isCurrent({ phase: 'ready', updating: false, state: 'unchanged' })).toBe(true);
    expect(isCurrent({ phase: 'ready', updating: true, state: 'ready' })).toBe(false);
    expect(isCurrent({ phase: 'loading', updating: false, state: 'ready' })).toBe(false);
    expect(isCurrent({ phase: 'ready', updating: false, state: 'failed' })).toBe(false);
  });
  it('has fungicides only when no outcome was served', () => {
    expect([hasFungicides({}), hasFungicides({ outcome: 'continue_monitoring' }), hasFungicides(null)]).toEqual([true, false, true]);
  });
});
