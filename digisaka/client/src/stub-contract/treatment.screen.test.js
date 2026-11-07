// The treatment screen's markup for the stub's lines, from the real suggestion store.
import { describe, it, expect } from 'vitest';
import { useStub, CYCLE_MS } from './harness.js';
import { renderScreen } from './screens.js';
import { useSuggestionStore } from '../stores/suggestion.js';
import TreatmentDetailView from '../views/TreatmentDetailView.vue';

const ctx = useStub();
const wait = async () => { ctx.clock.t += CYCLE_MS; };
const show = (line) => renderScreen(TreatmentDetailView, '/treatment/:lineId/:week', `/treatment/${line}/2026-W24`);

describe('treatment screen', () => {
  it('shows the basis, the three groups, other guidance and the record form, with no approval controls', async () => {
    const s = useSuggestionStore();
    await s.load('L04', wait);
    const html = await show('L04');
    expect(html).toContain('Based on healthy images only');
    expect(html).toContain('Fungicide options');
    expect(html).toContain('Recommended</span>');
    expect(html).toContain('Other guidance');
    expect(html).not.toMatch(/<b><\/b>/);
    expect(html).toContain('Record application');
    expect(html).toContain('The data suggests the line is healthy');
    for (const gone of ['Approve', 'Reject', 'Renew', 'Approval period', 'acknowledge']) expect(html).not.toContain(gone);
  });

  it('lists excluded units in the record form, and shows the human review banner', async () => {
    await useSuggestionStore().load('L05', wait);
    const html = await show('L05');
    expect(html).toMatch(/<option[^>]*>[^<]*\(excluded\)<\/option>/);
    expect(html).toContain('Human Review Required');
    expect(html).toContain('Fungicide options');
  });

  it('shows the what-changed note and the updating marker while a run is in progress, and clears them on the new revision', async () => {
    const s = useSuggestionStore();
    await s.load('L02', wait);
    const unit = s.groups.recommended.find((u) => !u.needs_confirmation);
    const base = s.revision;
    s.busy = false;
    const pending = s.record(unit.product_id, '2026-06-05', async () => { ctx.clock.t += 0; await Promise.resolve(); });
    await new Promise((r) => setTimeout(r, 20));
    expect(await show('L02')).toContain('Updating…');
    ctx.clock.t += CYCLE_MS * 2;
    await pending;
    const html = await show('L02');
    expect(html).not.toContain('Updating…');
    expect(html).toContain('What changed: The data suggests the suggestion changed after an application; a scan is suggested to verify.');
    expect(s.revision).not.toBe(base);
  });

  it('a record that asks to confirm opens the Record anyway panel with the returned alerts', async () => {
    const s = useSuggestionStore();
    await s.load('L05', wait);
    await s.record(s.groups.excluded[0].product_id, '2026-06-05', wait);
    const html = await show('L05');
    expect(html).toContain('Record anyway');
    expect(html).toContain('needs your confirmation (excluded)');
    expect(html).not.toContain('>Record application<');
  });

  it('a monitoring line shows the card and the reason in the confirm step; a suggested line has no card', async () => {
    const s = useSuggestionStore();
    await s.load('L06', wait);
    const unit = s.groups.eligible[0];
    const card = 'Monitoring is advised, but you may still record applications.';
    expect(await show('L06')).toContain(card);
    expect(await show('L06')).not.toContain('The data suggests treatment is not due yet; monitoring is advised.');
    await s.record(unit.product_id, '2026-06-05', wait);
    expect(s.pending.reason).toBe('monitoring_advised');
    expect(await show('L06')).toContain('The data suggests treatment is not due yet; monitoring is advised.');
    await s.load('L02', wait);
    expect(await show('L02')).not.toContain(card);
  });

  it('a line with no finished run says a scan is suggested', async () => {
    await useSuggestionStore().load('L01', wait);
    expect(await show('L01')).toContain('A scan is suggested to start one');
  });
});
