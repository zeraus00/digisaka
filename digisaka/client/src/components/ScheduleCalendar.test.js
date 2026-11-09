import { describe, it, expect, vi } from 'vitest';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import ScheduleCalendar from './ScheduleCalendar.vue';

vi.mock('../helpers/today.js', () => ({ todayIso: () => '2026-06-10', fromIso: (s) => new Date(`${s}T00:00:00`) }));

const unit = 'u|http://x#FungicideAzoxystrobin';
const days = [{ date: '2026-06-12', application: { product: 'azoxystrobin', unit_id: unit, timing_window: { start: '2026-06-12', end: '2026-06-14' } } }];
const render = (props) => renderToString(createSSRApp(ScheduleCalendar, props));
const cell = (html, day) => html.match(new RegExp(`<span class="([^"]*)"[^>]*><b[^>]*>${day}</b><i[^>]*>([^<]*)</i>`));

describe('ScheduleCalendar', () => {
  it('shows a suggested step outlined and a recorded application filled, on different days', async () => {
    const html = await render({ days, applications: [{ product_id: 'FungicideAzoxystrobin', applied_on: '2026-06-05' }] });
    expect(cell(html, 12)[1]).toContain('sug');
    expect(cell(html, 5)[1]).toContain('rec');
    expect(cell(html, 5)[2]).toBe('✓');
    expect(cell(html, 12)[2]).toBe('💊');
  });
  it('a recorded application inside a suggested window does not hide the suggestion', async () => {
    const html = await render({ days, applications: [{ product_id: 'FungicideAzoxystrobin', applied_on: '2026-06-13' }] });
    expect(cell(html, 12)[1]).toContain('sug');
    expect(cell(html, 13)[1]).toContain('rec');
  });
  it('the legend names both marks and the count reads recorded and suggested', async () => {
    const html = await render({ days, applications: [{ product_id: 'x', applied_on: '2026-06-05' }] });
    expect(html).toContain('Suggested step');
    expect(html).toContain('Recorded application');
    expect(html).toContain('1 recorded · 1 suggested');
  });
  it('a served step shows its status pill and note, an off-plan row is tagged, and the records add no extra event', async () => {
    const step = { product: 'azoxystrobin', unit_id: unit, timing_window: { start: '2026-06-12', end: '2026-06-14' }, kind: 'single_site', status: 'overdue', status_note: 'Partner recorded.', off_plan: false };
    const off = { product: 'Mancozeb', unit_id: null, timing_window: null, kind: 'multisite', status: 'applied', off_plan: true };
    const html = await render({ days: [{ date: '2026-06-12', application: step }, { date: '2026-06-03', application: off }], applications: [{ product_id: 'x', applied_on: '2026-06-03' }] });
    expect(html).toContain('Overdue');
    expect(html).toContain('Partner recorded.');
    expect(html).toContain('Off-plan');
    expect(html).toContain('1 recorded · 1 suggested');
  });
});
