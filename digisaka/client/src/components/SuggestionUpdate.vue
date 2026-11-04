<script setup>
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useCycleStore } from '../stores/cycle.js';
import { useSuggestionStore } from '../stores/suggestion.js';
import { updateState, isCurrent, hasFungicides } from '../helpers/scanUpdate.js';
import { outcomeReasonText } from '../helpers/messages.js';

// The line's suggestion update, shown on Scan step 3 and the Spray log step. A verified scan started a run when `reschedule` is set.
// `link` off hides the done card (and its jump to Treatment Review), for Scan step 3 where Weather comes first.
// The default slot is the next step; it shows only when the suggestion is current and has fungicide options.
const props = defineProps({ line: { type: String, required: true }, week: { type: String, required: true }, reschedule: { type: Object, default: null }, link: { type: Boolean, default: true } });
const cycle = useCycleStore(), suggestion = useSuggestionStore();
const update = computed(() => updateState({ reschedule: props.reschedule, tracked: suggestion.tracked, updating: suggestion.updating }));
const current = computed(() => suggestion.lineId === props.line && isCurrent({ phase: suggestion.phase, updating: suggestion.updating, state: update.value }));
const treatmentPath = computed(() => `/treatment/${encodeURIComponent(props.line)}/${encodeURIComponent(props.week)}`);
// The done card is the last branch of the template; without `link` it is the only one left out, so the section is left out with it.
const done = computed(() => !(suggestion.phase === 'notfound' || update.value === 'updating' || suggestion.phase === 'loading' || ['failed', 'timeout', 'error'].includes(update.value)));
const outcome = computed(() => suggestion.suggestion?.outcome);
const track = () => suggestion.track(props.line, props.reschedule.cycle_id);
// A failed run is read as a cycle to retry, then followed again.
async function retry() {
  suggestion.tracked = '';
  await cycle.attach(props.reschedule.cycle_id);
  if (cycle.phase === 'failed') await cycle.retry();
  if (cycle.phase === 'failed') suggestion.tracked = 'failed';
  else await suggestion.track(props.line, cycle.cycle?.cycle_id ?? props.reschedule.cycle_id);
}
</script>

<template>
  <section v-if="link || !done || cycle.error || suggestion.error" class="card update" aria-live="polite">
    <p v-if="cycle.error || suggestion.error" class="err" role="alert">{{ cycle.error || suggestion.error }}</p>
    <template v-if="suggestion.phase === 'notfound'">
      <h2>No treatment suggestion yet</h2>
      <p class="hint">This line has no treatment suggestion yet. A scan is suggested to start one.</p>
    </template>
    <template v-else-if="update === 'updating' || suggestion.phase === 'loading'">
      <h2>Updating the treatment suggestion...</h2>
      <p class="hint">This usually takes under a minute.</p>
    </template>
    <template v-else-if="update === 'failed'">
      <h2>The update failed</h2>
      <p v-if="cycle.cycle?.failure_reason">Reason: {{ cycle.cycle.failure_reason }}</p>
      <button class="primary" :disabled="cycle.busy" @click="retry">Retry</button>
    </template>
    <template v-else-if="update === 'timeout' || update === 'error'">
      <h2>{{ update === 'timeout' ? 'This is taking too long' : 'Could not load the suggestion' }}</h2>
      <button class="primary" @click="track">Check again</button>
    </template>
    <template v-else-if="link">
      <h2>{{ update === 'unchanged' ? 'The treatment suggestion is unchanged' : 'The treatment suggestion is updated' }}</h2>
      <p v-if="update === 'unchanged'" class="hint">These scans did not change it, so the current treatment suggestion still stands.</p>
      <p v-if="outcome === 'continue_monitoring'" class="hint">No treatment is suggested yet. Keep monitoring this line and scan again next week.</p>
      <p v-else-if="outcome === 'human_review_required'" class="hint">The data suggests an expert should look at this line{{ suggestion.suggestion.outcome_reason ? `: ${outcomeReasonText(suggestion.suggestion.outcome_reason)}` : '' }}</p>
      <div class="acts">
        <RouterLink class="btn primary" :to="treatmentPath">{{ update === 'unchanged' ? 'Open the current suggestion' : 'Open the suggestion' }}</RouterLink>
        <slot v-if="current && hasFungicides(suggestion.suggestion)" />
      </div>
    </template>
  </section>
</template>

<style scoped>
.card { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius-md); box-shadow: var(--shadow); padding: 16px; margin-bottom: 16px; max-width: 720px; display: grid; gap: 12px; }
h2 { font: 800 14px var(--font-display); color: var(--forest); letter-spacing: .04em; }
.hint { color: var(--ink-soft); font-size: 13px; }
.err { color: var(--danger); }
.acts { display: flex; flex-wrap: wrap; gap: 8px; }
button, .btn { padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: #fff; text-align: center; }
.primary { background: var(--forest); border-color: var(--forest); color: #fff; font-weight: 800; }
button:disabled { opacity: .55; cursor: not-allowed; }
</style>
