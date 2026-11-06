// Readable text for scheduler error codes; api.js errors carry the code in `.code`.
const MESSAGES = {
  unauthenticated: 'Your session expired. Sign in again.',
  forbidden: 'This account is not a Practitioner.',
  unknown_line: 'That line does not exist.',
  unknown_cycle: 'That cycle does not exist.',
  unknown_session: 'That scan does not belong to this line-week.',
  week_not_verified: 'Finish at least one scan, including its symptom confirmation, before closing the week.',
  product_not_offered: 'That product is not part of the current suggestion.',
  invalid_date: 'Enter the date as YYYY-MM-DD.',
  application_already_recorded: 'The application was already recorded.',
  cycle_running: 'The cycle is still running.',
  cycle_not_failed: 'Only a failed cycle can be retried.',
  cycle_slot_taken: 'Another cycle is already running for this line.',
  validation_error: 'The request was not accepted. Check the image and values and try again.',
  invalid_week: 'That is not a valid week. Use the form 2026-W24.',
  qa_unavailable: 'The QA service is unavailable. Try again shortly.',
  auth_unavailable: 'Sign-in could not be checked. Try again shortly.',
};
const GENERIC = 'Something went wrong. Try again.';

export const messageFor = (err) => MESSAGES[err?.code] || (err?.status === 0 ? 'Cannot reach the server. Check your connection.' : GENERIC);

// Plain wording for the scheduler's `outcome_reason` codes; an unknown code is shown as recorded.
const OUTCOME_REASONS = {
  disease_not_worsening: 'YLS is not below 8 and not falling.',
  disease_not_computable: 'There is not enough scan history to tell whether the disease is getting worse.',
  rainfall_not_favourable: 'Rainfall is not favourable for the disease.',
  rainfall_not_computable: 'Rainfall could not be assessed.',
  missing_feed_value: 'A weather or scan value is missing from the latest week\'s data.',
  requirement_not_fired: 'Treatment not yet warranted by the latest week\'s data and the current rules.',
  data_or_expert_review_needed: 'Data is missing or an expert needs to review the latest week\'s data.',
  fewer_than_min_weeks: 'There are not enough weekly records for the system to decide.',
};
export const outcomeReasonText = (code) => (code ? OUTCOME_REASONS[code] ?? code : '');

// Shown for a leaf whose QA outcome is `referral`; `conflict` and `not_verified` stay internal.
export const REFERRAL_TEXT = 'The known sources do not yet support a confident answer for this leaf; refer to an expert.';
