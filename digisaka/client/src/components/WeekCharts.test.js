import { describe, it, expect } from 'vitest';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import WeekCharts from './WeekCharts.vue';

const weeks = [
  { week: '2026-W22', yls: 7, yli: 4, rainfall_mm: 10 },
  { week: '2026-W23', yls: 6, yli: null, rainfall_mm: 30 },
  { week: '2026-W24', yls: 5, yli: 3, rainfall_mm: null },
];
const render = (props) => renderToString(createSSRApp(WeekCharts, { weeks, ...props }));
const count = (html, re) => (html.match(re) ?? []).length;

describe('WeekCharts trend toggle', () => {
  it('starts on All: labelled group, four buttons, one combined chart, key, no prose caption', async () => {
    const html = await render();
    expect(html).toContain('aria-label="Trend view"');
    expect(count(html, /<button/g)).toBe(4);
    expect(html).toMatch(/aria-label="All trends"[^>]*aria-pressed="true"|aria-pressed="true"[^>]*aria-label="All trends"/);
    expect(count(html, /<figure/g)).toBe(1);
    expect(html).toContain('class="key"');
    expect(html).not.toContain('worsening goes down');
    expect(html).not.toContain('figcaption');
    expect(html).toContain('Showing All trends');
  });
  it('single views show only their own caption', async () => {
    const d = await render({ initialView: 'disease' });
    expect(d).toContain('Leaf-spot stage (YLS)');
    expect(d).not.toContain('Rainfall by week (mm)');
    const r = await render({ initialView: 'rain' });
    expect(r).toContain('Rainfall by week (mm)');
    expect(r).not.toContain('Leaf-spot stage (YLS)');
  });
  it('a series with no values disables its button and leaves the key', async () => {
    const html = await render({ weeks: weeks.map((w) => ({ ...w, rainfall_mm: null })), initialView: 'rain' });
    expect(html).toMatch(/<button[^>]*disabled[^>]*>(?:(?!<\/button>).)*Rainfall/s);
    expect(html).toContain('Showing All trends');
    expect(html).not.toContain('Rainfall (mm, right axis)');
  });
  it('has no numbers table', async () => {
    expect(await render()).not.toContain('Show the numbers');
  });
  const withLeaves = weeks.map((w, i) => ({ ...w, leaves: [11, 9, 7][i], canopy: ['ok', 'watch', 'watch'][i] }));
  it('Leaves is disabled, and out of the key, when no week has a count', async () => {
    const html = await render();
    expect(html).toMatch(/<button[^>]*disabled[^>]*>(?:(?!<\/button>).)*Leaves/s);
    expect(html).not.toContain('class="ks"><line x1="1" x2="23" y1="5" y2="5" class="leaves');
    expect(html).not.toContain('Leaves: ');
    const picked = await render({ initialView: 'leaves' });
    expect(picked).toContain('Showing All trends');
  });
  it('All draws the leaves line and lists it in the key when counted', async () => {
    const html = await render({ weeks: withLeaves });
    expect(html).toContain('class="leaves dotted"');
    expect(html).toContain('</svg>Leaves</span>');
    expect(html).not.toContain('class="refline');
  });
  it('the Leaves view shows its heading, caption and the served reference lines', async () => {
    const html = await render({ weeks: withLeaves, leaves: { critical: 8, target: 10 }, initialView: 'leaves' });
    expect(html).toContain('Functional leaves by week — count 8 weeks after shooting');
    expect(html).toContain('7 functional leaves in 2026-W24. Below the target, above the critical level.');
    expect(html).toContain('8 critical');
    expect(html).toContain('10 target');
    const bare = await render({ weeks: withLeaves, leaves: { critical: null, target: 10 }, initialView: 'leaves' });
    expect(bare).not.toContain('critical</text>');
  });
});
