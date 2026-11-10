<script setup>
import { computed } from 'vue';
import { unitFacts, titleCase, explainMoa } from '../helpers/checks.js';
import '../styles/journey.css';

// The product-information rows, shared by the journey's details page and the cards on /treatment.
// An empty fact reads "Unknown"; a field the scheduler does not serve yet is greyed "Coming soon".
const props = defineProps({ unit: { type: Object, required: true } });
const f = computed(() => unitFacts(props.unit));
const MOBILITY = ['Contact', 'Translaminar', 'Locally systemic', 'Systemic'];
const pills = computed(() => [...MOBILITY, ...f.value.mobility.filter((m) => !MOBILITY.includes(m))]);
const rows = computed(() => [
  ['Active ingredient', f.value.activeIngredient], ['Manufacturer', f.value.manufacturer], ['Chemical group', f.value.chemicalGroup],
  ['Rate', f.value.rate], ['Rainfast period', f.value.rainfast], ['Application interval', f.value.interval],
]);
</script>

<template>
  <div class="facts">
    <div class="jr-rows">
      <div v-for="[label, value] in rows" :key="label" class="jr-row"><span>{{ label }}</span><b>{{ value ?? 'Unknown' }}</b></div>
      <div class="jr-row"><span>Mode of action</span><b>{{ f.modeOfAction ? explainMoa(f.modeOfAction) : 'Unknown' }}</b></div>
      <div class="jr-row"><span>FRAC code</span><b>{{ f.frac ?? 'Unknown' }}</b></div>
      <div class="jr-row"><span>MoA code</span><b>{{ f.moaCode ?? 'Unknown' }}</b></div>
      <div class="jr-row"><span>Description</span><b>{{ f.moaDescription ?? 'Unknown' }}</b></div>
      <div v-if="f.intervalSource" class="jr-row"><span>Source</span><b>{{ f.intervalSource }}</b></div>
      <!-- TODO(contract): formulation, price -->
      <div class="jr-row jr-off"><span>Formulation</span><b>Coming soon</b></div>
      <div class="jr-row jr-off"><span>Price</span><b>Coming soon</b></div>
    </div>
    <p class="jr-hint">Plant mobility</p>
    <div class="jr-chips"><span v-for="m in pills" :key="m" class="jr-pill" :class="{ on: f.mobility.includes(m) }">{{ titleCase(m) }}</span></div>
  </div>
</template>
