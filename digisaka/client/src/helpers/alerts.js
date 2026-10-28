// Display rules for the Schedule Preview's alerts. Built only from fields the payload already carries.
const RANK = { error: 0, cannot_check: 1, warning: 2, info: 3 };
const rankOf = (a) => (a.level === 'error' ? RANK.error : a.kind === 'cannot_check' ? RANK.cannot_check : a.level === 'warning' ? RANK.warning : RANK.info);
export const LEVEL_ICON = { error: '⛔', warning: '⚠️', info: 'ℹ️' };

// One list: errors, then Cannot-Check, then warnings, then notes. Stable within a group.
export const orderAlerts = (alerts) => alerts.map((a, i) => [a, i]).sort(([a, i], [b, j]) => rankOf(a) - rankOf(b) || i - j).map(([a]) => a);

// A fixed one-line label per `cause`; an unknown cause falls back to the generic line.
const CAUSES = {
  missing_cap: 'The known sources give no cap on how often this product group may be used.',
  missing_mode_of_action: 'The known sources do not name this product’s mode of action.',
  missing_repeat_count: 'The known sources give no limit on repeat applications.',
  missing_rainfast: 'The known sources give no rainfast period for this product.',
  missing_weather_limit: 'The known sources give no wind or temperature limit for this product.',
  missing_threshold: 'The known sources give no usable threshold for this check.',
  missing_input: 'A value this check needs is not available yet.',
  missing_interval: 'The known sources give no spacing between applications for this product.',
  missing_risk: 'The known sources give no risk level for this product group.',
  forecast_coverage: 'The weather forecast does not cover these days.',
  history_coverage: 'Application history covers only what was recorded in the scheduler.',
};
export const causeLabel = (cause) => CAUSES[cause] ?? 'The known sources do not yet support this check.';
export const ACK_MEANING = 'Acknowledging means you will check this yourself before applying.';

// Approve is off while the selection is not approvable or a Cannot-Check box is unticked; `reason` says why.
export function approveState({ approvable, blockers = [], required = [], acked = [] }) {
  if (blockers.length) return { ok: false, reason: `Approve is off: ${blockers.map((b) => b.text).join(' ')}` };
  // The scheduler's `approvable` is false while acknowledgements are pending, so it only decides when none are.
  if (!approvable && !required.length) return { ok: false, reason: 'Approve is off: this selection cannot be approved.' };
  if (!required.every((id) => acked.includes(id))) return { ok: false, reason: 'Acknowledge every Cannot-Check item to approve.' };
  return { ok: true, reason: '' };
}
