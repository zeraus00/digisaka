<script setup>
import { ref, watch } from 'vue';
import { useDevClockStore } from '../stores/devClock.js';
import { useRunModeStore } from '../stores/runMode.js';

// Dev only: each group renders once its own endpoint has answered (the run mode only on the stub), never in a production build.
const clock = useDevClockStore();
const runMode = useRunModeStore();
const draft = ref(clock.today ?? '');
watch(() => clock.today, (day) => { draft.value = day ?? ''; });

// The minimized state is kept per browser (localStorage; absent in tests, so guarded).
const KEY = 'devbar';
const min = ref((() => { try { return JSON.parse(globalThis.localStorage?.getItem(KEY))?.min === true; } catch { return false; } })());
const toggle = () => {
  min.value = !min.value;
  try { globalThis.localStorage?.setItem(KEY, JSON.stringify({ min: min.value })); } catch { /* storage blocked: keep going */ }
};
</script>

<template>
  <div v-if="clock.available || runMode.available" class="devbar" role="region" aria-label="Development tools">
    <b>DEV</b>
    <button type="button" class="min" :aria-expanded="!min" :aria-label="min ? 'Maximize development tools' : 'Minimize development tools'" @click="toggle">{{ min ? '▢' : '–' }}</button>
    <small v-if="min && runMode.available && runMode.mode !== 'normal'" class="warn">Scan runs: {{ runMode.mode }}</small>
    <template v-if="!min">
    <label v-if="runMode.available" :class="{ warn: runMode.mode !== 'normal' }">Scan runs
      <select :value="runMode.mode" :disabled="runMode.busy" aria-label="Scan runs" @change="runMode.set($event.target.value)">
        <option value="normal">Normal</option>
        <option value="fail">Fail</option>
        <option value="stuck">Stuck</option>
      </select>
    </label>
    <small v-if="runMode.error" class="err" role="alert">{{ runMode.error }}</small>
    <template v-if="clock.available">
    <label>Current date <input v-model="draft" type="date" aria-label="Current date"></label>
    <button type="button" :disabled="!draft || clock.busy" @click="clock.set(draft)">Set</button>
    <button type="button" :disabled="clock.busy" @click="clock.reset()">Reset to {{ clock.default }}</button>
    <small v-if="clock.pinned">pinned</small>
    <small v-if="clock.error" class="err" role="alert">{{ clock.error }}</small>
    </template>
    </template>
  </div>
</template>

<style scoped>
.devbar { position: fixed; right: 12px; bottom: calc(var(--tabbar-h) + 12px); z-index: 50; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 8px 12px; background: var(--card); border: 1px dashed var(--warn); border-radius: var(--radius-sm); box-shadow: var(--shadow); font-size: 13px; }
.devbar b { color: var(--warn); letter-spacing: .06em; }
.devbar label { display: flex; align-items: center; gap: 6px; }
.devbar button, .devbar input, .devbar select { padding: 4px 8px; border: 1px solid var(--line); border-radius: 8px; background: #fff; }
.devbar button:disabled { opacity: .55; cursor: not-allowed; }
.devbar .warn { color: var(--warn); font-weight: 600; }
.err { color: var(--danger); }
</style>
