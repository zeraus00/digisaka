<script setup>
import { onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageHeader from '../components/PageHeader.vue';
import SkeletonList from '../components/SkeletonList.vue';
import { outcomeReasonText } from '../helpers/messages.js';
import { useLinesStore, weekRows } from '../stores/lines.js';

const route = useRoute(), router = useRouter(), lines = useLinesStore();
const line = computed(() => lines.byId(String(route.params.lineId)));
const rows = computed(() => (line.value ? weekRows(line.value) : []));
onMounted(() => { if (!lines.loaded) lines.load(); });
const open = (p) => router.push(`/treatment/${encodeURIComponent(String(route.params.lineId))}/${encodeURIComponent(p.week)}`);
</script>

<template>
  <div class="page">
    <PageHeader :title="`Line ${route.params.lineId}`" subtitle="Each finished week and its treatment suggestion." />
    <SkeletonList v-if="lines.loading && !line" />
    <p v-else-if="lines.error" class="error">{{ lines.error }}</p>
    <p v-else-if="lines.loaded && !line" class="empty">This line's schedule couldn't be found.</p>
    <p v-else-if="line && !rows.length" class="empty">No finished weeks for this line yet.</p>
    <template v-else-if="line">
      <p class="hint">Choose a week to see its treatment.</p>
      <button v-for="p in rows" :key="p.cycle_id" class="card" type="button" @click="open(p)">
        <span class="thumb">🗓</span>
        <span class="body"><span class="name">{{ p.week }}</span><span class="sub">{{ outcomeReasonText(p.outcome_reason) }}</span></span>
        <span class="count">{{ p.label }}</span>
        <span class="chev">›</span>
      </button>
      <template v-if="line.applications?.length">
        <p class="hint">Recorded applications</p>
        <p v-for="a in line.applications" :key="a.application_id" class="sub">{{ a.applied_on }} · {{ a.product_id }}</p>
      </template>
    </template>
  </div>
</template>

<style scoped>
.error { color: var(--danger); font-weight: 700; }
.empty, .hint { color: var(--ink-soft); }
.empty { padding: 30px; text-align: center; border: 1.5px dashed var(--line); border-radius: var(--radius-md); background: var(--card); }
.hint { margin-bottom: 14px; }
.card { display: flex; align-items: center; gap: 14px; width: 100%; margin-bottom: 10px; padding: 16px; border: 1px solid var(--line); border-radius: var(--radius-md); background: var(--card); box-shadow: var(--shadow); text-align: left; }
.card:hover { border-color: var(--leaf); }
.thumb { display: grid; place-items: center; flex: none; width: 44px; height: 44px; border-radius: 12px; background: var(--tint); font-size: 20px; }
.body { flex: 1; min-width: 0; display: grid; gap: 2px; }
.name { font: 800 16px var(--font-display); }
.sub { font-size: 13.5px; color: var(--ink-soft); }
.chev { flex: none; font-size: 20px; color: var(--ink-soft); }
</style>
