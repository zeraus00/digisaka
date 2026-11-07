import { describe, it, expect } from 'vitest';
import { REFERRAL_TEXT, outcomeReasonText } from './messages.js';

describe('REFERRAL_TEXT', () => {
  it('uses the decided wording and none of the internal vocabulary', () => {
    expect(REFERRAL_TEXT).toBe('The known sources do not yet support a confident answer for this leaf; refer to an expert.');
    expect(REFERRAL_TEXT).not.toMatch(/conflict|not_verified|knowledge graph/i);
  });
});

describe('outcomeReasonText', () => {
  it('says in plain words why too few weekly records halt a line', () => {
    expect(outcomeReasonText('fewer_than_min_weeks')).toBe('There are not enough weekly records for the system to decide.');
  });
  it('shows an unknown code as recorded and nothing for no code', () => {
    expect(outcomeReasonText('something_new')).toBe('something_new');
    expect(outcomeReasonText(null)).toBe('');
  });
});
