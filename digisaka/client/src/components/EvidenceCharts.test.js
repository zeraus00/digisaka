import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createPinia, setActivePinia } from 'pinia';
import { useEvidenceStore } from '../stores/evidence.js';
import { useInsightsStore } from '../stores/insights.js';
import EvidenceCharts from './EvidenceCharts.vue';

let fetchMock;
beforeEach(() => { fetchMock = vi.fn().mockRejectedValue(new Error('down')); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => vi.unstubAllGlobals());

describe('EvidenceCharts leaves', () => {
  it('asks the insights store for the scan line and week, and a failed read breaks nothing', async () => {
    const app = createSSRApp(EvidenceCharts, { cycleId: 'c1', line: 'L 04', week: '2026-W24' });
    app.use(createPinia());
    await renderToString(app);
    expect(fetchMock.mock.calls.map((c) => c[0])).toContain('/api/v1/scheduler/lines/L%2004/weeks/2026-W24/insights');
  });
  it('loads no insights without a line', async () => {
    const app = createSSRApp(EvidenceCharts, { cycleId: 'c1' });
    app.use(createPinia());
    await renderToString(app);
    expect(fetchMock.mock.calls.map((c) => c[0]).some((u) => u.includes('/insights'))).toBe(false);
  });
});

// Eight consecutive weeks ending at the last finished week; W20 has no record. The evidence lists only the weeks it has.
const series = Array.from({ length: 8 }, (_, i) => {
  const gap = i === 3;
  return { week: `2026-W${17 + i}`, yls: gap ? null : 7 - (i >> 1), yli: gap ? null : 8, functional_leaves: null, canopy_status: null, rainfall_mm: gap ? null : 12 };
});
const evidence = {
  weeks: series.filter((w) => w.yls != null).slice(-4),
  disease: { level: null, falling: true, worsening: true, worsening_direction: 'lower', consecutive_weeks: 2, compared_weeks: ['2026-W23', '2026-W24'] },
  rainfall: { window_weeks: 2, recent_weeks: ['2026-W23', '2026-W24'], previous_weeks: ['2026-W21', '2026-W22'], recent_total_mm: 24, previous_total_mm: 24, favourable: false, conditions: [] },
};
const renderReady = async (insightsState) => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const e = useEvidenceStore();
  Object.assign(e, { phase: 'ready', evidence });
  e.load = () => {};
  const i = useInsightsStore();
  Object.assign(i, insightsState);
  i.load = () => {};
  return renderToString(createSSRApp(EvidenceCharts, { cycleId: 'c1', line: 'L03', week: '2026-W25' }).use(pinia));
};
const labels = (html) => [...html.matchAll(/>(W\d{2})<\/text>/g)].map((m) => m[1]);

describe('EvidenceCharts weeks', () => {
  it('draw the eight insights weeks whatever the evidence lists, a gap week kept and named as missing', async () => {
    const html = await renderReady({ phase: 'ready', data: { series } });
    expect(labels(html)).toEqual(['W17', 'W18', 'W19', 'W20', 'W21', 'W22', 'W23', 'W24']);
    expect(html).toContain('last 8 weeks');
    expect(html).not.toContain('weeks compared');
    expect(html).toMatch(/Missing weeks — [^<]*2026-W20/);
  });
  it('draw no chart without the insights, and keep the verdict chips', async () => {
    const html = await renderReady({ phase: 'error', data: null, error: 'down' });
    expect(html).not.toContain('Trend view');
    expect(html).toContain('YLS is falling');
  });
});
