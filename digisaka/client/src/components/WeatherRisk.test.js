import { describe, it, expect, beforeEach } from 'vitest';
import { createSSRApp } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { renderToString } from 'vue/server-renderer';
import WeatherRisk from './WeatherRisk.vue';
import { useInsightsStore } from '../stores/insights.js';
import { useSuggestionStore } from '../stores/suggestion.js';

const series = [
  { week: '2026-W23', rainfall_mm: 10, leaf_wetness_hours: 32.4 },
  { week: '2026-W24', rainfall_mm: 12, leaf_wetness_hours: null },
];
// The panel reads the newest series entry, the week the scheduler last read, not the asked week.
const render = async (week, rows = series, { readings = [], assessment } = {}) => {
  const pinia = createPinia();
  setActivePinia(pinia);
  Object.assign(useInsightsStore(), { phase: 'ready', data: { series: rows, risk: null, readings, rain_outlook: { days: [] } } });
  if (assessment !== undefined) Object.assign(useSuggestionStore(), { suggestion: { assessment } });
  return renderToString(createSSRApp(WeatherRisk, { line: 'L03', week }).use(pinia));
};
beforeEach(() => setActivePinia(createPinia()));

describe('Weather step leaf wetness tile', () => {
  it('shows the newest week\'s hours, named by its week', async () => {
    const html = await render('2026-W25', series.slice(0, 1));
    expect(html).toContain('32.4 h');
    expect(html).toContain('Week 23');
    expect(html).not.toContain('No leaf wetness value');
  });
  it('shows a dash and the no-value line when the week has none; humidity stays coming soon', async () => {
    const html = await render('2026-W25');
    expect(html).toMatch(/Leaf wetness<\/span><strong>—<\/strong>/);
    expect(html).toContain('No leaf wetness value recorded for week 24');
    expect(html).toMatch(/Humidity<\/span><strong>Coming soon/);
    expect(html).not.toMatch(/Leaf wetness<\/span><strong>Coming soon/);
  });
});

describe('What is driving the assessment', () => {
  const readings = [{ rule: 'r1', finding: 'Canopy watch', text: 'Canopy watch: fewer than 10 leaves.', source: null }, { rule: 'r2', finding: 'Infection risk', text: 'Infection risk.', source: null }];
  const assessment = {
    status: 'not_fired', note: 'n', caveat: 'c',
    conditions: [{ finding: 'a', label: 'Possible progression (YLS)', result: 'not_met' }, { finding: 'b', label: 'Infection risk', result: 'not_met' }],
    findings: [{ finding: 'c', label: 'Canopy watch', role: 'context' }, { finding: 'b', label: 'Infection risk', role: 'trigger' }],
  };
  it('shows the requirement\'s conditions with their results and tags each reading as trigger or context', async () => {
    const html = await render('2026-W25', series, { readings, assessment });
    expect(html).toContain('Possible progression (YLS)');
    expect(html).toContain('Not found');
    expect(html).toContain('Context only, not a treatment trigger');
    expect(html).toContain('Treatment trigger');
  });
  it('shows the readings as before when the response has no assessment', async () => {
    const html = await render('2026-W25', series, { readings, assessment: null });
    expect(html).toContain('Canopy watch');
    expect(html).not.toContain('Context only');
  });
});
