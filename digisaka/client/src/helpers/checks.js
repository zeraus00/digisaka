// Display rules for a unit's checks. Built only from fields the payload already carries; the scheduler's detail text is a
// fixed template, so each reader matches one template and anything else is shown as it came.
export const CHECK_LABEL = {
  stage_eligibility: 'Growth stage', rotation: 'Rotation', alternation: 'Alternation', max_consecutive: 'Repeat applications', group_cap: 'Applications per group',
  mixture: 'Mixture', resistance_risk: 'Resistance risk', label_weather: 'Label and weather', fit_of_moa_to_conditions: 'Fit to conditions',
};
export const checkLabel = (check) => CHECK_LABEL[check] ?? check.replace(/_/g, ' ');

// The payload's `multisite` flag is what the group code M means; other letters stay bare until a cited source gives their meaning.
export const explainMoa = (s) => (s ?? '').replace(/\bMode of action M\b/g, 'Mode of action M (multi-site)');

const PER = { 'crop cycle': 'per crop cycle', 'calendar year': 'per calendar year' };
const READERS = {
  group_cap(d) {
    let m = d.match(/^(.+?): (\d+) recorded \+ (\d+) planned = (\d+)(?:, range (\d+) to (\d+) (per [a-z ]+?)(?:, source (.+))?)?$/);
    if (m) return { text: `Group ${m[1]}: ${m[2]} recorded + ${m[3]} planned = ${m[4]}${m[5] ? `. Allowed ${m[5]} to ${m[6]} ${m[7]}` : ''}`, source: m[8] };
    m = d.match(/^(.+?): (\d+) recorded \+ (\d+) planned = (\d+) > max (\d+) (per [a-z ]+)$/);
    if (m) return { text: `Group ${m[1]}: ${m[2]} recorded + ${m[3]} planned = ${m[4]}, above the maximum of ${m[5]} ${m[6]}` };
    m = d.match(/^(.+?): (\d+) recorded \+ (\d+) planned = (\d+), at the minimum of (\d+) \(maximum (\d+)\): approaching$/);
    if (m) return { text: `Group ${m[1]}: ${m[2]} recorded + ${m[3]} planned = ${m[4]}. At the minimum of ${m[5]}, approaching the maximum of ${m[6]}` };
    m = d.match(/^(.+?): (\d+) of (\d+) to (\d+) (per [a-z ]+)$/);
    return m ? { text: `Group ${m[1]}: ${m[2]} planned. Allowed ${m[3]} to ${m[4]} ${m[5]}` } : null;
  },
  max_consecutive(d) {
    const m = d.match(/^(\d+) of (\d+)$/);
    return m ? { text: `${m[1]} in a row, at most ${m[2]} allowed` } : null;
  },
  label_weather(d) {
    const m = d.match(/^PT(\d+)H$/);
    return m ? { text: `Rainfast after ${m[1]} h` } : null;
  },
  mixture(d) {
    const m = d.match(/^not checked by the scheduler \((.+)\)$/);
    if (!m) return null;
    // Same Add / Needs words as the unit's conditions list.
    const KIND = { carrier: 'Add', property: 'Needs' };
    const parts = m[1].split('; ').map((p) => p.match(/^(carrier|property): (.+)$/));
    if (parts.some((p) => !p)) return null;
    return { text: `The scheduler does not check this, so check it yourself. ${parts.map((p) => `${KIND[p[1]]}: ${explainMoa(p[2])}.`).join(' ')}` };
  },
  resistance_risk(d) {
    const parts = d.split(', ');
    if (!/^[a-z ]+(, [a-z ]+)*$/.test(d) || parts.length > 4) return null;
    const risks = parts.join(', ');
    // Two risk levels are two sources' readings; when they differ, show both rather than pick one.
    return { text: new Set(parts).size === 1 ? `Risk ${parts[0]}` : `Sources differ: ${risks}` };
  },
};

// {text, source?} for one check's detail, or null when it has none.
export function humanDetail(check, detail) {
  if (!detail) return null;
  return READERS[check]?.(detail) ?? { text: detail };
}

const WORST = ['fail', 'cannot_check', 'warn'];
export const RESULT_LABEL = { pass: 'Pass', warn: 'Caution', fail: 'Fail', cannot_check: 'Check by hand', unchecked: 'Not checked' };

// recommended: the sequencer's pick; eligible: passed but not picked; excluded: failed a check.
// `selectable` can be absent in older payloads, so a failed check counts too.
export function unitGroup(unit) {
  if (unit.selectable === false || (unit.checks ?? []).some((c) => c.result === 'fail')) return 'excluded';
  return unit.excluded_from_schedule ? 'eligible' : 'recommended';
}
export const GROUP_LABEL = { recommended: 'Recommended', eligible: 'Eligible', excluded: 'Fails a check' };

// The checks that need a strip on the card: everything that is not a pass or an unchecked note.
export const stripChecks = (unit) => (unit.checks ?? []).filter((c) => WORST.includes(c.result));

// A product name arrives as the source wrote it ("azoxystrobin"); capitalise each word, leaving the rest as written.
export const titleCase = (s) => (s ?? '').replace(/(^|\s)(\p{L})/gu, (_, sp, c) => sp + c.toUpperCase());
export const sentenceCase = (s) => (s ?? '').charAt(0).toUpperCase() + (s ?? '').slice(1);
