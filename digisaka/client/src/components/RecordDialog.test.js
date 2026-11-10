import { describe, it, expect, vi } from 'vitest';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createPinia } from 'pinia';
import RecordDialog from './RecordDialog.vue';
import { useSuggestionStore } from '../stores/suggestion.js';

vi.mock('../helpers/today.js', () => ({ todayIso: () => '2026-06-10', fromIso: (s) => new Date(`${s}T00:00:00`), keepIfEdited: (c) => c }));

const entry = { stepId: 's1', label: 'Propiconazole + Mancozeb', moa: 'G1 + M', productId: 'p1', partnerId: 'p2', start: '2026-06-12', end: '2026-06-14', partnerOptions: [{ product_id: 'p3', compatible: false, why: 'excluded by label' }, { product_id: 'p2', compatible: true }] };
const render = (props, setup) => { const pinia = createPinia(); const app = createSSRApp(RecordDialog, props); app.use(pinia); setup?.(useSuggestionStore(pinia)); return renderToString(app); };

describe('RecordDialog', () => {
  it('a step opens on the plan: Record planned is the main action, with Choose something different and a quiet Skip', async () => {
    const html = await render({ entry });
    expect(html).toContain('role="dialog"');
    expect(html).toContain('Record this step');
    expect(html).toContain('Propiconazole + Mancozeb');
    expect(html).toContain('window 2026-06-12 to 2026-06-14');
    expect(html).toContain('Record planned');
    expect(html).toContain('Choose something different');
    expect(html).toContain('Skip this step');
    expect(html).toContain('max="2026-06-10"');
  });
  it('the partner picker shows the planned partner first and marks an incompatible one without hiding it', async () => {
    const html = await render({ entry, productName: (id) => id });
    expect(html.indexOf('P2 (planned)')).toBeGreaterThan(-1);
    expect(html.indexOf('P2 (planned)')).toBeLessThan(html.indexOf('P3'));
    expect(html).toContain('not compatible: excluded by label');
    expect(await render({ entry: { ...entry, partnerOptions: [] } })).not.toContain('Partner in the same tank');
  });
  it('with no entry it records a spray tied to no step: a product list, no plan, no skip', async () => {
    const html = await render({ entry: null });
    expect(html).toContain('Record a spray');
    expect(html).toContain('Not tied to a planned step');
    expect(html).toContain('Product applied');
    expect(html).toContain('Record spray');
    for (const gone of ['Record planned', 'Skip this step', 'Choose something different']) expect(html).not.toContain(gone);
  });
  it('a confirmation the scheduler asks for shows inside the dialog in place of the buttons', async () => {
    const pending = await render({ entry: null }, (s) => { s.pending = { product_id: 'p1', tier: 'excluded', alerts: [{ id: 'a', text: 'Group limit reached.' }] }; });
    expect(pending).toContain('Record anyway');
    expect(pending).toContain('needs your confirmation (excluded)');
    expect(pending).toContain('Group limit reached.');
    expect(pending).not.toContain('Record spray');
    const earlier = await render({ entry }, (s) => { s.earlier = { steps: [{ step_id: 'x', product: 'Mancozeb', timing_window: { start: '2026-06-03', end: '2026-06-07' } }] }; });
    expect(earlier).toContain('Earlier steps are still open');
    expect(earlier).toContain('Skip them all');
    expect(earlier).toContain('Record them first');
    expect(earlier).not.toContain('Record planned');
  });
  it('a failed call keeps its message in the dialog', async () => {
    expect(await render({ entry }, (s) => { s.error = 'The scheduler is busy.'; })).toContain('The scheduler is busy.');
  });
});
