// Pieces shared by the scheduler route files. Errors are the scheduler's flat {error, detail}.
import { userForToken } from './supabase.js';

export const BASE = '/api/v1/scheduler';
export const fail = (status, error, detail) => ({ status, body: { error, detail } });
export const ok = (body) => ({ status: 200, body });

// The scheduler wants a Practitioner: no token is 401, a Technical User without the role is 403.
export function authed(handle) {
  return (req) => {
    const user = userForToken((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
    if (!user) return fail(401, 'unauthenticated', 'Sign in to continue.');
    if (!user.roles.includes('practitioner')) return fail(403, 'forbidden', 'This account is not a Practitioner.');
    return handle(req);
  };
}

// ISO week keys such as 2026-W24; week 53 only exists in years whose 28 December falls in it.
export function isValidWeek(value) {
  const m = /^(\d{4})-W(\d{2})$/.exec(value);
  if (!m) return false;
  const year = Number(m[1]), week = Number(m[2]);
  const d = new Date(Date.UTC(year, 11, 28));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const last = Math.ceil(((d - Date.UTC(d.getUTCFullYear(), 0, 1)) / 86400000 + 1) / 7);
  return week >= 1 && week <= last;
}

// The stub's default "today": the scheduler's SCHEDULER_DEMO_TODAY (see client/src/helpers/today.js).
export const TODAY = '2026-06-15';
// The date the stub treats as today: the dev date when one is set, else TODAY (the scheduler's DevClock).
export const todayOf = (store) => store.data.devToday ?? TODAY;

// The ISO week key `n` weeks from `week` (n may be negative), through the Thursday that names a week's year.
export function shiftWeek(week, n) {
  const [y, w] = week.split('-W').map(Number);
  const mondayOf = (year) => { const j4 = new Date(Date.UTC(year, 0, 4)); j4.setUTCDate(j4.getUTCDate() - ((j4.getUTCDay() + 6) % 7)); return j4; };
  const mon = mondayOf(y); mon.setUTCDate(mon.getUTCDate() + (w - 1 + n) * 7);
  const thu = new Date(mon); thu.setUTCDate(mon.getUTCDate() + 3);
  const year = thu.getUTCFullYear();
  return `${year}-W${String(Math.round((mon - mondayOf(year)) / 604800000) + 1).padStart(2, '0')}`;
}

// The ISO week key of a YYYY-MM-DD day (the week of its Thursday).
export function weekOf(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const jan1 = Date.UTC(d.getUTCFullYear(), 0, 1);
  return `${d.getUTCFullYear()}-W${String(Math.ceil(((d - jan1) / 86400000 + 1) / 7)).padStart(2, '0')}`;
}

// Where a weekly read for `asked` ends, as the scheduler's read_end does: the Last finished week of the asked week,
// capped at the Last finished week of the stub's today (the week before the one the day is in).
export const readEnd = (asked, todayIso) => {
  const own = shiftWeek(asked, -1), cap = shiftWeek(weekOf(todayIso), -1);
  return own < cap ? own : cap;
};
