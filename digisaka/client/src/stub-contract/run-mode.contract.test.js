// Drives the real run-mode store against the in-process stub (the route is stub-only, so nothing else checks its shape).
import { describe, it, expect } from 'vitest';
import { useStub } from './harness.js';
import { useRunModeStore } from '../stores/runMode.js';

useStub();

describe('run-mode store against the stub', () => {
  it('loads Normal, sets Fail and reads it back', async () => {
    const s = useRunModeStore();
    await s.load(true);
    expect([s.available, s.mode]).toEqual([true, 'normal']);
    await s.set('fail');
    expect(s.mode).toBe('fail');
    const again = useRunModeStore();
    await again.load(true);
    expect(again.mode).toBe('fail');
  });
});
