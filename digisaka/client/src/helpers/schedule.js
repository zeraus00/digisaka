import { fromIso } from './today.js';
import { productOf } from '../stores/selection.js';

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// The ISO week label ('2026-W23') of a date, as the scheduler names a line-week.
export function isoWeek(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const year = d.getUTCFullYear();
  return `${year}-W${String(Math.ceil(((d - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7)).padStart(2, '0')}`;
}

// The Selection preview's days as calendar events: an application (with its timing window) and/or a
// weekly assessment per day. An application is done when one is recorded for its product inside its window.
// A weekly assessment is done once the line has a finished cycle for its week (`assessedWeeks`).
// A recorded application that no planned window covers (an earlier week's spray) is its own `applied` event.
export function scheduleEvents(days, applications = [], nameOf = (id) => id, assessedWeeks = []) {
  const planned = (days ?? []).flatMap((d) => {
    const out = [];
    const app = d.application;
    if (app) {
      const { start, end } = app.timing_window ?? { start: d.date, end: d.date };
      const done = applications.some((a) => a.product_id === productOf(app.unit_id) && a.applied_on >= start && a.applied_on <= end);
      out.push({ date: d.date, kind: 'application', label: app.product, moa: app.moa, start, end, done, productId: productOf(app.unit_id) });
    }
    if (d.monitoring) out.push({ date: d.date, kind: 'monitoring', label: d.monitoring.label, after: d.reassessment?.of ?? null, done: assessedWeeks.includes(isoWeek(d.date)) });
    return out;
  });
  const covered = (a) => planned.some((e) => e.kind === 'application' && a.product_id === e.productId && a.applied_on >= e.start && a.applied_on <= e.end);
  const applied = applications.filter((a) => !covered(a)).map((a) => ({ date: a.applied_on, kind: 'applied', label: nameOf(a.product_id), done: true }));
  return [...planned, ...applied].sort((a, b) => a.date.localeCompare(b.date));
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
