import { fromIso } from './today.js';
import { productOf } from '../stores/selection.js';

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// The Selection preview's days as calendar events: an application (with its timing window) and/or a
// weekly assessment per day. An application is done when one is recorded for its product inside its window.
export function scheduleEvents(days, applications = []) {
  return (days ?? []).flatMap((d) => {
    const out = [];
    const app = d.application;
    if (app) {
      const { start, end } = app.timing_window ?? { start: d.date, end: d.date };
      const done = applications.some((a) => a.product_id === productOf(app.unit_id) && a.applied_on >= start && a.applied_on <= end);
      out.push({ date: d.date, kind: 'application', label: app.product, moa: app.moa, start, end, done });
    }
    if (d.monitoring) out.push({ date: d.date, kind: 'monitoring', label: d.monitoring.label, after: d.reassessment?.of ?? null, done: false });
    return out;
  });
}

// One grid per month the events fall in: leading nulls pad to Monday, `events` is keyed by day of month.
export function monthGrids(events) {
  const by = new Map();
  for (const e of events) {
    const key = e.date.slice(0, 7);
    if (!by.has(key)) by.set(key, []);
    by.get(key).push(e);
  }
  return [...by.keys()].sort().map((key) => {
    const [y, m] = key.split('-').map(Number);
    const first = fromIso(`${key}-01`), length = new Date(y, m, 0).getDate();
    const mine = by.get(key).sort((a, b) => a.date.localeCompare(b.date));
    const onDay = {};
    for (const e of mine) (onDay[Number(e.date.slice(8))] ??= []).push(e);
    return {
      key, month: MONTHS[m - 1], year: y, events: mine, onDay,
      cells: [...Array((first.getDay() + 6) % 7).fill(null), ...Array.from({ length }, (_, i) => i + 1)],
      done: mine.filter((e) => e.done).length,
    };
  });
}
