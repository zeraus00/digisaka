import { fromIso } from './today.js';
import { shownName } from './checks.js';
import { productOf } from '../stores/suggestion.js';

// The kind pill of a step: the server sets the kind, these only word it.
export const STEP_KIND = { single_site: 'Alone', single_site_with_partner: 'With partner', multisite: 'Multisite alone' };
// The status pill of a step: the server sets the status, these only word it. Overdue is red, Applied green, the rest neutral.
export const STATUS_LABEL = { planned: 'Planned', due: 'Due', applied: 'Applied', skipped: 'Skipped', overdue: 'Overdue' };
export const STATUS_TONE = { applied: 'ok', overdue: 'bad', due: 'warn', skipped: '', planned: '' };
export const SKIP_REASONS = { rain: 'Rain', no_product: 'No product', low_disease: 'Low disease', other: 'Other' };
// The buttons follow the status: Skip on a Due or Overdue step, Undo skip on a Skipped one (the server decides the rest).
export const canSkip = (e) => !!e.stepId && (e.status === 'due' || e.status === 'overdue');
// A due or overdue step can be recorded against; the same steps can be skipped.
export const canRecord = canSkip;
export const canUndo = (e) => !!e.stepId && e.status === 'skipped';
export const MIXTURE_NOTE = 'Mixture conditions checked; physical compatibility not assessed.';

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// The ISO week label ('2026-W23') of a date, as the scheduler names a line-week.
export function isoWeek(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const year = d.getUTCFullYear();
  return `${year}-W${String(Math.ceil(((d - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7)).padStart(2, '0')}`;
}

// The suggestion's schedule days as calendar events: an application (with its timing window) and/or a
// weekly assessment per day. An application is done when one is recorded for its product inside its window.
// A weekly assessment is done once the line has a finished cycle for its week (`assessedWeeks`).
// Every recorded application is its own `applied` event, so the calendar can show it apart from the suggested step.
// When the server serves step status (`application.status`), it also serves the Applied, Skipped and Off-plan rows,
// so the status is shown as served and the records list adds no events of its own.
export function scheduleEvents(days, applications = [], nameOf = (id) => id, assessedWeeks = []) {
  const served = (days ?? []).some((d) => d.application?.status);
  const planned = (days ?? []).flatMap((d) => {
    const out = [];
    const app = d.application;
    if (app?.status) {
      const partner = app.partner ?? null;
      const { start, end } = app.timing_window?.start ? app.timing_window : { start: d.date, end: d.date };
      out.push({
        date: d.date, kind: app.status === 'applied' ? 'applied' : app.status === 'skipped' ? 'skipped' : 'application',
        label: partner ? `${shownName(app.product)} + ${shownName(partner.product)}` : shownName(app.product), moa: partner ? `${app.moa} + ${partner.moa}` : app.moa,
        start, end, done: app.status === 'applied', productId: app.unit_id ? productOf(app.unit_id) : null, partnerId: partner?.unit_id ? productOf(partner.unit_id) : null, partnerOptions: app.partner_options ?? [], step: app.kind ?? null, why: app.why ?? null, partner,
        stepId: app.step_id ?? null, status: app.status, note: app.status_note ?? null, skip: app.skip ?? null, offPlan: app.off_plan === true,
      });
    } else if (app) {
      const { start, end } = app.timing_window ?? { start: d.date, end: d.date };
      const done = applications.some((a) => a.product_id === productOf(app.unit_id) && a.applied_on >= start && a.applied_on <= end);
      // One event per step: a partnered step is titled with both products and groups. The server sets `step` (kind) and `why`.
      const partner = app.partner ?? null;
      out.push({
        date: d.date, kind: 'application', label: partner ? `${shownName(app.product)} + ${shownName(partner.product)}` : shownName(app.product), moa: partner ? `${app.moa} + ${partner.moa}` : app.moa,
        start, end, done, productId: productOf(app.unit_id), step: app.kind ?? null, why: app.why ?? null, partner,
      });
    }
    if (d.monitoring) out.push({ date: d.date, kind: 'monitoring', label: d.monitoring.label, after: d.reassessment?.of ?? null, done: assessedWeeks.includes(isoWeek(d.date)) });
    return out;
  });
  const applied = served ? [] : applications.map((a) => ({ date: a.applied_on, kind: 'applied', label: shownName(nameOf(a.product_id)), done: true }));
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
