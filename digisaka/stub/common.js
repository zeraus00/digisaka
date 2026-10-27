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
