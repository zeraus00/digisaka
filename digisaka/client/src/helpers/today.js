import { ref } from 'vue';

// The app's "today". The stub scheduler data ends at 2026-W24, so the app starts on the Monday of that
// week instead of the real clock; in a dev build the scheduler's dev clock replaces it (stores/devClock.js).
// Set `null` to use the real date again.
const day = ref('2026-06-08');

export const setToday = (iso) => { day.value = iso; };
export const today = () => (day.value ? fromIso(day.value) : new Date());
export const todayIso = () => toIso(today());
// A value that still holds the old default follows the new one; one the user edited stays.
export const keepIfEdited = (current, oldDefault, next) => (current === oldDefault ? next : current);

export function toIso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
// A YYYY-MM-DD string as a local date (not UTC, so the day never shifts).
export function fromIso(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
