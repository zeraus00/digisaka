// Display rules for the Schedule Preview's alerts. Built only from fields the payload already carries.
const RANK = { error: 0, cannot_check: 1, warning: 2, info: 3 };
const rankOf = (a) => (a.level === 'error' ? RANK.error : a.kind === 'cannot_check' ? RANK.cannot_check : a.level === 'warning' ? RANK.warning : RANK.info);
// Icon names (components/Icon.vue) by alert level.
export const LEVEL_ICON = { error: 'error', warning: 'alert', info: 'info' };

// One list: errors, then Cannot-Check, then warnings, then notes. Stable within a group.
export const orderAlerts = (alerts) => alerts.map((a, i) => [a, i]).sort(([a, i], [b, j]) => rankOf(a) - rankOf(b) || i - j).map(([a]) => a);
