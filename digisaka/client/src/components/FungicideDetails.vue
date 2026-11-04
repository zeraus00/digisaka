<script setup>
import { computed } from 'vue';
import { useSuggestionStore } from '../stores/suggestion.js';
import ProductFacts from './ProductFacts.vue';
import { titleCase, checkLabel, humanDetail, reasonText, planFor, RESULT_LABEL, GROUP_LABEL } from '../helpers/checks.js';
import { orderAlerts, LEVEL_ICON } from '../helpers/alerts.js';
import '../styles/journey.css';

const props = defineProps({ unit: { type: Object, required: true } });
const suggestion = useSuggestionStore();
const tier = computed(() => ['recommended', 'eligible', 'excluded'].find((g) => suggestion.groups[g].includes(props.unit)));
const plan = computed(() => planFor(suggestion.days, props.unit));
const checks = computed(() => (props.unit.checks ?? []).map((c) => ({ ...c, label: checkLabel(c.check), ...humanDetail(c.check, c.detail) })));
</script>

<template>
  <section class="jr-layout">
    <div>
      <article class="jr-card">
        <div class="jr-row"><div><h2>{{ titleCase(unit.label) }}</h2><span class="jr-hint">Product information</span></div><span class="jr-pill" :class="tier === 'excluded' ? 'bad' : 'ok'">{{ GROUP_LABEL[tier] }}</span></div>
        <ProductFacts :unit="unit" />
        <div class="jr-rows">
          <div class="jr-row"><span>Application window</span><b>{{ plan?.window ?? 'Not in this plan' }}</b></div>
          <div class="jr-row"><span>Next assessment</span><b>{{ plan?.next ?? 'Not in this plan' }}</b></div>
        </div>
      </article>
      <article v-if="tier === 'excluded' || unit.alerts.length || unit.needs_confirmation" class="jr-card">
        <h3>Caution</h3>
        <p v-if="unit.needs_confirmation" class="jr-hint">Needs confirmation to record.</p>
        <p v-if="unit.reason">{{ reasonText(unit.reason) }}</p>
        <ul class="jr-rows"><li v-for="a in orderAlerts(unit.alerts)" :key="a.id" class="jr-row"><span>{{ LEVEL_ICON[a.level] }} {{ a.text }}</span></li></ul>
      </article>
    </div>
    <aside class="jr-card" aria-label="Eligibility checks">
      <h3>Eligibility checks</h3>
      <p v-if="!checks.length" class="jr-hint">No checks were run{{ unit.reason ? `: ${reasonText(unit.reason)}` : '.' }}</p>
      <div v-for="c in checks" :key="c.check" class="jr-check"><span>{{ c.label }}<template v-if="c.text"><br><small class="jr-hint">{{ c.text }}</small></template></span><span class="jr-pill" :class="c.result === 'pass' ? 'ok' : c.result === 'fail' ? 'bad' : 'warn'">{{ RESULT_LABEL[c.result] ?? c.result }}</span></div>
      <!-- TODO(contract): label and registration -->
      <div class="jr-check jr-off"><span>Label and registration</span><span class="jr-pill">Coming soon</span></div>
      <p class="jr-hint">Verify the registered label and consult an agricultural specialist before making treatment decisions.</p>
    </aside>
  </section>
</template>
