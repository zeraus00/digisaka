<script setup>
import { computed, watch, onBeforeUnmount } from 'vue';
import { useLineHistoryStore } from '../stores/lineHistory.js';
import { useInsightsStore } from '../stores/insights.js';
import { useSuggestionStore } from '../stores/suggestion.js';
import WeekCharts from './WeekCharts.vue';
import { outcomeReasonText } from '../helpers/messages.js';
import { canopyLabel, progressionReading, outcomeText, canopyScale, percentOf, rainOutlookText } from '../helpers/insights.js';

// A line's insights for the week, so the practitioner sees the state of the line while choosing what to scan.
// The weekly charts keep reading the line history; everything else reads the insights and the latest suggestion.
const props = defineProps({ line: { type: String, default: '' }, week: { type: String, default: '' } });
const history = useLineHistoryStore();
const insights = useInsightsStore();
const suggestion = useSuggestionStore();
const load = () => {
  history.load(props.line, props.week);
  insights.load(props.line, props.week);
  if (props.line) suggestion.load(props.line); else suggestion.stop();
};
watch(() => [props.line, props.week], load, { immediate: true });
onBeforeUnmount(() => { history.load('', ''); insights.load('', ''); suggestion.stop(); });

const phase = computed(() => [insights.phase, history.phase].find((p) => p === 'error') ?? [insights.phase, history.phase].find((p) => p === 'loading') ?? insights.phase);
const error = computed(() => insights.error || history.error);
const data = computed(() => insights.data);
const yls = computed(() => insights.latest('yls'));
const yli = computed(() => insights.latest('yli'));
const shooting = computed(() => insights.latest('leaves_at_shooting'));
const leaves = computed(() => insights.latest('functional_leaves'));
const last = computed(() => insights.lastTreatment);
const progression = computed(() => progressionReading(data.value?.readings));
const status = computed(() => data.value?.series.find((w) => w.week === data.value.week)?.canopy_status ?? null);
const target = computed(() => data.value?.functional_leaves_target ?? null);
const threshold = computed(() => data.value?.functional_leaves_threshold ?? null);
const scale = computed(() => canopyScale(leaves.value?.functional_leaves, target.value));
const at = (v) => ({ left: `${percentOf(v, scale.value)}%` });
const rainfall = computed(() => {
  const mm = data.value?.series.find((w) => w.week === data.value.week)?.rainfall_mm;
  return mm == null ? 'No rainfall recorded this week' : `${mm} mm recorded this week`;
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
            <small>{{ progression?.text ?? 'No disease trend reading for this week' }}</small>
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
      <WeekCharts :weeks="history.weeks" />
    </template>
  </section>
</template>

<style scoped>
.history { margin-top: 12px; }
h3 { margin: 0 0 6px; font-size: .95rem; }
svg { max-width: 420px; }
.hint { color: var(--ink-soft); font-size: .8rem; margin: 6px 0 0; }
.err { color: var(--danger); }
</style>
