// The treatment screen's markup for the stub's lines, from the real suggestion store.
import { describe, it, expect } from 'vitest';
import { useStub, CYCLE_MS } from './harness.js';
import { renderScreen } from './screens.js';
import { useSuggestionStore } from '../stores/suggestion.js';
import { useScanStore } from '../stores/scan.js';
import { useInsightsStore } from '../stores/insights.js';
import TreatmentDetailView from '../views/TreatmentDetailView.vue';

const ctx = useStub();
const wait = async () => { ctx.clock.t += CYCLE_MS; };
const show = (line, step) => renderScreen(TreatmentDetailView, '/treatment/:lineId/:week', `/treatment/${line}/2026-W24${step ? `?step=${step}` : ''}`);

describe('treatment screen', () => {
  it('shows the basis, the three groups, other guidance and the record form, with no approval controls', async () => {
    const s = useSuggestionStore();
    await s.load('L04', wait);
    const options = await show('L04', 'fungicides');
    expect(options).toContain('Based on healthy images only');
    expect(options).toContain('Fungicide Options');
    expect(options).toContain('Recommended</span>');
    expect(options).toContain('Other guidance');
    expect(options).toContain('The data suggests the line is healthy');
    expect(options).not.toMatch(/<b><\/b>/);
    expect(options).not.toContain('Record application');
    const bare = await show('L04');
    expect(bare).toContain('Record application');
    expect(bare).not.toContain('Recommended</span>');
    for (const html of [options, bare]) for (const gone of ['Approve', 'Reject', 'Renew', 'Approval period', 'acknowledge']) expect(html).not.toContain(gone);
  });

  it('lists excluded units in the record form, and shows the human review banner', async () => {
    await useSuggestionStore().load('L05', wait);
    const html = await show('L05');
    expect(html).toMatch(/<option[^>]*>[^<]*\(excluded\)<\/option>/);
    expect(html).toContain('Human Review Required');
    expect(await show('L05', 'fungicides')).toContain('Fungicide Options');
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
    expect(await show('L06', 'fungicides')).toContain(card);
    expect(await show('L06')).not.toContain('The data suggests treatment is not due yet; monitoring is advised.');
    await s.record(unit.product_id, '2026-06-05', wait);
    expect(s.pending.reason).toBe('monitoring_advised');
    expect(await show('L06')).toContain('The data suggests treatment is not due yet; monitoring is advised.');
    await s.load('L02', wait);
    expect(await show('L02', 'fungicides')).not.toContain(card);
  });

  it('each ?step= shows its heading, four named tabs and only its own tab selected', async () => {
    await useSuggestionStore().load('L04', wait);
    const cases = [['weather', 'Weather Risk'], ['spray', 'Spray Log'], ['fungicides', 'Fungicide Options'], ['schedule', 'Schedule'], ['bogus', 'Schedule'], [undefined, 'Schedule']];
    for (const [step, title] of cases) {
      const html = await show('L04', step);
      expect(html).toContain(`<h2 class="step-title" data-v-${html.match(/data-v-(\w+)/)[1]}>${title}</h2>`);
      for (const name of ['Weather', 'Spray Log', 'Fungicides', 'Schedule']) expect(html).toContain(`aria-label="${name}"`);
      expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
      expect(html).toContain('Treatment Suggestion');
    }
    expect(await show('L04', 'weather')).toContain('Continue to Spray Log');
    expect(await show('L04', 'spray')).toContain('Continue to Fungicides');
    expect(await show('L04', 'fungicides')).toContain('Continue to Schedule');
  });

  it('the banner and what-changed note sit above the tabs on every step', async () => {
    const s = useSuggestionStore();
    await s.load('L02', wait);
    const unit = s.groups.recommended.find((u) => !u.needs_confirmation);
    s.busy = false;
    const pending = s.record(unit.product_id, '2026-06-05', async () => { ctx.clock.t += 0; await Promise.resolve(); });
    await new Promise((r) => setTimeout(r, 20));
    ctx.clock.t += CYCLE_MS * 2;
    await pending;
    for (const step of ['weather', 'fungicides']) {
      const html = await show('L02', step);
      expect(html).toMatch(/class="[^"]*banner/);
      expect(html).toContain('What changed:');
      expect(html.indexOf('What changed:')).toBeLessThan(html.indexOf('role="tablist"'));
    }
  });

  it('a line with no finished run says a scan is suggested', async () => {
    await useSuggestionStore().load('L01', wait);
    expect(await show('L01')).toContain('A scan is suggested to start one');
  });

  describe('entered from a scan', () => {
    const scanned = (step = 3) => { const sc = useScanStore(); sc.line = 'L04'; sc.week = '2026-W24'; sc.step = step; sc.leaves = [{ reschedule: { cycle_id: 'c1' } }]; return sc; };

    it('Spray Log shows the update while updating and on failure with Retry, and nothing once done', async () => {
      scanned();
      const s = useSuggestionStore();
      await s.load('L04', wait);
      await useInsightsStore().load('L04', '2026-W24');
      s.updating = true;
      expect(await show('L04', 'spray')).toContain('Updating the treatment suggestion');
      s.updating = false; s.tracked = 'failed';
      const failed = await show('L04', 'spray');
      expect(failed).toContain('The update failed');
      expect(failed).toContain('Retry');
      s.tracked = 'timeout';
      const slow = await show('L04', 'spray');
      expect(slow).toContain('The update is taking longer than expected');
      expect(slow).toContain('Check again');
      s.tracked = 'ready';
      const done = await show('L04', 'spray');
      expect(done).not.toContain('updated');
      expect(done).not.toContain('Updating the treatment suggestion');
      expect(done).not.toContain('did not change it');
    });

    it('a first run that fails or times out still shows its card while no suggestion has been read', async () => {
      scanned();
      const s = useSuggestionStore();
      await s.load('L04', wait);
      await useInsightsStore().load('L04', '2026-W24');
      s.phase = 'loading'; s.updating = false;
      s.tracked = 'timeout';
      expect(await show('L04', 'spray')).toContain('Check again');
      s.tracked = 'failed';
      expect(await show('L04', 'spray')).toContain('The update failed');
      s.tracked = '';
      expect(await show('L04', 'spray')).toContain('Updating the treatment suggestion');
    });

    it('shows Back to scan results at Results only, and no update card for another entry', async () => {
      const s = useSuggestionStore();
      await s.load('L04', wait);
      await useInsightsStore().load('L04', '2026-W24');
      s.updating = true;
      expect(await show('L04', 'spray')).not.toContain('Updating the treatment suggestion');
      expect(await show('L04')).not.toContain('Back to scan results');
      scanned(2);
      expect(await show('L04')).not.toContain('Back to scan results');
      scanned(3);
      expect(await show('L04')).toContain('Back to scan results');
      expect(await show('L05')).not.toContain('Back to scan results');
      expect(await show('L05', 'spray')).not.toContain('Updating the treatment suggestion');
    });
  });
});
