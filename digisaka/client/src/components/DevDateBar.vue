<script setup>
import { ref, watch } from 'vue';
import { useDevClockStore } from '../stores/devClock.js';

// Dev only: it renders once the scheduler's dev-date endpoint has answered, never in a production build.
const clock = useDevClockStore();
const draft = ref(clock.today ?? '');
watch(() => clock.today, (day) => { draft.value = day ?? ''; });
</script>

<template>
  <div v-if="clock.available" class="devdate" role="region" aria-label="Development date">
    <b>DEV</b>
    <label>Current date <input v-model="draft" type="date" aria-label="Current date"></label>
    <button type="button" :disabled="!draft || clock.busy" @click="clock.set(draft)">Set</button>
    <button type="button" :disabled="clock.busy" @click="clock.reset()">Reset to {{ clock.default }}</button>
    <small v-if="clock.pinned">pinned</small>
    <small v-if="clock.error" class="err" role="alert">{{ clock.error }}</small>
  </div>
</template>

<style scoped>
.devdate { position: fixed; right: 12px; bottom: calc(var(--tabbar-h) + 12px); z-index: 50; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 8px 12px; background: var(--card); border: 1px dashed var(--warn); border-radius: var(--radius-sm); box-shadow: var(--shadow); font-size: 13px; }
.devdate b { color: var(--warn); letter-spacing: .06em; }
.devdate label { display: flex; align-items: center; gap: 6px; }
.devdate button, .devdate input { padding: 4px 8px; border: 1px solid var(--line); border-radius: 8px; background: #fff; }
.devdate button:disabled { opacity: .55; cursor: not-allowed; }
.err { color: var(--danger); }
</style>
