// Readable text for scheduler error codes; api.js errors carry the code in `.code`.
const MESSAGES = {
  unauthenticated: 'Your session expired. Sign in again.',
  forbidden: 'This account is not a Practitioner.',
  unknown_line: 'That line does not exist.',
  unknown_cycle: 'That cycle does not exist.',
  unknown_selection: 'There is no treatment selection for this cycle.',
  unknown_session: 'That scan does not belong to this line-week.',
  week_not_verified: 'Finish at least one scan, including its symptom confirmation, before closing the week.',
  selection_not_draft: 'This selection was already decided.',
  selection_not_renewable: 'Only an approved selection can be renewed.',
  selection_not_approvable: 'A blocking alert has to be resolved before this selection can be approved.',
  acknowledgements_required: 'Acknowledge every listed check before approving.',
  no_active_selection: 'No approval period of this selection covers that date.',
  product_not_in_selection: 'That product is not part of this selection.',
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
  disease_not_worsening: 'The disease is not getting worse.',
  disease_not_computable: 'There is not enough scan history to tell whether the disease is getting worse.',
  rainfall_not_favourable: 'Rainfall is not favourable for the disease.',
  rainfall_not_computable: 'Rainfall could not be assessed.',
  missing_feed_value: 'Weather or scan data for this week is missing.',
  gate_e_rejected: 'The selection was rejected.',
};
export const outcomeReasonText = (code) => (code ? OUTCOME_REASONS[code] ?? code : '');

// Shown for a leaf whose QA outcome is `referral`; `conflict` and `not_verified` stay internal.
export const REFERRAL_TEXT = 'The known sources do not yet support a confident answer for this leaf; refer to an expert.';
