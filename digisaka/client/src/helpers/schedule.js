import { fromIso, toIso } from './today.js';
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

// The days after an application's recommended start that its window still covers, as `window` entries.
function windowDays(events) {
  const out = [];
  for (const e of events) {
    if (e.kind !== 'application') continue;
    for (let d = fromIso(e.date), end = fromIso(e.end); (d.setDate(d.getDate() + 1), d <= end); ) out.push({ date: toIso(d), kind: 'window', of: e });
  }
  return out;
}

// One grid per month the events or their windows fall in: leading nulls pad to Monday, `onDay` is keyed
// by day of month and `inWindow` holds the window days no event of its own sits on.
export function monthGrids(events) {
  const by = new Map();
  for (const e of [...events, ...windowDays(events)]) {
    const key = e.date.slice(0, 7);
    if (!by.has(key)) by.set(key, []);
    by.get(key).push(e);
  }
  return [...by.keys()].sort().map((key) => {
    const [y, m] = key.split('-').map(Number);
    const first = fromIso(`${key}-01`), length = new Date(y, m, 0).getDate();
    const all = by.get(key).sort((a, b) => a.date.localeCompare(b.date));
    const mine = all.filter((e) => e.kind !== 'window');
    const onDay = {}, inWindow = {};
    for (const e of mine) (onDay[Number(e.date.slice(8))] ??= []).push(e);
    for (const w of all) if (w.kind === 'window' && !onDay[Number(w.date.slice(8))]) inWindow[Number(w.date.slice(8))] = w.of;
    return {
      key, month: MONTHS[m - 1], year: y, events: mine, onDay, inWindow,
      cells: [...Array((first.getDay() + 6) % 7).fill(null), ...Array.from({ length }, (_, i) => i + 1)],
      done: mine.filter((e) => e.done).length,
    };
  });
}
