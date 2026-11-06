import { describe, it, expect } from 'vitest';
import { createSSRApp } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { renderToString } from 'vue/server-renderer';
import LineHistory from './LineHistory.vue';
import { useInsightsStore } from '../stores/insights.js';
import { useLineHistoryStore } from '../stores/lineHistory.js';
import { useSuggestionStore } from '../stores/suggestion.js';

// Eight consecutive weeks ending at the last finished week; W20 has no record.
const series = Array.from({ length: 8 }, (_, i) => {
  const week = `2026-W${17 + i}`, gap = i === 3;
  return { week, yls: gap ? null : 7 - (i >> 1), yli: gap ? null : 8, functional_leaves: gap ? null : 10, canopy_status: gap ? null : 'ok', rainfall_mm: gap ? null : 12, leaves_at_shooting: null };
});
const insights = { phase: 'ready', lineId: 'L03', week: '2026-W25', data: { series, readings: [], functional_leaves_threshold: 8, functional_leaves_target: 10, rain_outlook: { days: [] } } };

// The components load their stores on setup; the stores are primed and their loads silenced to look at the render.
const render = async (state = insights) => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const i = useInsightsStore();
  Object.assign(i, state);
  i.load = () => {};
  const h = useLineHistoryStore();
  Object.assign(h, { phase: 'ready', weeks: series.slice(-3) });
  h.load = () => {};
  useSuggestionStore().load = () => {};
  return renderToString(createSSRApp(LineHistory, { line: 'L03', week: '2026-W25' }).use(pinia));
};
const labels = (html) => [...html.matchAll(/>(W\d{2})<\/text>/g)].map((m) => m[1]);

describe('Line insights weekly charts', () => {
  it('draw the eight insights weeks in order, a week with no record kept on the axis', async () => {
    const html = await render();
    expect(labels(html)).toEqual(['W17', 'W18', 'W19', 'W20', 'W21', 'W22', 'W23', 'W24']);
    expect(html).not.toContain('Missing weeks');
  });
  it('draw no chart while the insights are not loaded or failed', async () => {
    for (const state of [{ phase: 'loading', data: null }, { phase: 'error', data: null, error: 'down' }]) {
      expect(await render({ ...insights, ...state })).not.toContain('Trend view');
    }
  });
});
