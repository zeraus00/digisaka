// Drives the real suggestion store against the in-process stub, polling on its fake clock.
import { describe, it, expect } from 'vitest';
import { useStub, CYCLE_MS } from './harness.js';
import { useSuggestionStore } from '../stores/suggestion.js';
import { useCycleStore } from '../stores/cycle.js';
import { useScanStore } from '../stores/scan.js';
import { updateState } from '../helpers/scanUpdate.js';
import { vi } from 'vitest';

vi.mock('../helpers/image.js', () => ({ fileToPayload: async (f) => ({ img_name: f.name, img: 'AAAA' }) }));

const ctx = useStub();
// Each poll wait moves the stub's clock past a run's time.
const wait = async () => { ctx.clock.t += CYCLE_MS; };

describe('suggestion store against the stub', () => {
  it('loads the groups, basis, schedule days and history of a line', async () => {
    const s = useSuggestionStore();
    await s.load('L02', wait);
    expect(s).toMatchObject({ phase: 'ready', updating: false, revision: 'c-L02-24' });
    expect(s.suggestion).toMatchObject({ basis: 'stage_confirmed', changes: null, trigger: 'scan' });
    expect(s.units.length).toBe(s.groups.recommended.length + s.groups.eligible.length + s.groups.excluded.length);
    expect(s.days.length).toBeGreaterThan(0);
    expect(s.history.map((a) => a.applied_on)).toEqual(['2026-06-02']);
    expect(s.cycles.map((c) => c.cycle_id)).toEqual(['c-L02-24']);
  });

  it('a line with no finished run is notfound; an unknown line too', async () => {
    const s = useSuggestionStore();
    await s.load('L01', wait);
    expect(s.phase).toBe('notfound');
    await s.load('L99', wait);
    expect(s.phase).toBe('notfound');
  });

  it('records a unit with no alerts, then follows the reschedule to the new revision', async () => {
    const s = useSuggestionStore();
    await s.load('L02', wait);
    const unit = s.groups.recommended.find((u) => !u.needs_confirmation);
    expect(await s.record(unit.product_id, '2026-06-05', wait)).toBe('recorded');
    expect(s).toMatchObject({ error: '', pending: null, updating: false });
    expect(s.revision).not.toBe('c-L02-24');
    expect(s.suggestion.trigger).toBe('application');
    expect(s.history.map((a) => a.applied_on)).toEqual(['2026-06-02', '2026-06-05']);
  });

  it('an excluded unit waits in pending with its tier and alerts; confirming resubmits with the returned revision', async () => {
    const s = useSuggestionStore();
    await s.load('L05', wait);
    const unit = s.groups.excluded[0];
    expect(await s.record(unit.product_id, '2026-06-05', wait)).toBe('confirm');
    expect(s.pending).toMatchObject({ product_id: unit.product_id, applied_on: '2026-06-05', revision: s.revision, tier: 'excluded' });
    expect(s.error).toBe('');
    expect(s.history).toHaveLength(0);
    expect(await s.confirm(wait)).toBe('recorded');
    expect(s.pending).toBeNull();
    expect(s.history.map((a) => a.applied_on)).toEqual(['2026-06-05']);
  });

  it('a stale revision is resubmitted with the one the scheduler returned', async () => {
    const s = useSuggestionStore();
    await s.load('L02', wait);
    const unit = s.groups.recommended.find((u) => !u.needs_confirmation);
    s.suggestion.revision = 'c-old';
    expect(await s.record(unit.product_id, '2026-06-05', wait)).toBe('confirm');
    expect(s.pending.revision).toBe('c-L02-24');
    expect(await s.confirm(wait)).toBe('recorded');
  });

  it('cancel drops what waits; product_not_offered and a repeat surface as messages', async () => {
    const s = useSuggestionStore();
    await s.load('L05', wait);
    await s.record(s.groups.excluded[0].product_id, '2026-06-05', wait);
    s.cancel();
    expect(s.pending).toBeNull();
    expect(await s.record('u-nothing', '2026-06-05', wait)).toBe('error');
    expect(s.error).toBe('That product is not part of the current suggestion.');
    expect(await s.record('', '2026-06-05', wait)).toBe('error');
    expect(await s.record(s.groups.excluded[0].product_id, 'June', wait)).toBe('error');
    expect(s.error).toBe('Enter the date as YYYY-MM-DD.');
  });
});

describe('a scan reschedule against the stub', () => {
  it('the suggestion shows the new revision once the run is done; a failed run is reported and can be retried', async () => {
    const scan = useScanStore();
    scan.select('L06', '2026-W25');
    scan.addFiles([{ name: 'a-healthy.jpg' }]);
    await scan.assess();
    const id = scan.leaves[0].reschedule?.cycle_id;
    expect(id).toBe('c-L06-25');
    const s = useSuggestionStore();
    await s.load('L06', wait);
    expect(await s.follow(id, wait)).toBe('failed');
    const c = useCycleStore();
    await c.attach(id, wait);
    expect(c.phase).toBe('failed');
    await c.retry(wait);
    expect(c.phase).toBe('monitoring');
    expect(await s.follow(id, wait)).toBe('ready');
    expect(s.revision).toBe(id);
  });
});

describe('what a scan leaves for the Results step', () => {
  const scanned = async (line, ...names) => {
    const scan = useScanStore();
    scan.select(line, '2026-W25');
    scan.addFiles(names.map((n) => ({ name: `${n}.jpg` })));
    await scan.assess();
    return scan;
  };
  it('a verified scan has a reschedule: updating, then ready on the new revision', async () => {
    const scan = await scanned('L04', 'a-healthy');
    const s = useSuggestionStore();
    expect(updateState({ reschedule: scan.reschedule, tracked: s.tracked, updating: s.updating })).toBe('updating');
    expect(await s.track('L04', scan.reschedule.cycle_id, wait)).toBe('ready');
    expect(updateState({ reschedule: scan.reschedule, tracked: s.tracked, updating: s.updating })).toBe('ready');
    expect(s).toMatchObject({ revision: scan.reschedule.cycle_id, phase: 'ready' });
  });
  it('the first run of a line with no suggestion is followed through the not-yet-found reads', async () => {
    const scan = await scanned('L01', 'a-healthy');
    const s = useSuggestionStore();
    expect(await s.track('L01', scan.reschedule.cycle_id, wait)).toBe('ready');
    expect(s.revision).toBe('c-L01-25');
  });
  it('scans that verify nothing leave the line stage unchanged', async () => {
    const scan = await scanned('L04', 'a-not_leaf', 'b-referral');
    expect(scan.reschedule).toBeNull();
    expect(updateState({ reschedule: scan.reschedule, tracked: '', updating: false })).toBe('unchanged');
  });
  it('a later verified scan of the same line-week does not start another run', async () => {
    const scan = await scanned('L04', 'a-healthy', 'b-healthy');
    expect(scan.leaves.map((l) => l.reschedule?.cycle_id ?? null)).toEqual(['c-L04-25', null]);
    expect(scan.reschedule.cycle_id).toBe('c-L04-25');
  });
});
