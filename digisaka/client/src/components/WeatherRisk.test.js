import { describe, it, expect, beforeEach } from 'vitest';
import { createSSRApp } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { renderToString } from 'vue/server-renderer';
import WeatherRisk from './WeatherRisk.vue';
import { useInsightsStore } from '../stores/insights.js';

const series = [
  { week: '2026-W23', rainfall_mm: 10, leaf_wetness_hours: 32.4 },
  { week: '2026-W24', rainfall_mm: 12, leaf_wetness_hours: null },
];
const render = async (week) => {
  const pinia = createPinia();
  setActivePinia(pinia);
  Object.assign(useInsightsStore(), { phase: 'ready', data: { series, risk: null, readings: [], rain_outlook: { days: [] } } });
  return renderToString(createSSRApp(WeatherRisk, { line: 'L03', week }).use(pinia));
};
beforeEach(() => setActivePinia(createPinia()));

describe('Weather step leaf wetness tile', () => {
  it('shows the week\'s hours', async () => {
    const html = await render('2026-W23');
    expect(html).toContain('32.4 h');
    expect(html).not.toContain('No leaf wetness value');
  });
  it('shows a dash and the no-value line when the week has none; humidity stays coming soon', async () => {
    const html = await render('2026-W24');
    expect(html).toContain('No leaf wetness value recorded for this week');
    expect(html).toMatch(/Humidity<\/span><strong>Coming soon/);
    expect(html).not.toMatch(/Leaf wetness<\/span><strong>Coming soon/);
  });
});
