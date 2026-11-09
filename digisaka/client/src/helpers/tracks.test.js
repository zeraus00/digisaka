import { test, expect } from 'vitest';
import { TRACKS, trackLabel, trackSplit } from './tracks.js';

test('single-site comes first and each track has its label', () => {
  expect(TRACKS.map(trackLabel)).toEqual(['Single-site', 'Multisite']);
  expect(trackLabel(undefined)).toBe('Single-site');
});

test('group usage splits by track, an unknown track is single-site', () => {
  const rows = [{ frac_code: '3', track: 'single_site' }, { frac_code: 'M 03', track: 'multisite' }, { frac_code: 'x' }];
  const split = trackSplit(rows);
  expect(split.single_site.map((g) => g.frac_code)).toEqual(['3', 'x']);
  expect(split.multisite.map((g) => g.frac_code)).toEqual(['M 03']);
  expect(trackSplit(null)).toEqual({ single_site: [], multisite: [] });
});
