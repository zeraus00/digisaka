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
