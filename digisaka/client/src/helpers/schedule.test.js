import { describe, it, expect } from 'vitest';
import { scheduleEvents, monthGrids } from './schedule.js';
import { productOf } from '../stores/selection.js';

const unit = 'http://x#Type|http://x#FungicideAzoxystrobin';
const days = [
  { date: '2026-06-29', application: { product: 'azoxystrobin', moa: 'C3', unit_id: unit, timing_window: { start: '2026-06-29', end: '2026-07-03' } } },
  { date: '2026-07-06', monitoring: { label: 'Weekly assessment' }, reassessment: { of: 'planned 2026-06-29 azoxystrobin' } },
];

describe('scheduleEvents', () => {
  it('turns an application day and an assessment day into events', () => {
    const ev = scheduleEvents(days);
    expect(ev.map((e) => [e.date, e.kind, e.label, e.done])).toEqual([
      ['2026-06-29', 'application', 'azoxystrobin', false],
      ['2026-07-06', 'monitoring', 'Weekly assessment', false],
    ]);
    expect(ev[1].after).toBe('planned 2026-06-29 azoxystrobin');
  });
  it('marks an application done only for its product inside its window', () => {
    const rec = (applied_on, product_id) => scheduleEvents(days, [{ product_id, applied_on }])[0].done;
    const id = productOf(unit);
    expect(rec('2026-07-01', id)).toBe(true);
    expect(rec('2026-07-04', id)).toBe(false);
    expect(rec('2026-07-01', 'other')).toBe(false);
  });
  it('adds an applied event for a recorded application no planned window covers, in date order', () => {
    const ev = scheduleEvents(days, [{ product_id: 'http://x#FungicidePyrimethanil', applied_on: '2026-06-01' }], (id) => id.split('#').pop());
    expect(ev.map((e) => [e.date, e.kind, e.label, e.done])).toEqual([
      ['2026-06-01', 'applied', 'FungicidePyrimethanil', true],
      ['2026-06-29', 'application', 'azoxystrobin', false],
      ['2026-07-06', 'monitoring', 'Weekly assessment', false],
    ]);
  });
  it('does not repeat an application a planned window already covers', () => {
    const ev = scheduleEvents(days, [{ product_id: productOf(unit), applied_on: '2026-07-01' }]);
    expect(ev.filter((e) => e.kind === 'applied')).toEqual([]);
  });
  it('handles a missing days list', () => expect(scheduleEvents(undefined)).toEqual([]));
});

describe('monthGrids', () => {
  it('groups events by month and pads the grid to Monday', () => {
    const [jun, jul] = monthGrids(scheduleEvents(days));
    expect([jun.month, jun.year, jul.month]).toEqual(['June', 2026, 'July']);
    expect(jun.cells[0]).toBe(1); // 1 June 2026 is a Monday
    expect(jul.cells.slice(0, 3)).toEqual([null, null, 1]); // 1 July is a Wednesday
    expect(jun.onDay[29][0].label).toBe('azoxystrobin');
    expect(jun.events).toHaveLength(1);
  });
});
