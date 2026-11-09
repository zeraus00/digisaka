// The two tracks a fungicide is on. The server sets each unit's and row's `track`; these tables only word it.
export const TRACKS = ['single_site', 'multisite'];
const LABEL = { single_site: 'Single-site', multisite: 'Multisite' };
export const trackLabel = (track) => LABEL[track] ?? LABEL.single_site;
// Group usage rows split by track (an unknown value counts as single-site, as the server maps it).
export const trackSplit = (usage) => ({
  single_site: (usage ?? []).filter((g) => g.track !== 'multisite'),
  multisite: (usage ?? []).filter((g) => g.track === 'multisite'),
});
