// Drives the real scan store against the in-process stub.
import { describe, it, expect, vi } from 'vitest';
import { useStub } from './harness.js';
import { useScanStore } from '../stores/scan.js';
import { sampleFile, RETAKE_SAMPLE } from '../helpers/stubSamples.js';

vi.mock('../helpers/image.js', () => ({ fileToPayload: async (f) => ({ img_name: f.name, img: 'AAAA' }) }));

useStub();
const file = (n) => ({ name: `${n}.jpg` });

async function scanned(line, ...names) {
  const s = useScanStore();
  s.select(line, '2026-W25');
  s.addFiles(names.map(file));
  await s.assess();
  return s;
}

describe('scan store against the stub', () => {
  it('reaches every outcome the Scan screen renders', async () => {
    const s = await scanned('L04', 'a-healthy', 'b-not_leaf', 'c-referral', 'd-rescan', 'e-stage2', 'f-unavailable');
    expect(s.leaves.map((l) => l.phase)).toEqual(['done', 'done', 'done', 'rescan', 'confirm', 'failed']);
    expect(s.leaves[5].error).toBe('The QA service is unavailable. Try again shortly.');
    await s.assess(); // retry the failed one
    expect(s.leaves[5].phase).toBe('confirm');
    await s.confirm(s.leaves[4].id, true);
    expect(s.leaves[4]).toMatchObject({ phase: 'done', outcome: 'treatment_result' });
    await s.confirm(s.leaves[5].id, false);
    expect(s.leaves[5].phase).toBe('rescan');
    await s.rescan(s.leaves[5].id, file('g-stage2'));
    expect(s.leaves[5].phase).toBe('confirm');
  });
});

describe('stub sample leaves against the stub', () => {
  it('each sample produces its scenario outcome', async () => {
    const s = useScanStore();
    s.select('L04', '2026-W25');
    s.addFiles(['healthy', 'not_leaf', 'referral', 'rescan', 'stage2', 'unavailable'].map(sampleFile));
    await s.assess();
    expect(s.leaves.map((l) => l.phase)).toEqual(['done', 'done', 'done', 'rescan', 'confirm', 'failed']);
    expect(s.leaves.slice(0, 3).map((l) => l.outcome)).toEqual(['healthy', 'not_leaf', 'referral']);
    await s.rescan(s.leaves[3].id, sampleFile(RETAKE_SAMPLE));
    expect(s.leaves[3].phase).toBe('confirm');
    await s.assess(); // the QA service is back on the retry
    expect(s.leaves[5].phase).toBe('confirm');
  });
});
