import { describe, it, expect } from 'vitest';
import { REFERRAL_TEXT } from './messages.js';

describe('REFERRAL_TEXT', () => {
  it('uses the decided wording and none of the internal vocabulary', () => {
    expect(REFERRAL_TEXT).toBe('The known sources do not yet support a confident answer for this leaf; refer to an expert.');
    expect(REFERRAL_TEXT).not.toMatch(/conflict|not_verified|knowledge graph/i);
  });
});
