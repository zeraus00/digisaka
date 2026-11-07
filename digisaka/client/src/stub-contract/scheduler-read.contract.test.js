// Drives the real lines, line-history and evidence stores (and the shared api.js) against the in-process stub.
import { describe, it, expect } from 'vitest';
import { useStub } from './harness.js';
import { useAuthStore } from '../stores/auth.js';
import { useLinesStore, dashboardSummary, weekRows } from '../stores/lines.js';
import { useLineHistoryStore } from '../stores/lineHistory.js';
import { useEvidenceStore } from '../stores/evidence.js';
import { diseaseCaption, rainfallCaption } from '../helpers/evidence.js';

const ctx = useStub();

describe('lines store against the stub', () => {
  it('loads every seed line for the dashboard and schedule list', async () => {
    const s = useLinesStore();
    await s.load();
    expect(s.error).toBe('');
    expect(s.statuses.map((l) => l.line_id)).toEqual(Array.from({ length: 21 }, (_, i) => `L${String(i + 1).padStart(2, '0')}`));
    expect(s.withCycles.map((l) => l.line_id)).toEqual(['L02', 'L03', 'L04', 'L05', 'L06']);
    expect(dashboardSummary(s.statuses)).toMatchObject({ lines: 21, applications: 1, humanReview: 1 });
    expect(weekRows(s.byId('L02'))[0]).toMatchObject({ week: '2026-W24', label: 'Suggestion ready' });
  });
  it('shows the Practitioner message when a Technical User is signed in', async () => {
    const auth = useAuthStore();
    await auth.signIn('admin@digisaka.test', 'pw');
    const s = useLinesStore();
    await s.load();
    expect(s.error).toBe('This account is not a Practitioner.');
  });
});

describe('line history store against the stub', () => {
  it('shows three weeks from the weekly dataset', async () => {
    const s = useLineHistoryStore();
    await s.load('L04', '2026-W25');
    expect(s.phase).toBe('ready');
    expect(s.weeks).toHaveLength(3);
    expect(s.weeks.at(-1)).toMatchObject({ week: '2026-W24', yls: 7, yli: 6 });
  });
  it('reports an unknown line in words', async () => {
    const s = useLineHistoryStore();
    await s.load('L99', '2026-W25');
    expect(s).toMatchObject({ phase: 'error', error: 'That line does not exist.' });
  });
});

describe('evidence store against the stub', () => {
  it('loads evidence the captions can read', async () => {
    const s = useEvidenceStore();
    await s.load('c-L03-25');
    expect(s.phase).toBe('ready');
    expect(diseaseCaption(s.evidence)).toBe('YLS fell two weeks in a row (9 to 8 to 7).');
    expect(rainfallCaption(s.evidence)).toBe('Rain over the last 2 weeks: 55 mm, up from 22 mm.');
    expect(s.evidence.rainfall.conditions.map((c) => c.verdict)).toEqual(['met', 'met', 'met']);
  });
  it('a cycle without trend evidence is the none state', async () => {
    const s = useEvidenceStore();
    await s.load('c-L05-25');
    expect(s).toMatchObject({ phase: 'none', error: '' });
  });
});
