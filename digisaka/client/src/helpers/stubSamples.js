// Sample leaf images for running the web app on the stub (docker-compose.stub.yml sets VITE_STUB_SAMPLES).
// The stub picks its canned answer from the image name, so each sample is named after a scenario.
// The bytes are a 1x1 PNG: the stub only needs a non-empty payload.
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

export const SAMPLE_SCENARIOS = {
  stage2: 'Stage 2 leaf',
  healthy: 'Healthy leaf',
  rescan: 'Rescan needed',
  referral: 'Referral',
  not_leaf: 'Not a leaf',
  unavailable: 'QA unavailable',
};
const DEFAULT_SET = ['stage2', 'stage2', 'healthy'];
export const RETAKE_SAMPLE = 'stage2'; // a retake of a rescan leaf must be a normal leaf, not another rescan

export const samplesEnabled = () => import.meta.env.VITE_STUB_SAMPLES === '1';

// What each stub line demonstrates: its weekly data scenario (the scheduler's synthetic dataset, L01 to L21) and, for
// L02 to L07, what the stub does with it. Shown only on the stub stack (README "Run it on the stub").
const LINE_SCENARIOS = {
  L01: 'Stable, no treatment',
  L02: 'Worsening, dry · application recorded',
  L03: 'Worsening, wet · flagged pick asks to confirm',
  L04: 'Stage 2, two options · ready to scan (demo line)',
  L05: 'Poor response, rotation · human review, blocking alert',
  L06: 'Response not poor · scan run fails, Retry works',
  L07: 'Poor response, missing interval · scan ends in human review',
  L08: 'No eligible option (stage 6)',
  L09: 'No eligible option (stage 1)',
  L10: 'One week of history',
  L11: 'Three weeks, rainfall not computable',
  L12: 'Missing feed value',
  L13: 'No confirmed stage (referral)',
  L14: 'All healthy',
  L15: 'Long series, flat YLS below 8',
  L16: 'Long series, flat YLS critical',
  L17: 'Long series, healthy then drops',
  L18: 'Long series, slow fall',
  L19: 'Long series, recovery',
  L20: 'Long series, fast fall',
  L21: 'Long series, flat YLS, one missing week',
};
export const lineLabel = (id) => (samplesEnabled() && LINE_SCENARIOS[id] ? `${id} · ${LINE_SCENARIOS[id]}` : id);

let counter = 0;
export function sampleFile(scenario) {
  if (!(scenario in SAMPLE_SCENARIOS)) throw new Error(`Unknown sample scenario: ${scenario}`);
  const bytes = Uint8Array.from(atob(PNG), (c) => c.charCodeAt(0));
  const n = String(++counter).padStart(2, '0');
  return new File([bytes], `${scenario}-leaf-${n}.png`, { type: 'image/png' });
}

export const defaultSamples = () => DEFAULT_SET.map(sampleFile);

// Adds the default samples to an empty queue for the selected line-week; never touches a queue that already has leaves.
export function addDefaultSamples(scan, enabled = samplesEnabled()) {
  if (enabled && scan.line && !scan.leaves.length) scan.addFiles(defaultSamples());
}
