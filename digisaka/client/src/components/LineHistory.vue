<script setup>
import { computed, watch, onBeforeUnmount } from 'vue';
import { useInsightsStore } from '../stores/insights.js';
import { useSuggestionStore } from '../stores/suggestion.js';
import WeekCharts from './WeekCharts.vue';
import { outcomeReasonText } from '../helpers/messages.js';
import { chartWeeks } from '../helpers/evidence.js';
import { canopyLabel, progressionReading, outcomeText, canopyScale, percentOf, rainOutlookText } from '../helpers/insights.js';

// A line's insights for the week, so the practitioner sees the state of the line while choosing what to scan.
// The weekly charts and everything else read the insights (8 weeks) and the latest suggestion.
const props = defineProps({ line: { type: String, default: '' }, week: { type: String, default: '' } });
const insights = useInsightsStore();
const suggestion = useSuggestionStore();
const load = () => {
  insights.load(props.line, props.week);
  if (props.line) suggestion.load(props.line);
};
watch(() => [props.line, props.week], load, { immediate: true });
// No suggestion.stop() here: Scan step 3 starts tracking its run as this step unmounts, and a stop would cancel it.
onBeforeUnmount(() => insights.load('', ''));

const phase = computed(() => insights.phase);
const error = computed(() => insights.error);
const data = computed(() => insights.data);
const chart = computed(() => chartWeeks(insights.data));
const yls = computed(() => insights.latest('yls'));
const yli = computed(() => insights.latest('yli'));
const shooting = computed(() => insights.latest('leaves_at_shooting'));
const leaves = computed(() => insights.latest('functional_leaves'));
const last = computed(() => insights.lastTreatment);
const progression = computed(() => progressionReading(data.value?.readings));
// The newest series entry: the week the scheduler last read, named by its key.
const newest = computed(() => data.value?.series.at(-1));
const status = computed(() => newest.value?.canopy_status ?? null);
const target = computed(() => data.value?.functional_leaves_target ?? null);
const threshold = computed(() => data.value?.functional_leaves_threshold ?? null);
const scale = computed(() => canopyScale(leaves.value?.functional_leaves, target.value));
const at = (v) => ({ left: `${percentOf(v, scale.value)}%` });
const rainfall = computed(() => {
  const mm = newest.value?.rainfall_mm, wk = newest.value ? Number(newest.value.week.split('W').pop()) : null;
  return mm == null ? `No rainfall recorded${wk ? ` for week ${wk}` : ''}` : `${mm} mm recorded in week ${wk}`;
});
const rainfallContext = computed(() => `${rainfall.value}. ${rainOutlookText(data.value?.rain_outlook)}`);
const result = computed(() => {
  if (suggestion.phase === 'notfound') return 'No scheduler result yet for this line.';
  if (suggestion.phase === 'error') return suggestion.error;
  if (suggestion.phase !== 'ready') return 'Loading…';
  const reason = outcomeReasonText(suggestion.suggestion.outcome_reason);
  const text = outcomeText(suggestion.suggestion.outcome);
  return reason ? `${text}: ${reason}` : text;
});
</script>

<template>
  <section v-if="insights.phase !== 'idle'" class="history" aria-label="Insights for this line">
    <h3>Line {{ insights.lineId }} insights</h3>
    <p v-if="phase === 'loading'" class="hint">Loading…</p>
    <p v-else-if="phase === 'error'" class="err">{{ error }} <button class="mark" type="button" @click="load">Try again</button></p>
    <template v-else-if="phase === 'ready'">
      <div class="insights">
        <div class="metrics">
          <article class="metric">
            <span>YLS</span><strong>{{ yls?.yls ?? '—' }}</strong>
            <small>{{ yls ? `${yls.week}, latest recorded` : 'No reading recorded' }}</small>
          </article>
          <article class="metric">
            <span>YLI</span><strong>{{ yli?.yli ?? '—' }}</strong>
            <small>{{ yli ? `${yli.week}, latest recorded` : 'No reading recorded' }}</small>
          </article>
          <article class="metric">
            <span>Leaves at shooting</span><strong>{{ shooting?.leaves_at_shooting ?? '—' }}</strong>
            <small>{{ shooting ? `${shooting.week}, latest recorded` : 'No reading recorded' }}</small>
          </article>
          <!-- TODO(contract): infection risk level -->
          <article class="metric unavailable">
            <span>Infection risk</span><strong>Coming soon</strong>
            <small>The scheduler does not provide this yet</small>
          </article>
          <article class="metric">
            <span>Progression</span><strong>{{ progression?.finding ?? 'Not assessed' }}</strong>
          </article>
          <article class="metric">
            <span>Last treatment</span>
            <strong>{{ last?.product ?? 'None recorded' }}</strong>
            <small>{{ last ? `Applied ${last.applied_on}` : 'No application recorded for this line' }}</small>
          </article>
        </div>

        <div class="canopy">
          <div class="section-title"><h4>Canopy check</h4></div>
          <div class="canopy-bar" role="img" :aria-label="`${leaves?.functional_leaves ?? 'No'} functional leaves, threshold ${threshold ?? 'unknown'}, target ${target ?? 'unknown'}`">
            <div class="canopy-fill" :style="{ width: `${percentOf(leaves?.functional_leaves, scale)}%` }"></div>
            <i v-if="threshold != null" class="canopy-tick critical" :style="at(threshold)"></i>
            <i v-if="target != null" class="canopy-tick target" :style="at(target)"></i>
          </div>
          <div class="canopy-scale" aria-hidden="true">
            <span v-if="threshold != null" class="critical-label" :style="at(threshold)">{{ threshold }} threshold</span>
            <span v-if="target != null" class="target-label" :style="at(target)">{{ target }} target</span>
          </div>
          <div class="canopy-summary">
            <b>{{ leaves ? `${leaves.functional_leaves} leaves.` : 'No leaf count recorded.' }}</b>
            <span v-if="leaves">{{ leaves.week }}, latest recorded</span>
            <strong v-if="canopyLabel(status)" :class="status">{{ canopyLabel(status) }}</strong>
          </div>
        </div>

        <div class="management">
          <h4>Why management may be needed</h4>
          <div class="reason">
            <b>Disease progression</b><p>{{ progression?.text ?? 'Not assessed' }}</p>
          </div>
          <div class="reason">
            <b>Rainfall context</b><p>{{ rainfallContext }}</p>
          </div>
          <div class="reason">
            <b>Latest scheduler result</b><p>{{ result }}</p>
          </div>
          <p class="disclaimer">These indicators are context, not a confirmed diagnosis. Verify findings with an agricultural specialist before treatment decisions.</p>
        </div>
      </div>
      <WeekCharts :weeks="chart.weeks" :leaves="chart.refs" />
    </template>
  </section>
</template>

<style scoped>
.history { margin-top: 12px; }
h3 { margin: 0 0 6px; font-size: .95rem; }
svg { max-width: 420px; }
.hint { color: var(--ink-soft); font-size: .8rem; margin: 6px 0 0; }
.err { color: var(--danger); }
.insights { display: grid; gap: 14px; }
.metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.metric { min-width: 0; display: grid; align-content: start; gap: 2px; padding: 10px; border-radius: 12px; background: #f0f3f0; }
.metric > span { color: var(--ink-soft); font-size: .72rem; }
.metric strong { color: var(--ink); font-size: 1rem; line-height: 1.3; overflow-wrap: anywhere; }
.metric small { color: var(--ink-soft); font-size: .68rem; line-height: 1.35; }
.metric.risk { background: #fdebc8; }
.metric.risk strong, .metric.risk small { color: #6b4000; }
.metric.unavailable strong { font-size: .82rem; }
.canopy, .management { padding-top: 12px; border-top: 1px solid var(--line); }
.section-title { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 5px; }
h4 { font-size: .9rem; }
.section-title span { padding: 3px 8px; border-radius: 999px; background: #e5e7eb; color: #4b5563; font-size: .68rem; font-weight: 700; }
.canopy p, .reason p, .disclaimer { color: var(--ink-soft); font-size: .76rem; line-height: 1.45; }
.canopy-bar { position: relative; height: 14px; margin: 12px 0 0; border-radius: 999px; background: #e5e7eb; }
.canopy-tick { position: absolute; top: -4px; height: 22px; border-left: 2px solid; }
.canopy-scale { position: relative; height: 20px; color: var(--ink-soft); font-size: .65rem; font-weight: 700; }
.canopy-scale span { position: absolute; top: 2px; white-space: nowrap; }
.canopy-summary { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 12px; font-size: .74rem; }
.prototype-note { margin-top: 5px; }
.management h4 { margin-bottom: 6px; }
.reason { display: flex; justify-content: space-between; gap: 10px; padding: 7px 0; border-top: 1px solid var(--line); }
.reason:first-of-type { border-top: 0; }
.reason b { flex: 0 0 38%; font-size: .74rem; }
.reason p { margin: 0; }
.disclaimer { margin-top: 8px; padding: 9px 10px; border-radius: 10px; background: #f1f1f1; }
@media (max-width: 680px) {
  .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
.canopy-fill { height: 100%; border-radius: inherit; background: #8a6508; }
.canopy-tick.critical { border-color: var(--danger); }
.canopy-tick.target { border-color: var(--forest); }
.critical-label { color: var(--danger); transform: translateX(-50%); }
.target-label { color: var(--forest); transform: translateX(-50%); }
.canopy-summary strong { margin-left: auto; }
.canopy-summary strong.ok { color: var(--forest); }
.canopy-summary strong.watch { color: #7a4a00; }
.canopy-summary strong.critical { color: var(--danger); }
</style>
