import { describe, it, expect, afterEach } from 'vitest';
import { computed } from 'vue';
import { todayIso, toIso, fromIso, setToday, keepIfEdited } from './today.js';
import { isoWeekOf } from './week.js';

describe('today', () => {
  it('is a day in 2026-W24, where the stub data ends', () => {
    expect(isoWeekOf(new Date(todayIso() + 'T12:00:00'))).toBe('2026-W24');
  });
  it('round-trips ISO dates without shifting the day', () => {
    expect(toIso(fromIso('2026-06-08'))).toBe('2026-06-08');
  });
  afterEach(() => setToday('2026-06-08'));
  it('is reactive: a computed over todayIso follows setToday', () => {
    const c = computed(() => todayIso());
    expect(c.value).toBe('2026-06-08');
    setToday('2026-06-15');
    expect(c.value).toBe('2026-06-15');
  });
  it('keeps what the user edited and moves what still holds the old date', () => {
    expect(keepIfEdited('2026-06-08', '2026-06-08', '2026-06-15')).toBe('2026-06-15');
    expect(keepIfEdited('2026-06-10', '2026-06-08', '2026-06-15')).toBe('2026-06-10');
  });
});
