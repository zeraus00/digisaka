import { describe, it, expect } from 'vitest';
import { REFERRAL_TEXT, outcomeReasonText, reasonLine, ASSESSMENT_RESULT, ASSESSMENT_ROLE } from './messages.js';

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
  const assessment = { note: 'No treatment trigger this week.', caveat: 'The rules decide.' };
  it('shows the served assessment note and its caveat instead of the generic reason code', () => {
    expect(reasonLine({ assessment, outcome_reason: 'requirement_not_fired' })).toEqual({ text: 'No treatment trigger this week.', caveat: 'The rules decide.' });
  });
  it('keeps the reason code wording when the response has no assessment (an older scheduler, a halted run)', () => {
    expect(reasonLine({ assessment: null, outcome_reason: 'fewer_than_min_weeks' })).toEqual({ text: outcomeReasonText('fewer_than_min_weeks'), caveat: '' });
    expect(reasonLine({ outcome_reason: 'requirement_not_fired' }).text).toBe(outcomeReasonText('requirement_not_fired'));
    expect(reasonLine({ assessment: null, outcome_reason: null })).toBeNull();
  });
  it('words each result and role as served, never as a verdict of its own', () => {
    expect(ASSESSMENT_RESULT).toEqual({ met: 'Found', not_met: 'Not found', cannot_check: 'Could not be checked' });
    expect(ASSESSMENT_ROLE).toEqual({ trigger: 'Treatment trigger', context: 'Context only, not a treatment trigger' });
  });
});
