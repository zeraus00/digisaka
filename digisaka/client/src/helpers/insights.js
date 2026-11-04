// Text for the insights screens. The server sets every verdict; these tables only word the value it sent, and an unknown value passes through.
const CANOPY = { ok: 'OK', watch: 'Watch', critical: 'Critical' };
export const canopyLabel = (status) => (status == null ? null : CANOPY[status] ?? status);

// The disease trend is the fired reading of rule R1 (a KG rule name, so a rename shows "Not assessed" until this follows).
export const PROGRESSION_RULE = 'R1';
export const progressionReading = (readings) => (readings ?? []).find((r) => r.rule?.startsWith(PROGRESSION_RULE)) ?? null;

// A suggestion with no outcome is a treatment suggestion; the two served outcomes are monitoring and expert review.
const OUTCOME = { continue_monitoring: 'Continue monitoring', human_review_required: 'Expert review suggested' };
export const outcomeText = (outcome) => (outcome == null ? 'Treatment suggested' : OUTCOME[outcome] ?? outcome);

// The canopy meter: the scale reaches 1.2 times the target, or the value when that is larger.
export const canopyScale = (value, target) => Math.max(1.2 * (target ?? 0), value ?? 0) || 1;
export const percentOf = (value, scale) => Math.min(100, Math.max(0, ((value ?? 0) / scale) * 100));

export function rainOutlookText(outlook) {
  const days = outlook?.days ?? [];
  if (!days.length || outlook.status === 'weather_not_yet_checked') return 'Weather not yet checked.';
  const rain = days.filter((d) => d.status === 'rain').length;
  const unreported = days.filter((d) => d.status === 'not_reported').length;
  const over = outlook.rain_above_mm == null ? '' : ` (rain means over ${outlook.rain_above_mm} mm)`;
  return `Rain on ${rain} of the next ${days.length} days${unreported ? `, ${unreported} not reported` : ''}${over}`;
}

// A condition's result as the practitioner reads it; an unknown result passes through.
const CONDITION = { met: 'Met', not_met: 'Not met', cannot_check: 'Cannot be checked' };
export const conditionWord = (result) => CONDITION[result] ?? result;

// The Treatment chip is on when either fungicide kind is active; the other chips follow their own kind.
export const TREATMENT_KINDS = ['systemic_fungicide', 'contact_fungicide'];
export const actionChips = (kinds) => {
  const on = (...names) => (kinds ?? []).some((k) => k.active && names.includes(k.kind));
  return [['Preventive', on('preventive')], ['Mechanical', on('mechanical')], ['Treatment', on(...TREATMENT_KINDS)], ['Monitor', on('monitoring')]];
};

// A day of the 5-day strip: its weekday, and the rainfall it shows ("—" when the weather is not reported).
export const weekday = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' });
export const dayRain = (d) => (d.status === 'dry' ? '0 mm' : d.status === 'rain' && d.precipitation_mm != null ? `${d.precipitation_mm} mm` : '—');

// Spray log wording. A group is "Discouraged" or "Maxed" only when the server says so; no status shows no pill.
export const STATUS_LABEL = { ok: 'OK', discouraged: 'Discouraged', maxed: 'Maxed' };
const TONE = { discouraged: 'warn', maxed: 'bad' };
// The badge on a recorded spray comes from the group row with the same FRAC code.
export function sprayBadge(spray, usage) {
  const status = (usage ?? []).find((g) => g.frac_code === spray.frac_code)?.status;
  return { label: STATUS_LABEL[status] && status !== 'ok' ? STATUS_LABEL[status] : 'Applied', tone: TONE[status] ?? 'ok' };
}
export const fracHeading = (usage) => ((usage ?? []).some((g) => g.status === 'discouraged' || g.status === 'maxed') ? 'Discouraged FRAC groups' : 'FRAC history');
export const usageLine = (g) => (g.range_min == null || g.range_max == null ? `${g.count} recorded, cap unknown` : `${g.count} of ${g.range_min} to ${g.range_max} ${g.period}`);
