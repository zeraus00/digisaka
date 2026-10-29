// Drives the real selection store against the in-process stub: the two 0004 payloads, approval with an
// acknowledgement, every refusal the scheduler lists, renewal and recording applications.
import { describe, it, expect } from 'vitest';
import { useStub } from './harness.js';
import { useSelectionStore } from '../stores/selection.js';
import { useLinesStore, selectionRows } from '../stores/lines.js';

useStub();
const WEEK = '2026-W24';
const ACK = 'cc-spiroxamine-rainfast';

describe('selection store against the stub', () => {
  it('reads the clean payload: approved, with its period, units and applications', async () => {
    const s = useSelectionStore();
    await s.load('L02', '2026-W23');
    expect(s).toMatchObject({ phase: 'ready', status: 'approved', humanReview: false });
    expect(s.selection).toMatchObject({ selection_id: 'sel-L02-23', line_id: 'L02', approvable: true, blockers: [], acknowledgements_required: [] });
    expect(s.selection.approval_period).toEqual({ approval_period_id: 'ap-L02-23-1', start: '2026-05-25', end: '2026-06-24', days: 30 });
    expect(s.selection.units.map((u) => u.product)).toEqual(['Chlorothalonil', 'Pyrimethanil', 'Fenpropimorph']);
    expect(s.payload.kg_build).toMatchObject({ abox_module: 'black-sigatoka' });
    expect(Object.keys(s.preview)).toEqual(['generated_on', 'horizon', 'replan', 'header', 'days', 'caps', 'weather', 'alerts', 'sources']);
    expect(s.applications.map((a) => a.applied_on)).toEqual(['2026-06-02']);
  });

  it('reads the stressed payload: a blocker, a required acknowledgement, and no period yet', async () => {
    const s = useSelectionStore();
    await s.load('L05', WEEK);
    expect(s).toMatchObject({ phase: 'ready', status: 'draft', humanReview: true });
    expect(s.selection.approvable).toBe(false);
    expect(s.selection.blockers).toEqual([expect.objectContaining({ unit_id: 'u-pyrimethanil', check: 'group_cap' })]);
    expect(s.required.map((a) => a.id)).toEqual([ACK]);
    expect(s.selection.approval_period).toMatchObject({ approval_period_id: null, start: null, end: null, days: 30 });
    expect(s.preview.alerts.some((a) => a.blocks_approval)).toBe(true);
  });

  it('approves L03 with its acknowledgement and a note, and the period starts', async () => {
    const s = useSelectionStore();
    await s.load('L03', WEEK);
    expect(s.status).toBe('draft');
    await s.approve([ACK], ' Spray at dawn ');
    expect(s).toMatchObject({ status: 'approved', error: '' });
    expect(s.selection.note).toBe('Spray at dawn');
    expect(s.selection.approval_period).toMatchObject({ start: '2026-06-08', end: '2026-07-08' });
    expect(s.cycle.outcome).toBe('approved');
    const lines = useLinesStore();
    await lines.load();
    expect(selectionRows(lines.byId('L03'))[0]).toMatchObject({ status: 'approved', appliedOn: [] });
  });

  it('refuses approval without the acknowledgement, and of a selection with a blocker', async () => {
    const s = useSelectionStore();
    await s.load('L03', WEEK);
    await s.approve([]);
    expect(s.error).toBe('Acknowledge every listed check before approving.');
    expect(s.status).toBe('draft');
    await s.load('L05', WEEK);
    await s.approve([ACK]);
    expect(s.error).toBe('A blocking alert has to be resolved before this selection can be approved.');
    expect(s.status).toBe('draft');
  });

  it('rejecting L03 is shown as rejected and sends the cycle to human review', async () => {
    const s = useSelectionStore();
    await s.load('L03', WEEK);
    await s.reject('not now');
    expect(s).toMatchObject({ status: 'rejected', humanReview: true });
    expect(s.cycle.outcome_reason).toBe('gate_e_rejected');
  });

  it('renews an approved selection for a new 30-day period, and not a draft', async () => {
    const s = useSelectionStore();
    await s.load('L02', '2026-W23');
    await s.renew([]);
    expect(s.error).toBe('');
    expect(s.selection.approval_period.approval_period_id).toBe('ap-L02-23-2');
    await s.load('L03', WEEK);
    await s.renew([]);
    expect(s.error).toBe('This selection cannot be renewed: it must be approved, and it can be renewed only once for each start date.');
  });

  it('records an application inside the period and lists it', async () => {
    const s = useSelectionStore();
    await s.load('L02', '2026-W23');
    await s.apply('u-pyrimethanil', '2026-06-05');
    expect(s.error).toBe('');
    expect(s.applications.map((a) => [a.product_id, a.applied_on])).toEqual([['u-chlorothalonil', '2026-06-02'], ['u-pyrimethanil', '2026-06-05']]);
  });

  it('refuses a date outside every period, a product outside the selection, a future date and a repeat', async () => {
    const s = useSelectionStore();
    await s.load('L02', '2026-W23');
    await s.apply('u-pyrimethanil', '2026-04-01');
    expect(s.error).toBe('No approval period of this selection covers that date.');
    await s.apply('u-spiroxamine', '2026-06-05');
    expect(s.error).toBe('That product is not part of this selection.');
    await s.apply('u-pyrimethanil', '2026-06-09');
    expect(s.error).toBe('The request was not accepted. Check the image and values and try again.');
    await s.apply('u-chlorothalonil', '2026-06-02');
    expect(s.error).toBe('The application was already recorded.');
    expect(s.applications).toHaveLength(1);
  });

  it('asks to confirm a record that shares a date with another, then stores the warning', async () => {
    const s = useSelectionStore();
    await s.load('L02', '2026-W23');
    await s.apply('u-pyrimethanil', '2026-06-02');
    expect(s.offSchedule.warnings.map((w) => w.code)).toEqual(['same_day']);
    expect(s.applications).toHaveLength(1);
    await s.confirmOffSchedule();
    expect(s.offSchedule).toBeNull();
    expect(s.applications.map((a) => a.product_id)).toContain('u-pyrimethanil');
    expect(s.applications.at(-1).acknowledged_warnings.map((w) => w.code)).toEqual(['same_day']);
  });

  it('a draft has no approval period, so nothing can be recorded against it', async () => {
    const s = useSelectionStore();
    await s.load('L03', WEEK);
    await s.apply('u-spiroxamine', '2026-06-05');
    expect(s.error).toBe('No approval period of this selection covers that date.');
  });

  it('reads the recorded real payload: a fresh draft with only acknowledgements, approvable once given', async () => {
    const s = useSelectionStore();
    await s.load('L06', '2026-W23');
    expect(s).toMatchObject({ phase: 'ready', status: 'draft' });
    expect(s.selection).toMatchObject({ blockers: [] });
    expect(s.required.length).toBeGreaterThan(0);
    expect(s.required.every((a) => a.kind === 'cannot_check')).toBe(true);
    await s.approve([]);
    expect(s.error).toBe('Acknowledge every listed check before approving.');
    await s.approve(s.required.map((a) => a.id));
    expect(s).toMatchObject({ status: 'approved', error: '' });
  });

  it('serves the unpicked units of the real payload but refuses to record against one', async () => {
    const s = useSelectionStore();
    await s.load('L06', '2026-W23');
    const unpicked = s.selection.units.filter((u) => u.excluded_from_schedule && u.selectable !== false);
    const picked = s.selection.units.find((u) => !u.excluded_from_schedule);
    expect(unpicked.length).toBeGreaterThan(0);
    expect(s.selection.units.some((u) => u.conditions?.length)).toBe(true);
    await s.approve(s.required.map((a) => a.id));
    await s.apply(unpicked[0].unit_id, '2026-06-08');
    expect(s.error).toBe('That product is not part of this selection.');
    await s.apply(picked.unit_id, '2026-06-08');
    expect(s.error).toBe('');
  });
});
