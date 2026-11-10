import { describe, it, expect } from 'vitest';
import { REFERRAL_TEXT, outcomeReasonText, reasonLine } from './messages.js';

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

describe('reasonLine', () => {
  const assessment = { note: 'No treatment trigger this week.', caveat: null };
  it('shows the served assessment note instead of the generic reason code, with a caveat only when one is served', () => {
    expect(reasonLine({ assessment, outcome_reason: 'requirement_not_fired' })).toEqual({ text: 'No treatment trigger this week.', caveat: '' });
    expect(reasonLine({ assessment: { ...assessment, caveat: 'Check it.' } }).caveat).toBe('Check it.');
  });
  it('keeps the reason code wording when the response has no assessment (an older scheduler, a halted run)', () => {
    expect(reasonLine({ assessment: null, outcome_reason: 'fewer_than_min_weeks' })).toEqual({ text: outcomeReasonText('fewer_than_min_weeks'), caveat: '' });
    expect(reasonLine({ outcome_reason: 'requirement_not_fired' }).text).toBe(outcomeReasonText('requirement_not_fired'));
    expect(reasonLine({ assessment: null, outcome_reason: null })).toBeNull();
  });
});
