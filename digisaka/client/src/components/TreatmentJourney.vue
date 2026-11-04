<script setup>
import { computed, onMounted, ref } from 'vue';
import { useInsightsStore } from '../stores/insights.js';
import { useSuggestionStore } from '../stores/suggestion.js';
import WeatherRisk from './WeatherRisk.vue';
import SprayLog from './SprayLog.vue';
import SuggestionUpdate from './SuggestionUpdate.vue';
import ProductFacts from './ProductFacts.vue';
import InsightsSummary from './InsightsSummary.vue';
import { RouterLink } from 'vue-router';
import { unitFacts, titleCase, checkLabel, humanDetail, reasonText, planFor, stripChecks, RESULT_LABEL, GROUP_LABEL } from '../helpers/checks.js';
import { orderAlerts, LEVEL_ICON } from '../helpers/alerts.js';
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
const tierOf = (u) => ['recommended', 'eligible', 'excluded'].find((g) => suggestion.groups[g].includes(u));
const showDetails = (u) => { unitId.value = u.unit_id; page.value = 3; };
const scheduleLink = computed(() => `/treatment/${encodeURIComponent(props.line)}/${encodeURIComponent(props.week)}`);
const plan = computed(() => (unit.value ? planFor(suggestion.days, unit.value) : null));
const checksOf = (u) => (u.checks ?? []).map((c) => ({ ...c, label: checkLabel(c.check), ...humanDetail(c.check, c.detail) }));
const failing = (u) => stripChecks(u).filter((c) => c.result === 'fail').map((c) => ({ label: checkLabel(c.check), ...humanDetail(c.check, c.detail) }));
const counts = computed(() => `${suggestion.groups.recommended.length + suggestion.groups.eligible.length} eligible · ${suggestion.groups.excluded.length} excluded`);
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
          <article class="jr-card">
            <div class="jr-row"><h2>Fungicide options</h2><span class="jr-hint">{{ counts }}</span></div>
            <p class="jr-warn">These are separate product choices, not a combination to mix. Compatibility has not been assessed.</p>
            <p v-if="!suggestion.units.length" class="jr-hint">No fungicide options were suggested for this line.</p>
            <div v-for="g in ['recommended', 'eligible']" :key="g" class="jr-tier">
              <button v-for="u in suggestion.groups[g]" :key="u.unit_id" type="button" class="jr-unit combo" :aria-label="`View details for ${titleCase(u.label)}`" @click="showDetails(u)">
                <span class="top"><b>{{ titleCase(u.label) }}</b><span v-if="g === 'recommended'" class="jr-pill ok">Recommended</span></span>
                <span class="pills">
                  <span v-if="unitFacts(u).frac" class="jr-pill">FRAC {{ unitFacts(u).frac }}</span><span v-if="unitFacts(u).site" class="jr-pill">{{ unitFacts(u).site }}</span>
                  <span v-for="m in unitFacts(u).mobility" :key="m" class="jr-pill">{{ m }}</span>
                  <span class="jr-pill jr-off">Price: Coming soon</span><span class="jr-hint">View details →</span>
                </span>
              </button>
            </div>
            <div v-if="suggestion.groups.excluded.length" class="jr-tier">
              <p class="jr-hint">Use caution</p><h3>Excluded options</h3>
              <button v-for="u in suggestion.groups.excluded" :key="u.unit_id" type="button" class="jr-unit excluded" :aria-label="`View excluded product details for ${titleCase(u.label)}`" @click="showDetails(u)">
                <span class="top"><b>{{ titleCase(u.label) }}</b><span class="jr-pill bad">{{ GROUP_LABEL.excluded }}</span></span>
                <span class="pills">
                  <span v-if="unitFacts(u).frac" class="jr-pill">FRAC {{ unitFacts(u).frac }}</span><span v-if="unitFacts(u).site" class="jr-pill">{{ unitFacts(u).site }}</span>
                  <span v-for="m in unitFacts(u).mobility" :key="m" class="jr-pill">{{ m }}</span><span class="jr-pill jr-off">Price: Coming soon</span>
                </span>
                <span>{{ reasonText(u.reason) }}</span>
                <ul v-if="failing(u).length"><li v-for="c in failing(u)" :key="c.label">{{ c.label }}: {{ c.text }}</li></ul>
                <ul v-if="u.alerts.length"><li v-for="a in orderAlerts(u.alerts)" :key="a.id"><span aria-hidden="true">{{ LEVEL_ICON[a.level] }}</span> {{ a.text }}</li></ul>
              </button>
            </div>
          </article>
        </div>
        <InsightsSummary />
      </section>
      <div class="jr-nav"><button type="button" @click="page = 1">Back</button><RouterLink class="jr-btn primary" :to="scheduleLink">Continue to schedule</RouterLink></div>
    </template>

    <template v-else-if="page === 3 && unit">
      <section class="jr-layout">
        <div>
          <article class="jr-card">
            <div class="jr-row"><div><h2>{{ titleCase(unit.label) }}</h2><span class="jr-hint">Product information</span></div><span class="jr-pill" :class="tierOf(unit) === 'excluded' ? 'bad' : 'ok'">{{ GROUP_LABEL[tierOf(unit)] }}</span></div>
            <ProductFacts :unit="unit" />
            <div class="jr-rows">
              <div class="jr-row"><span>Application window</span><b>{{ plan?.window ?? 'Not in this plan' }}</b></div>
              <div class="jr-row"><span>Next assessment</span><b>{{ plan?.next ?? 'Not in this plan' }}</b></div>
            </div>
          </article>
          <article v-if="tierOf(unit) === 'excluded' || unit.alerts.length" class="jr-card">
            <h3>Caution</h3>
            <p v-if="unit.reason">{{ reasonText(unit.reason) }}</p>
            <ul class="jr-rows"><li v-for="a in orderAlerts(unit.alerts)" :key="a.id" class="jr-row"><span>{{ LEVEL_ICON[a.level] }} {{ a.text }}</span></li></ul>
          </article>
        </div>
        <aside class="jr-card" aria-label="Eligibility checks">
          <h3>Eligibility checks</h3>
          <p v-if="!checksOf(unit).length" class="jr-hint">No checks were run{{ unit.reason ? `: ${reasonText(unit.reason)}` : '.' }}</p>
          <div v-for="c in checksOf(unit)" :key="c.check" class="jr-check"><span>{{ c.label }}<template v-if="c.text"><br><small class="jr-hint">{{ c.text }}</small></template></span><span class="jr-pill" :class="c.result === 'pass' ? 'ok' : c.result === 'fail' ? 'bad' : 'warn'">{{ RESULT_LABEL[c.result] ?? c.result }}</span></div>
          <!-- TODO(contract): label and registration -->
          <div class="jr-check jr-off"><span>Label and registration</span><span class="jr-pill">Coming soon</span></div>
          <p class="jr-hint">Verify the registered label and consult an agricultural specialist before making treatment decisions.</p>
        </aside>
      </section>
      <div class="jr-nav"><button type="button" @click="page = 2">Back to options</button><RouterLink class="jr-btn primary" :to="scheduleLink">Continue to schedule</RouterLink></div>
    </template>
  </section>
</template>
