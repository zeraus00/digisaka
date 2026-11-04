import { describe, it, expect } from 'vitest';
import { paginate } from './paging.js';

const rows = Array.from({ length: 7 }, (_, i) => i + 1);

describe('paginate', () => {
  it('shows five rows on page 1 and the rest on page 2', () => {
    expect(paginate(rows, 1)).toEqual({ shown: [1, 2, 3, 4, 5], pages: 2 });
    expect(paginate(rows, 2)).toEqual({ shown: [6, 7], pages: 2 });
  });
  it('an empty or short list is one page', () => {
    expect(paginate([], 1)).toEqual({ shown: [], pages: 1 });
    expect(paginate([1, 2, 3, 4, 5], 1).pages).toBe(1);
  });
});
