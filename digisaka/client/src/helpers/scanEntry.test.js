import { describe, it, expect } from 'vitest';
import { entryOf, showBackToScan } from './scanEntry.js';

const scan = (o = {}) => ({ line: 'L04', week: '2026-W24', step: 3, reschedule: { cycle_id: 'c1' }, ...o });
const at = (s, line = 'L04', week = '2026-W24') => ({ scan: s, line, week });

describe('entryOf', () => {
  it('follows the run of a matching line and week with a started run', () => {
    expect(entryOf(at(scan()))).toEqual({ kind: 'follow', cycleId: 'c1' });
  });
  it('loads for another line or week, or when no run started', () => {
    expect(entryOf(at(scan(), 'L05')).kind).toBe('load');
    expect(entryOf(at(scan(), 'L04', '2026-W23')).kind).toBe('load');
    expect(entryOf(at(scan({ reschedule: null }))).kind).toBe('load');
    expect(entryOf(at(scan({ line: '' }), '')).kind).toBe('load');
  });
});

describe('showBackToScan', () => {
  it('shows for a matching line and week at Results only', () => {
    expect(showBackToScan(at(scan()))).toBe(true);
    expect(showBackToScan(at(scan({ step: 2 })))).toBe(false);
    expect(showBackToScan(at(scan(), 'L05'))).toBe(false);
    expect(showBackToScan(at(scan(), 'L04', '2026-W23'))).toBe(false);
  });
});
