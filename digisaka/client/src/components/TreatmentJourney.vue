<script setup>
import { computed, onMounted, ref } from 'vue';
import { useInsightsStore } from '../stores/insights.js';
import { useSuggestionStore } from '../stores/suggestion.js';
import WeatherRisk from './WeatherRisk.vue';
import SprayLog from './SprayLog.vue';
import SuggestionUpdate from './SuggestionUpdate.vue';
import FungicideOptions from './FungicideOptions.vue';
import FungicideDetails from './FungicideDetails.vue';
import InsightsSummary from './InsightsSummary.vue';
import { RouterLink } from 'vue-router';
import '../styles/journey.css';

// Scan step 4: Weather, Spray log, Fungicides (list, then details), then a link to the schedule on /treatment.
// It reads the suggestion store as Scan step 3 left it, and never stops the update that step started.
const props = defineProps({ line: { type: String, required: true }, week: { type: String, required: true }, reschedule: { type: Object, default: null } });
const emit = defineEmits(['back']);
const insights = useInsightsStore(), suggestion = useSuggestionStore();
const page = ref(0); // 0 Weather, 1 Spray log, 2 Fungicide options, 3 Fungicide details
const PAGES = ['Weather', 'Spray log', 'Fungicides', 'Schedule'];
const activeStep = computed(() => Math.min(page.value, 2));
const unitId = ref('');
const unit = computed(() => suggestion.units.find((u) => u.unit_id === unitId.value) ?? null);
const showDetails = (u) => { unitId.value = u.unit_id; page.value = 3; };
const scheduleLink = computed(() => `/treatment/${encodeURIComponent(props.line)}/${encodeURIComponent(props.week)}`);
const optionPage = ref(1); // kept across a trip to details
const TITLES = ['Weather risk', 'Spray log', 'Fungicide options', 'Fungicide details'];

onMounted(() => {
  insights.load(props.line, props.week);
  // A scan already started the read; load only when the store is not on this line or has nothing in flight.
  if (suggestion.lineId !== props.line || !['loading', 'ready'].includes(suggestion.phase)) suggestion.load(props.line);
});
</script>

<template>
  <section class="journey" aria-label="Treatment review">
    <header><h1>{{ TITLES[page] }}</h1><p class="jr-hint">Line {{ line }} · {{ week }}</p></header>
    <ol class="jr-steps" aria-label="Treatment review progress">
      <li v-for="(label, i) in PAGES" :key="label" :class="{ active: activeStep === i, done: activeStep > i }"><span>{{ activeStep > i ? '✓' : i + 1 }}</span><small>{{ label }}</small></li>
    </ol>

    <template v-if="page === 0">
      <WeatherRisk :line="line" :week="week" />
      <div class="jr-nav"><button type="button" @click="emit('back')">Back to results</button><button class="primary" type="button" @click="page = 1">Continue to spray log</button></div>
    </template>

    <template v-else-if="page === 1">
      <SprayLog>
        <SuggestionUpdate :line="line" :week="week" :reschedule="reschedule" :link="false">
          <button class="jr-btn primary" type="button" @click="page = 2">Continue to fungicide options</button>
        </SuggestionUpdate>
      </SprayLog>
      <div class="jr-nav"><button type="button" @click="page = 0">Back</button></div>
    </template>

    <template v-else-if="page === 2">
      <p v-if="suggestion.phase === 'notfound'" class="jr-hint">This line has no treatment suggestion yet. A scan is suggested to start one.</p>
      <p v-else-if="suggestion.phase === 'error'" class="jr-err" role="alert">{{ suggestion.error }} <button type="button" @click="suggestion.load(line)">Try again</button></p>
      <p v-else-if="suggestion.phase !== 'ready'" class="jr-hint" role="status">Loading the suggestion…</p>
      <section v-else class="jr-layout">
        <div>
          <FungicideOptions v-model:page="optionPage" @select="showDetails" />
        </div>
        <InsightsSummary />
      </section>
      <div class="jr-nav"><button type="button" @click="page = 1">Back</button><RouterLink class="jr-btn primary" :to="scheduleLink">Continue to schedule</RouterLink></div>
    </template>

    <template v-else-if="page === 3 && unit">
      <FungicideDetails :unit="unit" />
      <div class="jr-nav"><button type="button" @click="page = 2">Back to options</button><RouterLink class="jr-btn primary" :to="scheduleLink">Continue to schedule</RouterLink></div>
    </template>
  </section>
</template>
