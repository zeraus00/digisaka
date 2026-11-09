import { describe, it, expect, vi } from 'vitest';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import ScheduleCalendar from './ScheduleCalendar.vue';

vi.mock('../helpers/today.js', () => ({ todayIso: () => '2026-06-10', fromIso: (s) => new Date(`${s}T00:00:00`) }));

const unit = 'u|http://x#FungicideAzoxystrobin';
const days = [{ date: '2026-06-12', application: { product: 'azoxystrobin', unit_id: unit, timing_window: { start: '2026-06-12', end: '2026-06-14' } } }];
const render = (props) => renderToString(createSSRApp(ScheduleCalendar, props));
const hasCell = (html, day, cls) => new RegExp(`<span class="[^"]*\\b${cls}\\b[^"]*"[^>]*><span class="date-number"[^>]*>${day}</span>`).test(html);

describe('ScheduleCalendar', () => {
  it('shows a suggested step outlined and a recorded application filled, on different days', async () => {
    const html = await render({ days, applications: [{ product_id: 'FungicideAzoxystrobin', applied_on: '2026-06-05' }] });
    expect(hasCell(html, 12, 'sug')).toBe(true);
    expect(hasCell(html, 5, 'rec')).toBe(true);
    expect(html).toContain('badge--event');
    expect(html).toContain('badge--recorded');
  });
  it('a recorded application inside a suggested window does not hide the suggestion', async () => {
    const html = await render({ days, applications: [{ product_id: 'FungicideAzoxystrobin', applied_on: '2026-06-13' }] });
    expect(hasCell(html, 12, 'sug')).toBe(true);
    expect(hasCell(html, 13, 'rec')).toBe(true);
  });
  it('the legend names both marks and the count reads recorded and suggested', async () => {
    const html = await render({ days, applications: [{ product_id: 'x', applied_on: '2026-06-05' }] });
    expect(html).toContain('Spray window');
    expect(html).toContain('Scan / re-assess');
    expect(html).toContain('Today');
    expect(html).toContain('1 recorded · 1 suggested');
  });
});
