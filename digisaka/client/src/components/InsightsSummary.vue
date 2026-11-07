<script setup>
import { computed } from 'vue';
import { useInsightsStore } from '../stores/insights.js';
import { progressionReading, actionChips } from '../helpers/insights.js';

// The side summary shared by the Weather and Spray log steps: the same rows as Disease Detection, the action chips and the server's summary.
const insights = useInsightsStore();
const data = computed(() => insights.data);
const val = (key) => insights.latest(key)?.[key] ?? '—';
const progression = computed(() => progressionReading(data.value?.readings));
const last = computed(() => insights.lastTreatment);
const chips = computed(() => actionChips(data.value?.actions?.kinds));
</script>

<template>
  <aside v-if="data" class="jr-card" aria-label="Summary">
    <h3>Line {{ insights.lineId }} summary</h3>
    <div class="jr-rows">
      <div class="jr-row"><span>YLS</span><b>{{ val('yls') }}</b></div>
      <div class="jr-row"><span>YLI</span><b>{{ val('yli') }}</b></div>
      <div class="jr-row"><span>Leaves at shooting</span><b>{{ val('leaves_at_shooting') }}</b></div>
      <!-- TODO(contract): infection risk level -->
      <div class="jr-row jr-off"><span>Infection risk</span><b>Coming soon</b></div>
      <div class="jr-row"><span>Progression</span><b>{{ progression?.finding ?? 'Not assessed' }}</b></div>
      <div class="jr-row"><span>Last treatment</span><b>{{ last?.product ?? 'None recorded' }}</b></div>
    </div>
    <div class="jr-chips"><span v-for="[label, on] in chips" :key="label" class="jr-pill" :class="{ on }">{{ on ? '✓ ' : '' }}{{ label }}</span></div>
    <p v-if="data.actions?.summary" class="jr-hint">{{ data.actions.summary }}</p>
    <p class="jr-hint">These indicators are context, not a confirmed diagnosis. Verify findings with an agricultural specialist before treatment decisions.</p>
  </aside>
</template>
