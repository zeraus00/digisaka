<script setup>
import { causeLabel, ACK_MEANING } from '../helpers/alerts.js';

// The "Why this matters" fold-out of one alert; `unit` is the product the alert is about, if any.
defineProps({ alert: { type: Object, required: true }, unit: { type: Object, default: null }, unitId: { type: String, default: '' }, units: { type: Array, default: () => [] }, build: { type: Object, default: null } });
</script>

<template>
  <details v-if="alert.kind === 'cannot_check' || unit || units.length" class="why">
    <summary>Why this matters</summary>
    <p v-if="unit">Product: <a :href="`#unit-${unitId}`">{{ unit.product }}</a><template v-if="unit.sample_fact"> (sample data)</template></p>
    <p v-if="units.length">{{ units.length === 1 ? 'Product' : 'Products' }}: <template v-for="(u, i) in units" :key="u.unit_id"><template v-if="i">, </template><a :href="`#unit-${u.unit_id}`">{{ u.product }}</a></template></p>
    <p v-if="alert.kind === 'cannot_check'">{{ causeLabel(alert.cause) }} {{ ACK_MEANING }}</p>
    <p v-if="build">Checked against known sources build {{ build.abox_digest }}.</p>
  </details>
</template>

<style scoped>
.why { margin-top: 6px; font-size: 13px; } .why summary { cursor: pointer; font-weight: 700; } .why p { margin-top: 4px; overflow-wrap: anywhere; }
</style>
