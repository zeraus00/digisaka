import { describe, it, expect, beforeEach } from 'vitest';
import { createSSRApp } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { renderToString } from 'vue/server-renderer';
import DevBar from './DevBar.vue';
import { useDevClockStore } from '../stores/devClock.js';
import { useRunModeStore } from '../stores/runMode.js';

async function render(clock, run) {
  const pinia = createPinia();
  setActivePinia(pinia);
  Object.assign(useDevClockStore(), { available: false, today: '2026-06-08', default: '2026-06-08' }, clock);
  Object.assign(useRunModeStore(), run);
  return renderToString(createSSRApp(DevBar).use(pinia));
}

describe('DevBar', () => {
  beforeEach(() => setActivePinia(createPinia()));
  it('shows the date group only', async () => {
    const html = await render({ available: true }, {});
    expect(html).toContain('Current date');
    expect(html).not.toContain('Scan runs');
  });
  it('shows the run-mode group only', async () => {
    const html = await render({}, { available: true });
    expect(html).toContain('Scan runs');
    expect(html).not.toContain('Current date');
  });
  it('shows both', async () => {
    const html = await render({ available: true }, { available: true });
    expect(html).toContain('Current date');
    expect(html).toContain('Scan runs');
  });
  it('renders nothing with neither group available', async () => {
    expect(await render({}, {})).not.toContain('Development tools');
  });
  it('warns on a mode other than Normal', async () => {
    expect(await render({}, { available: true, mode: 'fail' })).toContain('class="warn"');
    expect(await render({}, { available: true, mode: 'normal' })).not.toContain('class="warn"');
  });
});
