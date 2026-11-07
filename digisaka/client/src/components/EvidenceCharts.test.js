import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createPinia } from 'pinia';
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
